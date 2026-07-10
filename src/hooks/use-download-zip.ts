import JSZip from "jszip";
import { useState, useCallback } from "react";

export interface ZipEntry {
  url?: string;
  content?: string;
  fileName: string; // e.g. "variant_1_white_pad5_webp.webp" or "metadata.txt"
}

export type ZipState = "idle" | "fetching" | "zipping" | "done" | "error";

/**
 * Hook that fetches a list of remote image URLs, bundles them into a ZIP,
 * and triggers a browser download — all client-side via JSZip.
 */
export function useDownloadZip(zipFileName = "packoptima_variants.zip") {
  const [state, setState] = useState<ZipState>("idle");
  const [progress, setProgress] = useState(0); // 0–100
  const [error, setError] = useState<string | null>(null);

  const download = useCallback(
    async (entries: ZipEntry[]) => {
      if (entries.length === 0) return;

      setState("fetching");
      setProgress(0);
      setError(null);

      try {
        const zip = new JSZip();

        // Helper function to convert a WebP Blob to a JPEG Blob client-side
        const convertWebPToJPEG = (webpBlob: Blob): Promise<Blob> => {
          return new Promise((resolve, reject) => {
            const img = new Image();
            const url = URL.createObjectURL(webpBlob);

            img.onload = () => {
              URL.revokeObjectURL(url);
              const canvas = document.createElement("canvas");
              canvas.width = img.naturalWidth;
              canvas.height = img.naturalHeight;
              const ctx = canvas.getContext("2d");
              if (!ctx) {
                reject(new Error("Failed to get 2D canvas context"));
                return;
              }

              // Fill with white background (JPEG doesn't support transparency)
              ctx.fillStyle = "#ffffff";
              ctx.fillRect(0, 0, canvas.width, canvas.height);
              ctx.drawImage(img, 0, 0);

              canvas.toBlob(
                (jpegBlob) => {
                  if (jpegBlob) {
                    resolve(jpegBlob);
                  } else {
                    reject(new Error("Failed to convert canvas to JPEG blob"));
                  }
                },
                "image/jpeg",
                0.92 // high quality
              );
            };

            img.onerror = () => {
              URL.revokeObjectURL(url);
              reject(new Error("Failed to load WebP image for JPEG conversion"));
            };

            img.src = url;
          });
        };

        // Fetch each image and add to zip, updating progress per file
        for (let i = 0; i < entries.length; i++) {
          const { url, content, fileName } = entries[i];

          if (content !== undefined) {
            zip.file(fileName, content);
            setProgress(Math.round(((i + 1) / entries.length) * 80));
            continue;
          }

          if (!url) continue;

          const response = await fetch(url);
          if (!response.ok) {
            throw new Error(`Failed to fetch ${fileName}: ${response.statusText}`);
          }

          const blob = await response.blob();
          let finalBlob = blob;
          let finalFileName = fileName;

          // Convert webp to jpeg if needed
          if (blob.type === "image/webp" || fileName.toLowerCase().endsWith(".webp")) {
            try {
              finalBlob = await convertWebPToJPEG(blob);
              finalFileName = fileName.replace(/\.webp$/i, ".jpeg");
            } catch (err) {
              console.error("Failed to convert WebP to JPEG, using original blob:", err);
            }
          }

          zip.file(finalFileName, finalBlob);

          setProgress(Math.round(((i + 1) / entries.length) * 80)); // 0–80% = fetching phase
        }

        setState("zipping");

        // Generate the zip blob
        const zipBlob = await zip.generateAsync(
          { type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 } },
          (meta) => {
            // 80–100% = zipping phase
            setProgress(80 + Math.round(meta.percent * 0.2));
          }
        );

        setState("done");
        setProgress(100);

        // Trigger browser download
        const objectUrl = URL.createObjectURL(zipBlob);
        const a = document.createElement("a");
        a.href = objectUrl;
        a.download = zipFileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        // Clean up object URL after a short delay
        setTimeout(() => URL.revokeObjectURL(objectUrl), 5000);

        // Reset state after success
        setTimeout(() => {
          setState("idle");
          setProgress(0);
        }, 2500);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
        setState("error");
        setTimeout(() => {
          setState("idle");
          setProgress(0);
          setError(null);
        }, 4000);
      }
    },
    [zipFileName]
  );

  return { download, state, progress, error };
}
