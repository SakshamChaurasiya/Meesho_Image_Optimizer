"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, CheckCircle2, Image as ImageIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VariantTransformations {
  backgroundRemoved: boolean;
  objectCentered: boolean;
  paddingApplied: number;
  brightnessAdjusted: number;
  contrastAdjusted: number;
  compressed: boolean;
}

export interface VariantCardProps {
  variantId: string;
  url: string;
  format: string;
  size: number;
  width: number;
  height: number;
  transformations: VariantTransformations;
  score: number;
  index: number;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

async function downloadVariant(url: string, fileName: string) {
  let downloadUrl = url;
  if (url.includes("cloudinary.com") && url.includes("/upload/")) {
    downloadUrl = url.replace("/upload/", "/upload/fl_attachment/");
  }

  try {
    const response = await fetch(downloadUrl);
    if (!response.ok) throw new Error("Network response was not ok");
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(blobUrl);
  } catch {
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}

export function VariantCard({
  variantId,
  url,
  format,
  size,
  width,
  height,
  transformations,
  score,
  index,
}: VariantCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const badges: { label: string; color: string }[] = [];

  if (transformations.backgroundRemoved) {
    badges.push({ label: "BG Removed", color: "bg-violet-500/10 text-violet-400 border-violet-500/20" });
  } else {
    badges.push({ label: "Original BG", color: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20" });
  }

  badges.push({
    label: `Pad ${transformations.paddingApplied}%`,
    color: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  });

  if (transformations.brightnessAdjusted > 1.0) {
    badges.push({
      label: `Bright +${Math.round((transformations.brightnessAdjusted - 1) * 100)}%`,
      color: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    });
  }

  badges.push({
    label: format.toUpperCase(),
    color:
      format === "webp"
        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
        : "bg-orange-500/10 text-orange-400 border-orange-500/20",
  });

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.03, type: "spring", stiffness: 120 }}
        className="group relative flex flex-col border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 rounded-xl overflow-hidden hover:border-slate-400 dark:hover:border-slate-650 hover:shadow-lg hover:shadow-slate-100/50 dark:hover:shadow-none transition-all duration-300"
      >
        {/* Thumbnail */}
        <div 
          onClick={() => setIsOpen(true)}
          className="relative bg-[repeating-conic-gradient(#80808010_0%_25%,transparent_0%_50%)] bg-[length:16px_16px] dark:bg-[repeating-conic-gradient(#ffffff04_0%_25%,transparent_0%_50%)] aspect-square overflow-hidden border-b border-slate-100 dark:border-slate-800 cursor-pointer"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt={variantId}
            className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-[1.03]"
          />
          {/* Hover overlay for zoom icon */}
          <div className="absolute inset-0 bg-slate-950/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <span className="bg-white/90 dark:bg-slate-900/95 text-slate-850 dark:text-white px-3.5 py-1.5 rounded-full text-xs font-bold shadow-md flex items-center gap-1.5 backdrop-blur-xs scale-90 group-hover:scale-100 transition-all duration-350">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
              Preview
            </span>
          </div>
          <div className="absolute top-2 left-2 flex items-center gap-1 bg-slate-900/90 dark:bg-slate-955/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm shadow-sm">
            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
            #{index + 1}
          </div>
          <div className="absolute top-2 right-2 flex items-center gap-1 bg-emerald-500/90 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full backdrop-blur-sm shadow-sm">
            Score: {score}
          </div>
        </div>

        {/* Info */}
        <div className="p-3.5 flex flex-col gap-3.5 flex-1">
          {/* Dimension + size */}
          <div className="flex items-center justify-between text-[10px] font-medium text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <ImageIcon className="h-3 w-3" />
              {width}×{height}
            </span>
            <span>{formatBytes(size)}</span>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-1">
            {badges.map((b) => (
              <span
                key={b.label}
                className={`text-[9px] font-semibold px-2 py-0.5 rounded-md border ${
                  b.color.includes("zinc")
                    ? "bg-slate-100 dark:bg-slate-850 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800"
                    : b.color.includes("violet")
                    ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/25"
                    : b.color
                }`}
              >
                {b.label}
              </span>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 mt-auto pt-1">
            <Button
              size="sm"
              variant="outline"
              className="w-full text-xs h-8 gap-1.5 px-2 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold cursor-pointer"
              onClick={() => downloadVariant(url, `${variantId}.${format}`)}
              id={`download-${variantId}`}
            >
              <Download className="h-3 w-3" />
              Download
            </Button>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-10">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="relative w-full max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh] md:max-h-[85vh]"
            >
              {/* Close Button */}
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-3 right-3 z-10 p-1.5 bg-white/80 dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-full border border-slate-200/50 dark:border-slate-800/50 shadow-sm transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Image Preview Side */}
              <div className="relative flex-1 bg-[repeating-conic-gradient(#80808010_0%_25%,transparent_0%_50%)] bg-[length:16px_16px] dark:bg-[repeating-conic-gradient(#ffffff04_0%_25%,transparent_0%_50%)] flex items-center justify-center p-6 aspect-square md:aspect-auto md:h-full overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={variantId}
                  className="max-w-full max-h-[40vh] md:max-h-[70vh] object-contain drop-shadow-md"
                />
              </div>

              {/* Detail Side */}
              <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-800 p-6 flex flex-col justify-between bg-slate-50/50 dark:bg-slate-900/30 overflow-y-auto">
                <div className="flex flex-col gap-5">
                  <div>
                    <span className="text-[10px] font-bold tracking-wider text-emerald-500 dark:text-emerald-400 uppercase">
                      Variant details
                    </span>
                    <h3 className="text-base font-bold text-slate-850 dark:text-white mt-1 break-all">
                      {variantId}
                    </h3>
                  </div>

                  {/* Optimization Score */}
                  <div className="bg-emerald-500/10 dark:bg-emerald-500/5 border border-emerald-500/25 dark:border-emerald-500/15 rounded-xl p-3.5 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-350">
                      Quality Score
                    </span>
                    <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                      {score} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">/ 100</span>
                    </span>
                  </div>

                  {/* File Metadata */}
                  <div className="grid grid-cols-2 gap-3.5">
                    <div className="bg-slate-100/60 dark:bg-slate-800/40 rounded-xl p-3 border border-slate-200/40 dark:border-slate-800/40">
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase">Dimensions</span>
                      <p className="text-xs font-extrabold text-slate-700 dark:text-slate-200 mt-0.5">{width} × {height}</p>
                    </div>
                    <div className="bg-slate-100/60 dark:bg-slate-800/40 rounded-xl p-3 border border-slate-200/40 dark:border-slate-800/40">
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase">File Size</span>
                      <p className="text-xs font-extrabold text-slate-700 dark:text-slate-200 mt-0.5">{formatBytes(size)}</p>
                    </div>
                  </div>

                  {/* Characteristics list */}
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider">Applied Rules</span>
                    <div className="flex flex-wrap gap-1.5">
                      {badges.map((b) => (
                        <span
                          key={b.label}
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border ${
                            b.color.includes("zinc")
                              ? "bg-slate-100 dark:bg-slate-850 text-slate-600 dark:text-slate-350 border-slate-200 dark:border-slate-800"
                              : b.color.includes("violet")
                              ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/25"
                              : b.color
                          }`}
                        >
                          {b.label}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-slate-200/50 dark:border-slate-800/50">
                  <Button
                    className="w-full h-11 gap-2 text-xs font-bold shadow-md cursor-pointer"
                    onClick={() => downloadVariant(url, `${variantId}.${format}`)}
                  >
                    <Download className="h-4 w-4" />
                    Download Variant
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
