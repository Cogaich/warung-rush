// Warung Rush sound: every noise is a WebAudio oscillator or a burst of
// filtered static, made in code. No audio files, nothing to download.
// A mute toggle (M) silences everything at once.

let ctx = null;
let muted = false;

function audioCtx() {
  if (ctx === null) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

export function unlockAudio() {
  audioCtx();
}

export function setMuted(value) {
  muted = value;
  if (muted) sizzleStop();
}

export function isMuted() {
  return muted;
}

function tone(freq, dur, type, gain, slideTo) {
  if (muted) return;
  const ac = audioCtx();
  if (!ac) return;
  const now = ac.currentTime;
  const osc = ac.createOscillator();
  const amp = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, now + dur);
  amp.gain.setValueAtTime(gain, now);
  amp.gain.exponentialRampToValueAtTime(0.001, now + dur);
  osc.connect(amp);
  amp.connect(ac.destination);
  osc.start(now);
  osc.stop(now + dur + 0.02);
}

function noiseBurst(dur, filterFreq, gain) {
  if (muted) return;
  const ac = audioCtx();
  if (!ac) return;
  const now = ac.currentTime;
  const len = Math.max(1, Math.floor(ac.sampleRate * dur));
  const buffer = ac.createBuffer(1, len, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ac.createBufferSource();
  src.buffer = buffer;
  const filter = ac.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = filterFreq;
  const amp = ac.createGain();
  amp.gain.setValueAtTime(gain, now);
  amp.gain.exponentialRampToValueAtTime(0.001, now + dur);
  src.connect(filter);
  filter.connect(amp);
  amp.connect(ac.destination);
  src.start(now);
}

// One knife chop: a short wooden thock.
export function chopSound() {
  noiseBurst(0.07, 900, 0.5);
  tone(180, 0.06, 'triangle', 0.25, 90);
}

// The wok sizzling while food fries: a looped high-passed noise bed.
let sizzleNodes = null;
export function sizzleStart() {
  if (muted) return;
  const ac = audioCtx();
  if (!ac || sizzleNodes) return;
  const len = ac.sampleRate;
  const buffer = ac.createBuffer(1, len, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < len; i += 1) data[i] = Math.random() * 2 - 1;
  const src = ac.createBufferSource();
  src.buffer = buffer;
  src.loop = true;
  const filter = ac.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = 2500;
  const amp = ac.createGain();
  amp.gain.value = 0.05;
  src.connect(filter);
  filter.connect(amp);
  amp.connect(ac.destination);
  src.start();
  sizzleNodes = { src, amp };
}

export function sizzleStop() {
  if (!sizzleNodes || !ctx) return;
  try {
    sizzleNodes.amp.gain.setTargetAtTime(0, ctx.currentTime, 0.05);
    sizzleNodes.src.stop(ctx.currentTime + 0.3);
  } catch {
    // Already stopped; nothing to do.
  }
  sizzleNodes = null;
}

export function dingSound() {
  tone(880, 0.18, 'sine', 0.3);
  tone(1318, 0.28, 'sine', 0.22);
}

export function popSound() {
  tone(520, 0.08, 'square', 0.16, 780);
}

export function coinSound() {
  tone(988, 0.09, 'sine', 0.25);
  setTimeout(() => tone(1319, 0.16, 'sine', 0.25), 70);
}

export function buzzSound() {
  tone(140, 0.25, 'sawtooth', 0.2, 90);
}

export function perfectSound() {
  tone(660, 0.1, 'sine', 0.25);
  setTimeout(() => tone(880, 0.1, 'sine', 0.25), 80);
  setTimeout(() => tone(1320, 0.22, 'sine', 0.25), 160);
}

export function clickSound() {
  tone(700, 0.05, 'square', 0.1);
}

// A short rising arpeggio when a shift starts.
export function startSound() {
  tone(523, 0.1, 'sine', 0.22);
  setTimeout(() => tone(659, 0.1, 'sine', 0.22), 90);
  setTimeout(() => tone(784, 0.18, 'sine', 0.22), 180);
}
