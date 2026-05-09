/**
 * BroadcastChannel sync between Control window (/app) and External Display (/display)
 *
 * Channel name: 'lumina-bus'
 *
 * Message types:
 *  - 'control:state' (control -> display): full state snapshot { liveAsset, isPlaying, currentTime, duration, volume, eqBands, masterGain, audioOutputId }
 *  - 'control:command' (control -> display): { action: 'play'|'pause'|'seek'|'load', payload }
 *  - 'control:hello' (control -> display): handshake to confirm bus is alive
 *  - 'display:hello' (display -> control): handshake confirmation from display
 *  - 'display:state' (display -> control): { currentTime, isPlaying, ended }
 *  - 'control:tick' (control -> display): high-frequency time sync
 */

export const BUS_CHANNEL = 'lumina-bus';

export const createBus = () => {
  if (typeof BroadcastChannel === 'undefined') {
    // Fallback no-op
    return {
      postMessage: () => {},
      addListener: () => () => {},
      close: () => {},
    };
  }
  const bc = new BroadcastChannel(BUS_CHANNEL);
  return {
    raw: bc,
    postMessage: (msg) => bc.postMessage(msg),
    addListener: (handler) => {
      const cb = (e) => handler(e.data);
      bc.addEventListener('message', cb);
      return () => bc.removeEventListener('message', cb);
    },
    close: () => bc.close(),
  };
};
