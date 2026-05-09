/**
 * Web Audio API engine for Lumina Asset Suite.
 * Provides a 10-band EQ, master gain, and graceful integration with HTML media elements.
 *
 * NOTE: Once a media element is connected via `createMediaElementSource`, browsers route
 * its audio through Web Audio. Disconnecting requires re-creating the source on a new media element.
 */

export const EQ_BANDS = [31, 62, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.source = null;
    this.connectedEl = null;
    this.masterGain = null;
    this.filters = [];
    this.analyser = null;
    this.eqValues = EQ_BANDS.map(() => 0); // dB
    this.gainDb = 0; // dB
  }

  ensureContext() {
    if (!this.ctx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new Ctx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  buildChain() {
    if (!this.ctx) return;
    // Build EQ filter chain
    this.filters = EQ_BANDS.map((freq, i) => {
      const f = this.ctx.createBiquadFilter();
      // Use peaking for mid bands; lowshelf for first; highshelf for last for natural feel
      if (i === 0) f.type = 'lowshelf';
      else if (i === EQ_BANDS.length - 1) f.type = 'highshelf';
      else f.type = 'peaking';
      f.frequency.value = freq;
      f.Q.value = 1.0;
      f.gain.value = this.eqValues[i];
      return f;
    });
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = dbToGain(this.gainDb);
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 1024;
    this.analyser.smoothingTimeConstant = 0.85;
  }

  connect(mediaEl) {
    if (!mediaEl) return;
    if (this.connectedEl === mediaEl && this.source) return;
    this.ensureContext();
    if (!this.filters.length || !this.masterGain) {
      this.buildChain();
    }
    try {
      // Disconnect previous if any
      if (this.source) {
        try { this.source.disconnect(); } catch {}
      }
      this.source = this.ctx.createMediaElementSource(mediaEl);
      this.connectedEl = mediaEl;
      // source -> filters chain -> masterGain -> analyser -> destination
      let prev = this.source;
      for (const f of this.filters) {
        prev.connect(f);
        prev = f;
      }
      prev.connect(this.masterGain);
      this.masterGain.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);
    } catch (e) {
      // Common error: media element already connected (cannot reconnect to same source)
      // eslint-disable-next-line no-console
      console.warn('AudioEngine.connect failed:', e.message);
    }
  }

  setEqBand(index, db) {
    this.eqValues[index] = db;
    if (this.filters[index]) {
      this.filters[index].gain.value = db;
    }
  }

  setMasterGainDb(db) {
    this.gainDb = db;
    if (this.masterGain) {
      this.masterGain.gain.value = dbToGain(db);
    }
  }

  resetEq() {
    EQ_BANDS.forEach((_, i) => this.setEqBand(i, 0));
  }

  getAnalyserData() {
    if (!this.analyser) return null;
    const buf = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(buf);
    return buf;
  }

  // Convenience: returns a fresh frequency-domain buffer reused across calls.
  getFrequencyData() {
    if (!this.analyser) return null;
    if (!this._freqBuf || this._freqBuf.length !== this.analyser.frequencyBinCount) {
      this._freqBuf = new Uint8Array(this.analyser.frequencyBinCount);
    }
    this.analyser.getByteFrequencyData(this._freqBuf);
    return this._freqBuf;
  }

  getTimeDomainData() {
    if (!this.analyser) return null;
    const buf = new Uint8Array(this.analyser.fftSize);
    this.analyser.getByteTimeDomainData(buf);
    return buf;
  }
}

export function dbToGain(db) {
  return Math.pow(10, db / 20);
}
export function gainToDb(gain) {
  return 20 * Math.log10(Math.max(0.0001, gain));
}

/**
 * Compute peak level in dB from time-domain Uint8Array (0..255 centred at 128)
 */
export function computePeakDb(timeDomain) {
  if (!timeDomain) return -Infinity;
  let peak = 0;
  for (let i = 0; i < timeDomain.length; i++) {
    const v = Math.abs(timeDomain[i] - 128) / 128;
    if (v > peak) peak = v;
  }
  return peak <= 0 ? -Infinity : 20 * Math.log10(peak);
}
