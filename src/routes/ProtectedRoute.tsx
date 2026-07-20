import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAdminAuth } from '@/hooks/useAdminAuth'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthed } = useAdminAuth()
  const location = useLocation()

  if (!isAuthed) {
    return <Navigate to="/admin/login" state={{ from: location.pathname }} replace />
  }

  return <>{children}</>
}
