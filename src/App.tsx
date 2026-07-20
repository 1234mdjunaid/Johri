import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { queryClient } from '@/lib/queryClient'
import { AdminAuthProvider } from '@/hooks/useAdminAuth'
import { ProtectedRoute } from '@/routes/ProtectedRoute'
import { CampaignPage } from '@/pages/CampaignPage'

// The admin console is a separate bundle — guests spinning the wheel never pay for it.
const AdminLoginPage = lazy(() => import('@/pages/admin/AdminLoginPage').then((m) => ({ default: m.AdminLoginPage })))
const AdminLayout = lazy(() => import('@/pages/admin/AdminLayout').then((m) => ({ default: m.AdminLayout })))
const AdminDashboardPage = lazy(() =>
  import('@/pages/admin/AdminDashboardPage').then((m) => ({ default: m.AdminDashboardPage })),
)
const AdminOffersPage = lazy(() => import('@/pages/admin/AdminOffersPage').then((m) => ({ default: m.AdminOffersPage })))
const AdminCouponsPage = lazy(() =>
  import('@/pages/admin/AdminCouponsPage').then((m) => ({ default: m.AdminCouponsPage })),
)
const AdminSettingsPage = lazy(() =>
  import('@/pages/admin/AdminSettingsPage').then((m) => ({ default: m.AdminSettingsPage })),
)

function AdminFallback() {
  return <div className="flex min-h-screen items-center justify-center text-sm text-muted-2">Loading console…</div>
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AdminAuthProvider>
        <BrowserRouter>
          <Suspense fallback={<AdminFallback />}>
            <Routes>
              <Route path="/" element={<CampaignPage />} />
              <Route path="/admin/login" element={<AdminLoginPage />} />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<AdminDashboardPage />} />
                <Route path="offers" element={<AdminOffersPage />} />
                <Route path="coupons" element={<AdminCouponsPage />} />
                <Route path="settings" element={<AdminSettingsPage />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: '#fffdf9',
              color: '#2e2838',
              border: '1.5px solid #e6ddf4',
              borderRadius: '999px',
              fontSize: '14px',
            },
          }}
        />
      </AdminAuthProvider>
    </QueryClientProvider>
  )
}
