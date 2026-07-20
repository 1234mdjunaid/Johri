import FingerprintJS from '@fingerprintjs/fingerprintjs'

let cached: string | null = null

/**
 * Best-effort device fingerprint used only as a UX shortcut (skip straight to an
 * existing coupon). It is never trusted as the source of truth for uniqueness —
 * the server enforces that on mobile number via a DB-level unique constraint.
 */
export async function getFingerprint(): Promise<string> {
  if (cached) return cached
  try {
    const fp = await FingerprintJS.load()
    const result = await fp.get()
    cached = result.visitorId
  } catch {
    cached = 'fp-unavailable'
  }
  return cached
}
