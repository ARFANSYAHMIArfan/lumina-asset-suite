import React, { useEffect, useRef, useState } from 'react';
import { createBus } from '../lib/bus';
import { motion, AnimatePresence } from 'framer-motion';
import { formatTimecode } from '../lib/format';
import { Disc, Radio } from 'lucide-react';

export default function DisplayPage() {
  const videoRef = useRef(null);
  const audioRef = useRef(null);
  const busRef = useRef(null);
  const [state, setState] = useState({
    liveAsset: null,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    isLive: false,
  });
  const [hudVisible, setHudVisible] = useState(true);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const bus = createBus();
    busRef.current = bus;
    const off = bus.addListener((data) => {
      if (!data) return;
      if (data.type === 'control:state') {
        setState((prev) => ({ ...prev, ...data.payload }));
        setConnected(true);
      }
      if (data.type === 'control:tick') {
        setState((prev) => ({
          ...prev,
          currentTime: data.payload.currentTime,
          isPlaying: data.payload.isPlaying,
          duration: data.payload.duration ?? prev.duration,
        }));
      }
      if (data.type === 'control:hello') {
        bus.postMessage({ type: 'display:hello', ts: Date.now() });
        setConnected(true);
      }
    });
    bus.postMessage({ type: 'display:hello', ts: Date.now() });
    const beacon = setInterval(() => {
      bus.postMessage({ type: 'display:hello', ts: Date.now() });
    }, 5000);
    return () => {
      try {
        bus.postMessage({ type: 'display:bye', ts: Date.now() });
      } catch {}
      clearInterval(beacon);
      off?.();
      bus.close();
    };
  }, []);

  // Sync media element to control state
  useEffect(() => {
    const isVideo = state.liveAsset?.type === 'video';
    const el = isVideo ? videoRef.current : audioRef.current;
    if (!el || !state.liveAsset) return;
    // Sync time if drift > 0.6s
    const drift = Math.abs((el.currentTime || 0) - (state.currentTime || 0));
    if (drift > 0.6 && isFinite(state.currentTime)) {
      try {
        el.currentTime = state.currentTime;
      } catch {}
    }
    // Play/pause
    if (state.isPlaying && el.paused) {
      el.play().catch(() => {});
    } else if (!state.isPlaying && !el.paused) {
      el.pause();
    }
  }, [state]);

  // Toggle HUD with mouse movement / H key
  useEffect(() => {
    let timeoutId;
    const reveal = () => {
      setHudVisible(true);
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => setHudVisible(false), 3000);
    };
    window.addEventListener('mousemove', reveal);
    const onKey = (e) => {
      if (e.key === 'h' || e.key === 'H') setHudVisible((v) => !v);
    };
    window.addEventListener('keydown', onKey);
    reveal();
    return () => {
      window.removeEventListener('mousemove', reveal);
      window.removeEventListener('keydown', onKey);
      clearTimeout(timeoutId);
    };
  }, []);

  const isVideo = state.liveAsset?.type === 'video';
  const isAudio = state.liveAsset?.type === 'audio';

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black" data-testid="display-root">
      {/* Media surface */}
      <div className="absolute inset-0 flex items-center justify-center bg-black">
        {isVideo ? (
          <video
            ref={videoRef}
            src={state.liveAsset.public_url}
            playsInline
            className="h-full w-full object-contain bg-black"
            data-testid="display-video"
          />
        ) : isAudio ? (
          <>
            <audio
              ref={audioRef}
              src={state.liveAsset.public_url}
              className="hidden"
              data-testid="display-audio"
            />
            <div className="flex flex-col items-center gap-6">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 6, ease: 'linear' }}
                className="flex h-40 w-40 items-center justify-center rounded-full border border-[rgba(239,45,45,0.45)] bg-[rgba(239,45,45,0.06)] text-[hsl(var(--live-red))]"
              >
                <Disc className="h-20 w-20" />
              </motion.div>
              <p className="max-w-[80%] truncate text-center text-2xl font-medium">{state.liveAsset.title}</p>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <Radio className="h-12 w-12 opacity-30" />
            <p className="font-mono text-xs uppercase tracking-[0.3em]">NO LIVE SIGNAL</p>
            {!connected && <p className="font-mono text-[10px] uppercase tracking-[0.2em]">Waiting for control room…</p>}
          </div>
        )}
      </div>

      {/* HUD overlay */}
      <AnimatePresence>
        {hudVisible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="pointer-events-none absolute inset-0"
            data-testid="display-hud"
          >
            {/* Top-left: brand + LIVE state */}
            <div className="absolute left-4 top-4 flex items-center gap-2 rounded-lg border border-border/60 bg-black/60 px-3 py-2 backdrop-blur-sm">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <Radio className="h-3.5 w-3.5" />
              </div>
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-muted-foreground">LUMINA</p>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-foreground">EXTERNAL DISPLAY</p>
              </div>
            </div>

            {/* Top-right: ON AIR */}
            {state.isLive && state.liveAsset && (
              <div className="absolute right-4 top-4 flex items-center gap-2 rounded-lg border border-[rgba(239,45,45,0.45)] bg-black/60 px-3 py-2 backdrop-blur-sm">
                <span className="h-2.5 w-2.5 rounded-full bg-[hsl(var(--live-red))] shadow-[0_0_0_5px_rgba(239,45,45,0.18)] animate-live-blink" />
                <span className="font-mono text-xs font-semibold tracking-[0.18em]">ON AIR</span>
              </div>
            )}

            {/* Bottom: title + timecode */}
            {state.liveAsset && (
              <div className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-3">
                <div className="max-w-[60%] rounded-lg border border-border/60 bg-black/60 px-3 py-2 backdrop-blur-sm">
                  <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">SOURCE</p>
                  <p className="truncate text-base font-medium">{state.liveAsset.title}</p>
                </div>
                <div className="rounded-lg border border-border/60 bg-black/60 px-3 py-2 backdrop-blur-sm">
                  <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">TIMECODE</p>
                  <p className="font-mono text-base tabular-nums tracking-[0.12em]">
                    {formatTimecode(state.currentTime)} <span className="text-muted-foreground">/ {formatTimecode(state.duration)}</span>
                  </p>
                </div>
              </div>
            )}

            {/* Hide hint */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 font-mono text-[9px] uppercase tracking-[0.25em] text-muted-foreground/60">
              press H to toggle HUD
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
