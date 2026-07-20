/// <reference path="../pb_data/types.d.ts" />

/**
 * Johri Jewellers — Spin & Win custom API routes.
 *
 * PocketBase JS hooks run inside the PocketBase binary itself (pb_hooks/*.pb.js
 * is auto-loaded on `pocketbase serve`). These routes run with full server
 * privileges, which is why the `offers` / `customers` / `coupons` collections
 * are locked down to admin-only access in pb_schema.json: every public write
 * goes through this file instead, so the browser can never bypass the
 * "one coupon per mobile number" rule no matter what it sends.
 *
 * Requires PocketBase v0.23+ (JSVM hooks). If you deploy to a managed
 * PocketBase host that does not allow custom pb_hooks, see the README's
 * "Deploying without custom hooks" note for the client-side fallback.
 */

const MOBILE_PATTERN = /^[6-9]\d{9}$/

// Best-effort in-memory rate limit: max 8 claim attempts per IP per 10 minutes.
// This resets whenever the PocketBase process restarts and does not span
// multiple instances behind a load balancer — it's a spam speed-bump, not the
// security boundary. The unique DB index on coupons.mobile is what actually
// guarantees one coupon per number regardless of how many requests arrive.
const RATE_LIMIT = { max: 8, windowMs: 10 * 60 * 1000 }
const rateBuckets = new Map()

function checkRateLimit(ip) {
  const now = Date.now()
  const bucket = rateBuckets.get(ip) || []
  const recent = bucket.filter((t) => now - t < RATE_LIMIT.windowMs)
  if (recent.length >= RATE_LIMIT.max) {
    rateBuckets.set(ip, recent)
    return false
  }
  recent.push(now)
  rateBuckets.set(ip, recent)
  return true
}

function randomCouponNumber() {
  const suffix = $security.randomStringWithAlphabet(6, "0123456789ABCDEFGHJKLMNPQRSTUVWXYZ")
  return `JHR-${suffix}`
}

function couponToJSON(coupon) {
  return {
    id: coupon.id,
    couponNumber: coupon.get("couponNumber"),
    offer: coupon.get("offer"),
    offerTitle: coupon.get("offerTitle"),
    customer: coupon.get("customer"),
    customerName: coupon.get("customerName"),
    mobile: coupon.get("mobile"),
    redeemed: coupon.get("redeemed"),
    expiryDate: coupon.get("expiryDate"),
    created: coupon.get("created"),
  }
}

routerAdd("POST", "/api/spin/claim", (e) => {
  const ip = e.realIP ? e.realIP() : "unknown"
  if (!checkRateLimit(ip)) {
    throw new ApiError(429, "Too many attempts. Please wait a few minutes and try again.")
  }

  const data = e.requestInfo().body || {}
  const name = String(data.name || "").trim()
  const mobile = String(data.mobile || "").trim()
  const offerId = String(data.offerId || "").trim()
  const fingerprint = String(data.fingerprint || "").slice(0, 200)

  if (name.length < 2) {
    throw new BadRequestError("Please enter your full name.")
  }
  if (!MOBILE_PATTERN.test(mobile)) {
    throw new BadRequestError("Please enter a valid 10-digit Indian mobile number.")
  }
  if (!offerId) {
    throw new BadRequestError("Missing offer.")
  }

  // Already claimed? Hand back the existing coupon instead of minting a new one.
  const existing = $app.findFirstRecordByFilter("coupons", "mobile = {:mobile}", { mobile })
  if (existing) {
    return e.json(200, { coupon: couponToJSON(existing), alreadyExists: true })
  }

  const offer = $app.findRecordById("offers", offerId)
  if (!offer || !offer.get("active")) {
    throw new BadRequestError("This offer is no longer available.")
  }

  const validityDays = Number(offer.get("validityDays")) || 30
  const now = new Date()
  const expiry = new Date(now.getTime() + validityDays * 86400000)

  let saved = null
  let lastErr = null

  // Retry a handful of times in case of a coupon-number collision or a
  // same-mobile race with a concurrent request; the unique DB indexes on
  // coupons.mobile / coupons.couponNumber are the real safety net.
  for (let attempt = 0; attempt < 5 && !saved; attempt++) {
    try {
      saved = $app.runInTransaction((txApp) => {
        const customersCol = txApp.findCollectionByNameOrId("customers")
        const customer = new Record(customersCol)
        customer.set("name", name)
        customer.set("mobile", mobile)
        customer.set("fingerprint", fingerprint)
        txApp.save(customer)

        const couponsCol = txApp.findCollectionByNameOrId("coupons")
        const coupon = new Record(couponsCol)
        coupon.set("couponNumber", randomCouponNumber())
        coupon.set("offer", offer.id)
        coupon.set("offerTitle", offer.get("title"))
        coupon.set("customer", customer.id)
        coupon.set("customerName", name)
        coupon.set("mobile", mobile)
        coupon.set("redeemed", false)
        coupon.set("expiryDate", expiry.toISOString())
        txApp.save(coupon)

        customer.set("couponId", coupon.id)
        txApp.save(customer)

        return coupon
      })
    } catch (err) {
      lastErr = err
      // A duplicate mobile that raced us in: return the winner of that race.
      const raced = $app.findFirstRecordByFilter("coupons", "mobile = {:mobile}", { mobile })
      if (raced) {
        return e.json(200, { coupon: couponToJSON(raced), alreadyExists: true })
      }
    }
  }

  if (!saved) {
    throw new ApiError(500, "Could not generate your coupon. Please try again.", lastErr)
  }

  return e.json(200, { coupon: couponToJSON(saved), alreadyExists: false })
})

routerAdd("GET", "/api/spin/lookup", (e) => {
  const mobile = String(e.requestInfo().query.mobile || "").trim()
  if (!MOBILE_PATTERN.test(mobile)) {
    throw new BadRequestError("Invalid mobile number.")
  }
  const coupon = $app.findFirstRecordByFilter("coupons", "mobile = {:mobile}", { mobile })
  if (!coupon) {
    throw new NotFoundError("No coupon found for this mobile number.")
  }
  return e.json(200, couponToJSON(coupon))
})
