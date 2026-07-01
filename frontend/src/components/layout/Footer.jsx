import { Link } from 'react-router-dom'
import { Phone, Mail, MapPin, Instagram, Facebook } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-charcoal-900 text-ivory-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <img src="/assets/logo-nav.png" alt="Harsha Art Gallery"
                className="w-11 h-11 rounded-full object-cover" />
              <div>
                <div className="font-display text-xl font-bold text-white">Harsha</div>
                <div className="font-accent text-xs text-gold-400 tracking-widest uppercase">Art Gallery</div>
              </div>
            </div>
            <p className="text-sm text-ivory-300/80 leading-relaxed mb-5">
              Premium handcrafted embroidery art, bringing generations of tradition to every stitch.
            </p>
            <div className="flex gap-3">
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer"
                className="w-9 h-9 rounded-full border border-gold-600/40 flex items-center justify-center hover:bg-gold-600/20 transition-colors">
                <Instagram size={15} className="text-gold-400" />
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer"
                className="w-9 h-9 rounded-full border border-gold-600/40 flex items-center justify-center hover:bg-gold-600/20 transition-colors">
                <Facebook size={15} className="text-gold-400" />
              </a>
            </div>
          </div>

          {/* Categories */}
          <div>
            <h4 className="font-display text-white font-semibold mb-5">Collections</h4>
            <ul className="space-y-2">
              {['Aari Work', 'Thread Embroidery', 'Bead Work', 'Sequence Work', 'Wedding Frames'].map(cat => (
                <li key={cat}>
                  <Link to={`/products?category=${cat.toLowerCase().replace(' ', '-')}`}
                    className="text-sm text-ivory-300/70 hover:text-gold-400 transition-colors">
                    {cat}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display text-white font-semibold mb-5">Quick Links</h4>
            <ul className="space-y-2">
              {[
                { to: '/', label: 'Home' },
                { to: '/products', label: 'Gallery' },
                { to: '/custom-order', label: 'Custom Order' },
                { to: '/admin', label: 'Admin Panel' },
              ].map(link => (
                <li key={link.to}>
                  <Link to={link.to} className="text-sm text-ivory-300/70 hover:text-gold-400 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display text-white font-semibold mb-5">Contact</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2.5">
                <Phone size={14} className="text-gold-400 mt-1 flex-shrink-0" />
                <span className="text-sm text-ivory-300/70">+91 98765 43210</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Mail size={14} className="text-gold-400 mt-1 flex-shrink-0" />
                <span className="text-sm text-ivory-300/70">harsha@artgallery.com</span>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin size={14} className="text-gold-400 mt-1 flex-shrink-0" />
                <span className="text-sm text-ivory-300/70">Chennai, Tamil Nadu, India</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-3">
          <p className="text-xs text-ivory-300/40">
            © {new Date().getFullYear()} Harsha Art Gallery. All rights reserved.
          </p>
          <p className="text-xs text-ivory-300/40">
            Crafted with <span className="text-gold-500">♥</span> for art lovers
          </p>
        </div>
      </div>
    </footer>
  )
}
