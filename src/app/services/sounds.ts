import type { KeyboardSoundType } from '../contexts/SettingsContext';

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

// "Pop Click" — short, snappy pop sound
function playPopClick() {
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

// "Retro Beep" — deeper, dual-tone retro sound
function playRetroBeep() {
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

// "Soft Tap" — gentle, soft tap with white noise
function playSoftTap() {
  const ctx = getAudioContext();

  // Create noise buffer for a softer, more natural tap
  const bufferSize = ctx.sampleRate * 0.03; // 30ms
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    // Shaped noise that decays
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.2));
  }

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.04, ctx.currentTime);

  // Bandpass filter to shape the noise
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(2000 + Math.random() * 500, ctx.currentTime);
  filter.Q.setValueAtTime(1.5, ctx.currentTime);

  noise.connect(filter);
  filter.connect(noiseGain);
  noiseGain.connect(ctx.destination);
  noise.start(ctx.currentTime);
}

/**
 * Play a keystroke sound.
 * 
 * Sound types:
 * - "pop-click": Short snappy pop (synthesized)
 * - "retro-beep": Deeper retro dual-tone beep (synthesized)
 * - "soft-tap": Gentle tap with noise (synthesized)
 * - "silent": No sound
 * 
 * To add REAL audio files (e.g. actual mechanical keyboard sounds):
 * 1. Place .mp3/.wav files in /public/sounds/ (e.g. /public/sounds/mechanical.mp3)
 * 2. Add a new case below that loads and plays the audio file:
 * 
 *    const audio = new Audio('/sounds/mechanical.mp3');
 *    audio.volume = 0.5;
 *    audio.play();
 * 
 * 3. Add the new type to KeyboardSoundType in SettingsContext.tsx
 * 4. Add it to the sound options list in SettingsPage.tsx
 */
export function playKeystrokeSound(type: KeyboardSoundType, enabled: boolean) {
  if (!enabled || type === 'silent') return;

  try {
    switch (type) {
      case 'pop-click':
        playPopClick();
        break;
      case 'retro-beep':
        playRetroBeep();
        break;
      case 'soft-tap':
        playSoftTap();
        break;
    }
  } catch {
    // Audio context may not be available
  }
}
