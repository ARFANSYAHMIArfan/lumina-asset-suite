import React from 'react';

export function StagingBadge() {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-md border border-[rgba(255,107,26,0.35)] bg-[rgba(255,107,26,0.10)] px-2 py-0.5 text-[10px] font-semibold tracking-[0.18em] text-[#FFB179]"
      data-testid="staging-badge"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_0_3px_rgba(255,107,26,0.18)]" />
      STAGING
    </span>
  );
}

export function LiveBadge({ blinking = true }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-md border border-[rgba(239,45,45,0.45)] bg-[rgba(239,45,45,0.12)] px-2 py-0.5 text-[10px] font-semibold tracking-[0.18em] text-[#FF8A8A]"
      data-testid="live-badge"
    >
      <span className={`h-1.5 w-1.5 rounded-full bg-[hsl(var(--live-red))] shadow-[0_0_0_3px_rgba(239,45,45,0.20)] ${blinking ? 'animate-live-blink' : ''}`} />
      LIVE
    </span>
  );
}
