import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { MessageCircle, ArrowRight } from 'lucide-react'

export default function CTABanner() {
  return (
    <section className="py-24 bg-gold-gradient relative overflow-hidden">
      <div className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `repeating-linear-gradient(
            -45deg,
            transparent,
            transparent 8px,
            rgba(255,255,255,.2) 8px,
            rgba(255,255,255,.2) 16px
          )`
        }}
      />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-4">
            Ready to Create Something Beautiful?
          </h2>
          <p className="font-body text-white/80 text-lg leading-relaxed mb-10 max-w-xl mx-auto">
            Tell us your vision and we'll bring it to life. Every stitch crafted with passion and precision.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/custom-order"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-gold-700 font-body font-semibold tracking-wide rounded-sm hover:bg-ivory-50 transition-colors shadow-lg"
            >
              Place Custom Order
              <ArrowRight size={16} />
            </Link>
            <a
              href="https://wa.me/919876543210"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-3.5 border-2 border-white text-white font-body font-semibold tracking-wide rounded-sm hover:bg-white/10 transition-colors"
            >
              <MessageCircle size={16} />
              Chat on WhatsApp
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
