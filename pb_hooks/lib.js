// Shared helpers for the Spin & Win hooks, loaded via require(`${__hooks}/lib.js`).
//
// IMPORTANT PocketBase JSVM quirk: a routerAdd/hook callback does NOT close over
// top-level `function`/`const` bindings declared elsewhere in the same .pb.js file
// — each callback is compiled and executed as its own isolated program. Shared
// code has to be required from a separate file like this one instead. (Verified
// empirically against PocketBase v0.39.8 — see README's PocketBase limitations
// section.)

const MOBILE_PATTERN = /^[6-9]\d{9}$/

// Sequential coupon numbers (JHR-000001, JHR-000002, ...) via a single-row
// counter record, incremented atomically inside the same transaction as the
// coupon insert — pass the transaction's `txApp`, not the outer `$app`, so a
// rolled-back claim (e.g. a losing race on a duplicate mobile) also rolls
// back the increment instead of leaving a gap.
function nextCouponNumber(txApp) {
  let counter = null
  try {
    counter = txApp.findFirstRecordByFilter("counters", "key = 'coupon_seq'", {})
  } catch (err) {
    counter = null
  }
  if (!counter) {
    const countersCol = txApp.findCollectionByNameOrId("counters")
    counter = new Record(countersCol)
    counter.set("key", "coupon_seq")
    counter.set("value", 0)
  }
  const next = Number(counter.get("value") || 0) + 1
  counter.set("value", next)
  txApp.save(counter)
  return "JHR-" + String(next).padStart(6, "0")
}

// $app.findFirstRecordByFilter throws (rather than returning null/undefined)
// when nothing matches — verified against PocketBase v0.39.8. Every "does a
// coupon already exist for this mobile" check needs this wrapper.
function findCouponByMobile(mobile) {
  try {
    return $app.findFirstRecordByFilter("coupons", "mobile = {:mobile}", { mobile })
  } catch (err) {
    return null
  }
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

// Best-effort in-memory rate limit: max 8 claim attempts per IP per 10 minutes.
// require() caches this module per VM instance, so `buckets` persists across
// requests handled by that VM — but PocketBase pools several VMs, so the limit
// is enforced per-VM, not globally, and resets on restart. It's a spam speed
// bump, not the security boundary: the unique DB index on coupons.mobile is
// what actually guarantees one coupon per number.
const RATE_LIMIT = { max: 8, windowMs: 10 * 60 * 1000 }
const buckets = new Map()

function checkRateLimit(ip) {
  const now = Date.now()
  const recent = (buckets.get(ip) || []).filter((t) => now - t < RATE_LIMIT.windowMs)
  if (recent.length >= RATE_LIMIT.max) {
    buckets.set(ip, recent)
    return false
  }
  recent.push(now)
  buckets.set(ip, recent)
  return true
}

module.exports = { MOBILE_PATTERN, nextCouponNumber, couponToJSON, checkRateLimit, findCouponByMobile }
