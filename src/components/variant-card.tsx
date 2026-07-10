"use client";

import React from "react";
import { motion } from "framer-motion";
import { Download, CheckCircle2, Image as ImageIcon } from "lucide-react";
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
  onOptimize?: (transformations: VariantTransformations, variantId: string) => void;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function downloadVariant(url: string, fileName: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
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
  onOptimize,
}: VariantCardProps) {
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
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, type: "spring", stiffness: 120 }}
      className="group relative flex flex-col border border-border bg-card/50 backdrop-blur-sm rounded-xl overflow-hidden hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
    >
      {/* Thumbnail */}
      <div className="relative bg-[repeating-conic-gradient(#80808015_0%_25%,transparent_0%_50%)] bg-[length:16px_16px] aspect-square overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt={variantId}
          className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm">
          <CheckCircle2 className="h-3 w-3 text-emerald-400" />
          #{index + 1}
        </div>
        <div className="absolute top-2 right-2 flex items-center gap-1 bg-primary/90 text-black text-[10px] font-extrabold px-2 py-0.5 rounded-full backdrop-blur-sm shadow-sm">
          Score: {score}
        </div>
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col gap-2 flex-1">
        {/* Dimension + size */}
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
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
              className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full border ${b.color}`}
            >
              {b.label}
            </span>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-auto">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 text-[11px] h-7 gap-1 px-1.5 border-border hover:border-primary/40 hover:bg-primary/5"
            onClick={() => downloadVariant(url, `${variantId}.${format}`)}
            id={`download-${variantId}`}
          >
            <Download className="h-3 w-3" />
            Download
          </Button>
          {onOptimize && (
            <Button
              size="sm"
              variant="default"
              className="flex-1 text-[11px] h-7 gap-1 px-1.5 bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
              onClick={() => onOptimize(transformations, variantId)}
              id={`optimize-${variantId}`}
            >
              🎯 Optimize
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
