import React from 'react';
import { motion } from 'framer-motion';

export function LiveIndicator({ isLive, compact = false }) {
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 transition-colors ${
        isLive
          ? 'border-[rgba(239,45,45,0.45)] bg-[rgba(239,45,45,0.08)]'
          : 'border-border/80 bg-background'
      }`}
      data-testid="live-output-indicator"
      data-state={isLive ? 'live' : 'off'}
    >
      <span
        className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
          isLive
            ? 'bg-[hsl(var(--live-red))] shadow-[0_0_0_5px_rgba(239,45,45,0.18)] animate-live-blink'
            : 'bg-muted-foreground/40'
        }`}
      />
      <span
        className={`font-mono text-xs font-semibold tracking-[0.18em] ${
          isLive ? 'text-[#F5F5F5]' : 'text-muted-foreground'
        }`}
      >
        {isLive ? 'ON AIR' : 'OFF AIR'}
      </span>
      {!compact && isLive && (
        <motion.span
          initial={{ opacity: 0, x: -4 }}
          animate={{ opacity: 1, x: 0 }}
          className="hidden font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground sm:inline"
        >
          LIVE OUTPUT
        </motion.span>
      )}
    </div>
  );
}
