import { NavLink, Outlet } from 'react-router-dom'
import { useAdminAuth } from '@/hooks/useAdminAuth'

const tabs = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/offers', label: 'Offers', end: false },
  { to: '/admin/coupons', label: 'Coupons', end: false },
  { to: '/admin/settings', label: 'Settings', end: false },
]

export function AdminLayout() {
  const { logout } = useAdminAuth()

  return (
    <div className="min-h-screen bg-cream pb-16">
      <header className="border-mist bg-paper/88 sticky top-0 z-20 border-b backdrop-blur-md">
        <div className="mx-auto flex max-w-[1060px] flex-wrap items-center gap-3.5 px-[18px] py-3">
          <img src="/assets/johri-logo-lavender.png" alt="Johri" className="w-[30px]" />
          <div className="font-heading text-deep mr-auto text-[19px]">Johri admin</div>
          <nav className="flex gap-2">
            {tabs.map((tab) => (
              <NavLink
                key={tab.to}
                to={tab.to}
                end={tab.end}
                className={({ isActive }) =>
                  `h-[38px] cursor-pointer rounded-full border-[1.5px] px-[18px] text-[13.5px] font-bold flex items-center ${
                    isActive ? 'border-lavender bg-wisteria text-royal' : 'border-mist bg-transparent text-muted-2'
                  }`
                }
              >
                {tab.label}
              </NavLink>
            ))}
          </nav>
          <button
            onClick={logout}
            className="border-mist text-muted-2 hover:bg-wisteria hover:text-royal h-[38px] cursor-pointer rounded-full border-[1.5px] bg-transparent px-4 text-[13px]"
          >
            Log out
          </button>
        </div>
      </header>
      <div className="mx-auto max-w-[1060px] px-[18px] pt-[26px]">
        <Outlet />
      </div>
    </div>
  )
}
