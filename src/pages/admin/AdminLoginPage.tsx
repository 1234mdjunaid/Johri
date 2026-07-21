import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { ClientResponseError } from 'pocketbase'
import { adminLogin } from '@/lib/adminApi'
import { useAdminAuth } from '@/hooks/useAdminAuth'

function describeLoginError(err: unknown): string {
  if (err instanceof ClientResponseError) {
    if (err.status === 0) {
      return "Can't reach the server — check VITE_POCKETBASE_URL is set correctly and the backend is running."
    }
    if (err.status === 400) {
      return 'Incorrect email or password.'
    }
    return `Login failed (HTTP ${err.status}). ${err.message || 'Please try again.'}`
  }
  return "Can't reach the server — this usually means the backend URL is wrong, unreachable, or blocked by CORS."
}

export function AdminLoginPage() {
  const { isAuthed } = useAdminAuth()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (isAuthed) {
    const from = (location.state as { from?: string } | null)?.from ?? '/admin'
    return <Navigate to={from} replace />
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await adminLogin(email.trim(), password)
    } catch (err) {
      setError(describeLoginError(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4 py-6"
      style={{ background: 'radial-gradient(120% 90% at 50% 0%, #fffdf8 0%, #faf7f0 45%, #f1eaf8 100%)' }}
    >
      <div className="animate-fade-up border-mist w-full max-w-[380px] rounded-3xl border-[1.5px] bg-paper px-7 py-9 text-center shadow-[0_20px_50px_rgba(74,58,115,.16)]">
        <img src="/assets/johri-logo-lavender.png" alt="Johri" className="mx-auto w-[52px]" />
        <h2 className="font-heading text-deep mt-3.5 mb-1 text-[26px] font-normal">Admin access</h2>
        <p className="text-muted-2 mb-6 text-[13.5px]">Johri Jewellers campaign console</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Admin email"
            autoComplete="username"
            required
            className="border-pale focus:border-lavender focus:ring-lavender/20 h-[52px] w-full rounded-full border-[1.5px] bg-cream px-[18px] text-center text-base transition-[border-color,box-shadow] focus:ring-4 focus:outline-none"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoComplete="current-password"
            required
            className="border-pale focus:border-lavender focus:ring-lavender/20 h-[52px] w-full rounded-full border-[1.5px] bg-cream px-[18px] text-center text-base tracking-[.2em] transition-[border-color,box-shadow] focus:ring-4 focus:outline-none"
          />

          {error && <div className="text-error text-[13px]">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="mt-1.5 h-[52px] w-full cursor-pointer rounded-full text-[15px] font-bold text-paper shadow-[0_10px_26px_rgba(95,77,140,.3)] disabled:opacity-70"
            style={{ background: 'linear-gradient(135deg,#8a76b8,#5f4d8c)' }}
          >
            {loading ? 'Signing in…' : 'Enter console'}
          </button>
        </form>

        <Link to="/" className="mt-[18px] inline-block text-[12.5px]">
          ← Back to spin wheel
        </Link>
      </div>
    </div>
  )
}
