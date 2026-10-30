/**
 * OPTI-SIM UI Audio Feedback Synthesizer
 * Native Web Audio API utility for tactile, synthesized UI sounds.
 * 
 * Complies with Phase 18G requirements:
 * - Pure Web Audio API synthesis (OscillatorNode + GainNode + BiquadFilterNode)
 * - Zero external media files (.mp3, .wav)
 * - Single persistent AudioContext initialized upon user interaction
 * - Strict ADSR envelope shaping (subtle, non-jarring volume levels)
 * - Global volume / mute toggle with localStorage persistence
 */

import { useState, useEffect, useCallback } from 'react';

const AUDIO_MUTED_STORAGE_KEY = 'optisim_audio_muted';

// Global single AudioContext reference
let globalAudioCtx: AudioContext | null = null;

// Global mute state in memory, seeded from localStorage
let isMutedGlobal: boolean = (() => {
  if (typeof window === 'undefined') return false;
  try {
    const saved = localStorage.getItem(AUDIO_MUTED_STORAGE_KEY);
    return saved === 'true';
  } catch {
    return false;
  }
})();

// Listeners for reactive updates
const muteListeners = new Set<(muted: boolean) => void>();

/**
 * Returns or initializes the shared AudioContext lazily on user gesture.
 */
export function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;

  if (!globalAudioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      globalAudioCtx = new AudioContextClass();
    }
  }

  // Ensure AudioContext is resumed if suspended by browser autoplay policy
  if (globalAudioCtx && globalAudioCtx.state === 'suspended') {
    globalAudioCtx.resume().catch(() => {
      // Ignored if user hasn't interacted yet
    });
  }

  return globalAudioCtx;
}

/**
 * Check if audio is currently muted globally.
 */
export function isAudioMuted(): boolean {
  return isMutedGlobal;
}

/**
 * Set the global mute state and notify listeners.
 */
export function setAudioMuted(muted: boolean): void {
  isMutedGlobal = muted;
  try {
    localStorage.setItem(AUDIO_MUTED_STORAGE_KEY, String(muted));
  } catch {
    // ignore localStorage errors
  }
  muteListeners.forEach((listener) => listener(muted));
}

/**
 * Toggle the global mute state.
 */
export function toggleAudioMuted(): boolean {
  const next = !isMutedGlobal;
  setAudioMuted(next);
  return next;
}

/**
 * Subscribe to mute state changes.
 */
export function onMuteChange(listener: (muted: boolean) => void): () => void {
  muteListeners.add(listener);
  return () => {
    muteListeners.delete(listener);
  };
}

// Debounce timers to coalesce rapid duplicate events
let lastTickTime = 0;
let lastSnapTime = 0;
let lastErrorTime = 0;

/**
 * Sound 1: "Tick"
 * Short, crisp, high-frequency sound with fast decay.
 * Used for standard button clicks and flipping ADC/DAC digital toggles.
 */
export function playTick(): void {
  if (isMutedGlobal) return;
  const nowMs = typeof performance !== 'undefined' ? performance.now() : Date.now();
  if (nowMs - lastTickTime < 45) return;
  lastTickTime = nowMs;

  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // Crisp high-frequency micro-tone with gentle pitch decay
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1650, now);
    osc.frequency.exponentialRampToValueAtTime(1150, now + 0.032);

    // ADSR Envelope: Fast attack, instant decay to avoid clicking
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.12, now + 0.002); // 2ms Attack
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.035); // 33ms Decay/Release

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.038);
  } catch {
    // Safely swallow audio exceptions
  }
}

/**
 * Sound 2: "Snap"
 * Satisfying tactile snap with mid frequency and slight pitch drop.
 * Used for successfully connecting two terminals in the Manual Circuit Builder.
 */
export function playSnap(): void {
  if (isMutedGlobal) return;
  const nowMs = typeof performance !== 'undefined' ? performance.now() : Date.now();
  if (nowMs - lastSnapTime < 45) return;
  lastSnapTime = nowMs;

  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // Mid-frequency dropping downwards for satisfying latch feedback
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(580, now);
    osc.frequency.exponentialRampToValueAtTime(240, now + 0.08);

    // Envelope: Quick punchy attack followed by smooth exponential decay
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.004); // 4ms Attack
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09); // 86ms Decay

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.095);
  } catch {
    // Safely swallow audio exceptions
  }
}

/**
 * Sound 3: "Error / Deny"
 * Low frequency, muted sawtooth wave through a warm low-pass filter.
 * Used for invalid wire connections or form/circuit validation failures.
 */
export function playError(): void {
  if (isMutedGlobal) return;
  const nowMs = typeof performance !== 'undefined' ? performance.now() : Date.now();
  if (nowMs - lastErrorTime < 45) return;
  lastErrorTime = nowMs;

  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    // Low-frequency sawtooth for clear distinction without being abrasive
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(145, now);
    osc.frequency.exponentialRampToValueAtTime(85, now + 0.16);

    // Biquad lowpass filter to soften high harmonic harshness
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(500, now);
    filter.frequency.exponentialRampToValueAtTime(220, now + 0.16);

    // Envelope: Moderate attack, gentle decay
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.15, now + 0.006); // 6ms Attack
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16); // 154ms Decay

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.17);
  } catch {
    // Safely swallow audio exceptions
  }
}

/**
 * React Hook for UI Audio Feedback with reactive Mute state binding.
 */
export function useAudioFeedback() {
  const [muted, setMuted] = useState<boolean>(() => isAudioMuted());

  useEffect(() => {
    const unsubscribe = onMuteChange((newMuted) => {
      setMuted(newMuted);
    });
    return unsubscribe;
  }, []);

  const toggleMute = useCallback(() => {
    const next = toggleAudioMuted();
    if (!next) {
      // Preview confirmation tick when unmuting
      playTick();
    }
  }, []);

  return {
    isMuted: muted,
    toggleMute,
    setIsMuted: setAudioMuted,
    playTick,
    playSnap,
    playError,
  };
}
