import { NavLink } from 'react-router-dom'
import { Home, Grid, Wand2, ShoppingBag, User } from 'lucide-react'
import { useCart } from '../../context/CartContext'

const tabs = [
  { to: '/',           icon: Home,      label: 'Home',    end: true },
  { to: '/products',   icon: Grid,      label: 'Gallery'  },
  { to: '/ai-preview', icon: Wand2,     label: 'AI'       },
  { to: '/my-orders',  icon: ShoppingBag, label: 'Orders' },
  { to: '/track',      icon: User,      label: 'Track'    },
]

export default function MobileNav() {
  const { itemCount } = useCart()

  return (
    // Only visible on mobile/tablet (hidden on md+)
    <nav className="fixed bottom-0 inset-x-0 z-50 md:hidden
      bg-charcoal-900/95 backdrop-blur-md border-t border-white/10
      safe-area-pb">
      <div className="flex items-center justify-around h-16 px-2">
        {tabs.map(tab => (
          <NavLink key={tab.to} to={tab.to} end={tab.end}
            className={({ isActive }) =>
              `relative flex flex-col items-center justify-center gap-0.5 flex-1 h-full
              transition-colors duration-200 ${isActive ? 'text-gold-400' : 'text-ivory-300/40 hover:text-ivory-300/70'}`
            }>
            {({ isActive }) => (
              <>
                {/* Active pill indicator */}
                {isActive && (
                  <span className="absolute top-2 w-6 h-0.5 rounded-full bg-gold-500" />
                )}
                <tab.icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
                <span className="font-body text-[10px] font-medium tracking-wide">{tab.label}</span>
                {/* Cart badge on Orders tab */}
                {tab.to === '/my-orders' && itemCount > 0 && (
                  <span className="absolute top-2.5 right-3 w-4 h-4 bg-gold-500 rounded-full
                    flex items-center justify-center text-[9px] font-bold text-white">
                    {itemCount > 9 ? '9+' : itemCount}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
