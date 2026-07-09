import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import ProductImage from "@/models/ProductImage";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { handleApiError, AppError } from "@/lib/error-handler";
import { logger } from "@/lib/logger";
import { z } from "zod";

// Zod schema for file validation metadata (optional extensions)
const UploadSchema = z.object({
  name: z.string().min(1),
  size: z.number().max(10 * 1024 * 1024, "File size must not exceed 10MB"),
  type: z.string().refine(
    (val) => ["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(val),
    { message: "Only JPEG, JPG, PNG, and WEBP formats are supported" }
  ),
});

export async function POST(request: NextRequest) {
  try {
    logger.info("Incoming upload request received");

    // 1. Connect to Database
    await connectToDatabase();

    // 2. Parse Form Data
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      throw new AppError("No file uploaded or file field is invalid", 400);
    }

    // 3. Validate File using Zod
    const validationResult = UploadSchema.safeParse({
      name: file.name,
      size: file.size,
      type: file.type,
    });

    if (!validationResult.success) {
      // Throw format/size errors directly to be formatted by Zod validation formatter
      return NextResponse.json(
        {
          success: false,
          error: validationResult.error.issues[0]?.message || "Validation failed",
        },
        { status: 400 }
      );
    }

    logger.debug({ fileName: file.name, fileSize: file.size }, "File validation succeeded");

    // 4. Convert File to Node Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 5. Upload to Cloudinary
    logger.info("Uploading file to Cloudinary...");
    const cloudinaryResponse = await uploadToCloudinary(buffer);
    logger.info(
      { publicId: cloudinaryResponse.public_id },
      "Cloudinary upload completed successfully"
    );

    // 6. Save metadata in MongoDB
    const newProductImage = new ProductImage({
      originalUrl: cloudinaryResponse.secure_url,
      originalPublicId: cloudinaryResponse.public_id,
      fileName: file.name,
      width: cloudinaryResponse.width,
      height: cloudinaryResponse.height,
      size: cloudinaryResponse.bytes,
      format: cloudinaryResponse.format,
      status: "pending",
      variants: [],
    });

    await newProductImage.save();
    logger.info({ imageId: newProductImage._id }, "Metadata persisted to MongoDB");

    return NextResponse.json({
      success: true,
      data: newProductImage,
    });
  } catch (error) {
    return handleApiError(error, "API Upload Route");
  }
}

export async function GET() {
  try {
    await connectToDatabase();
    const images = await ProductImage.find().sort({ createdAt: -1 }).limit(12);
    return NextResponse.json({
      success: true,
      data: images,
    });
  } catch (error) {
    return handleApiError(error, "GET Uploaded Images");
  }
}
