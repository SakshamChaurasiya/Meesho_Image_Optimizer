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
    <Card className="w-full border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md shadow-xl shadow-slate-100/50 dark:shadow-none rounded-2xl overflow-hidden">
      <CardContent className="p-6">
        {/* Dropzone or Preview Area */}
        {!previewUrl ? (
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={onButtonClick}
            className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 sm:p-12 cursor-pointer transition-all duration-300 ${
              dragActive
                ? "border-slate-800 dark:border-slate-200 bg-slate-50 dark:bg-slate-800/30 scale-[0.99]"
                : "border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 hover:bg-slate-50/50 dark:hover:bg-slate-800/10"
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
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 mb-4 transition-colors">
              <UploadCloud className="h-6 w-6" />
            </div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 text-center">
              Drag & drop your product image here, or{" "}
              <span className="text-slate-950 dark:text-white underline font-bold">browse files</span>
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 text-center">
              Supports JPEG, PNG, WEBP (Max 10MB)
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-[10px] text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-950/40 px-3 py-1.5 rounded-full border border-slate-100 dark:border-slate-900">
              <span>✓ Optimized for Meesho dimensional weight specs</span>
            </div>
          </div>
        ) : (
          <div className="relative border border-slate-100 dark:border-slate-800 rounded-xl p-4 bg-slate-50/55 dark:bg-slate-950/20 flex flex-col items-center">
            {/* Image Preview */}
            <div className="relative w-full aspect-square max-h-72 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-950">
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
                  className="absolute top-2 right-2 rounded-full h-8 w-8 shadow-md hover:scale-105 transition-transform"
                  onClick={clearFile}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Meta Info */}
            <div className="w-full flex items-center space-x-3 mt-4 p-3 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-lg text-left">
              <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                <FileImage className="h-5 w-5 shrink-0" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-150 truncate">{file?.name}</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                  {(file!.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="w-full mt-4 flex items-center space-x-2 text-xs text-destructive bg-red-500/5 border border-red-500/10 p-2.5 rounded-lg">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Upload CTA Button */}
            <div className="w-full flex gap-3 mt-5">
              <Button
                variant="outline"
                className="flex-1 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
                onClick={clearFile}
                disabled={uploading}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-950 font-semibold shadow-md transition-all"
                onClick={handleUpload}
                disabled={uploading}
              >
                {uploading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  "Optimize Image"
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
