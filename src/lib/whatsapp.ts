import type { CouponRecord } from '@/types'

export function buildWhatsAppLink(coupon: CouponRecord, whatsappNumber: string): string {
  const message = [
    'Hello Johri Jewellers,',
    '',
    'My Name:',
    coupon.customerName,
    '',
    'Mobile:',
    coupon.mobile,
    '',
    'Coupon Number:',
    coupon.couponNumber,
    '',
    'Offer Won:',
    coupon.offerTitle,
    '',
    'I would like to claim my offer.',
    'Thank you.',
  ].join('\n')
  const digits = whatsappNumber.replace(/[^\d]/g, '')
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
}
