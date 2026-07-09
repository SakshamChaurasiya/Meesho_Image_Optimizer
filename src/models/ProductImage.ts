import mongoose, { Schema, Document, Model } from "mongoose";

export interface IVariant {
  variantId: string;
  url: string;
  publicId: string;
  width: number;
  height: number;
  size: number;
  format: string;
  transformations: {
    backgroundRemoved: boolean;
    objectCentered: boolean;
    paddingApplied: number;
    brightnessAdjusted: number;
    contrastAdjusted: number;
    compressed: boolean;
  };
  createdAt: Date;
}

export interface IProductImage extends Document {
  originalUrl: string;
  originalPublicId: string;
  fileName: string;
  width: number;
  height: number;
  size: number;
  format: string;
  status: "pending" | "processing" | "completed" | "failed";
  errorDetails?: string;
  jobId?: string;
  variants: IVariant[];
  createdAt: Date;
  updatedAt: Date;
}

const VariantSchema = new Schema<IVariant>({
  variantId: { type: String, required: true },
  url: { type: String, required: true },
  publicId: { type: String, required: true },
  width: { type: Number, required: true },
  height: { type: Number, required: true },
  size: { type: Number, required: true },
  format: { type: String, required: true },
  transformations: {
    backgroundRemoved: { type: Boolean, default: false },
    objectCentered: { type: Boolean, default: false },
    paddingApplied: { type: Number, default: 0 },
    brightnessAdjusted: { type: Number, default: 1 },
    contrastAdjusted: { type: Number, default: 1 },
    compressed: { type: Boolean, default: false },
  },
  createdAt: { type: Date, default: Date.now },
});

const ProductImageSchema = new Schema<IProductImage>(
  {
    originalUrl: { type: String, required: true },
    originalPublicId: { type: String, required: true },
    fileName: { type: String, required: true },
    width: { type: Number, required: true },
    height: { type: Number, required: true },
    size: { type: Number, required: true },
    format: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
    },
    errorDetails: { type: String },
    jobId: { type: String },
    variants: [VariantSchema],
  },
  {
    timestamps: true,
  }
);

// Prevent compiling model multiple times during Next.js hot-reloads
const ProductImage: Model<IProductImage> =
  mongoose.models.ProductImage || mongoose.model<IProductImage>("ProductImage", ProductImageSchema);

export default ProductImage;
