/**
 * Spectrum analyzer canvas visualization.
 * Renders a low-FPS frequency spectrum using Web Audio AnalyserNode data.
 *
 * The renderer is intentionally lightweight so it doesn't impact playback.
 * Uses a single canvas, requestAnimationFrame at ~24fps, no React re-render per frame.
 */
import React, { useEffect, useRef } from 'react';

export default function SpectrumAnalyzer({ getData, height = 64, color = '#FF6B1A', backgroundColor = 'transparent', barCount = 48 }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(0);
  const lastDrawRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let dpr = window.devicePixelRatio || 1;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      dpr = window.devicePixelRatio || 1;
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const draw = (ts) => {
      // Throttle to ~24fps
      if (ts - lastDrawRef.current < 41) {
        rafRef.current = requestAnimationFrame(draw);
        return;
      }
      lastDrawRef.current = ts;

      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      ctx.clearRect(0, 0, w, h);
      if (backgroundColor && backgroundColor !== 'transparent') {
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, w, h);
      }

      const data = getData?.();
      if (data && data.length) {
        // Group bins to barCount visible bars (logarithmic groupings for nicer feel)
        const bars = barCount;
        const total = data.length;
        const gap = 2;
        const barWidth = Math.max(1, (w - (bars - 1) * gap) / bars);

        // Use logarithmic mapping to emphasize lower frequencies
        for (let i = 0; i < bars; i++) {
          const lo = Math.floor(Math.pow(i / bars, 1.6) * total);
          const hi = Math.floor(Math.pow((i + 1) / bars, 1.6) * total);
          let max = 0;
          for (let j = lo; j < hi && j < total; j++) {
            if (data[j] > max) max = data[j];
          }
          const ratio = max / 255;
          const barH = Math.max(1, ratio * h);
          const x = i * (barWidth + gap);
          const y = h - barH;
          // Gradient: orange base -> bright top
          const grad = ctx.createLinearGradient(0, y, 0, h);
          grad.addColorStop(0, color);
          grad.addColorStop(1, 'rgba(255, 107, 26, 0.15)');
          ctx.fillStyle = grad;
          ctx.fillRect(x, y, barWidth, barH);
        }
      } else {
        // Idle baseline
        ctx.fillStyle = 'rgba(255, 107, 26, 0.06)';
        ctx.fillRect(0, h - 2, w, 2);
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, [getData, color, backgroundColor, barCount]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height: `${height}px`, display: 'block' }}
      data-testid="spectrum-analyzer-canvas"
    />
  );
}
