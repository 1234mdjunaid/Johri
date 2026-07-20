import { useQuery } from '@tanstack/react-query'
import { fetchActiveOffers } from '@/lib/api'

export function useOffers() {
  return useQuery({
    queryKey: ['offers', 'active'],
    queryFn: fetchActiveOffers,
    staleTime: 60_000,
  })
}
