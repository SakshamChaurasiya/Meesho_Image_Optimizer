"use client";

import React, { useState, useRef } from "react";
import { UploadCloud, FileImage, X, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

interface ImageUploaderProps {
  onUploadSuccess?: (data: any) => void; // eslint-disable-line @typescript-eslint/no-explicit-any
}

export function ImageUploader({ onUploadSuccess }: ImageUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);

  // Handle drag events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Validate and set file
  const validateAndSetFile = (selectedFile: File) => {
    setError(null);

    // Validate size (10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError("File size exceeds 10MB limit.");
      toast.error("File size exceeds 10MB limit.");
      return;
    }

    // Validate type
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(selectedFile.type)) {
      setError("Invalid format. Please upload JPEG, PNG or WEBP.");
      toast.error("Only JPEG, PNG, and WEBP formats are supported.");
      return;
    }

    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
  };

  // Handle drop event
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  // Handle file input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  // Trigger file input click
  const onButtonClick = () => {
    inputRef.current?.click();
  };

  // Clear selected file
  const clearFile = () => {
    setFile(null);
    setPreviewUrl(null);
    setError(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  // Handle Upload submit
  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to upload image.");
      }

      toast.success("Product image uploaded successfully!");
      if (onUploadSuccess) {
        onUploadSuccess(result.data);
      }
      clearFile();
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "An unexpected error occurred.";
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="w-full max-w-xl mx-auto border border-border bg-card/45 backdrop-blur-md shadow-xl">
      <CardContent className="p-6">
        {/* Dropzone or Preview Area */}
        {!previewUrl ? (
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={onButtonClick}
            className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-10 cursor-pointer transition-all duration-300 ${
              dragActive
                ? "border-primary bg-primary/5 scale-[0.99]"
                : "border-border/80 hover:border-primary/40 hover:bg-muted/10"
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              multiple={false}
              onChange={handleChange}
              accept=".jpg,.jpeg,.png,.webp"
            />
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
              <UploadCloud className="h-6 w-6" />
            </div>
            <p className="text-sm font-semibold text-foreground">
              Drag & drop your product image here, or{" "}
              <span className="text-primary hover:underline">browse</span>
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Supports JPEG, PNG, WEBP (Max 10MB)
            </p>
          </div>
        ) : (
          <div className="relative border border-border rounded-xl p-4 bg-muted/20 flex flex-col items-center">
            {/* Image Preview */}
            <div className="relative w-full aspect-square max-h-72 rounded-lg overflow-hidden border border-border/60 bg-muted/40">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="Upload preview"
                className="w-full h-full object-contain"
              />
              {!uploading && (
                <Button
                  size="icon"
                  variant="destructive"
                  className="absolute top-2 right-2 rounded-full h-8 w-8 shadow-md"
                  onClick={clearFile}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Meta Info */}
            <div className="w-full flex items-center space-x-3 mt-4 p-2 bg-background/50 border border-border/50 rounded-lg text-left">
              <FileImage className="h-8 w-8 text-primary/80 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-foreground truncate">{file?.name}</p>
                <p className="text-[10px] text-muted-foreground">
                  {(file!.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="w-full mt-4 flex items-center space-x-2 text-xs text-destructive bg-destructive/5 border border-destructive/20 p-2.5 rounded-lg">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Upload CTA Button */}
            <div className="w-full flex gap-3 mt-5">
              <Button
                variant="outline"
                className="flex-1 border-border"
                onClick={clearFile}
                disabled={uploading}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 shadow-lg shadow-primary/10"
                onClick={handleUpload}
                disabled={uploading}
              >
                {uploading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  "Upload Image"
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
