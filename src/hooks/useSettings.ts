import { useQuery } from '@tanstack/react-query'
import { fetchSettings } from '@/lib/api'

export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: fetchSettings,
    staleTime: 60_000,
  })
}
