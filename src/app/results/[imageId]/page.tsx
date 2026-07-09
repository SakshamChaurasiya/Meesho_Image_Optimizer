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
  createdAt: string;
}

type FilterKey = "all" | "bg-removed" | "original-bg" | "webp" | "jpeg";

const FILTER_OPTIONS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All Variants" },
  { key: "bg-removed", label: "BG Removed" },
  { key: "original-bg", label: "Original BG" },
  { key: "webp", label: "WebP Only" },
  { key: "jpeg", label: "JPEG Only" },
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
      case "webp":
        return v.format === "webp";
      case "jpeg":
        return v.format === "jpeg";
      default:
        return true;
    }
  }) ?? [];

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden selection:bg-primary/10">
      {/* Background gradients */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/8 rounded-full blur-[120px] -z-10 pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-violet-500/8 rounded-full blur-[140px] -z-10 pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/60 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-muted-foreground hover:text-foreground"
              onClick={() => router.push("/")}
              id="back-to-home-btn"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div className="h-5 w-px bg-border" />
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-primary to-violet-500 text-white shadow-md shadow-primary/20">
                <Layers className="h-4 w-4" />
              </div>
              <span className="text-base font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/75">
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
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
            <p className="text-muted-foreground text-sm">Loading variants…</p>
          </div>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4 text-center max-w-md px-4">
            <AlertCircle className="h-12 w-12 text-red-500" />
            <h2 className="text-xl font-bold">Could not load results</h2>
            <p className="text-muted-foreground text-sm">{error}</p>
            <Button onClick={() => router.push("/")} id="back-btn-error">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </div>
        </div>
      )}

      {/* Results */}
      {!loading && data && (
        <main className="container mx-auto px-4 sm:px-6 py-10 space-y-12">
          {/* Page title */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-medium">
              <Sparkles className="h-3.5 w-3.5 animate-pulse" />
              {data.variants.length} Optimized Variants Generated
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Optimization Results
            </h1>
            <p className="text-muted-foreground text-sm max-w-xl">
              <span className="font-medium text-foreground">{data.fileName}</span>
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
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-bold">Before / After Comparison</h2>
                <span className="text-xs text-muted-foreground ml-1">(drag the slider)</span>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                <BeforeAfterComparison
                  beforeUrl={data.originalUrl}
                  afterUrl={comparisonVariant.url}
                  beforeLabel="Original"
                  afterLabel="Optimized"
                />
                {/* Comparison variant selector */}
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground font-medium">
                    Currently comparing against:
                  </p>
                  <div className="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto pr-1">
                    {data.variants.map((v) => (
                      <button
                        key={v.variantId}
                        onClick={() => setComparisonVariant(v)}
                        className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                          comparisonVariant?.variantId === v.variantId
                            ? "border-primary shadow-md shadow-primary/20"
                            : "border-border hover:border-primary/40"
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={v.url}
                          alt={v.variantId}
                          className="w-full h-full object-contain bg-[repeating-conic-gradient(#80808015_0%_25%,transparent_0%_50%)] bg-[length:12px_12px]"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.section>
          )}

          {/* Variants Grid */}
          <section className="space-y-5">
            {/* Controls bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-bold">All Variants</h2>
                <span className="text-sm text-muted-foreground">
                  ({filteredVariants.length} of {data.variants.length})
                </span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {/* Filter pills */}
                {FILTER_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => setActiveFilter(opt.key)}
                    className={`text-xs px-3 py-1 rounded-full border font-medium transition-all duration-150 ${
                      activeFilter === opt.key
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    }`}
                    id={`filter-${opt.key}`}
                  >
                    {opt.label}
                  </button>
                ))}
                {/* Download all — ZIP */}
                <Button
                  size="sm"
                  variant="outline"
                  className="relative gap-2 text-xs h-8 overflow-hidden min-w-[130px] border-border hover:border-primary/40 disabled:opacity-70"
                  disabled={zipState === "fetching" || zipState === "zipping"}
                  onClick={() =>
                    downloadZip(
                      filteredVariants.map((v) => ({
                        url: v.url,
                        fileName: `${v.variantId}.${v.format}`,
                      }))
                    )
                  }
                  id="download-all-btn"
                >
                  {/* Progress fill background */}
                  {(zipState === "fetching" || zipState === "zipping") && (
                    <span
                      className="absolute inset-0 bg-primary/15 transition-all duration-300"
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
                  className="flex flex-col items-center gap-3 py-20 text-muted-foreground"
                >
                  <ImageIcon className="h-10 w-10 opacity-30" />
                  <p className="text-sm">No variants match this filter</p>
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
