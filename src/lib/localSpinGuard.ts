const STORAGE_KEY = 'johri_spin_claim'
const COOKIE_KEY = 'johri_spin_claim'

interface SpinClaim {
  couponId: string
  couponNumber: string
  mobile: string
}

function setCookie(name: string, value: string, days: number) {
  const expires = new Date(Date.now() + days * 86400000).toUTCString()
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`
}

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

/** Local-only guard so a returning guest on the same browser skips straight to their coupon. */
export function saveLocalClaim(claim: SpinClaim) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(claim))
  } catch {
    // localStorage may be unavailable (private mode); the cookie fallback still works.
  }
  setCookie(COOKIE_KEY, JSON.stringify(claim), 365)
}

export function readLocalClaim(): SpinClaim | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) ?? getCookie(COOKIE_KEY)
    return raw ? (JSON.parse(raw) as SpinClaim) : null
  } catch {
    return null
  }
}
