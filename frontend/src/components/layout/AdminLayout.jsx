import { Outlet, NavLink, Link } from 'react-router-dom'
import { LayoutDashboard, Package, ShoppingBag, MapPin, BarChart3, Tag, ArrowLeft, Sparkles } from 'lucide-react'

const adminLinks = [
  { to: '/admin',                 label: 'Dashboard',        icon: LayoutDashboard, end: true },
  { to: '/admin/products',        label: 'Products',         icon: Package },
  { to: '/admin/orders',          label: 'Orders',           icon: ShoppingBag },
  { to: '/admin/tracking',        label: 'Tracking',         icon: MapPin },
  { to: '/admin/analytics',       label: 'Analytics',        icon: BarChart3 },
  { to: '/admin/coupons-reviews', label: 'Coupons & Reviews',icon: Tag },
]

export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-64 bg-charcoal-900 flex flex-col">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-full bg-gold-gradient flex items-center justify-center">
              <Sparkles size={14} className="text-white" />
            </div>
            <span className="font-display text-white font-bold text-lg">Harsha</span>
          </div>
          <div className="font-body text-xs text-gold-400 tracking-widest uppercase ml-10">Admin Panel</div>
        </div>
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
        <div className="p-4 border-t border-white/10">
          <Link to="/" className="flex items-center gap-2 text-xs text-ivory-300/50 hover:text-gold-400 transition-colors">
            <ArrowLeft size={13} />Back to Site
          </Link>
        </div>
      </aside>
      <main className="flex-1 overflow-auto"><Outlet /></main>
    </div>
  )
}
