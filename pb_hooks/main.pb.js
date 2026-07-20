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
 *
 * NOTE: each routerAdd callback below requires `${__hooks}/lib.js` for shared
 * helpers instead of referencing top-level functions in this file — PocketBase's
 * JSVM does not let a hook callback close over this file's module scope (see
 * pb_hooks/lib.js and the README for details).
 */

routerAdd("POST", "/api/spin/claim", (e) => {
  const { MOBILE_PATTERN, randomCouponNumber, couponToJSON, checkRateLimit, findCouponByMobile } = require(`${__hooks}/lib.js`)

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
  const existing = findCouponByMobile(mobile)
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

  let savedJSON = null
  let lastErr = null

  // Retry a handful of times in case of a coupon-number collision or a
  // same-mobile race with a concurrent request; the unique DB indexes on
  // coupons.mobile / coupons.couponNumber are the real safety net.
  for (let attempt = 0; attempt < 5 && !savedJSON; attempt++) {
    try {
      $app.runInTransaction((txApp) => {
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

        // Serialize to a plain object *while the record is still live inside
        // the transaction* — a Record handle returned from runInTransaction
        // is unsafe to read from afterwards once the transaction has closed
        // (verified against PocketBase v0.39.8; see README's PocketBase
        // limitations section).
        savedJSON = couponToJSON(coupon)
        return null
      })
    } catch (err) {
      lastErr = err
      // A duplicate mobile that raced us in: return the winner of that race.
      const raced = findCouponByMobile(mobile)
      if (raced) {
        return e.json(200, { coupon: couponToJSON(raced), alreadyExists: true })
      }
    }
  }

  if (!savedJSON) {
    throw new ApiError(500, "Could not generate your coupon. Please try again.")
  }

  return e.json(200, { coupon: savedJSON, alreadyExists: false })
})

routerAdd("GET", "/api/spin/lookup", (e) => {
  const { MOBILE_PATTERN, couponToJSON, findCouponByMobile } = require(`${__hooks}/lib.js`)

  const mobile = String(e.requestInfo().query.mobile || "").trim()
  if (!MOBILE_PATTERN.test(mobile)) {
    throw new BadRequestError("Invalid mobile number.")
  }
  const coupon = findCouponByMobile(mobile)
  if (!coupon) {
    throw new NotFoundError("No coupon found for this mobile number.")
  }
  return e.json(200, couponToJSON(coupon))
})
