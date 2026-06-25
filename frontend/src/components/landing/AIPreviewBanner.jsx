import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Wand2, ArrowRight } from 'lucide-react'

export default function AIPreviewBanner() {
  return (
    <section className="px-4 sm:px-6 lg:px-8 py-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-900/80 via-charcoal-800 to-gold-900/60
          border border-gold-600/20 p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gold-gradient flex items-center justify-center flex-shrink-0">
          <Wand2 size={22} className="text-white" />
        </div>
        <div className="flex-1">
          <div className="font-display text-white font-bold text-base sm:text-lg mb-1">
            AI Embroidery Preview ✨
          </div>
          <p className="font-body text-ivory-300/60 text-xs sm:text-sm leading-relaxed">
            Upload your garment photo, choose a style, and see your embroidery design before ordering.
          </p>
        </div>
        <Link to="/ai-preview"
          className="flex-shrink-0 flex items-center gap-2 bg-gold-gradient text-white
            font-body font-semibold text-xs sm:text-sm px-4 py-2.5 rounded-xl hover:opacity-90 transition-opacity whitespace-nowrap">
          Try Free <ArrowRight size={14} />
        </Link>
      </motion.div>
    </section>
  )
}
