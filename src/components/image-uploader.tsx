"use client";

import React, { useState, useRef } from "react";
import { UploadCloud, X, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

interface ImageUploaderProps {
  onUploadSuccess?: (data: any) => void; // eslint-disable-line @typescript-eslint/no-explicit-any
}

interface UploadQueueItem {
  id: string;
  file: File;
  previewUrl: string;
  status: "idle" | "uploading" | "success" | "error";
  error?: string;
}

export function ImageUploader({ onUploadSuccess }: ImageUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [queue, setQueue] = useState<UploadQueueItem[]>([]);
  const [uploading, setUploading] = useState(false);

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

  // Validate and add multiple files
  const validateAndAddFiles = (selectedFiles: FileList) => {
    const newItems: UploadQueueItem[] = [];
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

    Array.from(selectedFiles).forEach((selectedFile) => {
      // Validate size (10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error(`"${selectedFile.name}" exceeds 10MB limit.`);
        return;
      }

      // Validate type
      if (!validTypes.includes(selectedFile.type)) {
        toast.error(`Only JPEG, PNG, and WEBP formats are supported. "${selectedFile.name}" ignored.`);
        return;
      }

      // Add to queue
      newItems.push({
        id: Math.random().toString(36).substring(7),
        file: selectedFile,
        previewUrl: URL.createObjectURL(selectedFile),
        status: "idle",
      });
    });

    if (newItems.length > 0) {
      setQueue((prev) => [...prev, ...newItems]);
      toast.success(`Added ${newItems.length} images to queue.`);
    }
  };

  // Handle drop event
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndAddFiles(e.dataTransfer.files);
    }
  };

  // Handle file input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      validateAndAddFiles(e.target.files);
    }
  };

  // Trigger file input click
  const onButtonClick = () => {
    inputRef.current?.click();
  };

  // Remove individual item
  const removeItem = (id: string) => {
    setQueue((prev) => {
      const item = prev.find((x) => x.id === id);
      if (item) {
        URL.revokeObjectURL(item.previewUrl);
      }
      return prev.filter((x) => x.id !== id);
    });
  };

  // Clear queue
  const clearQueue = () => {
    queue.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    setQueue([]);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  // Handle Sequential Upload submit
  const handleUpload = async () => {
    const pendingItems = queue.filter((x) => x.status === "idle" || x.status === "error");
    if (pendingItems.length === 0) return;

    setUploading(true);

    for (const item of pendingItems) {
      // Mark current item as uploading
      setQueue((prev) =>
        prev.map((x) => (x.id === item.id ? { ...x, status: "uploading" } : x))
      );

      const formData = new FormData();
      formData.append("file", item.file);

      try {
        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error || "Failed to upload image.");
        }

        // Mark success
        setQueue((prev) =>
          prev.map((x) => (x.id === item.id ? { ...x, status: "success" } : x))
        );

        toast.success(`"${item.file.name}" uploaded successfully!`);
        if (onUploadSuccess) {
          onUploadSuccess(result.data);
        }

        // Remove from list after short success delay
        setTimeout(() => {
          removeItem(item.id);
        }, 1500);

      } catch (err) {
        const errMsg = err instanceof Error ? err.message : "An unexpected error occurred.";
        setQueue((prev) =>
          prev.map((x) => (x.id === item.id ? { ...x, status: "error", error: errMsg } : x))
        );
        toast.error(`Failed to optimize "${item.file.name}": ${errMsg}`);
      }
    }

    setUploading(false);
  };

  return (
    <Card className="w-full border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md shadow-xl shadow-slate-100/50 dark:shadow-none rounded-2xl overflow-hidden">
      <CardContent className="p-6">
        {/* Dropzone Area */}
        {queue.length === 0 ? (
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={onButtonClick}
            className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 sm:p-12 cursor-pointer transition-all duration-300 ${
              dragActive
                ? "border-slate-800 dark:border-slate-200 bg-slate-50 dark:bg-slate-800/30 scale-[0.99]"
                : "border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-650 hover:bg-slate-50/50 dark:hover:bg-slate-800/10"
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              multiple={true}
              onChange={handleChange}
              accept=".jpg,.jpeg,.png,.webp"
            />
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-300 mb-4 transition-colors">
              <UploadCloud className="h-6 w-6" />
            </div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 text-center">
              Drag & drop product images here, or{" "}
              <span className="text-slate-950 dark:text-white underline font-bold">browse files</span>
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 text-center">
              Supports JPEG, PNG, WEBP (Max 10MB per file)
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-[10px] text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-950/40 px-3 py-1.5 rounded-full border border-slate-100 dark:border-slate-900">
              <span>✓ Batch processing enabled</span>
            </div>
          </div>
        ) : (
          <div className="relative border border-slate-100 dark:border-slate-850 rounded-xl p-4 bg-slate-50/55 dark:bg-slate-950/20 flex flex-col gap-4">
            {/* List of files in queue */}
            <div className="w-full flex items-center justify-between border-b border-slate-200/50 dark:border-slate-800 pb-2">
              <span className="text-xs font-bold text-slate-850 dark:text-slate-300">
                Upload Queue ({queue.length} file{queue.length > 1 ? "s" : ""})
              </span>
              {!uploading && (
                <button
                  onClick={clearQueue}
                  className="text-[10px] text-red-500 hover:underline font-bold"
                >
                  Clear All
                </button>
              )}
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1 scrollbar-thin">
              {queue.map((item) => (
                <div
                  key={item.id}
                  className="relative flex items-center space-x-3 p-2.5 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-lg text-left"
                >
                  {/* Preview Thumbnail */}
                  <div className="relative h-10 w-10 rounded-md overflow-hidden bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-855 shrink-0">
                    <img
                      src={item.previewUrl}
                      alt={item.file.name}
                      className="w-full h-full object-contain"
                    />
                    {item.status === "uploading" && (
                      <div className="absolute inset-0 bg-white/70 dark:bg-slate-900/70 flex items-center justify-center">
                        <RefreshCw className="h-4 w-4 text-slate-800 dark:text-slate-200 animate-spin" />
                      </div>
                    )}
                  </div>

                  {/* Meta Details */}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-150 truncate">
                      {item.file.name}
                    </p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500">
                      {(item.file.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>

                  {/* Actions & Status */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {item.status === "success" && (
                      <span className="text-[9px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded font-bold">
                        Ready
                      </span>
                    )}
                    {item.status === "error" && (
                      <div className="flex items-center gap-1 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded text-red-550 dark:text-red-400 text-[9px] font-bold" title={item.error}>
                        <AlertCircle className="h-3 w-3" />
                        Failed
                      </div>
                    )}
                    {!uploading && item.status !== "success" && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 rounded-full text-slate-400 hover:text-red-500"
                        onClick={() => removeItem(item.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Action buttons */}
            <div className="w-full flex gap-3 mt-1">
              <Button
                variant="outline"
                className="flex-1 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
                onClick={clearQueue}
                disabled={uploading}
              >
                Add More
              </Button>
              <Button
                className="flex-1 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-950 font-semibold shadow-md transition-all"
                onClick={handleUpload}
                disabled={uploading || queue.every((x) => x.status === "success")}
              >
                {uploading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Optimize Batch"
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
