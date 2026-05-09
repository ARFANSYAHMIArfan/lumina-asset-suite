import React, { forwardRef } from 'react';
import { Music, Video, Disc } from 'lucide-react';
import { motion } from 'framer-motion';

const BusPlayer = forwardRef(function BusPlayer(
  { variant, asset, onTimeUpdate, onLoadedMetadata, onEnded, onPlay, onPause, label, badge, accent, isPulsing, muted },
  ref,
) {
  // variant: 'staging' | 'live'
  const ringClass = variant === 'live'
    ? 'ring-1 ring-[rgba(239,45,45,0.40)] shadow-[0_0_0_1px_rgba(239,45,45,0.12),0_0_28px_rgba(239,45,45,0.10)]'
    : 'ring-1 ring-[rgba(255,107,26,0.35)] shadow-[0_0_0_1px_rgba(255,107,26,0.10),0_0_24px_rgba(255,107,26,0.08)]';

  const isVideo = asset?.type === 'video';
  const isAudio = asset?.type === 'audio';

  return (
    <div
      className={`relative flex h-full flex-col rounded-xl border border-border/80 bg-card overflow-hidden ${ringClass} ${isPulsing ? 'animate-border-pulse' : ''}`}
      data-testid={`bus-${variant}`}
      data-bus={variant}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-border/70 px-3 py-2">
        <div className="flex items-center gap-2">
          {badge}
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label}</span>
        </div>
        <span className="max-w-[60%] truncate font-mono text-[11px] text-foreground/85 tabular-nums" title={asset?.title}>
          {asset?.title || '— no signal —'}
        </span>
      </div>

      {/* Player area */}
      <div className="relative aspect-video w-full bg-[#0A0A0A]">
        {asset ? (
          isVideo ? (
            <video
              ref={ref}
              src={asset.public_url}
              onTimeUpdate={onTimeUpdate}
              onLoadedMetadata={onLoadedMetadata}
              onEnded={onEnded}
              onPlay={onPlay}
              onPause={onPause}
              muted={!!muted}
              playsInline
              className="absolute inset-0 h-full w-full object-contain bg-black"
              data-testid={`${variant}-video`}
            />
          ) : (
            <>
              <audio
                ref={ref}
                src={asset.public_url}
                onTimeUpdate={onTimeUpdate}
                onLoadedMetadata={onLoadedMetadata}
                onEnded={onEnded}
                onPlay={onPlay}
                onPause={onPause}
                muted={!!muted}
                preload="metadata"
                className="hidden"
                data-testid={`${variant}-audio`}
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-muted-foreground">
                <motion.div
                  className={`flex h-20 w-20 items-center justify-center rounded-full border ${variant === 'live' ? 'border-[rgba(239,45,45,0.45)] bg-[rgba(239,45,45,0.08)] text-[hsl(var(--live-red))]' : 'border-[rgba(255,107,26,0.35)] bg-[rgba(255,107,26,0.06)] text-primary'}`}
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 8, ease: 'linear' }}
                >
                  <Disc className="h-10 w-10" />
                </motion.div>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em]">AUDIO TRACK</p>
                <p className="max-w-[80%] truncate text-center text-xs">{asset.title}</p>
              </div>
            </>
          )
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground">
            {variant === 'live' ? <Video className="h-8 w-8 opacity-30" /> : <Music className="h-8 w-8 opacity-30" />}
            <p className="font-mono text-[10px] uppercase tracking-[0.25em]">NO SOURCE</p>
          </div>
        )}
      </div>

      {/* Footer status */}
      <div className="flex items-center justify-between gap-2 border-t border-border/70 px-3 py-1.5">
        <span className={`font-mono text-[10px] uppercase tracking-[0.2em] ${accent}`}>{label}</span>
        <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
          {asset?.type ? asset.type.toUpperCase() : '—'}
        </span>
      </div>
    </div>
  );
});

export default BusPlayer;
