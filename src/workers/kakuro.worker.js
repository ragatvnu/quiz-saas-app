\\
// src/workers/kakuro.worker.js
// Web Worker wrapper so generation doesn't block the UI.
import { generateKakuro, generateKakuroBatch } from '../utils/kakuroGenerator.js';

self.onmessage = (e) => {
  const { type, payload } = e.data || {};
  try {
    if (type === 'generate') {
      const p = generateKakuro(payload || {});
      self.postMessage({ type: 'result', puzzle: p });
    } else if (type === 'batch') {
      const arr = generateKakuroBatch(payload?.n || 3, payload?.opts || {});
      self.postMessage({ type: 'result', puzzles: arr });
    } else {
      self.postMessage({ type: 'error', message: 'Unknown message type' });
    }
  } catch (err) {
    self.postMessage({ type: 'error', message: err?.message || String(err) });
  }
};
