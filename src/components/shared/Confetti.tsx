import { useMemo } from 'react'

interface Piece {
  left: number
  w: number
  h: number
  radius: number
  color: string
  duration: string
  delay: string
}

const COLORS = ['#8a76b8', '#b99a5f', '#cbbce0', '#e6ddf4', '#d8c39a']

export function Confetti({ count = 44 }: { count?: number }) {
  const pieces = useMemo<Piece[]>(
    () =>
      Array.from({ length: count }, () => ({
        left: Math.round(Math.random() * 100),
        w: 6 + Math.round(Math.random() * 6),
        h: 8 + Math.round(Math.random() * 8),
        radius: Math.random() > 0.5 ? 99 : 2,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        duration: (2.6 + Math.random() * 2.4).toFixed(2),
        delay: (Math.random() * 0.7).toFixed(2),
      })),
    [count],
  )

  return (
    <div className="pointer-events-none fixed inset-0 z-3 overflow-hidden" aria-hidden="true">
      {pieces.map((c, i) => (
        <span
          key={i}
          className="absolute top-0"
          style={{
            left: `${c.left}%`,
            width: c.w,
            height: c.h,
            borderRadius: c.radius,
            background: c.color,
            animation: `fall ${c.duration}s cubic-bezier(.2,.6,.6,1) ${c.delay}s both`,
          }}
        />
      ))}
    </div>
  )
}
