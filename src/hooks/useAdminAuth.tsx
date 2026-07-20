import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { pb } from '@/lib/pocketbase'

interface AdminAuthContextValue {
  isAuthed: boolean
  adminName: string
  logout: () => void
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null)

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [isAuthed, setIsAuthed] = useState(pb.authStore.isValid)
  const [adminName, setAdminName] = useState(String(pb.authStore.record?.name ?? pb.authStore.record?.email ?? ''))

  useEffect(() => {
    const unsubscribe = pb.authStore.onChange(() => {
      setIsAuthed(pb.authStore.isValid)
      setAdminName(String(pb.authStore.record?.name ?? pb.authStore.record?.email ?? ''))
    })
    return unsubscribe
  }, [])

  const logout = () => {
    pb.authStore.clear()
  }

  return <AdminAuthContext.Provider value={{ isAuthed, adminName, logout }}>{children}</AdminAuthContext.Provider>
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext)
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider')
  return ctx
}
