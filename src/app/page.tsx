"use client";

import React, { useState, useEffect, useCallback } from "react";
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
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  const fetchImages = useCallback(async () => {
    try {
      const res = await fetch("/api/upload");
      const result = await res.json();
      if (result.success) {
        setImages(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch images:", error);
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
    <div className="min-h-screen bg-background relative overflow-hidden selection:bg-primary/10">
      {/* Background gradients */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] -z-10 pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-violet-500/10 rounded-full blur-[140px] -z-10 pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)] -z-10" />

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/60 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center space-x-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-primary to-violet-500 text-white shadow-lg shadow-primary/20">
              <Layers className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/75">
              PackOptima
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <Button size="sm" className="hidden sm:inline-flex shadow-md shadow-primary/10 hover:shadow-primary/20 transition-all">
              Launch App
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 sm:px-6 py-20 lg:py-28">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column */}
          <div className="lg:col-span-7 flex flex-col items-start space-y-8 text-left">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center space-x-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary"
            >
              <Sparkles className="h-4 w-4 text-primary animate-pulse" />
              <span>Smart E-commerce Image Optimization</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1]"
            >
              Reduce Marketplace{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-violet-500 to-indigo-500">
                Shipping Charges
              </span>{" "}
              with Optimized Product Images
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-lg text-muted-foreground max-w-xl font-normal leading-relaxed"
            >
              Intelligently optimize your product images using computer vision and AI background techniques.
              Generate multiple layout, padding, and size variations to ensure logistics systems scan your packages accurately.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
            >
              <Button size="lg" className="w-full sm:w-auto text-base font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all">
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-base border-border">
                Watch Demo
              </Button>
            </motion.div>

            {/* Quick Metrics */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="grid grid-cols-3 gap-6 pt-6 border-t border-border w-full max-w-lg"
            >
              <div>
                <h4 className="text-2xl sm:text-3xl font-bold text-foreground">25+</h4>
                <p className="text-xs text-muted-foreground mt-1">Variants Generated</p>
              </div>
              <div>
                <h4 className="text-2xl sm:text-3xl font-bold text-foreground">30%</h4>
                <p className="text-xs text-muted-foreground mt-1">Shipping Error Drop</p>
              </div>
              <div>
                <h4 className="text-2xl sm:text-3xl font-bold text-foreground">&lt; 3s</h4>
                <p className="text-xs text-muted-foreground mt-1">Processing Time</p>
              </div>
            </motion.div>
          </div>

          {/* Right Column: Upload Component */}
          <div className="lg:col-span-5 relative w-full flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="w-full relative animate-in"
            >
              <ImageUploader onUploadSuccess={handleUploadSuccess} />
            </motion.div>
            {/* Float design accents */}
            <div className="absolute -bottom-6 -left-6 h-28 w-28 bg-primary/20 rounded-full blur-2xl -z-10 pointer-events-none" />
          </div>
        </div>
      </main>

      {/* Recent Uploaded Images Grid */}
      <AnimatePresence>
        {images.length > 0 && (
          <section className="container mx-auto px-4 sm:px-6 py-12 border-t border-border bg-background/30 backdrop-blur-sm">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-xl font-bold mb-6 text-foreground flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-primary animate-pulse" />
                Recent Uploaded Images
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {images.map((img) => {
                  const isProcessing = processingIds.has(img._id);
                  const statusColor =
                    img.status === "completed"
                      ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                      : img.status === "failed"
                      ? "bg-red-500/10 text-red-500 border-red-500/20"
                      : img.status === "processing"
                      ? "bg-blue-500/10 text-blue-500 border-blue-500/20"
                      : "bg-amber-500/10 text-amber-500 border-amber-500/20";

                  return (
                    <motion.div
                      key={img._id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="relative group border border-border bg-card/45 backdrop-blur-sm rounded-xl overflow-hidden flex flex-col p-3 gap-2"
                    >
                      {/* Image thumbnail */}
                      <div className="relative aspect-square rounded-lg overflow-hidden bg-muted/20 border border-border/40">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={img.originalUrl}
                          alt={img.fileName}
                          className="w-full h-full object-contain"
                        />
                        {isProcessing && (
                          <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
                            <Loader2 className="h-6 w-6 text-primary animate-spin" />
                          </div>
                        )}
                      </div>

                      {/* Info row */}
                      <div className="text-left">
                        <p className="text-xs font-semibold truncate text-foreground">{img.fileName}</p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-[10px] text-muted-foreground uppercase">{img.format}</span>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusColor}`}>
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
                          variant="default"
                          className="w-full text-xs h-7 mt-1"
                          onClick={() => handleProcess(img._id)}
                          id={`process-btn-${img._id}`}
                        >
                          <Zap className="h-3 w-3 mr-1" />
                          Generate Variants
                        </Button>
                      )}
                      {img.status === "completed" && (
                        <div className="flex items-center justify-center gap-1 text-emerald-500 text-xs font-medium mt-1">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Variants Ready
                        </div>
                      )}
                      {img.status === "failed" && (
                        <div className="flex items-center justify-center gap-1 text-red-500 text-xs font-medium mt-1">
                          <XCircle className="h-3.5 w-3.5" />
                          Processing Failed
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </section>
        )}
      </AnimatePresence>

      {/* Feature Cards Grid */}
      <section className="border-t border-border bg-muted/10 py-20 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold tracking-tight">Built to Perfect Your Product Catalog</h2>
            <p className="text-muted-foreground mt-3">Advanced computer vision techniques optimized specifically for marketplace warehouse scanning rules.</p>
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
              <Card className="border border-border/80 bg-card/60 backdrop-blur-sm hover:border-primary/30 hover:shadow-lg transition-all duration-300">
                <CardContent className="p-6 flex flex-col space-y-4">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <Maximize className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold">Dynamic Padding Optimization</h3>
                  <p className="text-sm text-muted-foreground">
                    Automatically adds optimal white margins to prevent marketplace automated cropping systems from cutting off product edges.
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Feature 2 */}
            <motion.div variants={itemVariants}>
              <Card className="border border-border/80 bg-card/60 backdrop-blur-sm hover:border-primary/30 hover:shadow-lg transition-all duration-300">
                <CardContent className="p-6 flex flex-col space-y-4">
                  <div className="h-12 w-12 rounded-lg bg-violet-500/10 text-violet-500 flex items-center justify-center">
                    <Zap className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold">Multi-Variant Pipeline</h3>
                  <p className="text-sm text-muted-foreground">
                    Processes up to 25 distinct combinations of padding, alignment, compression, and contrast parameters in a single batch.
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Feature 3 */}
            <motion.div variants={itemVariants}>
              <Card className="border border-border/80 bg-card/60 backdrop-blur-sm hover:border-primary/30 hover:shadow-lg transition-all duration-300">
                <CardContent className="p-6 flex flex-col space-y-4">
                  <div className="h-12 w-12 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                    <Shield className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold">Zero Algorithm Claims</h3>
                  <p className="text-sm text-muted-foreground">
                    Honest, deterministic visual optimization designed to make package size scanning error-free without claiming to read secret algorithms.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
