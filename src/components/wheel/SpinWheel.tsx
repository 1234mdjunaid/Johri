import { useEffect, useMemo, useRef } from 'react'
import gsap from 'gsap'
import { buildWheelSegments, studPositions } from '@/lib/wheelMath'
import type { WheelOffer } from '@/types'

interface SpinWheelProps {
  offers: WheelOffer[]
  rotation: number
  spinning: boolean
  onSpin: () => void
}

export function SpinWheel({ offers, rotation, spinning, onSpin }: SpinWheelProps) {
  const segments = useMemo(() => buildWheelSegments(offers), [offers])
  const studs = useMemo(() => studPositions(offers.length), [offers.length])
  const pointerRef = useRef<HTMLDivElement>(null)
  const wasSpinning = useRef(false)

  // GSAP bounce flourish on the pointer the instant the wheel settles on a winner.
  useEffect(() => {
    if (wasSpinning.current && !spinning && pointerRef.current) {
      gsap.fromTo(
        pointerRef.current,
        { scale: 1, rotate: 0 },
        { scale: 1.22, rotate: -6, duration: 0.16, ease: 'power2.out', yoyo: true, repeat: 3, transformOrigin: '50% 20%' },
      )
    }
    wasSpinning.current = spinning
  }, [spinning])

  return (
    <div className="relative aspect-square w-[min(88vw,420px)]">
      {/* pointer */}
      <div
        ref={pointerRef}
        className="absolute top-[-6px] left-1/2 z-6 -translate-x-1/2 drop-shadow-[0_3px_6px_rgba(74,58,115,.35)]"
      >
        <svg width="34" height="42" viewBox="0 0 34 42">
          <path d="M17 42 L2 8 Q17 -6 32 8 Z" fill="#b99a5f" />
          <circle cx="17" cy="10" r="4.5" fill="#fffdf9" />
        </svg>
      </div>

      <svg
        viewBox="0 0 400 400"
        className="block h-full w-full drop-shadow-[0_18px_44px_rgba(74,58,115,.28)]"
      >
        <defs>
          <radialGradient id="hubMetal" cx="35%" cy="30%" r="80%">
            <stop offset="0%" stopColor="#a992cc" />
            <stop offset="70%" stopColor="#6b5a96" />
          </radialGradient>
          <linearGradient id="rimShine" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#e6ddf4" stopOpacity="0.5" />
            <stop offset="50%" stopColor="#fffdf9" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#4a3a73" stopOpacity="0.35" />
          </linearGradient>
        </defs>

        <circle cx="200" cy="200" r="197" fill="#4a3a73" />
        <circle cx="200" cy="200" r="197" fill="url(#rimShine)" />
        <circle cx="200" cy="200" r="190" fill="none" stroke="#b99a5f" strokeWidth="3" />

        <g
          style={{
            transform: `rotate(${rotation}deg)`,
            transformOrigin: '200px 200px',
            transition: spinning ? 'transform 5.4s cubic-bezier(.12,.75,.09,1)' : 'none',
          }}
        >
          {segments.map((s) => (
            <path key={s.id} d={s.path} fill={s.fill} stroke="#fffdf9" strokeWidth={2} />
          ))}
          {segments.map((s) => (
            <g key={`${s.id}-label`} transform={s.labelTransform}>
              <text
                x={200}
                y={66}
                textAnchor="middle"
                fill={s.textColor}
                style={{ fontFamily: 'var(--font-body,Figtree,sans-serif)', fontWeight: 700, fontSize: 15, letterSpacing: '.02em' }}
              >
                {s.line1}
              </text>
              {s.line2 && (
                <text
                  x={200}
                  y={84}
                  textAnchor="middle"
                  fill={s.textColor}
                  style={{ fontFamily: 'var(--font-body,Figtree,sans-serif)', fontWeight: 700, fontSize: 15, letterSpacing: '.02em' }}
                >
                  {s.line2}
                </text>
              )}
            </g>
          ))}
          {studs.map((st, i) => (
            <circle key={i} cx={st.x} cy={st.y} r={4} fill="#b99a5f" stroke="#fffdf9" strokeWidth={1.2} />
          ))}
        </g>

        <circle cx="200" cy="200" r="58" fill="#fffdf9" stroke="#b99a5f" strokeWidth={2.5} />
      </svg>

      <button
        onClick={onSpin}
        disabled={spinning || offers.length === 0}
        aria-label="Spin the wheel"
        className="animate-hub-pulse font-heading absolute top-1/2 left-1/2 z-5 aspect-square w-[26%] -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-full border-2 border-gold text-[clamp(16px,4vw,22px)] tracking-[.08em] text-paper transition-transform active:scale-95 disabled:cursor-not-allowed"
        style={{ background: 'radial-gradient(circle at 35% 30%, #a992cc, #6b5a96 70%)' }}
      >
        {spinning ? '…' : 'SPIN'}
      </button>
    </div>
  )
}
