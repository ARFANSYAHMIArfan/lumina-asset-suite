/**
 * Persistent state for last STAGING and LIVE selection so the operator
 * can recover the working set after a refresh.
 *
 * We store only IDs (not full asset objects) because asset metadata may
 * have changed since last session. We also store transport state.
 */

const KEY = 'lumina:session:v1';

function safeParse(json) {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function loadSessionState() {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  const raw = window.localStorage.getItem(KEY);
  if (!raw) return null;
  return safeParse(raw);
}

export function saveSessionState(state) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Storage may be full or disabled; ignore silently.
  }
}

export function clearSessionState() {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
