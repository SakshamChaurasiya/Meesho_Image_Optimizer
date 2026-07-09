import JSZip from "jszip";
import { useState, useCallback } from "react";

export interface ZipEntry {
  url: string;
  fileName: string; // e.g. "variant_1_white_pad5_webp.webp"
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

        // Fetch each image and add to zip, updating progress per file
        for (let i = 0; i < entries.length; i++) {
          const { url, fileName } = entries[i];

          const response = await fetch(url);
          if (!response.ok) {
            throw new Error(`Failed to fetch ${fileName}: ${response.statusText}`);
          }

          const blob = await response.blob();
          zip.file(fileName, blob);

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
