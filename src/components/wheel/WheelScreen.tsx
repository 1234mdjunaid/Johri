import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { SpinWheel } from '@/components/wheel/SpinWheel'
import { ParticlesField } from '@/components/shared/ParticlesField'
import { useOffers } from '@/hooks/useOffers'
import { pickWinnerAndRotation } from '@/lib/wheelMath'
import { clearTicks, playChime, resumeAudio, scheduleTicks } from '@/lib/audio'
import { logSpin } from '@/lib/api'
import { getFingerprint } from '@/lib/fingerprint'
import type { WheelOffer } from '@/types'

const SPIN_DURATION_MS = 5400

interface WheelScreenProps {
  onWin: (offer: WheelOffer) => void
  muted: boolean
}

export function WheelScreen({ onWin, muted }: WheelScreenProps) {
  const { data: offers, isLoading, isError } = useOffers()
  const [rotation, setRotation] = useState(0)
  const [spinning, setSpinning] = useState(false)
  const tickTimers = useRef<number[]>([])
  const mutedRef = useRef(muted)
  mutedRef.current = muted

  const handleSpin = () => {
    if (spinning || !offers || offers.length === 0) return
    resumeAudio()
    const { winner, rotation: nextRotation } = pickWinnerAndRotation(offers, rotation)
    clearTicks(tickTimers.current)
    tickTimers.current = scheduleTicks(SPIN_DURATION_MS, () => mutedRef.current)
    setSpinning(true)
    setRotation(nextRotation)
    window.setTimeout(() => {
      playChime(mutedRef.current)
      setSpinning(false)
      void getFingerprint().then((fp) => logSpin(winner.id, fp))
      onWin(winner)
    }, SPIN_DURATION_MS + 150)
  }

  return (
    <motion.div
      data-screen="wheel"
      className="relative z-2 flex min-h-screen flex-col items-center justify-center gap-2.5 px-4 pt-7 pb-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.7 }}
    >
      <ParticlesField />
      <img src="/assets/johri-logo-lavender.png" alt="Johri" className="w-[54px] drop-shadow-[0_3px_12px_rgba(185,154,95,.3)]" />
      <h1 className="font-heading text-deep mt-1.5 text-center text-[clamp(26px,6.4vw,40px)] font-normal text-balance">
        Spin &amp; win a treasure
      </h1>
      <p className="text-muted mt-0.5 mb-4 max-w-[320px] text-center text-[15px] text-balance">
        Every spin wins. One spin per guest — make it count.
      </p>

      {isLoading && <div className="text-muted-2 py-16 text-sm">Loading today&apos;s offers…</div>}

      {isError && (
        <div className="text-error max-w-xs py-16 text-center text-sm">
          We couldn&apos;t load the wheel. Please refresh and try again.
        </div>
      )}

      {!isLoading && !isError && offers && offers.length === 0 && (
        <div className="text-muted-2 max-w-xs py-16 text-center text-sm">
          No active offers right now — please check back soon.
        </div>
      )}

      {!isLoading && offers && offers.length > 0 && (
        <SpinWheel offers={offers} rotation={rotation} spinning={spinning} onSpin={handleSpin} />
      )}

      <Link to="/admin" className="text-muted-3 mt-6 text-xs tracking-[.18em] uppercase">
        Admin
      </Link>
    </motion.div>
  )
}
