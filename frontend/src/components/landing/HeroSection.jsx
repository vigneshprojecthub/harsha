import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowRight, Sparkles, Wand2 } from 'lucide-react'

export default function HeroSection() {
  return (
    <section className="relative flex items-center overflow-hidden bg-charcoal-900
      pt-20 pb-8 md:pt-28 md:pb-12 min-h-[55vh] md:min-h-[60vh]">

      {/* Subtle fabric texture */}
      <div className="absolute inset-0 opacity-10"
        style={{ backgroundImage: `repeating-linear-gradient(45deg,transparent,transparent 2px,rgba(200,134,15,0.3) 2px,rgba(200,134,15,0.3) 4px)` }} />
      <div className="absolute inset-0 bg-gradient-to-r from-charcoal-900 via-charcoal-900/90 to-charcoal-900/50" />
      <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-charcoal-900 to-transparent" />

      {/* Decorative ring — desktop only */}
      <div className="absolute -right-20 top-0 bottom-0 hidden md:flex items-center">
        <div className="w-80 h-80 rounded-full border border-gold-500/20" />
        <div className="absolute w-60 h-60 rounded-full border border-gold-500/15 inset-10" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="flex items-center gap-2 mb-3">
          <div className="h-px w-8 bg-gold-500" />
          <span className="font-accent text-gold-400 italic text-sm tracking-wide">Handcrafted with love</span>
        </motion.div>

        <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-3">
          Where Thread<br />Becomes{' '}
          <span className="text-transparent bg-clip-text bg-gold-gradient">Art</span>
        </motion.h1>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}
          className="font-body text-ivory-200/60 text-sm md:text-base max-w-sm mb-6 leading-relaxed">
          Premium Aari work, bead & thread embroidery, and wedding frames. Every piece, your story.
        </motion.p>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="flex flex-row gap-3">
          <Link to="/products" className="btn-gold text-xs sm:text-sm py-2.5 px-4">
            Explore <ArrowRight size={14} />
          </Link>
          <Link to="/ai-preview" className="btn-outline-gold text-xs sm:text-sm py-2.5 px-4 border-gold-500/50 text-gold-300 hover:bg-gold-500/10">
            <Wand2 size={14} /> AI Preview
          </Link>
          <Link to="/custom-order" className="hidden sm:flex btn-outline-gold text-xs sm:text-sm py-2.5 px-4 border-ivory-300/30 text-ivory-300 hover:bg-white/5">
            Custom Order
          </Link>
        </motion.div>

        {/* Compact stats row */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
          className="flex gap-6 mt-8 pt-6 border-t border-white/10">
          {[['500+','Pieces'],['12+','Years'],['100%','Handmade']].map(([n,l]) => (
            <div key={l}>
              <div className="font-display text-lg font-bold text-gold-400">{n}</div>
              <div className="font-body text-[10px] text-ivory-300/40 tracking-wide uppercase">{l}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
