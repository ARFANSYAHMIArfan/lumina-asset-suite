/**
 * BroadcastChannel sync between Control window (/app) and External Display (/display)
 *
 * Channel name: 'lumina-bus'
 *
 * Message types:
 *  - 'control:state' (control -> display): full state snapshot {
 *      liveAsset, isPlaying, currentTime, duration, gainDb, eqBands, isLive
 *    }
 *  - 'control:tick' (control -> display): high-frequency time sync
 *      { currentTime, isPlaying, duration }
 *  - 'control:cmd' (control -> display): explicit playback commands
 *      { action: 'play'|'pause'|'seek'|'load'|'stop', payload? }
 *  - 'control:hello' (control -> display): handshake announcement
 *  - 'display:hello' (display -> control): handshake confirmation from display
 *  - 'display:bye' (display -> control): display closing
 *  - 'display:state' (display -> control): display currentTime + isPlaying
 */

export const BUS_CHANNEL = 'lumina-bus';

export const MSG = {
  CONTROL_STATE: 'control:state',
  CONTROL_TICK: 'control:tick',
  CONTROL_CMD: 'control:cmd',
  CONTROL_HELLO: 'control:hello',
  DISPLAY_HELLO: 'display:hello',
  DISPLAY_BYE: 'display:bye',
  DISPLAY_STATE: 'display:state',
};

export const CMD = {
  PLAY: 'play',
  PAUSE: 'pause',
  SEEK: 'seek',
  STOP: 'stop',
  LOAD: 'load',
};

export const createBus = () => {
  if (typeof BroadcastChannel === 'undefined') {
    // Fallback no-op (e.g., during SSR or unsupported browser)
    return {
      postMessage: () => {},
      addListener: () => () => {},
      close: () => {},
      raw: null,
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
