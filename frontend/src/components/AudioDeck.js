import React from 'react';
import { Slider } from './ui/slider';
import { Volume2, VolumeX, RotateCcw } from 'lucide-react';
import { Button } from './ui/button';
import { EQ_BANDS } from '../lib/audioEngine';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from './ui/select';

function formatHz(hz) {
  if (hz >= 1000) return `${hz / 1000}k`;
  return `${hz}`;
}

function MasterFader({ gainDb, onChange, peakDb }) {
  // Slider in dB: -60 to +12
  const minDb = -60;
  const maxDb = 12;
  return (
    <div
      className="flex h-full flex-col items-center gap-2 rounded-xl border border-border/80 bg-card px-3 py-3"
      data-testid="master-fader-panel"
    >
      <div className="flex items-center gap-1.5">
        <Volume2 className="h-3.5 w-3.5 text-primary" />
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">MASTER</span>
      </div>

      <div className="flex flex-1 items-stretch gap-2">
        <div className="flex flex-col items-center justify-between py-1 font-mono text-[8px] tabular-nums text-muted-foreground">
          <span>+12</span>
          <span>0</span>
          <span>-12</span>
          <span>-30</span>
          <span>-60</span>
        </div>

        <div className="flex items-center">
          <Slider
            orientation="vertical"
            value={[gainDb]}
            min={minDb}
            max={maxDb}
            step={0.1}
            onValueChange={(v) => onChange(v[0])}
            className="h-full w-3 [&_[data-slot=track]]:bg-white/10 [&_[data-slot=range]]:bg-primary [&_[data-slot=thumb]]:h-5 [&_[data-slot=thumb]]:w-5 [&_[data-slot=thumb]]:rounded-md [&_[data-slot=thumb]]:bg-primary [&_[data-slot=thumb]]:shadow-[0_0_0_3px_rgba(255,107,26,0.18)]"
            data-testid="master-gain-fader"
          />
        </div>

        {/* VU meter */}
        <VuMeter peakDb={peakDb} />
      </div>

      <div className="flex items-baseline gap-1">
        <span className="font-mono text-sm font-semibold tabular-nums text-foreground" data-testid="master-gain-value">
          {gainDb >= 0 ? `+${gainDb.toFixed(1)}` : gainDb.toFixed(1)}
        </span>
        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">dB</span>
      </div>
    </div>
  );
}

function VuMeter({ peakDb }) {
  // peakDb in dBFS, typically -60..0
  const minDb = -60;
  const maxDb = 6;
  const clamped = Math.max(minDb, Math.min(maxDb, isFinite(peakDb) ? peakDb : minDb));
  const pct = ((clamped - minDb) / (maxDb - minDb)) * 100;

  return (
    <div className="relative flex flex-col">
      <div
        className="h-full w-2.5 overflow-hidden rounded-full bg-white/10"
        data-testid="master-vu-meter"
      >
        <div
          className="absolute bottom-0 left-0 right-0 rounded-full transition-[height] duration-100"
          style={{
            height: `${pct}%`,
            background: 'linear-gradient(to top, #2EE59D 0%, #2EE59D 60%, #FFD166 75%, #FFD166 88%, #EF2D2D 95%, #EF2D2D 100%)',
          }}
        />
      </div>
    </div>
  );
}

function EQPanel({ eqValues, onChangeBand, onResetEq }) {
  const minDb = -12;
  const maxDb = 12;
  return (
    <div
      className="flex h-full flex-col rounded-xl border border-border/80 bg-card p-3"
      data-testid="eq-panel"
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">10-BAND EQ</span>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={onResetEq}
          className="h-6 gap-1 px-2 text-[10px] uppercase tracking-wide hover:bg-white/5"
          data-testid="eq-reset-button"
        >
          <RotateCcw className="h-3 w-3" /> Reset
        </Button>
      </div>
      <div className="grid flex-1 grid-cols-10 gap-1.5">
        {EQ_BANDS.map((hz, i) => (
          <div key={hz} className="flex flex-col items-center gap-1">
            <span
              className="font-mono text-[9px] tabular-nums text-foreground/80"
              data-testid={`eq-band-${hz}-value`}
            >
              {eqValues[i] >= 0 ? '+' : ''}{eqValues[i].toFixed(0)}
            </span>
            <Slider
              orientation="vertical"
              value={[eqValues[i]]}
              min={minDb}
              max={maxDb}
              step={0.5}
              onValueChange={(v) => onChangeBand(i, v[0])}
              className="h-20 w-2 [&_[data-slot=track]]:bg-white/10 [&_[data-slot=range]]:bg-[#2EE59D] [&_[data-slot=thumb]]:h-3 [&_[data-slot=thumb]]:w-3 [&_[data-slot=thumb]]:bg-[#2EE59D]"
              data-testid={`eq-band-${hz}-slider`}
            />
            <span className="font-mono text-[9px] uppercase text-muted-foreground">
              {formatHz(hz)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function OutputRouting({ outputDevices, selectedOutputId, onSelectOutput, supported }) {
  return (
    <div
      className="flex h-full flex-col gap-2 rounded-xl border border-border/80 bg-card p-3"
      data-testid="output-routing-panel"
    >
      <div className="flex items-center gap-1.5">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">AUDIO OUTPUT</span>
      </div>
      <Select value={selectedOutputId} onValueChange={onSelectOutput} disabled={!supported}>
        <SelectTrigger className="h-9 bg-background border-border/70" data-testid="audio-output-device-select">
          <SelectValue placeholder={supported ? 'Select device' : 'Not supported'} />
        </SelectTrigger>
        <SelectContent className="bg-card border-border/80">
          {outputDevices.map((d) => (
            <SelectItem key={d.deviceId} value={d.deviceId} className="font-mono text-xs">
              {d.label || `Device ${d.deviceId.substring(0, 6)}…`}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {!supported && (
        <p className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
          setSinkId not supported in this browser
        </p>
      )}
      <div className="mt-auto rounded-md border border-border/70 bg-background px-2 py-1.5">
        <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">DEVICES</p>
        <p className="font-mono text-xs tabular-nums text-foreground">
          {outputDevices.length} found
        </p>
      </div>
    </div>
  );
}

export default function AudioDeck({
  gainDb, onGainChange, peakDb,
  eqValues, onChangeBand, onResetEq,
  outputDevices, selectedOutputId, onSelectOutput, sinkIdSupported,
}) {
  return (
    <div className="grid grid-cols-12 gap-3" data-testid="audio-deck">
      <div className="col-span-2 min-h-[180px]">
        <MasterFader gainDb={gainDb} onChange={onGainChange} peakDb={peakDb} />
      </div>
      <div className="col-span-7 min-h-[180px]">
        <EQPanel eqValues={eqValues} onChangeBand={onChangeBand} onResetEq={onResetEq} />
      </div>
      <div className="col-span-3 min-h-[180px]">
        <OutputRouting
          outputDevices={outputDevices}
          selectedOutputId={selectedOutputId}
          onSelectOutput={onSelectOutput}
          supported={sinkIdSupported}
        />
      </div>
    </div>
  );
}
