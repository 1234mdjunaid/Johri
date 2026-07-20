import { formatDate } from '@/lib/date'
import type { CouponRecord } from '@/types'

export function CouponCard({ coupon, terms, businessName = 'Johri Jewellers' }: { coupon: CouponRecord; terms: string; businessName?: string }) {
  return (
    <div className="animate-pop w-full max-w-[430px] rounded-3xl bg-gradient-to-br from-paper via-[#f7f1e6] to-wash p-1.5 shadow-[0_24px_60px_rgba(74,58,115,.22)]">
      <div className="border-gold relative overflow-hidden rounded-[19px] border-[1.5px] px-[22px] py-6">
        <div className="border-gold/35 pointer-events-none absolute -top-10 -right-10 h-[150px] w-[150px] rounded-full border" />
        <div className="border-lavender/25 pointer-events-none absolute -top-5 -right-5 h-[150px] w-[150px] rounded-full border" />

        <div className="flex items-center gap-3.5">
          <img src="/assets/johri-logo-lavender.png" alt="Johri" className="w-11" />
          <div>
            <div className="font-heading text-deep text-[21px]">{businessName}</div>
            <div className="text-gold text-[10.5px] tracking-[.3em] uppercase">Privilege coupon</div>
          </div>
        </div>

        <div className="border-gold mt-5 mb-4 rounded-2xl border border-dashed bg-royal/7 px-[18px] py-4 text-center">
          <div className="font-heading text-royal text-[clamp(22px,5.4vw,28px)] text-balance">{coupon.offerTitle}</div>
          <div className="text-gold mt-1.5 text-[15px] font-bold tracking-[.14em]">{coupon.couponNumber}</div>
        </div>

        <div className="grid grid-cols-2 gap-x-3.5 gap-y-2.5 text-[13.5px]">
          <div>
            <div className="text-muted-3 text-[10.5px] tracking-[.18em] uppercase">Guest</div>
            <div className="text-ink font-bold">{coupon.customerName}</div>
          </div>
          <div>
            <div className="text-muted-3 text-[10.5px] tracking-[.18em] uppercase">Mobile</div>
            <div className="text-ink font-bold">{coupon.mobile}</div>
          </div>
          <div>
            <div className="text-muted-3 text-[10.5px] tracking-[.18em] uppercase">Issued</div>
            <div className="text-ink font-bold">{formatDate(coupon.created)}</div>
          </div>
          <div>
            <div className="text-muted-3 text-[10.5px] tracking-[.18em] uppercase">Valid till</div>
            <div className="text-royal font-bold">{formatDate(coupon.expiryDate)}</div>
          </div>
        </div>

        <div className="border-mist text-muted-2 mt-[18px] border-t pt-3.5 text-[11px] leading-[1.55] text-balance">
          {terms}
        </div>
      </div>
    </div>
  )
}
