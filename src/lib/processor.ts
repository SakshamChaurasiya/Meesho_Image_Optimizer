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
  outputFormat: OutputFormat;
}

/** Result of processing a single variant */
export interface ProcessedVariant {
  buffer: Buffer;
  config: VariantConfig;
  width: number;
  height: number;
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
 * Process a single image variant:
 * 1. Remove background (if requested).
 * 2. Trim transparent border to tight bounding box.
 * 3. Scale to fit within padded canvas.
 * 4. Composite centered onto CANVAS_SIZE × CANVAS_SIZE background.
 * 5. Adjust brightness.
 * 6. Convert to specified output format.
 */
export async function processImageVariant(
  sourceBuffer: Buffer,
  config: VariantConfig
): Promise<ProcessedVariant> {
  logger.debug(
    { config },
    `Processing variant: bg=${config.backgroundType} pad=${config.paddingPercent}% brightness=${config.brightness} format=${config.outputFormat}`
  );

  let workingBuffer = sourceBuffer;

  // Step 1 — background removal
  if (config.backgroundRemoved) {
    const provider = getBackgroundRemovalProvider();
    workingBuffer = await provider.removeBackground(workingBuffer);
  }

  // Step 2 — trim transparent border to get tight product bounding box
  const { trimmed, width: subjectW, height: subjectH } = await trimTransparentBorder(workingBuffer);

  // Step 3 — calculate max available canvas area after padding
  const paddingPx = Math.round((config.paddingPercent / 100) * CANVAS_SIZE);
  const availableSize = CANVAS_SIZE - paddingPx * 2;

  // Scale subject to fit in availableSize × availableSize (maintain aspect ratio)
  const scale = Math.min(availableSize / subjectW, availableSize / subjectH);
  const scaledW = Math.round(subjectW * scale);
  const scaledH = Math.round(subjectH * scale);

  // Step 4a — resize the trimmed subject
  const resizedSubject = await sharp(trimmed)
    .resize(scaledW, scaledH, { fit: "fill" })
    .ensureAlpha()
    .toBuffer();

  // Step 4b — compute exact offset to perfectly center the subject on canvas
  const offsetLeft = Math.round((CANVAS_SIZE - scaledW) / 2);
  const offsetTop = Math.round((CANVAS_SIZE - scaledH) / 2);

  // Step 4c — build the background canvas and composite the subject
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

  // Step 5 — brightness adjustment using modulate
  if (config.brightness !== 1.0) {
    pipeline = pipeline.modulate({ brightness: config.brightness });
  }

  // Step 5a — flatten to background colour for non-transparent outputs
  if (config.backgroundType !== "transparent") {
    pipeline = pipeline.flatten({ background });
  }

  // Step 6 — output format conversion
  let outputBuffer: Buffer;
  if (config.outputFormat === "webp") {
    outputBuffer = await pipeline.webp({ quality: 85, effort: 4 }).toBuffer();
  } else {
    outputBuffer = await pipeline.jpeg({ quality: 88, progressive: true }).toBuffer();
  }

  return {
    buffer: outputBuffer,
    config,
    width: CANVAS_SIZE,
    height: CANVAS_SIZE,
  };
}

/**
 * The full 20-variant processing matrix.
 * Combinations: 4 bg/padding × 4 padding × 2 brightness × 2 format = 20 distinct configs.
 *
 * 5 bg configs × 2 brightness × 2 format = 20
 */
function buildVariantMatrix(): VariantConfig[] {
  const configs: VariantConfig[] = [];

  // Background-removed variants (white bg) × padding 5/10/15/20 × default brightness × webp
  const bgRemovedPaddings: number[] = [5, 10, 15, 20];
  for (const pad of bgRemovedPaddings) {
    configs.push({
      backgroundRemoved: true,
      backgroundType: "white",
      paddingPercent: pad,
      brightness: 1.0,
      outputFormat: "webp",
    });
    // Enhanced brightness variant
    configs.push({
      backgroundRemoved: true,
      backgroundType: "white",
      paddingPercent: pad,
      brightness: 1.1,
      outputFormat: "jpeg",
    });
  }

  // Light-gray background (background removed) × padding 10% × 2 formats
  configs.push({
    backgroundRemoved: true,
    backgroundType: "light-gray",
    paddingPercent: 10,
    brightness: 1.0,
    outputFormat: "webp",
  });
  configs.push({
    backgroundRemoved: true,
    backgroundType: "light-gray",
    paddingPercent: 10,
    brightness: 1.1,
    outputFormat: "jpeg",
  });

  // Original (no bg removal) — centered + padded × 2 paddings × 2 formats
  configs.push({
    backgroundRemoved: false,
    backgroundType: "white",
    paddingPercent: 5,
    brightness: 1.0,
    outputFormat: "webp",
  });
  configs.push({
    backgroundRemoved: false,
    backgroundType: "white",
    paddingPercent: 10,
    brightness: 1.0,
    outputFormat: "jpeg",
  });

  return configs;
}

/**
 * Run all variants for the given image buffer, uploading each to Cloudinary.
 * Returns an array of IVariant objects ready for MongoDB persistence.
 */
export async function generateAllVariants(
  sourceBuffer: Buffer,
  imageId: string
): Promise<IVariant[]> {
  const matrix = buildVariantMatrix();
  logger.info({ imageId, total: matrix.length }, "Starting variant generation");

  const variants: IVariant[] = [];

  for (let i = 0; i < matrix.length; i++) {
    const config = matrix[i];
    const variantId = `variant_${i + 1}_${config.backgroundType}_pad${config.paddingPercent}_${config.outputFormat}`;

    try {
      logger.debug({ variantId, config }, "Processing variant");

      const processed = await processImageVariant(sourceBuffer, config);

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
          contrastAdjusted: 1.0,
          compressed: true,
        },
        createdAt: new Date(),
      });

      logger.info({ variantId, url: uploaded.secure_url }, `Variant ${i + 1}/${matrix.length} uploaded`);
    } catch (err) {
      logger.error({ variantId, err }, `Failed to process variant ${variantId} — skipping`);
      // Continue generating remaining variants even if one fails
    }
  }

  logger.info({ imageId, generated: variants.length, total: matrix.length }, "Variant generation complete");
  return variants;
}
