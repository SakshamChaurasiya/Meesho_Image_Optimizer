"use client";

import React, { useRef, useState, useCallback } from "react";

interface BeforeAfterProps {
  beforeUrl: string;
  afterUrl: string;
  beforeLabel?: string;
  afterLabel?: string;
}

/**
 * Interactive drag-slider before/after image comparison component.
 */
export function BeforeAfterComparison({
  beforeUrl,
  afterUrl,
  beforeLabel = "Original",
  afterLabel = "Optimized",
}: BeforeAfterProps) {
  const [sliderX, setSliderX] = useState(50); // percent
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const updateSlider = useCallback((clientX: number) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    setSliderX((x / rect.width) * 100);
  }, []);

  const onMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragging.current) return;
      updateSlider(e.clientX);
    },
    [updateSlider]
  );

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      updateSlider(e.touches[0].clientX);
    },
    [updateSlider]
  );

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-square rounded-xl overflow-hidden select-none cursor-col-resize border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
      onMouseMove={onMouseMove}
      onMouseDown={() => (dragging.current = true)}
      onMouseUp={() => (dragging.current = false)}
      onMouseLeave={() => (dragging.current = false)}
      onTouchMove={onTouchMove}
    >
      {/* After (optimized) — full width underneath */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={afterUrl}
        alt={afterLabel}
        className="absolute inset-0 w-full h-full object-contain"
        draggable={false}
      />

      {/* Before (original) — clipped to slider position */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ width: `${sliderX}%` }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={beforeUrl}
          alt={beforeLabel}
          className="absolute inset-0 w-full h-full object-contain bg-[repeating-conic-gradient(#80808010_0%_25%,transparent_0%_50%)] bg-[length:16px_16px] dark:bg-[repeating-conic-gradient(#ffffff04_0%_25%,transparent_0%_50%)]"
          style={{ width: `${10000 / sliderX}%`, maxWidth: "none" }}
          draggable={false}
        />
      </div>

      {/* Divider line */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-white dark:bg-slate-300 shadow-[0_0_8px_rgba(0,0,0,0.3)] z-10 pointer-events-none"
        style={{ left: `${sliderX}%` }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-white dark:bg-slate-900 shadow-md border border-slate-200 dark:border-slate-800 flex items-center justify-center">
          <svg
            className="h-3.5 w-3.5 text-slate-700 dark:text-slate-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l-4 3 4 3M16 9l4 3-4 3" />
          </svg>
        </div>
      </div>

      {/* Labels */}
      <span className="absolute top-3 left-3 text-[10px] font-bold bg-slate-950/80 text-white px-2.5 py-1 rounded-md backdrop-blur-sm pointer-events-none border border-white/10 shadow-sm uppercase tracking-wider">
        {beforeLabel}
      </span>
      <span className="absolute top-3 right-3 text-[10px] font-bold bg-emerald-500/90 text-white px-2.5 py-1 rounded-md backdrop-blur-sm pointer-events-none border border-emerald-400/20 shadow-sm uppercase tracking-wider">
        {afterLabel}
      </span>
    </div>
  );
}
