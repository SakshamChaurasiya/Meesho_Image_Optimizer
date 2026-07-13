"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Layers,
  Loader2,
  Download,
  Sparkles,
  ImageIcon,
  AlertCircle,
  SlidersHorizontal,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { VariantCard, type VariantCardProps } from "@/components/variant-card";
import { BeforeAfterComparison } from "@/components/before-after-comparison";
import { useDownloadZip } from "@/hooks/use-download-zip";

interface ImageResult {
  _id: string;
  originalUrl: string;
  fileName: string;
  format: string;
  width: number;
  height: number;
  size: number;
  status: string;
  variants: Omit<VariantCardProps, "index">[];
  analysis?: {
    dimensions: { width: number; height: number };
    boundingBox: { left: number; top: number; width: number; height: number };
    occupancyRatio: number;
    whiteSpaceRatio: number;
    centerAlignment: { dx: number; dy: number; isCentered: boolean };
    brightness: number;
    contrast: number;
    resolution: number;
    aspectRatio: number;
  };
  createdAt: string;
}

type FilterKey = "all" | "bg-removed" | "original-bg";

const FILTER_OPTIONS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All Variants" },
  { key: "bg-removed", label: "BG Removed" },
  { key: "original-bg", label: "Original BG" },
];

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function ResultsPage() {
  const { imageId } = useParams<{ imageId: string }>();
  const router = useRouter();
  const [data, setData] = useState<ImageResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const [comparisonVariant, setComparisonVariant] = useState<Omit<VariantCardProps, "index"> | null>(null);
  const { download: downloadZip, state: zipState, progress: zipProgress } = useDownloadZip(
    data ? `packoptima_${data.fileName.replace(/\.[^.]+$/, "")}_variants.zip` : "packoptima_variants.zip"
  );

  useEffect(() => {
    if (!imageId) return;
    fetch(`/api/results/${imageId}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setData(json.data);
          // Default comparison to first bg-removed variant
          const bgRemoved = json.data.variants.find(
            (v: Omit<VariantCardProps, "index">) => v.transformations.backgroundRemoved
          );
          setComparisonVariant(bgRemoved ?? json.data.variants[0] ?? null);
        } else {
          setError(json.error ?? "Failed to load results");
        }
      })
      .catch(() => setError("Network error — could not load results"))
      .finally(() => setLoading(false));
  }, [imageId]);

  const filteredVariants = data?.variants.filter((v) => {
    switch (activeFilter) {
      case "bg-removed":
        return v.transformations.backgroundRemoved;
      case "original-bg":
        return !v.transformations.backgroundRemoved;
      default:
        return true;
    }
  }) ?? [];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f19] relative overflow-x-hidden selection:bg-slate-900/10 dark:selection:bg-white/10">
      {/* Background decoration */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-slate-100 dark:bg-slate-900/20 rounded-full blur-[140px] -z-10 pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 max-w-7xl">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-slate-550 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 font-semibold"
              onClick={() => router.push("/")}
              id="back-to-home-btn"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div className="h-4 w-px bg-slate-200 dark:bg-slate-850" />
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 shadow-sm">
                <Layers className="h-4 w-4" />
              </div>
              <span className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white">
                PackOptima
              </span>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4 text-center">
            <Loader2 className="h-9 w-9 text-slate-800 dark:text-slate-200 animate-spin" />
            <p className="text-slate-550 dark:text-slate-400 text-sm font-semibold">
              Analyzing image & compiling safety padding variants…
            </p>
          </div>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4 text-center max-w-md px-6 py-8 border border-red-100 dark:border-red-950/20 bg-white dark:bg-slate-900/40 rounded-2xl">
            <AlertCircle className="h-10 w-10 text-red-500" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Failed to retrieve results</h2>
            <p className="text-slate-500 dark:text-slate-400 text-xs">{error}</p>
            <Button className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-slate-200 text-xs mt-2" onClick={() => router.push("/")} id="back-btn-error">
              <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
              Return Home
            </Button>
          </div>
        </div>
      )}

      {/* Results */}
      {!loading && data && (
        <main className="container mx-auto px-4 sm:px-6 py-10 space-y-12 max-w-7xl">
          {/* Page title */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/10 dark:border-emerald-400/10 bg-emerald-500/5 text-emerald-600 dark:text-emerald-450 text-xs font-semibold">
              <Sparkles className="h-3.5 w-3.5 text-emerald-500 animate-pulse" />
              {data.variants.length} Safety Variants Generated
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Optimization Workbench
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs max-w-xl font-medium">
              Source: <span className="font-bold text-slate-800 dark:text-slate-200">{data.fileName}</span>
              {" · "}
              {data.width}×{data.height} · {formatBytes(data.size)} · {data.format.toUpperCase()}
            </p>
          </motion.div>

          {/* Before / After Comparison */}
          {comparisonVariant && (
            <motion.section
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2 border-b border-slate-200/60 dark:border-slate-850 pb-2">
                <SlidersHorizontal className="h-4.5 w-4.5 text-slate-550 dark:text-slate-450" />
                <h2 className="text-base font-extrabold text-slate-800 dark:text-slate-200">Interactive Comparison</h2>
                <span className="text-xs text-slate-400 dark:text-slate-500 font-medium ml-1">(drag slider to inspect bounds)</span>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-7">
                  <BeforeAfterComparison
                    beforeUrl={data.originalUrl}
                    afterUrl={comparisonVariant.url}
                    beforeLabel="Original"
                    afterLabel="Optimized"
                  />
                </div>
                {/* Comparison variant selector */}
                <div className="lg:col-span-5 space-y-4 border border-slate-200/80 dark:border-slate-800/80 bg-white/50 dark:bg-slate-900/30 p-5 rounded-2xl">
                  <div className="text-left">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Select Variant to Compare:
                    </p>
                    <p className="text-[11px] text-slate-450 dark:text-slate-500 mt-1 font-semibold leading-relaxed">
                      Pick any generated margin or brightness scale layout to preview it side-by-side with your original listing photo.
                    </p>
                  </div>
                  <div className="grid grid-cols-4 gap-2 max-h-[260px] overflow-y-auto pr-1 scrollbar-thin">
                    {data.variants.map((v, idx) => (
                      <button
                        key={v.variantId}
                        onClick={() => setComparisonVariant(v)}
                        className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                          comparisonVariant?.variantId === v.variantId
                            ? "border-slate-900 dark:border-slate-100 shadow-md"
                            : "border-slate-200/80 dark:border-slate-800 hover:border-slate-450 dark:hover:border-slate-650"
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={v.url}
                          alt={v.variantId}
                          className="w-full h-full object-contain bg-[repeating-conic-gradient(#80808010_0%_25%,transparent_0%_50%)] bg-[length:10px_10px]"
                        />
                        <span className="absolute bottom-0 right-0 bg-slate-950/80 text-white text-[9px] px-1 rounded-tl-md font-bold">
                          #{idx + 1}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.section>
          )}

          {/* Image Analysis Dashboard */}
          {data.analysis && (
            <motion.section
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2 border-b border-slate-200/60 dark:border-slate-850 pb-2">
                <Sparkles className="h-4.5 w-4.5 text-slate-550 dark:text-slate-450 animate-pulse" />
                <h2 className="text-base font-extrabold text-slate-800 dark:text-slate-200">AI Bounding Box Analysis</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
                <div className="border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900/30 p-4 rounded-xl flex flex-col justify-between hover:border-slate-400 dark:hover:border-slate-700 transition-all duration-300">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-wider">Dimensions</span>
                  <span className="text-sm font-bold mt-1 text-slate-800 dark:text-slate-200">{data.analysis.dimensions.width}×{data.analysis.dimensions.height}</span>
                </div>
                <div className="border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900/30 p-4 rounded-xl flex flex-col justify-between hover:border-slate-400 dark:hover:border-slate-700 transition-all duration-300">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-wider">Occupancy</span>
                  <span className="text-sm font-bold mt-1 text-slate-800 dark:text-slate-200">{Math.round(data.analysis.occupancyRatio * 100)}%</span>
                </div>
                <div className="border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900/30 p-4 rounded-xl flex flex-col justify-between hover:border-slate-400 dark:hover:border-slate-700 transition-all duration-300">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-wider">White Space</span>
                  <span className="text-sm font-bold mt-1 text-slate-800 dark:text-slate-200">{Math.round(data.analysis.whiteSpaceRatio * 100)}%</span>
                </div>
                <div className="border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900/30 p-4 rounded-xl flex flex-col justify-between hover:border-slate-400 dark:hover:border-slate-700 transition-all duration-300">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-wider">Centered</span>
                  <span className="text-sm font-bold mt-1 text-slate-800 dark:text-slate-200">{data.analysis.centerAlignment.isCentered ? "Yes" : "No"}</span>
                </div>
                <div className="border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900/30 p-4 rounded-xl flex flex-col justify-between hover:border-slate-400 dark:hover:border-slate-700 transition-all duration-300">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-wider">Brightness</span>
                  <span className="text-sm font-bold mt-1 text-slate-800 dark:text-slate-200">{Math.round(data.analysis.brightness)}/255</span>
                </div>
                <div className="border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900/30 p-4 rounded-xl flex flex-col justify-between hover:border-slate-400 dark:hover:border-slate-700 transition-all duration-300">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-wider">Contrast</span>
                  <span className="text-sm font-bold mt-1 text-slate-800 dark:text-slate-200">{Math.round(data.analysis.contrast)}/128</span>
                </div>
                <div className="border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900/30 p-4 rounded-xl flex flex-col justify-between hover:border-slate-400 dark:hover:border-slate-700 transition-all duration-300">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-wider">Resolution</span>
                  <span className="text-sm font-bold mt-1 text-slate-800 dark:text-slate-200">{(data.analysis.resolution / 1000000).toFixed(2)} MP</span>
                </div>
                <div className="border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900/30 p-4 rounded-xl flex flex-col justify-between hover:border-slate-400 dark:hover:border-slate-700 transition-all duration-300">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-wider">Aspect Ratio</span>
                  <span className="text-sm font-bold mt-1 text-slate-800 dark:text-slate-200">{data.analysis.aspectRatio.toFixed(2)}:1</span>
                </div>
              </div>
            </motion.section>
          )}

          {/* Variants Grid */}
          <section className="space-y-6">
            {/* Controls bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/60 dark:border-slate-850 pb-3">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-4.5 w-4.5 text-slate-550 dark:text-slate-400" />
                <h2 className="text-base font-extrabold text-slate-800 dark:text-slate-200">Generated Variations</h2>
                <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold">
                  ({filteredVariants.length} of {data.variants.length} listed)
                </span>
              </div>
              <div className="flex items-center gap-2.5 flex-wrap">
                {/* Filter pills */}
                <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-950 rounded-lg border border-slate-200/60 dark:border-slate-850">
                  {FILTER_OPTIONS.map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() => setActiveFilter(opt.key)}
                      className={`text-[11px] px-3 py-1 rounded-md font-bold transition-all duration-150 ${
                        activeFilter === opt.key
                          ? "bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-sm border border-slate-200/50 dark:border-slate-800"
                          : "text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-350"
                      }`}
                      id={`filter-${opt.key}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {/* Download all — ZIP */}
                <Button
                  size="sm"
                  className="relative gap-1.5 text-xs h-8 overflow-hidden min-w-[130px] bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-955 font-bold disabled:opacity-75"
                  disabled={zipState === "fetching" || zipState === "zipping"}
                  onClick={() => {
                    const imageEntries = filteredVariants.map((v, index) => ({
                      url: v.url,
                      fileName: `${String(index + 1).padStart(2, '0')}_${v.variantId}.${v.format}`,
                    }));

                    const metadataText = [
                      "PACKOPTIMA VARIANTS CONSTRAINTS & METADATA",
                      `Generated At: ${new Date().toLocaleString()}`,
                      `Total Images: ${filteredVariants.length}`,
                      "==================================================",
                      "",
                      ...filteredVariants.map((v, index) => {
                        const num = String(index + 1).padStart(2, '0');
                        const bgType = v.transformations.backgroundRemoved
                          ? (v.variantId.includes("transparent") ? "Transparent" : v.variantId.includes("light-gray") ? "Light Gray" : "White")
                          : "Original Background";

                        return `[Image #${num}]
File: ${num}_${v.variantId}.jpeg
Background Removal: ${v.transformations.backgroundRemoved ? "Yes" : "No"}
Background Color: ${bgType}
Padding: ${v.transformations.paddingApplied}%
Brightness: ${v.transformations.brightnessAdjusted > 1.0 ? `+${Math.round((v.transformations.brightnessAdjusted - 1) * 100)}%` : "Normal"}
Contrast: ${v.transformations.contrastAdjusted > 1.0 ? `+${Math.round((v.transformations.contrastAdjusted - 1) * 100)}%` : "Normal"}
Quality Score: ${v.score}/100
Dimensions: ${v.width}x${v.height}
Size: ${formatBytes(v.size)}
----------------------------------------`;
                      })
                    ].join("\n");

                    downloadZip([
                      ...imageEntries,
                      {
                        fileName: "metadata.txt",
                        content: metadataText,
                      }
                    ]);
                  }}
                  id="download-all-btn"
                >
                  {/* Progress fill background */}
                  {(zipState === "fetching" || zipState === "zipping") && (
                    <span
                      className="absolute inset-y-0 left-0 bg-emerald-500/20 transition-all duration-300"
                      style={{ width: `${zipProgress}%` }}
                    />
                  )}
                  <span className="relative flex items-center gap-1.5">
                    {zipState === "fetching" && (
                      <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Fetching… {zipProgress}%</>
                    )}
                    {zipState === "zipping" && (
                      <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Zipping… {zipProgress}%</>
                    )}
                    {zipState === "done" && (
                      <><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Done!</>
                    )}
                    {zipState === "error" && (
                      <><AlertCircle className="h-3.5 w-3.5 text-red-500" /> Error</>
                    )}
                    {zipState === "idle" && (
                      <><Download className="h-3.5 w-3.5" /> Download All (.zip)</>
                    )}
                  </span>
                </Button>
              </div>
            </div>

            {/* Grid */}
            <AnimatePresence mode="wait">
              {filteredVariants.length === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center gap-3 py-20 text-slate-400 dark:text-slate-500 text-center"
                >
                  <ImageIcon className="h-10 w-10 opacity-30" />
                  <p className="text-sm font-semibold">No variants match this filter</p>
                </motion.div>
              ) : (
                <motion.div
                  key={activeFilter}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                  className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
                >
                  {filteredVariants.map((variant, i) => (
                    <VariantCard key={variant.variantId} {...variant} index={i} />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        </main>
      )}
    </div>
  );
}
