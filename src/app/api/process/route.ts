import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db";
import ProductImage from "@/models/ProductImage";
import { generateAllVariants } from "@/lib/processor";
import { logger } from "@/lib/logger";

const ProcessRequestSchema = z.object({
  imageId: z.string().min(1, "imageId is required"),
  removeBackground: z.boolean().default(true),
});

/**
 * POST /api/process
 * Trigger AI processing pipeline for an existing uploaded image.
 * Body: { imageId: string }  — MongoDB document _id of the ProductImage
 */
export async function POST(req: NextRequest) {
  logger.info("POST /api/process — received processing request");

  try {
    await connectToDatabase();

    // Validate request body
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parseResult = ProcessRequestSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parseResult.error.issues },
        { status: 422 }
      );
    }

    const { imageId, removeBackground } = parseResult.data;

    // Fetch the ProductImage document
    const imageDoc = await ProductImage.findById(imageId);
    if (!imageDoc) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    if (imageDoc.status === "processing") {
      return NextResponse.json(
        { error: "Image is already being processed" },
        { status: 409 }
      );
    }

    if (imageDoc.status === "completed") {
      return NextResponse.json(
        { error: "Image has already been processed", variants: imageDoc.variants },
        { status: 409 }
      );
    }

    // Mark as processing
    imageDoc.status = "processing";
    await imageDoc.save();

    logger.info({ imageId, url: imageDoc.originalUrl }, "Fetching original image from Cloudinary");

    // Fetch original image bytes from Cloudinary URL
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

    // Run the full variant generation pipeline
    let results;
    try {
      results = await generateAllVariants(sourceBuffer, imageId, removeBackground);
    } catch (procErr) {
      logger.error({ imageId, procErr }, "Variant generation failed");
      imageDoc.status = "failed";
      imageDoc.errorDetails = procErr instanceof Error ? procErr.message : String(procErr);
      await imageDoc.save();
      return NextResponse.json({ error: "Processing pipeline failed" }, { status: 500 });
    }

    // Persist all variants and mark as completed
    imageDoc.variants = results.variants;
    imageDoc.analysis = results.analysis;
    if (results.backgroundProvider) {
      imageDoc.backgroundProvider = results.backgroundProvider;
    }
    if (results.fallbackUsed !== undefined) {
      imageDoc.fallbackUsed = results.fallbackUsed;
    }
    imageDoc.status = results.variants.length > 0 ? "completed" : "failed";
    if (results.variants.length === 0) {
      imageDoc.errorDetails = "All variant processing attempts failed";
    }
    await imageDoc.save();

    logger.info({ imageId, variantCount: results.variants.length }, "Processing completed successfully");

    return NextResponse.json(
      {
        success: true,
        imageId,
        status: imageDoc.status,
        variantCount: results.variants.length,
        variants: results.variants.map((v) => ({
          variantId: v.variantId,
          url: v.url,
          format: v.format,
          size: v.size,
          transformations: v.transformations,
          score: v.score,
        })),
      },
      { status: 200 }
    );
  } catch (err) {
    logger.error({ err }, "Unexpected error in POST /api/process");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * GET /api/process?imageId=<id>
 * Check the current processing status of an image.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const imageId = searchParams.get("imageId");

  if (!imageId) {
    return NextResponse.json({ error: "imageId query param is required" }, { status: 400 });
  }

  try {
    await connectToDatabase();
    const imageDoc = await ProductImage.findById(imageId).select(
      "status variantCount errorDetails variants"
    );
    if (!imageDoc) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    return NextResponse.json({
      imageId,
      status: imageDoc.status,
      variantCount: imageDoc.variants?.length ?? 0,
      errorDetails: imageDoc.errorDetails,
    });
  } catch (err) {
    logger.error({ err }, "Unexpected error in GET /api/process");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
