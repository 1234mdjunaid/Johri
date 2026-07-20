import { pb } from '@/lib/pocketbase'
import type { ClaimResponse, CouponRecord, OfferRecord, SettingsRecord, WheelOffer } from '@/types'

export async function fetchActiveOffers(): Promise<WheelOffer[]> {
  const records = await pb.collection('offers').getFullList<OfferRecord>({
    filter: 'active = true',
    sort: 'created',
    requestKey: 'active-offers',
  })
  return records.map((o) => ({
    id: o.id,
    title: o.title,
    probability: o.probability,
    wheelColor: o.wheelColor,
    validityDays: o.validityDays,
  }))
}

/** Logs a spin the instant the wheel lands, independent of whether the guest goes on to claim. */
export async function logSpin(offerId: string, fingerprint: string): Promise<void> {
  try {
    await pb.collection('spins').create({ offer: offerId, fingerprint })
  } catch {
    // Non-critical analytics write — never block the win screen on this.
  }
}

export async function fetchSettings(): Promise<SettingsRecord | null> {
  try {
    return await pb.collection('settings').getFirstListItem<SettingsRecord>('', { requestKey: 'settings' })
  } catch {
    return null
  }
}

interface ClaimPayload {
  name: string
  mobile: string
  offerId: string
  fingerprint: string
}

/**
 * Claims a coupon through the PocketBase custom route (pb_hooks/main.pb.js).
 * The server — not the browser — is the source of truth for "one coupon per
 * mobile number": it runs the lookup-or-create atomically under a superuser
 * context, so a duplicate submission (or two tabs racing) can never mint two
 * coupons for the same number.
 */
export async function claimCoupon(payload: ClaimPayload): Promise<ClaimResponse> {
  return pb.send<ClaimResponse>('/api/spin/claim', {
    method: 'POST',
    body: payload,
  })
}

export async function lookupCouponByMobile(mobile: string): Promise<CouponRecord | null> {
  try {
    return await pb.send<CouponRecord>(`/api/spin/lookup?mobile=${encodeURIComponent(mobile)}`, {
      method: 'GET',
    })
  } catch {
    return null
  }
}
