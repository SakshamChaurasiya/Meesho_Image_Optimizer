import sharp from "sharp";
import { logger } from "@/lib/logger";
import { getBackgroundRemovalProvider } from "@/lib/ai/providers";
import { uploadToCloudinary } from "@/lib/cloudinary";
import type { IVariant } from "@/models/ProductImage";

/** Canvas dimensions for all output images (Meesho-recommended square) */
const CANVAS_SIZE = 800;

/** Output format and quality settings */
type OutputFormat = "webp" | "jpeg";

/** Background type for processed variants */
type BackgroundType = "white" | "light-gray" | "transparent";

/** A single variant configuration in the processing matrix */
export interface VariantConfig {
  backgroundType: BackgroundType;
  backgroundRemoved: boolean;
  paddingPercent: number; // 5 | 10 | 15 | 20
  brightness: number; // 1.0 = default, 1.1 = enhanced
  contrast: number; // 1.0 = default, 1.1 = enhanced
  outputFormat: OutputFormat;
  jpegQuality: number;
}

/** Result of processing a single variant */
export interface ProcessedVariant {
  buffer: Buffer;
  config: VariantConfig;
  width: number;
  height: number;
}

export interface ImageAnalysis {
  dimensions: { width: number; height: number };
  boundingBox: { left: number; top: number; width: number; height: number };
  occupancyRatio: number;
  whiteSpaceRatio: number;
  centerAlignment: { dx: number; dy: number; isCentered: boolean };
  brightness: number;
  contrast: number;
  resolution: number;
  aspectRatio: number;
}

/**
 * Trim transparent pixels from an RGBA buffer and return the tightest
 * bounding box of the non-transparent region, plus the trimmed image buffer.
 */
async function trimTransparentBorder(
  inputBuffer: Buffer
): Promise<{ trimmed: Buffer; top: number; left: number; width: number; height: number }> {
  const image = sharp(inputBuffer).ensureAlpha();
  const { data, info } = await image
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;

  let minX = width,
    minY = height,
    maxX = 0,
    maxY = 0;
  let hasNonTransparent = false;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const alphaIndex = (y * width + x) * channels + (channels - 1);
      if (data[alphaIndex] > 10) {
        // threshold: ignore near-transparent edge artifacts
        hasNonTransparent = true;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (!hasNonTransparent) {
    // Fallback: entire image is transparent — return as-is
    return { trimmed: inputBuffer, top: 0, left: 0, width, height };
  }

  const cropWidth = maxX - minX + 1;
  const cropHeight = maxY - minY + 1;

  const trimmed = await sharp(inputBuffer)
    .extract({ left: minX, top: minY, width: cropWidth, height: cropHeight })
    .toBuffer();

  return { trimmed, top: minY, left: minX, width: cropWidth, height: cropHeight };
}

/**
 * Resolve a background type to sharp's `flatten` background colour.
 * Transparent backgrounds skip flattening entirely.
 */
function resolveBackground(backgroundType: BackgroundType): { r: number; g: number; b: number } {
  switch (backgroundType) {
    case "white":
      return { r: 255, g: 255, b: 255 };
    case "light-gray":
      return { r: 245, g: 245, b: 245 };
    default:
      return { r: 255, g: 255, b: 255 }; // fallback — transparent skips flatten
  }
}

/**
 * Perform detailed visual characteristics analysis on the background-removed or original image.
 */
export async function analyzeImage(inputBuffer: Buffer): Promise<ImageAnalysis> {
  const image = sharp(inputBuffer);
  const metadata = await image.metadata();
  const width = metadata.width ?? 0;
  const height = metadata.height ?? 0;

  // Find bounding box based on alpha channel or fallback
  const { top, left, width: boxW, height: boxH } = await trimTransparentBorder(inputBuffer);

  const occupancyRatio = (boxW * boxH) / (width * height || 1);
  const whiteSpaceRatio = 1 - occupancyRatio;

  const imageCenterX = width / 2;
  const imageCenterY = height / 2;
  const productCenterX = left + boxW / 2;
  const productCenterY = top + boxH / 2;
  const dx = productCenterX - imageCenterX;
  const dy = productCenterY - imageCenterY;
  const isCentered = Math.abs(dx) < width * 0.05 && Math.abs(dy) < height * 0.05;

  const stats = await image.stats();
  const rMean = stats.channels[0]?.mean ?? 128;
  const gMean = stats.channels[1]?.mean ?? 128;
  const bMean = stats.channels[2]?.mean ?? 128;
  const brightness = (rMean + gMean + bMean) / 3;

  const rStdev = stats.channels[0]?.stdev ?? 50;
  const gStdev = stats.channels[1]?.stdev ?? 50;
  const bStdev = stats.channels[2]?.stdev ?? 50;
  const contrast = (rStdev + gStdev + bStdev) / 3;

  return {
    dimensions: { width, height },
    boundingBox: { left, top, width: boxW, height: boxH },
    occupancyRatio,
    whiteSpaceRatio,
    centerAlignment: { dx, dy, isCentered },
    brightness,
    contrast,
    resolution: width * height,
    aspectRatio: width / (height || 1),
  };
}

/**
 * Validate variant based on quality rules.
 */
export function validateVariant(
  processed: ProcessedVariant,
  analysis: ImageAnalysis,
  config: VariantConfig
): { valid: boolean; reason?: string } {
  // 1. Invalid aspect ratio
  const ar = processed.width / processed.height;
  if (ar < 0.95 || ar > 1.05) {
    return { valid: false, reason: "Invalid aspect ratio" };
  }

  // 2. Low resolution
  if (processed.width < 400 || processed.height < 400) {
    return { valid: false, reason: "Low resolution" };
  }

  // 3. Failed background cleanup
  if (
    config.backgroundRemoved &&
    analysis.boundingBox.width >= analysis.dimensions.width &&
    analysis.boundingBox.height >= analysis.dimensions.height
  ) {
    return { valid: false, reason: "Failed background cleanup" };
  }

  // 4. Product touching borders or cropped
  if (config.paddingPercent <= 0) {
    return { valid: false, reason: "Product touching borders (zero padding)" };
  }

  const paddingPx = Math.round((config.paddingPercent / 100) * CANVAS_SIZE);
  const availableSize = CANVAS_SIZE - paddingPx * 2;
  const scale = Math.min(availableSize / analysis.boundingBox.width, availableSize / analysis.boundingBox.height);
  const scaledW = Math.round(analysis.boundingBox.width * scale);
  const scaledH = Math.round(analysis.boundingBox.height * scale);
  const offsetLeft = Math.round((CANVAS_SIZE - scaledW) / 2);
  const offsetTop = Math.round((CANVAS_SIZE - scaledH) / 2);

  if (offsetLeft < paddingPx - 2 || offsetTop < paddingPx - 2) {
    return { valid: false, reason: "Product cropped or too close to borders" };
  }

  return { valid: true };
}

/**
 * Calculate the internal optimization score.
 */
export function calculateOptimizationScore(
  config: VariantConfig,
  analysis: ImageAnalysis
): number {
  let score = 50;

  // 1. Background normalization
  if (config.backgroundRemoved && config.backgroundType === "white") {
    score += 20;
  } else if (config.backgroundRemoved && config.backgroundType === "light-gray") {
    score += 15;
  } else if (config.backgroundType === "transparent") {
    score += 10;
  }

  // 2. Optimal padding (10% to 15% is sweet spot)
  if (config.paddingPercent === 10 || config.paddingPercent === 15) {
    score += 15;
  } else {
    score += 5;
  }

  // 3. Brightness correction
  if (analysis.brightness < 120 && config.brightness > 1.0) {
    score += 10;
  } else if (analysis.brightness >= 120 && config.brightness === 1.0) {
    score += 5;
  }

  // 4. Contrast enhancement
  if (analysis.contrast < 50 && config.contrast > 1.0) {
    score += 5;
  }

  // 5. Format preference
  if (config.outputFormat === "webp") {
    score += 5;
  }

  return Math.min(100, Math.max(0, score));
}

/**
 * Process a single image variant
 */
export async function processImageVariant(
  sourceBuffer: Buffer,
  config: VariantConfig
): Promise<ProcessedVariant> {
  logger.debug(
    { config },
    `Processing variant: bg=${config.backgroundType} pad=${config.paddingPercent}% brightness=${config.brightness}`
  );

  let workingBuffer = sourceBuffer;

  // Step 1 — Background removal (with graceful failure fallback)
  if (config.backgroundRemoved) {
    try {
      const provider = getBackgroundRemovalProvider();
      workingBuffer = await provider.removeBackground(workingBuffer);
    } catch (err) {
      logger.error({ err }, "Background removal provider failed. Falling back to original image.");
      config.backgroundRemoved = false;
    }
  }

  // Step 2 — Trim transparent border to get tight bounding box
  const { trimmed, width: subjectW, height: subjectH } = await trimTransparentBorder(workingBuffer);

  // Step 3 — Scale subject to fit within padded canvas
  const paddingPx = Math.round((config.paddingPercent / 100) * CANVAS_SIZE);
  const availableSize = CANVAS_SIZE - paddingPx * 2;
  const scale = Math.min(availableSize / subjectW, availableSize / subjectH);
  const scaledW = Math.round(subjectW * scale);
  const scaledH = Math.round(subjectH * scale);

  // Step 4 — Resize trimmed subject
  const resizedSubject = await sharp(trimmed)
    .resize(scaledW, scaledH, { fit: "fill" })
    .ensureAlpha()
    .toBuffer();

  const offsetLeft = Math.round((CANVAS_SIZE - scaledW) / 2);
  const offsetTop = Math.round((CANVAS_SIZE - scaledH) / 2);

  // Step 5 — Composite onto background canvas
  const background = resolveBackground(config.backgroundType);
  let pipeline = sharp({
    create: {
      width: CANVAS_SIZE,
      height: CANVAS_SIZE,
      channels: 4,
      background:
        config.backgroundType === "transparent"
          ? { r: 0, g: 0, b: 0, alpha: 0 }
          : { ...background, alpha: 255 },
    },
  }).composite([{ input: resizedSubject, top: offsetTop, left: offsetLeft }]);

  // Step 6 — Brightness adjustment
  if (config.brightness !== 1.0) {
    pipeline = pipeline.modulate({ brightness: config.brightness });
  }

  // Step 7 — Contrast adjustment
  if (config.contrast !== 1.0) {
    const gain = config.contrast;
    const bias = -128 * gain + 128;
    pipeline = pipeline.linear(gain, bias);
  }

  // Step 8 — Flatten background
  if (config.backgroundType !== "transparent") {
    pipeline = pipeline.flatten({ background });
  }

  // Step 9 — Output format and quality
  let outputBuffer: Buffer;
  if (config.outputFormat === "webp") {
    outputBuffer = await pipeline.webp({ quality: config.jpegQuality, effort: 4 }).toBuffer();
  } else {
    outputBuffer = await pipeline.jpeg({ quality: config.jpegQuality, progressive: true }).toBuffer();
  }

  return {
    buffer: outputBuffer,
    config,
    width: CANVAS_SIZE,
    height: CANVAS_SIZE,
  };
}

/**
 * Build deterministic 24-variant config matrix.
 */
function buildVariantMatrix(): VariantConfig[] {
  const configs: VariantConfig[] = [];
  const paddings = [5, 10, 15, 20];
  const formats: OutputFormat[] = ["webp", "jpeg"];

  for (const bgRemoved of [true, false]) {
    for (const bgType of ["white", "light-gray", "transparent"] as BackgroundType[]) {
      if (bgType === "transparent" && !bgRemoved) continue;

      for (const pad of paddings) {
        for (const format of formats) {
          const brightness = pad === 10 || pad === 20 ? 1.1 : 1.0;
          const contrast = pad === 15 || pad === 20 ? 1.1 : 1.0;
          const jpegQuality = format === "jpeg" ? (pad === 5 ? 80 : pad === 15 ? 90 : 85) : 85;

          configs.push({
            backgroundRemoved: bgRemoved,
            backgroundType: bgType,
            paddingPercent: pad,
            brightness,
            contrast,
            outputFormat: format,
            jpegQuality,
          });
        }
      }
    }
  }

  return configs.slice(0, 24);
}

/**
 * Generate, validate, and rank all variants.
 */
export async function generateAllVariants(
  sourceBuffer: Buffer,
  imageId: string
): Promise<{ variants: IVariant[]; analysis: ImageAnalysis }> {
  // 1. Initial background-removed buffer for analysis
  let bgRemovedBuffer: Buffer | null = null;
  try {
    const provider = getBackgroundRemovalProvider();
    bgRemovedBuffer = await provider.removeBackground(sourceBuffer);
  } catch (err) {
    logger.error({ err }, "Initial background removal for analysis failed. Using source image.");
  }

  const analysisBuffer = bgRemovedBuffer || sourceBuffer;
  const analysis = await analyzeImage(analysisBuffer);

  const matrix = buildVariantMatrix();
  logger.info({ imageId, total: matrix.length }, "Starting variant generation");

  const variants: IVariant[] = [];

  for (let i = 0; i < matrix.length; i++) {
    const config = matrix[i];
    const variantId = `variant_${i + 1}_${config.backgroundType}_pad${config.paddingPercent}_${config.outputFormat}`;

    try {
      const processed = await processImageVariant(sourceBuffer, config);

      // Validate variant quality rules
      const validation = validateVariant(processed, analysis, config);
      if (!validation.valid) {
        logger.warn({ variantId, reason: validation.reason }, "Variant failed validation — skipping");
        continue;
      }

      // Calculate score
      const score = calculateOptimizationScore(config, analysis);

      const uploaded = await uploadToCloudinary(
        processed.buffer,
        `packoptima/variants/${imageId}`
      );

      variants.push({
        variantId,
        url: uploaded.secure_url,
        publicId: uploaded.public_id,
        width: processed.width,
        height: processed.height,
        size: uploaded.bytes,
        format: config.outputFormat,
        transformations: {
          backgroundRemoved: config.backgroundRemoved,
          objectCentered: true,
          paddingApplied: config.paddingPercent,
          brightnessAdjusted: config.brightness,
          contrastAdjusted: config.contrast,
          compressed: true,
        },
        score,
        createdAt: new Date(),
      });

      logger.info({ variantId, score, url: uploaded.secure_url }, `Variant ${i + 1}/${matrix.length} added`);
    } catch (err) {
      logger.error({ variantId, err }, `Failed to process variant ${variantId} — skipping`);
    }
  }

  // Rank variants by score descending
  variants.sort((a, b) => b.score - a.score);

  logger.info({ imageId, generated: variants.length }, "Variant generation and scoring complete");
  return { variants, analysis };
}
