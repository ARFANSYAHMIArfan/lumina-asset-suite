import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRightLeft, Zap } from 'lucide-react';
import { Button } from './ui/button';

export default function TransitionColumn({ canTake, onTake, onCut, isPulsing }) {
  return (
    <div className="flex h-full w-32 flex-col items-center justify-center gap-3 px-2">
      <div className="flex w-full flex-col items-center gap-1 rounded-md border border-border/70 bg-card px-2 py-1.5">
        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">TRANSITION</span>
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-foreground/85">A / B BUS</span>
      </div>

      <div className="flex flex-1 w-full flex-col items-center justify-center gap-3">
        <Button
          onClick={onTake}
          disabled={!canTake}
          className="relative h-16 w-full rounded-2xl bg-primary text-primary-foreground font-bold tracking-wide shadow-[0_10px_30px_rgba(255,107,26,0.18)] hover:bg-[hsl(var(--lumina-orange-hover))] active:translate-y-[1px] disabled:opacity-50 disabled:shadow-none"
          data-testid="take-transition-button"
        >
          <ArrowRightLeft className="mr-2 h-5 w-5" />
          TAKE
          <AnimatePresence>
            {isPulsing && (
              <motion.span
                key="pulse"
                initial={{ opacity: 0.5 }}
                animate={{ opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="pointer-events-none absolute inset-0 rounded-2xl bg-white/30"
              />
            )}
          </AnimatePresence>
        </Button>
        <Button
          onClick={onCut}
          disabled={!canTake}
          variant="outline"
          className="h-12 w-full rounded-xl border-[rgba(239,45,45,0.35)] bg-[rgba(239,45,45,0.10)] text-foreground hover:bg-[rgba(239,45,45,0.18)] disabled:opacity-50"
          data-testid="cut-transition-button"
        >
          <Zap className="mr-2 h-4 w-4" />
          CUT
        </Button>
      </div>

      <div className="w-full rounded-md border border-border/70 bg-card px-2 py-1.5">
        <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground text-center">
          STAGING → LIVE
        </p>
      </div>
    </div>
  );
}
