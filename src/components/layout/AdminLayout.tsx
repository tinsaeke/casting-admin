import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAdminAuth } from '@/contexts/AuthContext'
import {
  FiGrid, FiUsers, FiFilm, FiFolder, FiUser, FiBriefcase,
  FiVideo, FiBookmark, FiMapPin, FiShield, FiLogOut,
  FiMenu, FiX, FiChevronRight, FiCheckCircle, FiPackage, FiCreditCard,
  FiSliders, FiArrowDownCircle, FiUserCheck, FiCpu,
} from 'react-icons/fi'

const NAV = [
  { path: '/',                label: 'Dashboard',         icon: FiGrid },
  { path: '/users',           label: 'Users',             icon: FiUsers },
  { path: '/role-requests',   label: 'Role Requests',     icon: FiUserCheck },
  { path: '/cast-calls',      label: 'Cast Calls',        icon: FiFilm },
  { path: '/productions',     label: 'Productions',       icon: FiFolder },
  { path: '/talents',         label: 'Talents',           icon: FiUser },
  { path: '/agencies',        label: 'Agencies',          icon: FiBriefcase },
  { path: '/companies',       label: 'Companies',         icon: FiCheckCircle },
  { path: '/auditions',       label: 'Auditions',         icon: FiVideo },
  { path: '/bookings',        label: 'Bookings',          icon: FiBookmark },
  { path: '/avatar-licenses', label: 'Avatar Licenses',   icon: FiCpu },
  { path: '/replica-kyc',     label: 'Replica KYC',       icon: FiShield },
  { path: '/locations',       label: 'Locations',         icon: FiMapPin },
  { path: '/trust',           label: 'Trust & Reports',   icon: FiShield },
  { path: '/sub-plans',       label: 'Sub Plans',         icon: FiPackage },
  { path: '/sub-users',       label: 'Subscriptions',     icon: FiCreditCard },
  { path: '/platform-fees',   label: 'Platform Fees',     icon: FiSliders },
  { path: '/withdrawals',     label: 'Withdrawals',       icon: FiArrowDownCircle },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAdminAuth()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Sidebar */}
      <aside className={`${collapsed ? 'w-16' : 'w-56'} bg-gray-900 text-white flex flex-col transition-all duration-200 shrink-0`}>
        {/* Logo */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
          {!collapsed && (
            <div>
              <p className="text-xs font-black text-orange-400 uppercase tracking-widest">Besew</p>
              <p className="text-[10px] text-gray-400 font-bold">Admin Panel</p>
            </div>
          )}
          <button onClick={() => setCollapsed(c => !c)}
            className="p-1.5 rounded-lg hover:bg-white/10 transition shrink-0">
            {collapsed ? <FiMenu className="w-4 h-4" /> : <FiX className="w-4 h-4" />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 space-y-0.5 overflow-y-auto">
          {NAV.map(({ path, label, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              end={path === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-orange-500/20 text-orange-400 border-r-2 border-orange-400'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              {!collapsed && <span>{label}</span>}
              {!collapsed && <FiChevronRight className="w-3 h-3 ml-auto opacity-30" />}
            </NavLink>
          ))}
        </nav>

        {/* User + Logout */}
        <div className="border-t border-white/10 p-3 space-y-1">
          {!collapsed && (
            <div className="px-1 mb-2">
              <p className="text-xs font-bold text-white truncate">{user?.name || 'Admin'}</p>
              <p className="text-[10px] text-gray-500 truncate">{user?.email || user?.party_id}</p>
            </div>
          )}
          <button onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 rounded-lg transition font-bold">
            <FiLogOut className="w-4 h-4 shrink-0" />
            {!collapsed && 'Logout'}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-h-screen overflow-auto">
        {children}
      </main>
    </div>
  )
}
