import { pb } from '@/lib/pocketbase'
import type { CouponRecord, OfferRecord, SettingsRecord, SpinRecord } from '@/types'

export async function adminLogin(email: string, password: string) {
  return pb.collection('admins').authWithPassword(email, password)
}

export interface DashboardStats {
  totalSpins: number
  couponsGenerated: number
  couponsRedeemed: number
  couponsPending: number
  activeOffers: number
  todaysSpins: number
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const [coupons, offers, spins] = await Promise.all([
    pb.collection('coupons').getFullList<CouponRecord>({ sort: '-created', requestKey: 'admin-coupons-stats' }),
    pb.collection('offers').getFullList<OfferRecord>({ requestKey: 'admin-offers-stats' }),
    pb.collection('spins').getFullList<SpinRecord>({ sort: '-created', requestKey: 'admin-spins-stats' }),
  ])
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)
  const todaysSpins = spins.filter((s) => new Date(s.created) >= startOfToday).length
  return {
    totalSpins: spins.length,
    couponsGenerated: coupons.length,
    couponsRedeemed: coupons.filter((c) => c.redeemed).length,
    couponsPending: coupons.filter((c) => !c.redeemed).length,
    activeOffers: offers.filter((o) => o.active).length,
    todaysSpins,
  }
}

export interface SpinsByDay {
  label: string
  count: number
}

export async function fetchSpinsSeries(days = 7): Promise<SpinsByDay[]> {
  const spins = await pb.collection('spins').getFullList<SpinRecord>({ sort: '-created', requestKey: 'admin-spins-series' })
  const buckets: SpinsByDay[] = []
  for (let i = days - 1; i >= 0; i--) {
    const day = new Date()
    day.setHours(0, 0, 0, 0)
    day.setDate(day.getDate() - i)
    const next = new Date(day)
    next.setDate(next.getDate() + 1)
    const count = spins.filter((s) => {
      const t = new Date(s.created)
      return t >= day && t < next
    }).length
    buckets.push({ label: day.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }), count })
  }
  return buckets
}

export async function fetchRecentCoupons(limit = 8): Promise<CouponRecord[]> {
  return pb.collection('coupons').getList<CouponRecord>(1, limit, { sort: '-created' }).then((r) => r.items)
}

export async function fetchCoupons(params: { search?: string; status?: 'all' | 'redeemed' | 'pending' }): Promise<CouponRecord[]> {
  const filters: string[] = []
  if (params.status === 'redeemed') filters.push('redeemed = true')
  if (params.status === 'pending') filters.push('redeemed = false')
  if (params.search) {
    const q = params.search.replace(/"/g, '\\"')
    filters.push(`(couponNumber ~ "${q}" || mobile ~ "${q}" || customerName ~ "${q}")`)
  }
  return pb.collection('coupons').getFullList<CouponRecord>({
    sort: '-created',
    filter: filters.join(' && '),
  })
}

export async function setCouponRedeemed(id: string, redeemed: boolean): Promise<CouponRecord> {
  return pb.collection('coupons').update<CouponRecord>(id, { redeemed })
}

export async function fetchAllOffers(): Promise<OfferRecord[]> {
  return pb.collection('offers').getFullList<OfferRecord>({ sort: 'created' })
}

export async function createOffer(data: Partial<OfferRecord>): Promise<OfferRecord> {
  return pb.collection('offers').create<OfferRecord>(data)
}

export async function updateOffer(id: string, data: Partial<OfferRecord>): Promise<OfferRecord> {
  return pb.collection('offers').update<OfferRecord>(id, data)
}

export async function deleteOffer(id: string): Promise<void> {
  await pb.collection('offers').delete(id)
}

export async function fetchAdminSettings(): Promise<SettingsRecord | null> {
  try {
    return await pb.collection('settings').getFirstListItem<SettingsRecord>('')
  } catch {
    return null
  }
}

export async function saveSettings(id: string | null, data: Partial<SettingsRecord> | FormData): Promise<SettingsRecord> {
  if (id) return pb.collection('settings').update<SettingsRecord>(id, data)
  return pb.collection('settings').create<SettingsRecord>(data)
}

const FORMULA_LEADERS = ['=', '+', '-', '@', '\t', '\r']

export function toCSV(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return ''
  const headers = Object.keys(rows[0])
  const escape = (v: unknown) => {
    let str = String(v ?? '')
    // Neutralize CSV/formula injection (a customer name like "=cmd(...)" opened in Excel).
    if (FORMULA_LEADERS.includes(str[0])) str = `'${str}`
    return `"${str.replace(/"/g, '""')}"`
  }
  const lines = [headers.join(','), ...rows.map((r) => headers.map((h) => escape(r[h])).join(','))]
  return lines.join('\n')
}

export function downloadCSV(filename: string, rows: Record<string, unknown>[]) {
  const csv = toCSV(rows)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
