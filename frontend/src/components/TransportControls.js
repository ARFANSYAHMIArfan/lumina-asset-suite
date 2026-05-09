import React from 'react';
import { Play, Pause, Square, SkipBack, SkipForward, Repeat } from 'lucide-react';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { formatTimecode } from '../lib/format';

export default function TransportControls({
  isPlaying, currentTime, duration, onPlay, onPause, onStop, onPrev, onNext, onSeek,
  loop, onToggleLoop,
}) {
  return (
    <div
      className="flex flex-col gap-2 rounded-xl border border-border/80 bg-card p-3"
      data-testid="transport-controls"
    >
      <div className="flex items-center gap-3">
        {/* Transport buttons */}
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="icon"
            onClick={onPrev}
            className="h-10 w-10 bg-transparent border-border/70 hover:bg-white/5"
            data-testid="transport-prev-button"
            title="Previous in queue"
          >
            <SkipBack className="h-4 w-4" />
          </Button>
          {isPlaying ? (
            <Button
              variant="outline"
              size="icon"
              onClick={onPause}
              className="h-11 w-11 bg-primary/10 border-primary/40 text-primary hover:bg-primary/20"
              data-testid="transport-pause-button"
            >
              <Pause className="h-5 w-5" />
            </Button>
          ) : (
            <Button
              variant="outline"
              size="icon"
              onClick={onPlay}
              className="h-11 w-11 bg-primary/10 border-primary/40 text-primary hover:bg-primary/20"
              data-testid="transport-play-button"
            >
              <Play className="h-5 w-5" />
            </Button>
          )}
          <Button
            variant="outline"
            size="icon"
            onClick={onStop}
            className="h-10 w-10 bg-transparent border-border/70 hover:bg-white/5"
            data-testid="transport-stop-button"
          >
            <Square className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={onNext}
            className="h-10 w-10 bg-transparent border-border/70 hover:bg-white/5"
            data-testid="transport-next-button"
            title="Next in queue"
          >
            <SkipForward className="h-4 w-4" />
          </Button>
          <Button
            variant={loop ? 'default' : 'outline'}
            size="icon"
            onClick={onToggleLoop}
            className={`h-10 w-10 ${loop ? 'bg-primary text-primary-foreground' : 'bg-transparent border-border/70 hover:bg-white/5'}`}
            data-testid="transport-loop-button"
            title="Loop current"
          >
            <Repeat className="h-4 w-4" />
          </Button>
        </div>

        {/* Current timecode */}
        <div className="flex shrink-0 items-center gap-2 rounded-md border border-border/70 bg-background px-2.5 py-1.5">
          <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">TC</span>
          <span
            className="font-mono text-sm tracking-[0.12em] tabular-nums text-foreground"
            data-testid="transport-timecode"
          >
            {formatTimecode(currentTime)}
          </span>
        </div>

        {/* Progress bar with slider */}
        <div className="flex flex-1 items-center gap-2">
          <span className="font-mono text-[10px] tabular-nums text-muted-foreground" data-testid="timeline-timecode-current">
            {formatTimecode(currentTime)}
          </span>
          <Slider
            value={[Math.min(currentTime, duration || 0)]}
            min={0}
            max={Math.max(duration || 0, 0.001)}
            step={0.1}
            onValueChange={(v) => onSeek?.(v[0])}
            className="flex-1 [&_[data-slot=track]]:bg-white/10 [&_[data-slot=range]]:bg-primary [&_[data-slot=thumb]]:h-4 [&_[data-slot=thumb]]:w-4 [&_[data-slot=thumb]]:bg-primary"
            data-testid="timeline-scrub-slider"
          />
          <span className="font-mono text-[10px] tabular-nums text-muted-foreground" data-testid="timeline-timecode-duration">
            {formatTimecode(duration)}
          </span>
        </div>
      </div>
    </div>
  );
}
