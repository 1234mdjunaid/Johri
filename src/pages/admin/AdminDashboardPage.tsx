import { StatCard } from '@/components/admin/StatCard'
import { SimpleBarChart } from '@/components/admin/SimpleBarChart'
import { useDashboardStats, useRecentCoupons, useSpinsSeries } from '@/hooks/useAdminQueries'
import { formatDate } from '@/lib/date'

export function AdminDashboardPage() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats()
  const { data: series, isLoading: seriesLoading } = useSpinsSeries()
  const { data: recent, isLoading: recentLoading } = useRecentCoupons()

  return (
    <div className="animate-fade-up flex flex-col gap-[26px]">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-3.5">
        <StatCard label="Total spins" value={statsLoading ? '—' : (stats?.totalSpins ?? 0)} />
        <StatCard label="Coupons generated" value={statsLoading ? '—' : (stats?.couponsGenerated ?? 0)} />
        <StatCard label="Coupons redeemed" value={statsLoading ? '—' : (stats?.couponsRedeemed ?? 0)} color="#5c6b42" />
        <StatCard label="Pending coupons" value={statsLoading ? '—' : (stats?.couponsPending ?? 0)} color="#8a6d33" />
        <StatCard label="Active offers" value={statsLoading ? '—' : (stats?.activeOffers ?? 0)} color="#8a6d33" />
        <StatCard label="Today's spins" value={statsLoading ? '—' : (stats?.todaysSpins ?? 0)} />
      </div>

      <div className="border-mist rounded-[20px] border-[1.5px] bg-paper p-5">
        <div className="text-muted-3 mb-3 text-[11.5px] tracking-[.16em] uppercase">Spins — last 7 days</div>
        {seriesLoading ? (
          <div className="text-muted-2 py-8 text-center text-sm">Loading…</div>
        ) : (
          <SimpleBarChart data={series ?? []} />
        )}
      </div>

      <div className="border-mist overflow-hidden rounded-[20px] border-[1.5px] bg-paper">
        <div className="border-mist border-b px-[18px] py-3.5 text-sm font-bold text-ink">Recent customers</div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-[13.5px]">
            <thead>
              <tr className="text-muted-3 text-left text-[11px] tracking-[.14em] uppercase">
                <th className="px-[18px] py-3 font-semibold">Coupon</th>
                <th className="px-2.5 py-3 font-semibold">Guest</th>
                <th className="px-2.5 py-3 font-semibold">Mobile</th>
                <th className="px-2.5 py-3 font-semibold">Offer</th>
                <th className="px-[18px] py-3 font-semibold">Created</th>
              </tr>
            </thead>
            <tbody>
              {recentLoading && (
                <tr>
                  <td colSpan={5} className="text-muted-3 px-[18px] py-8 text-center">
                    Loading…
                  </td>
                </tr>
              )}
              {!recentLoading && (recent?.length ?? 0) === 0 && (
                <tr>
                  <td colSpan={5} className="text-muted-3 px-[18px] py-8 text-center">
                    No coupons yet — they will appear here as guests spin.
                  </td>
                </tr>
              )}
              {recent?.map((c) => (
                <tr key={c.id} className="border-mist border-t">
                  <td className="text-royal px-[18px] py-3 font-bold whitespace-nowrap">{c.couponNumber}</td>
                  <td className="px-2.5 py-3">{c.customerName}</td>
                  <td className="px-2.5 py-3 whitespace-nowrap">{c.mobile}</td>
                  <td className="px-2.5 py-3">{c.offerTitle}</td>
                  <td className="text-muted-2 px-[18px] py-3 whitespace-nowrap">{formatDate(c.created)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
