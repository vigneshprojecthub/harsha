import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'
import MobileNav from './MobileNav'

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-charcoal-900">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      {/* Footer only on desktop */}
      <div className="hidden md:block">
        <Footer />
      </div>
      {/* Bottom nav only on mobile/tablet */}
      <MobileNav />
    </div>
  )
}
