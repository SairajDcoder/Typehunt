import type { KeyboardSoundType } from '../contexts/SettingsContext';

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

function playMechanical() {
  const ctx = getAudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'square';
  osc.frequency.setValueAtTime(1800 + Math.random() * 400, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.04);

  gain.gain.setValueAtTime(0.08, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.05);
}

function playTypewriter() {
  const ctx = getAudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(600 + Math.random() * 200, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.08);

  gain.gain.setValueAtTime(0.06, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.1);

  // Add a click component
  const click = ctx.createOscillator();
  const clickGain = ctx.createGain();
  click.type = 'sine';
  click.frequency.setValueAtTime(3000, ctx.currentTime);
  clickGain.gain.setValueAtTime(0.03, ctx.currentTime);
  clickGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.02);
  click.connect(clickGain);
  clickGain.connect(ctx.destination);
  click.start(ctx.currentTime);
  click.stop(ctx.currentTime + 0.02);
}

export function playKeystrokeSound(type: KeyboardSoundType, enabled: boolean) {
  if (!enabled || type === 'silent') return;

  try {
    if (type === 'mechanical') {
      playMechanical();
    } else if (type === 'typewriter') {
      playTypewriter();
    }
  } catch {
    // Audio context may not be available
  }
}
