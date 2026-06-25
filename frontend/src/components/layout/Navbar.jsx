import { useState, useEffect } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, ShoppingCart } from 'lucide-react'
import CartIcon from '../cart/CartIcon'
import CartDrawer from '../cart/CartDrawer'

const navLinks = [
  { to: '/',           label: 'Home',      end: true },
  { to: '/products',   label: 'Gallery'    },
  { to: '/ai-preview', label: 'AI Preview' },
  { to: '/my-orders',  label: 'My Orders'  },
  { to: '/track',      label: 'Track'      },
]

export default function Navbar() {
  const [scrolled,  setScrolled]  = useState(false)
  const [cartOpen,  setCartOpen]  = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-charcoal-900/95 backdrop-blur-md shadow-lg shadow-black/20' : 'bg-gradient-to-b from-black/60 to-transparent'
      }`}>
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gold-gradient flex items-center justify-center">
                <Sparkles size={15} className="text-white" />
              </div>
              <div>
                <div className="font-display text-base md:text-xl font-bold text-white leading-none">Harsha</div>
                <div className="font-accent text-[10px] text-gold-300 tracking-widest uppercase hidden sm:block">Art Gallery</div>
              </div>
            </Link>

            {/* Desktop nav links */}
            <div className="hidden md:flex items-center gap-6">
              {navLinks.map(link => (
                <NavLink key={link.to} to={link.to} end={link.end}
                  className={({ isActive }) =>
                    `font-body text-sm tracking-wider uppercase transition-colors duration-200 ${
                      isActive ? 'text-gold-400' : 'text-ivory-100/80 hover:text-gold-300'
                    }`
                  }>
                  {link.label}
                </NavLink>
              ))}
              <CartIcon onClick={() => setCartOpen(true)} />
              <Link to="/custom-order" className="btn-gold text-sm py-2.5 px-5">Order Now</Link>
            </div>

            {/* Mobile — just cart icon (bottom nav handles the rest) */}
            <div className="md:hidden flex items-center gap-2">
              <CartIcon onClick={() => setCartOpen(true)} />
            </div>
          </div>
        </nav>
      </header>
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  )
}
