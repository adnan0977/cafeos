// Web Audio API Sound Utility for POS and Kitchen Display System (KDS)
// Zero external sound asset dependency - instant, reliable, high-fidelity audio

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  } catch (e) {
    console.warn('[AudioContext] Not initialized:', e);
    return null;
  }
}

/**
 * Play pleasant melodic chime when Kitchen marks an order as READY
 * (Two-tone ascending chime: C5 -> G5)
 */
export function playKitchenReadyChime() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  // Tone 1: 523.25 Hz (C5)
  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(523.25, now);
  gain1.gain.setValueAtTime(0.3, now);
  gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

  osc1.connect(gain1);
  gain1.connect(ctx.destination);
  osc1.start(now);
  osc1.stop(now + 0.35);

  // Tone 2: 783.99 Hz (G5)
  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(783.99, now + 0.15);
  gain2.gain.setValueAtTime(0.35, now + 0.15);
  gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

  osc2.connect(gain2);
  gain2.connect(ctx.destination);
  osc2.start(now + 0.15);
  osc2.stop(now + 0.65);
}

/**
 * Play crisp affirmative sound when POS punches and forwards order to Kitchen
 */
export function playNewOrderKitchenChime() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(587.33, now); // D5
  osc.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5

  gain.gain.setValueAtTime(0.25, now);
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.25);
}

/**
 * Play alert tone for urgent or overdue tickets
 */
export function playAlertBeep() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(440, now);
  osc.frequency.setValueAtTime(330, now + 0.1);

  gain.gain.setValueAtTime(0.2, now);
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.3);
}

/**
 * Play authentic Cash Register "Cha-ching!" sound for Cash settlement / Drawer kick
 */
export function playCashRegisterSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  // Bell tone (metallic chime)
  const bellOsc = ctx.createOscillator();
  const bellGain = ctx.createGain();
  bellOsc.type = 'sine';
  bellOsc.frequency.setValueAtTime(1480, now);
  bellGain.gain.setValueAtTime(0.3, now);
  bellGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

  bellOsc.connect(bellGain);
  bellGain.connect(ctx.destination);
  bellOsc.start(now);
  bellOsc.stop(now + 0.5);

  // High sparkle ring (cha-ching)
  const ringOsc = ctx.createOscillator();
  const ringGain = ctx.createGain();
  ringOsc.type = 'triangle';
  ringOsc.frequency.setValueAtTime(2093, now + 0.08); // C7
  ringGain.gain.setValueAtTime(0.35, now + 0.08);
  ringGain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

  ringOsc.connect(ringGain);
  ringGain.connect(ctx.destination);
  ringOsc.start(now + 0.08);
  ringOsc.stop(now + 0.7);
}

/**
 * Play quick scanner barcode beep
 */
export function playBarcodeBeep() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'square';
  osc.frequency.setValueAtTime(1760, now); // A6
  gain.gain.setValueAtTime(0.12, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.08);
}

/**
 * Play tactile keyboard numpad click
 */
export function playKeyClick() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(800, now);
  osc.frequency.exponentialRampToValueAtTime(200, now + 0.03);
  gain.gain.setValueAtTime(0.08, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.03);
}

