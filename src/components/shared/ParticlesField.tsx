import { useMemo } from 'react'

interface Particle {
  left: number
  size: number
  color: string
  duration: number
  delay: number
}

/** Slow-drifting gold/lavender motes used as ambient background texture across screens. */
export function ParticlesField({ count = 14 }: { count?: number }) {
  const particles = useMemo<Particle[]>(
    () =>
      Array.from({ length: count }, (_, i) => ({
        left: 4 + Math.random() * 92,
        size: 3 + Math.round(Math.random() * 4),
        color: i % 3 === 0 ? '#b99a5f' : i % 3 === 1 ? '#b9a8d6' : '#8a76b8',
        duration: 9 + Math.round(Math.random() * 9),
        delay: Math.round(Math.random() * 90) / 10,
      })),
    [count],
  )

  return (
    <div className="pointer-events-none fixed inset-0 z-[1]" aria-hidden="true">
      {particles.map((p, i) => (
        <span
          key={i}
          className="absolute rounded-full"
          style={{
            bottom: '-2vh',
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            background: p.color,
            animation: `floaty ${p.duration}s linear ${p.delay}s infinite`,
          }}
        />
      ))}
    </div>
  )
}
