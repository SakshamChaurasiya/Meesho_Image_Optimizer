import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db";
import ProductImage from "@/models/ProductImage";
import { generateRefinedVariants } from "@/lib/processor";
import { logger } from "@/lib/logger";

const RefineRequestSchema = z.object({
  imageId: z.string().min(1, "imageId is required"),
  baseTransformations: z.object({
    backgroundRemoved: z.boolean(),
    backgroundType: z.enum(["white", "light-gray", "transparent"]),
    paddingPercent: z.number(),
    brightness: z.number(),
    contrast: z.number(),
    format: z.string().optional(),
  }),
});

/**
 * POST /api/process/refine
 * Generate a new set of variants fine-tuned around a user-selected best variant.
 */
export async function POST(req: NextRequest) {
  logger.info("POST /api/process/refine — received refinement request");

  try {
    await connectToDatabase();

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parseResult = RefineRequestSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parseResult.error.issues },
        { status: 422 }
      );
    }

    const { imageId, baseTransformations } = parseResult.data;

    const imageDoc = await ProductImage.findById(imageId);
    if (!imageDoc) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    // Set to processing
    imageDoc.status = "processing";
    await imageDoc.save();

    logger.info({ imageId }, "Fetching original image from Cloudinary for refinement");

    let sourceBuffer: Buffer;
    try {
      const imageResponse = await fetch(imageDoc.originalUrl);
      if (!imageResponse.ok) {
        throw new Error(`Failed to fetch original image: ${imageResponse.statusText}`);
      }
      const arrayBuffer = await imageResponse.arrayBuffer();
      sourceBuffer = Buffer.from(arrayBuffer);
    } catch (fetchErr) {
      logger.error({ imageId, fetchErr }, "Failed to fetch source image");
      imageDoc.status = "failed";
      imageDoc.errorDetails = fetchErr instanceof Error ? fetchErr.message : String(fetchErr);
      await imageDoc.save();
      return NextResponse.json({ error: "Failed to fetch source image" }, { status: 502 });
    }

    // Run variant refinement pipeline
    let results;
    try {
      results = await generateRefinedVariants(sourceBuffer, imageId, {
        backgroundRemoved: baseTransformations.backgroundRemoved,
        backgroundType: baseTransformations.backgroundType,
        paddingPercent: baseTransformations.paddingPercent,
        brightness: baseTransformations.brightness,
        contrast: baseTransformations.contrast,
        outputFormat: "jpeg", // Force JPEG per requirements
        jpegQuality: 85,
      });
    } catch (procErr) {
      logger.error({ imageId, procErr }, "Refinement pipeline failed");
      imageDoc.status = "failed";
      imageDoc.errorDetails = procErr instanceof Error ? procErr.message : String(procErr);
      await imageDoc.save();
      return NextResponse.json({ error: "Refinement pipeline failed" }, { status: 500 });
    }

    // Overwrite the existing variants with the new refined list and complete
    imageDoc.variants = results.variants;
    imageDoc.analysis = results.analysis;
    imageDoc.status = results.variants.length > 0 ? "completed" : "failed";
    if (results.variants.length === 0) {
      imageDoc.errorDetails = "All refined variant processing attempts failed";
    }
    await imageDoc.save();

    logger.info({ imageId, variantCount: results.variants.length }, "Refinement completed successfully");

    return NextResponse.json({
      success: true,
      imageId,
      status: imageDoc.status,
      variants: results.variants,
    });
  } catch (err) {
    logger.error({ err }, "Unexpected error in POST /api/process/refine");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
