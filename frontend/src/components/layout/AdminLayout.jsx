import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Package, ShoppingBag, MapPin, BarChart3, Tag, ArrowLeft, Sparkles, LogOut, User } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const adminLinks = [
  { to: '/admin',                 label: 'Dashboard',         icon: LayoutDashboard, end: true },
  { to: '/admin/products',        label: 'Products',          icon: Package },
  { to: '/admin/orders',          label: 'Orders',            icon: ShoppingBag },
  { to: '/admin/tracking',        label: 'Tracking',          icon: MapPin },
  { to: '/admin/analytics',       label: 'Analytics',         icon: BarChart3 },
  { to: '/admin/coupons-reviews', label: 'Coupons & Reviews', icon: Tag },
]

export default function AdminLayout() {
  const { admin, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/admin/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-charcoal-900 flex flex-col flex-shrink-0">
        {/* Logo */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-full bg-gold-gradient flex items-center justify-center">
              <Sparkles size={14} className="text-white" />
            </div>
            <span className="font-display text-white font-bold text-lg">Harsha</span>
          </div>
          <div className="font-body text-xs text-gold-400 tracking-widest uppercase ml-10">Admin Panel</div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 p-4 space-y-1">
          {adminLinks.map(link => (
            <NavLink key={link.to} to={link.to} end={link.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-body transition-all duration-200 ${
                  isActive
                    ? 'bg-gold-600/20 text-gold-400 border border-gold-600/30'
                    : 'text-ivory-300/70 hover:bg-white/5 hover:text-white'
                }`
              }>
              <link.icon size={17} />
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* Bottom — user + logout */}
        <div className="p-4 border-t border-white/10 space-y-2">
          {/* Logged in as */}
          <div className="flex items-center gap-2 px-2 py-1.5">
            <div className="w-7 h-7 rounded-full bg-gold-gradient flex items-center justify-center flex-shrink-0">
              <User size={13} className="text-white" />
            </div>
            <div>
              <div className="font-body text-xs text-white font-semibold">{admin?.username}</div>
              <div className="font-body text-[10px] text-ivory-300/30">Administrator</div>
            </div>
          </div>

          <button onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-2.5 rounded-lg font-body text-sm
              text-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200">
            <LogOut size={15} />
            Sign Out
          </button>

          <Link to="/" className="flex items-center gap-2 px-4 py-2 text-xs text-ivory-300/30 hover:text-gold-400 transition-colors font-body">
            <ArrowLeft size={13} />Back to Site
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
