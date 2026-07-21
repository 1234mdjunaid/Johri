import { useState } from 'react'
import toast from 'react-hot-toast'
import { useCouponsList, useToggleCouponRedeemed } from '@/hooks/useAdminQueries'
import { downloadCSV } from '@/lib/adminApi'
import { formatDate } from '@/lib/date'
import { describeError } from '@/lib/errors'

type StatusFilter = 'all' | 'pending' | 'redeemed'

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'redeemed', label: 'Redeemed' },
]

export function AdminCouponsPage() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')
  const { data: coupons, isLoading } = useCouponsList(search, status)
  const toggle = useToggleCouponRedeemed()

  const handleExport = () => {
    if (!coupons || coupons.length === 0) {
      toast.error('No coupons to export yet.')
      return
    }
    downloadCSV(
      `johri-coupons-${new Date().toISOString().slice(0, 10)}.csv`,
      coupons.map((c) => ({
        couponNumber: c.couponNumber,
        customerName: c.customerName,
        mobile: c.mobile,
        offerTitle: c.offerTitle,
        redeemed: c.redeemed ? 'Redeemed' : 'Pending',
        created: c.created,
        expiryDate: c.expiryDate,
      })),
    )
  }

  return (
    <div className="animate-fade-up flex flex-col gap-[22px]">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-deep text-[24px] font-normal">Coupons</h2>
        <button
          onClick={handleExport}
          className="border-lavender text-royal hover:bg-wisteria h-10 cursor-pointer rounded-full border-[1.5px] bg-paper px-[18px] text-[13.5px] font-bold"
        >
          Export CSV
        </button>
      </div>

      <div className="border-mist overflow-hidden rounded-[20px] border-[1.5px] bg-paper">
        <div className="border-mist flex flex-wrap items-center gap-2.5 border-b px-[18px] py-4">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, mobile or coupon…"
            className="border-mist focus:border-lavender min-w-[200px] flex-1 rounded-full border-[1.5px] bg-cream px-4 text-sm transition-colors"
            style={{ height: 42 }}
          />
          <div className="flex gap-1.5">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setStatus(f.value)}
                className={`h-[38px] cursor-pointer rounded-full border-[1.5px] px-3.5 text-[13px] font-semibold ${
                  status === f.value ? 'border-lavender bg-wisteria text-royal' : 'border-mist bg-transparent text-muted-2'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-[13.5px]">
            <thead>
              <tr className="text-muted-3 text-left text-[11px] tracking-[.14em] uppercase">
                <th className="px-[18px] py-3 font-semibold">Coupon</th>
                <th className="px-2.5 py-3 font-semibold">Guest</th>
                <th className="px-2.5 py-3 font-semibold">Mobile</th>
                <th className="px-2.5 py-3 font-semibold">Offer</th>
                <th className="px-2.5 py-3 font-semibold">Created</th>
                <th className="px-[18px] py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={6} className="text-muted-3 px-[18px] py-8 text-center">
                    Loading…
                  </td>
                </tr>
              )}
              {!isLoading && (coupons?.length ?? 0) === 0 && (
                <tr>
                  <td colSpan={6} className="text-muted-3 px-[18px] py-8 text-center">
                    No coupons match this search yet.
                  </td>
                </tr>
              )}
              {coupons?.map((c) => (
                <tr key={c.id} className="border-mist border-t">
                  <td className="text-royal px-[18px] py-3 font-bold whitespace-nowrap">{c.couponNumber}</td>
                  <td className="px-2.5 py-3">{c.customerName}</td>
                  <td className="px-2.5 py-3 whitespace-nowrap">{c.mobile}</td>
                  <td className="px-2.5 py-3">{c.offerTitle}</td>
                  <td className="text-muted-2 px-2.5 py-3 whitespace-nowrap">{formatDate(c.created)}</td>
                  <td className="px-[18px] py-3">
                    <button
                      onClick={() =>
                        toggle.mutate(
                          { id: c.id, redeemed: !c.redeemed },
                          { onError: (err) => toast.error(describeError(err, 'Could not update this coupon.')) },
                        )
                      }
                      disabled={toggle.isPending}
                      className={`h-[30px] cursor-pointer rounded-full border-[1.5px] px-3.5 text-xs font-bold whitespace-nowrap ${
                        c.redeemed
                          ? 'border-success-border bg-success-bg text-success'
                          : 'border-[#e6d9bd] bg-[#f9f3e4] text-[#8a6d33]'
                      }`}
                    >
                      {c.redeemed ? 'Redeemed' : 'Pending'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
