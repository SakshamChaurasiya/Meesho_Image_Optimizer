import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary from environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface CloudinaryUploadResponse {
  secure_url: string;
  public_id: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}

/**
 * Uploads a file buffer to Cloudinary using upload_stream
 * @param fileBuffer The file buffer to upload
 * @param folder The folder path on Cloudinary where the file should be saved
 */
export async function uploadToCloudinary(
  fileBuffer: Buffer,
  folder = "packoptima"
): Promise<CloudinaryUploadResponse> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }
        if (!result) {
          reject(new Error("Cloudinary upload returned an empty result."));
          return;
        }
        resolve({
          secure_url: result.secure_url,
          public_id: result.public_id,
          width: result.width,
          height: result.height,
          format: result.format,
          bytes: result.bytes,
        });
      }
    );

    uploadStream.end(fileBuffer);
  });
}
/**
 * Deletes one or more resources from Cloudinary by their public_ids.
 * Uses delete_resources for batch deletion.
 * @param publicIds Array of Cloudinary public_ids to delete
 */
export async function deleteFromCloudinary(publicIds: string[]): Promise<void> {
  if (publicIds.length === 0) return;

  // Cloudinary delete_resources supports up to 100 ids per call
  const CHUNK = 100;
  for (let i = 0; i < publicIds.length; i += CHUNK) {
    const chunk = publicIds.slice(i, i + CHUNK);
    await cloudinary.api.delete_resources(chunk, { resource_type: "image" });
  }
}
