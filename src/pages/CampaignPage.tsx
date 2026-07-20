import { useEffect, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { SplashScreen } from '@/components/splash/SplashScreen'
import { WheelScreen } from '@/components/wheel/WheelScreen'
import { WinScreen } from '@/components/wheel/WinScreen'
import { CouponScreen } from '@/components/coupon/CouponScreen'
import { MuteToggle } from '@/components/shared/MuteToggle'
import { useSettings } from '@/hooks/useSettings'
import { claimCoupon, lookupCouponByMobile } from '@/lib/api'
import { getFingerprint } from '@/lib/fingerprint'
import { readLocalClaim, saveLocalClaim } from '@/lib/localSpinGuard'
import { env } from '@/config/env'
import type { CampaignScreen, ClaimResponse, CouponRecord, WheelOffer } from '@/types'
import type { ClaimFormValues } from '@/lib/validation'

const DEFAULT_TERMS =
  'Valid on a single purchase at Johri Jewellers. One coupon per guest. Cannot be combined with other offers. Please present this coupon in store. Subject to store discretion.'

export function CampaignPage() {
  const { data: settings } = useSettings()
  const [screen, setScreen] = useState<CampaignScreen>('intro')
  const [muted, setMuted] = useState(false)
  const [prize, setPrize] = useState<WheelOffer | null>(null)
  const [coupon, setCoupon] = useState<CouponRecord | null>(null)
  const [couponNote, setCouponNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [checkingReturningGuest, setCheckingReturningGuest] = useState(true)

  // Returning-guest fast path: this browser already claimed a coupon, so skip
  // the intro/wheel/win screens entirely rather than let them spin again.
  useEffect(() => {
    let cancelled = false
    const claim = readLocalClaim()
    if (!claim) {
      setCheckingReturningGuest(false)
      return
    }
    void lookupCouponByMobile(claim.mobile).then((fresh) => {
      if (cancelled) return
      if (fresh) {
        setCoupon(fresh)
        setCouponNote('Welcome back — here is your coupon from this device.')
        setScreen('coupon')
      }
      setCheckingReturningGuest(false)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const businessName = settings?.businessName || env.businessName
  const whatsappNumber = settings?.whatsappNumber || env.whatsappNumber
  const terms = settings?.terms || DEFAULT_TERMS
  const introSeconds = settings?.introSeconds || 3.4

  const handleWin = (offer: WheelOffer) => {
    setPrize(offer)
    setScreen('win')
  }

  const handleClaim = async (values: ClaimFormValues) => {
    if (!prize) return
    setSubmitting(true)
    try {
      const fingerprint = await getFingerprint()
      const response: ClaimResponse = await claimCoupon({
        name: values.name,
        mobile: values.mobile,
        offerId: prize.id,
        fingerprint,
      })
      setCoupon(response.coupon)
      setCouponNote(
        response.alreadyExists ? 'A coupon has already been generated for this mobile number — here it is again.' : '',
      )
      saveLocalClaim({
        couponId: response.coupon.id,
        couponNumber: response.coupon.couponNumber,
        mobile: response.coupon.mobile,
      })
      setScreen('coupon')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong. Please try again.'
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  if (checkingReturningGuest) {
    return <div className="min-h-screen bg-cream" />
  }

  return (
    <div
      className="min-h-screen overflow-x-hidden text-ink"
      style={{ background: 'radial-gradient(120% 90% at 50% 0%, #fffdf8 0%, #faf7f0 45%, #f1eaf8 100%)' }}
    >
      {screen !== 'intro' && <MuteToggle muted={muted} onToggle={() => setMuted((m) => !m)} />}
      <AnimatePresence mode="wait">
        {screen === 'intro' && (
          <SplashScreen key="intro" seconds={introSeconds} onComplete={() => setScreen('wheel')} />
        )}
        {screen === 'wheel' && <WheelScreen key="wheel" muted={muted} onWin={handleWin} />}
        {screen === 'win' && prize && (
          <WinScreen key="win" offer={prize} onSubmit={handleClaim} submitting={submitting} />
        )}
        {screen === 'coupon' && coupon && (
          <CouponScreen
            key="coupon"
            coupon={coupon}
            terms={terms}
            businessName={businessName}
            whatsappNumber={whatsappNumber}
            note={couponNote}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
