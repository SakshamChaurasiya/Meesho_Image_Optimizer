import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import ProductImage from "@/models/ProductImage";
import { logger } from "@/lib/logger";

/**
 * GET /api/results/[imageId]
 * Returns full image metadata including all generated variants.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { imageId: string } }
) {
  const { imageId } = params;

  try {
    await connectToDatabase();

    const imageDoc = await ProductImage.findById(imageId).lean();

    if (!imageDoc) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: imageDoc });
  } catch (err) {
    logger.error({ err, imageId }, "Failed to fetch image results");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
