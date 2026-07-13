"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ImageUploader } from "@/components/image-uploader";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Zap,
  Shield,
  Layers,
  Image as ImageIcon,
  ArrowRight,
  Maximize,
  Loader2,
  CheckCircle2,
  XCircle,
  Trash2,
} from "lucide-react";

interface UploadedImage {
  _id: string;
  originalUrl: string;
  fileName: string;
  format: string;
  status: string;
  variantCount?: number;
}

export default function Home() {
  const router = useRouter();
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const fetchImages = useCallback(async () => {
    try {
      const res = await fetch("/api/upload");
      const result = await res.json();
      if (result.success) {
        setImages(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch images:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  const handleUploadSuccess = (newImage: UploadedImage) => {
    setImages((prev) => [newImage, ...prev]);
  };

  const handleProcess = async (imageId: string) => {
    setProcessingIds((prev) => new Set(prev).add(imageId));
    try {
      const res = await fetch("/api/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageId }),
      });
      const result = await res.json();
      if (res.ok && result.success) {
        setImages((prev) =>
          prev.map((img) =>
            img._id === imageId
              ? { ...img, status: "completed", variantCount: result.variantCount }
              : img
          )
        );
      } else {
        setImages((prev) =>
          prev.map((img) =>
            img._id === imageId ? { ...img, status: "failed" } : img
          )
        );
      }
    } catch (err) {
      console.error("Processing failed:", err);
      setImages((prev) =>
        prev.map((img) =>
          img._id === imageId ? { ...img, status: "failed" } : img
        )
      );
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(imageId);
        return next;
      });
    }
  };

  const handleDelete = async (imageId: string) => {
    // First click: show confirmation
    if (confirmDeleteId !== imageId) {
      setConfirmDeleteId(imageId);
      // Auto-cancel confirm after 4s if user doesn't click again
      setTimeout(() => setConfirmDeleteId((id) => (id === imageId ? null : id)), 4000);
      return;
    }
    // Second click: proceed with deletion
    setConfirmDeleteId(null);
    setDeletingIds((prev) => new Set(prev).add(imageId));
    try {
      const res = await fetch("/api/upload", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageId }),
      });
      if (res.ok) {
        setImages((prev) => prev.filter((img) => img._id !== imageId));
      } else {
        console.error("Delete failed:", await res.text());
      }
    } catch (err) {
      console.error("Delete error:", err);
    } finally {
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(imageId);
        return next;
      });
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 100 } },
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f19] relative overflow-hidden selection:bg-slate-900/10 dark:selection:bg-white/10">
      {/* Background decoration */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-slate-100 dark:bg-slate-900/20 rounded-full blur-[140px] -z-10 pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000005_1px,transparent_1px),linear-gradient(to_bottom,#00000005_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:20px_20px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_80%,transparent_100%)] -z-10" />

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 max-w-7xl">
          <div className="flex items-center space-x-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 shadow-md">
              <Layers className="h-4.5 w-4.5" />
            </div>
            <span className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">
              PackOptima
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <Button size="sm" className="bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-950 font-semibold shadow-sm transition-all" onClick={() => {
              const uploadSection = document.getElementById("upload-section");
              uploadSection?.scrollIntoView({ behavior: "smooth" });
            }}>
              Start Optimizing
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 sm:px-6 py-12 lg:py-20 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column */}
          <div className="lg:col-span-7 flex flex-col items-start space-y-6 text-left">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center space-x-2 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-1 text-xs font-semibold text-slate-600 dark:text-slate-350 shadow-sm"
            >
              <Sparkles className="h-3.5 w-3.5 text-emerald-500 animate-pulse" />
              <span>Meesho Seller Image Optimization Utility</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.15] text-slate-900 dark:text-white"
            >
              Reduce Meesho Shipping Costs with{" "}
              <span className="text-emerald-600 dark:text-emerald-400">
                AI-Optimized
              </span>{" "}
              Product Images
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-base text-slate-500 dark:text-slate-400 max-w-xl leading-relaxed"
            >
              Logistics systems determine shipping charges by scanning product bounds. PackOptima automatically creates 20–25 visual layouts with centered positioning, safety margins, and optimized contrast to prevent excessive dimensional weight estimation.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto"
            >
              <Button size="lg" className="bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-950 font-bold shadow-md" onClick={() => {
                const uploadSection = document.getElementById("upload-section");
                uploadSection?.scrollIntoView({ behavior: "smooth" });
              }}>
                Upload Product Image
                <ArrowRight className="ml-2 h-4.5 w-4.5" />
              </Button>
              <Button size="lg" variant="outline" className="border-slate-200 dark:border-slate-850 hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-350" onClick={() => {
                const howItWorksSection = document.getElementById("how-it-works");
                howItWorksSection?.scrollIntoView({ behavior: "smooth" });
              }}>
                How It Works
              </Button>
            </motion.div>

            {/* Quick Metrics */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="grid grid-cols-3 gap-6 pt-6 border-t border-slate-200 dark:border-slate-850 w-full max-w-lg"
            >
              <div>
                <h4 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-200">20–25</h4>
                <p className="text-[11px] text-slate-450 dark:text-slate-500 mt-1 font-medium">Variants Generated</p>
              </div>
              <div>
                <h4 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-200">100%</h4>
                <p className="text-[11px] text-slate-450 dark:text-slate-500 mt-1 font-medium">Meesho Compliant</p>
              </div>
              <div>
                <h4 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-200">Seconds</h4>
                <p className="text-[11px] text-slate-450 dark:text-slate-500 mt-1 font-medium">Processing Speed</p>
              </div>
            </motion.div>
          </div>

          {/* Right Column: Upload Component */}
          <div id="upload-section" className="lg:col-span-5 relative w-full flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="w-full relative"
            >
              <ImageUploader onUploadSuccess={handleUploadSuccess} />
            </motion.div>
          </div>
        </div>
      </main>

      {/* Recent Uploaded Images Grid */}
      <AnimatePresence>
        {(loading || images.length > 0) && (
          <section className="container mx-auto px-4 sm:px-6 py-12 border-t border-slate-200 dark:border-slate-850 bg-white/40 dark:bg-slate-900/10 backdrop-blur-sm max-w-7xl">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-lg font-bold mb-6 text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-slate-650 dark:text-slate-400" />
                Your Optimized Catalog Images
              </h2>
              {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 animate-in fade-in duration-300">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="border border-slate-200 dark:border-slate-805 bg-white dark:bg-slate-900/40 rounded-xl p-3.5 flex flex-col gap-3.5 animate-pulse">
                      <div className="aspect-square rounded-lg bg-slate-100 dark:bg-slate-950/80" />
                      <div className="space-y-2">
                        <div className="h-3 bg-slate-100 dark:bg-slate-950/80 rounded w-2/3" />
                        <div className="flex justify-between items-center">
                          <div className="h-2.5 bg-slate-100 dark:bg-slate-950/80 rounded w-1/4" />
                          <div className="h-4 bg-slate-100 dark:bg-slate-950/80 rounded w-1/3" />
                        </div>
                      </div>
                      <div className="h-8 bg-slate-100 dark:bg-slate-950/85 rounded-lg mt-1 w-full" />
                      <div className="h-6 bg-slate-100 dark:bg-slate-950/85 rounded-lg w-full" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {images.map((img) => {
                    const isProcessing = processingIds.has(img._id);
                    const statusColor =
                      img.status === "completed"
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                        : img.status === "failed"
                        ? "bg-red-500/10 text-red-650 dark:text-red-400 border-red-500/20"
                        : img.status === "processing"
                        ? "bg-blue-500/10 text-blue-650 dark:text-blue-400 border-blue-500/20"
                        : "bg-amber-500/10 text-amber-650 dark:text-amber-400 border-amber-500/20";

                    return (
                      <motion.div
                        key={img._id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="relative group border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 rounded-xl overflow-hidden flex flex-col p-3 gap-2"
                      >
                        {/* Image thumbnail */}
                        <div className="relative aspect-square rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={img.originalUrl}
                            alt={img.fileName}
                            className="w-full h-full object-contain"
                          />
                          {isProcessing && (
                            <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 flex items-center justify-center">
                              <Loader2 className="h-5 w-5 text-slate-900 dark:text-slate-100 animate-spin" />
                            </div>
                          )}
                        </div>

                        {/* Info row */}
                        <div className="text-left">
                          <p className="text-xs font-bold truncate text-slate-850 dark:text-slate-205">{img.fileName}</p>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase">{img.format}</span>
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md border ${statusColor}`}>
                              {img.status === "completed" && img.variantCount
                                ? `${img.variantCount} variants`
                                : img.status}
                            </span>
                          </div>
                        </div>

                        {/* Action row */}
                        {img.status === "pending" && !isProcessing && (
                          <Button
                            size="sm"
                            className="w-full text-xs h-8 mt-1 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-slate-200 font-semibold"
                            onClick={() => handleProcess(img._id)}
                            id={`process-btn-${img._id}`}
                          >
                            <Zap className="h-3 w-3 mr-1.5" />
                            Generate Variants
                          </Button>
                        )}
                        {img.status === "completed" && (
                          <Button
                            size="sm"
                            className="w-full text-xs h-8 mt-1 gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold border-0"
                            onClick={() => router.push(`/results/${img._id}`)}
                            id={`view-results-btn-${img._id}`}
                          >
                            <CheckCircle2 className="h-3 w-3" />
                            Compare & Select
                            <ArrowRight className="h-3 w-3 ml-auto" />
                          </Button>
                        )}
                        {img.status === "failed" && (
                          <div className="flex items-center justify-center gap-1 text-red-500 text-xs font-bold mt-1.5 py-1">
                            <XCircle className="h-3.5 w-3.5" />
                            Failed
                          </div>
                        )}

                        {/* Delete button */}
                        <button
                          className={`w-full flex items-center justify-center gap-1 text-[9px] font-bold mt-0.5 py-1.5 rounded-lg border transition-all duration-150 ${
                            confirmDeleteId === img._id
                              ? "border-red-200 bg-red-50 dark:bg-red-950/20 text-red-650 hover:bg-red-100 dark:hover:bg-red-950/40"
                              : "border-slate-100 dark:border-slate-800/80 text-slate-400 dark:text-slate-500 hover:border-red-100 hover:text-red-500"
                          } ${deletingIds.has(img._id) ? "opacity-50 pointer-events-none" : ""}`}
                          onClick={() => handleDelete(img._id)}
                          id={`delete-btn-${img._id}`}
                          disabled={deletingIds.has(img._id)}
                        >
                          {deletingIds.has(img._id) ? (
                            <><Loader2 className="h-3 w-3 animate-spin" /> Deleting…</>
                          ) : confirmDeleteId === img._id ? (
                            <><Trash2 className="h-3 w-3" /> Confirm Delete</>  
                          ) : (
                            <><Trash2 className="h-3 w-3" /> Remove Image</>
                          )}
                        </button>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        )}
      </AnimatePresence>

      {/* How It Works Section */}
      <section id="how-it-works" className="border-t border-slate-200 dark:border-slate-850 py-16 sm:py-24 max-w-7xl mx-auto container px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-450 uppercase tracking-widest bg-emerald-500/5 px-3 py-1 rounded-md border border-emerald-500/10">Process Flow</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-4">Optimize Images in 4 Simple Steps</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">How we calculate safety ranges to ensure barcode scanners determine optimal dimensions.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="flex flex-col items-center text-center p-4">
            <div className="h-12 w-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-105 flex items-center justify-center font-bold text-lg mb-4 shadow-sm border border-slate-200/50 dark:border-slate-700">1</div>
            <h3 className="font-bold text-slate-800 dark:text-slate-205 mb-2 text-base">Upload Image</h3>
            <p className="text-xs text-slate-550 dark:text-slate-405 leading-relaxed">Drag and drop your raw product listing photo into the upload dropzone.</p>
          </div>
          <div className="flex flex-col items-center text-center p-4">
            <div className="h-12 w-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-105 flex items-center justify-center font-bold text-lg mb-4 shadow-sm border border-slate-200/50 dark:border-slate-700">2</div>
            <h3 className="font-bold text-slate-800 dark:text-slate-205 mb-2 text-base">AI Analysis</h3>
            <p className="text-xs text-slate-550 dark:text-slate-405 leading-relaxed">Our AI isolates the product bounding box, alignment vectors, and white space ratios.</p>
          </div>
          <div className="flex flex-col items-center text-center p-4">
            <div className="h-12 w-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-105 flex items-center justify-center font-bold text-lg mb-4 shadow-sm border border-slate-200/50 dark:border-slate-700">3</div>
            <h3 className="font-bold text-slate-800 dark:text-slate-205 mb-2 text-base">Generate Layouts</h3>
            <p className="text-xs text-slate-550 dark:text-slate-405 leading-relaxed">The system generates 20–25 visual variants with calibrated safety padding percentages.</p>
          </div>
          <div className="flex flex-col items-center text-center p-4">
            <div className="h-12 w-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-lg mb-4 shadow-sm border border-emerald-500/20">4</div>
            <h3 className="font-bold text-slate-800 dark:text-slate-205 mb-2 text-base">Compare & Use</h3>
            <p className="text-xs text-slate-550 dark:text-slate-405 leading-relaxed">Select the variant offering optimal padding alignment, download, and update your Meesho listing.</p>
          </div>
        </div>
      </section>

      {/* Why PackOptima Section */}
      <section className="border-t border-slate-200 dark:border-slate-850 bg-slate-100/30 dark:bg-slate-950/20 py-16 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-450 uppercase tracking-widest bg-emerald-500/5 px-3 py-1 rounded-md border border-emerald-500/10">Tool Capabilities</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-4">Why Sellers Choose PackOptima</h2>
            <p className="text-slate-550 dark:text-slate-405 mt-2 text-sm">Deterministic visual optimization designed specifically to lower logistics weight calculations.</p>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {/* Feature 1 */}
            <motion.div variants={itemVariants}>
              <Card className="border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md transition-all duration-300 rounded-xl">
                <CardContent className="p-6 flex flex-col space-y-4">
                  <div className="h-10 w-10 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center justify-center">
                    <Maximize className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Dynamic Padding Optimization</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Automatically inserts optimal white boundaries. This stops automated warehouse scanners from clipping product edges, preventing incorrect volume estimations.
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Feature 2 */}
            <motion.div variants={itemVariants}>
              <Card className="border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md transition-all duration-300 rounded-xl">
                <CardContent className="p-6 flex flex-col space-y-4">
                  <div className="h-10 w-10 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-850 dark:text-slate-200 flex items-center justify-center">
                    <Zap className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">20–25 Variations in One Click</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Evaluates contrast scales, margins, alignments, and backgrounds, all compiled in seconds to give you multiple listing image variants to pick from.
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Feature 3 */}
            <motion.div variants={itemVariants}>
              <Card className="border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md transition-all duration-300 rounded-xl">
                <CardContent className="p-6 flex flex-col space-y-4">
                  <div className="h-10 w-10 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-850 dark:text-slate-200 flex items-center justify-center">
                    <Shield className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">100% Marketplace Compliant</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Provides clean, background-corrected images matching Meesho listing standards, preserving exact catalog resolutions without artifacting.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="border-t border-slate-200 dark:border-slate-850 py-16 sm:py-24 max-w-4xl mx-auto container px-4 sm:px-6">
        <div className="text-center mb-12">
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-450 uppercase tracking-widest bg-emerald-500/5 px-3 py-1 rounded-md border border-emerald-500/10">Help Center</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-4">Frequently Asked Questions</h2>
        </div>

        <div className="space-y-6">
          <div className="p-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 rounded-xl">
            <h3 className="font-bold text-slate-855 dark:text-slate-105 text-sm">How does PackOptima help reduce Meesho shipping costs?</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
              Meesho logistics warehouses use computerized scanning cameras to measure product dimensions. If a listing photo is off-center or lacks safety borders, automated scanners may miscalculate the product edges, leading to higher dimensional weight charges. PackOptima optimizes padding and centering to ensure accurate scanning.
            </p>
          </div>
          <div className="p-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 rounded-xl">
            <h3 className="font-bold text-slate-855 dark:text-slate-105 text-sm">How many image variants are generated?</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
              For every uploaded image, the tool processes approximately 20–25 unique layout variants. These include background-removed files with white or light-gray fills, varying border padding amounts, and fine-tuned brightness alignments.
            </p>
          </div>
          <div className="p-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 rounded-xl">
            <h3 className="font-bold text-slate-855 dark:text-slate-105 text-sm">Does the tool modify the actual product visual?</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
              No. It only adjusts white space padding, alignment, contrast, and background characteristics. Your actual product remains perfectly unaltered and true to life, ensuring listing rules are followed.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-850 bg-white dark:bg-[#0b0f19] py-8">
        <div className="container mx-auto px-4 sm:px-6 max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400 dark:text-slate-550">
          <div className="flex items-center space-x-2">
            <Layers className="h-4 w-4 text-slate-400" />
            <span className="font-bold text-slate-700 dark:text-slate-300">PackOptima</span>
            <span>© {new Date().getFullYear()}</span>
          </div>
          <div className="flex space-x-6">
            <span className="hover:text-slate-655 transition-colors">Meesho Optimizer Engine V3</span>
            <span className="hover:text-slate-655 transition-colors">Privacy</span>
            <span className="hover:text-slate-655 transition-colors">Terms of Service</span>
          </div>
        </div>
      </footer>
    </div>
  );
}