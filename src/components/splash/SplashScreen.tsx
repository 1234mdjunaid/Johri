import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { ParticlesField } from '@/components/shared/ParticlesField'
import { LogoMark } from '@/components/shared/LogoMark'

interface SplashScreenProps {
  onComplete: () => void
  seconds?: number
}

export function SplashScreen({ onComplete, seconds = 3.4 }: SplashScreenProps) {
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    timerRef.current = window.setTimeout(onComplete, seconds * 1000)
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seconds])

  return (
    <motion.div
      data-screen="intro"
      className="relative z-2 flex min-h-screen flex-col items-center justify-center gap-5 overflow-hidden"
      exit={{ opacity: 0, transition: { duration: 0.6, ease: 'easeInOut' } }}
    >
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background: 'radial-gradient(60% 50% at 50% 38%, rgba(185,154,95,.16), transparent 70%)',
        }}
      />
      <ParticlesField />

      <LogoMark className="animate-logo-in w-[min(46vw,190px)]" sweep />

      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.4, delay: 0.9, ease: 'easeOut' }}
      >
        <div className="font-heading text-deep text-[clamp(30px,7vw,44px)] tracking-[.02em]">Johri Jewellers</div>
        <div className="mt-2 text-[13px] tracking-[.42em] text-gold uppercase">Crafted to be treasured</div>
      </motion.div>
    </motion.div>
  )
}
