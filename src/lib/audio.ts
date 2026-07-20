let ctx: AudioContext | null = null

function getContext(): AudioContext | null {
  if (ctx) return ctx
  try {
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    ctx = new Ctor()
  } catch {
    ctx = null
  }
  return ctx
}

export function resumeAudio() {
  const c = getContext()
  if (c && c.state === 'suspended') void c.resume()
}

export function playTick(muted: boolean) {
  if (muted) return
  const c = getContext()
  if (!c) return
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.type = 'square'
  osc.frequency.value = 1500
  gain.gain.setValueAtTime(0.035, c.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.05)
  osc.connect(gain)
  gain.connect(c.destination)
  osc.start()
  osc.stop(c.currentTime + 0.05)
}

export function playChime(muted: boolean) {
  if (muted) return
  const c = getContext()
  if (!c) return
  ;[523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
    const osc = c.createOscillator()
    const gain = c.createGain()
    osc.type = 'sine'
    osc.frequency.value = freq
    const t = c.currentTime + i * 0.13
    gain.gain.setValueAtTime(0.0001, t)
    gain.gain.exponentialRampToValueAtTime(0.09, t + 0.03)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.9)
    osc.connect(gain)
    gain.connect(c.destination)
    osc.start(t)
    osc.stop(t + 1)
  })
}

/** Schedules spin ticks that decelerate (growing interval) across the spin duration. */
export function scheduleTicks(totalMs: number, muted: () => boolean): number[] {
  const timers: number[] = []
  let t = 0
  let interval = 45
  while (t < totalMs - 400) {
    timers.push(window.setTimeout(() => playTick(muted()), t))
    t += interval
    interval *= 1.09
  }
  return timers
}

export function clearTicks(timers: number[]) {
  timers.forEach((t) => window.clearTimeout(t))
}
