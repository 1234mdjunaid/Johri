import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createOffer,
  deleteCouponAndCustomer,
  deleteOffer,
  fetchAdminSettings,
  fetchAllOffers,
  fetchCoupons,
  fetchDashboardStats,
  fetchRecentCoupons,
  fetchSpinsSeries,
  resetCampaignData,
  saveSettings,
  setCouponRedeemed,
  updateOffer,
} from '@/lib/adminApi'
import type { CouponRecord, OfferRecord, SettingsRecord } from '@/types'

export function useDashboardStats() {
  return useQuery({ queryKey: ['admin', 'stats'], queryFn: fetchDashboardStats, staleTime: 15_000 })
}

export function useSpinsSeries() {
  return useQuery({ queryKey: ['admin', 'spins-series'], queryFn: () => fetchSpinsSeries(7), staleTime: 30_000 })
}

export function useRecentCoupons() {
  return useQuery({ queryKey: ['admin', 'coupons', 'recent'], queryFn: () => fetchRecentCoupons(8), staleTime: 15_000 })
}

export function useCouponsList(search: string, status: 'all' | 'redeemed' | 'pending') {
  return useQuery({
    queryKey: ['admin', 'coupons', 'list', search, status],
    queryFn: () => fetchCoupons({ search, status }),
    staleTime: 10_000,
  })
}

export function useToggleCouponRedeemed() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, redeemed }: { id: string; redeemed: boolean }) => setCouponRedeemed(id, redeemed),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin'] })
    },
  })
}

export function useDeleteCoupon() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (coupon: CouponRecord) => deleteCouponAndCustomer(coupon),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin'] })
    },
  })
}

export function useResetCampaignData() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => resetCampaignData(),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin'] })
    },
  })
}

export function useAllOffers() {
  return useQuery({ queryKey: ['admin', 'offers'], queryFn: fetchAllOffers, staleTime: 10_000 })
}

export function useOfferMutations() {
  const qc = useQueryClient()
  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ['admin', 'offers'] })
    void qc.invalidateQueries({ queryKey: ['offers'] })
    void qc.invalidateQueries({ queryKey: ['admin', 'stats'] })
  }
  const create = useMutation({
    mutationFn: (data: Partial<OfferRecord>) => createOffer(data),
    onSuccess: invalidate,
  })
  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<OfferRecord> }) => updateOffer(id, data),
    onSuccess: invalidate,
  })
  const remove = useMutation({
    mutationFn: (id: string) => deleteOffer(id),
    onSuccess: invalidate,
  })
  return { create, update, remove }
}

export function useAdminSettings() {
  return useQuery({ queryKey: ['admin', 'settings'], queryFn: fetchAdminSettings, staleTime: 10_000 })
}

export function useSaveSettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string | null; data: Partial<SettingsRecord> | FormData }) => saveSettings(id, data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'settings'] })
      void qc.invalidateQueries({ queryKey: ['settings'] })
    },
  })
}
