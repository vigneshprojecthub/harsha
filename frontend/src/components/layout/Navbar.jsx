import { useState, useEffect } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, Sparkles } from 'lucide-react'
import CartIcon from '../cart/CartIcon'
import CartDrawer from '../cart/CartDrawer'

const navLinks = [
  { to: '/',           label: 'Home' },
  { to: '/products',   label: 'Gallery' },
  { to: '/ai-preview', label: 'AI Preview' },
  { to: '/my-orders',  label: 'My Orders' },
  { to: '/track',      label: 'Track Order' },
]

export default function Navbar() {
  const [scrolled,  setScrolled]  = useState(false)
  const [menuOpen,  setMenuOpen]  = useState(false)
  const [cartOpen,  setCartOpen]  = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? 'bg-charcoal-800/95 backdrop-blur-md shadow-lg' : 'bg-transparent'
      }`}>
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-gold-gradient flex items-center justify-center">
                <Sparkles size={18} className="text-white" />
              </div>
              <div>
                <div className="font-display text-xl font-bold text-white leading-none">Harsha</div>
                <div className="font-accent text-xs text-gold-300 tracking-widest uppercase">Art Gallery</div>
              </div>
            </Link>

            <div className="hidden md:flex items-center gap-6">
              {navLinks.map(link => (
                <NavLink key={link.to} to={link.to} end={link.to === '/'}
                  className={({ isActive }) =>
                    `font-body text-sm tracking-wider uppercase transition-colors duration-200 ${
                      isActive ? 'text-gold-400' : 'text-ivory-100 hover:text-gold-300'
                    }`
                  }>
                  {link.label}
                </NavLink>
              ))}
              <CartIcon onClick={() => setCartOpen(true)} />
              <Link to="/custom-order" className="btn-gold text-sm py-2.5 px-5">Order Now</Link>
            </div>

            <div className="md:hidden flex items-center gap-3">
              <CartIcon onClick={() => setCartOpen(true)} />
              <button className="text-white p-2" onClick={() => setMenuOpen(!menuOpen)}>
                {menuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </nav>

        <AnimatePresence>
          {menuOpen && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-charcoal-900/98 backdrop-blur-md border-t border-gold-600/20">
              <div className="px-6 py-6 flex flex-col gap-4">
                {navLinks.map(link => (
                  <NavLink key={link.to} to={link.to} end={link.to === '/'} onClick={() => setMenuOpen(false)}
                    className={({ isActive }) =>
                      `font-body text-base tracking-wide py-2 border-b border-white/5 ${isActive ? 'text-gold-400' : 'text-ivory-200'}`
                    }>
                    {link.label}
                  </NavLink>
                ))}
                <Link to="/custom-order" onClick={() => setMenuOpen(false)} className="btn-gold mt-2 text-center justify-center">
                  Place Custom Order
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  )
}
