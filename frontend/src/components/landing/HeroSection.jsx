import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowRight, Sparkles } from 'lucide-react'

const floatVariants = {
  animate: {
    y: [-8, 8, -8],
    transition: { duration: 5, repeat: Infinity, ease: 'easeInOut' }
  }
}

const ornamentVariants = {
  animate: {
    rotate: [0, 360],
    transition: { duration: 30, repeat: Infinity, ease: 'linear' }
  }
}

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-charcoal-900">
      {/* Background fabric texture overlay */}
      <div className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `repeating-linear-gradient(
            45deg,
            transparent,
            transparent 2px,
            rgba(200,134,15,0.3) 2px,
            rgba(200,134,15,0.3) 4px
          )`
        }}
      />

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-r from-charcoal-900 via-charcoal-900/90 to-charcoal-900/40" />
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-charcoal-900 to-transparent" />

      {/* Decorative circles */}
      <div className="absolute top-20 right-20 w-96 h-96 rounded-full border border-gold-500/20 opacity-50" />
      <div className="absolute top-32 right-32 w-72 h-72 rounded-full border border-gold-500/15 opacity-40" />
      <div className="absolute top-44 right-44 w-48 h-48 rounded-full border border-gold-500/10 opacity-30" />

      {/* Floating ornament */}
      <motion.div
        variants={ornamentVariants}
        animate="animate"
        className="absolute top-16 right-40 w-24 h-24 opacity-20"
      >
        <svg viewBox="0 0 100 100" className="text-gold-400 fill-current">
          <path d="M50 5 L61 35 L93 35 L68 57 L79 91 L50 70 L21 91 L32 57 L7 35 L39 35 Z" />
        </svg>
      </motion.div>

      {/* Main content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 grid lg:grid-cols-2 gap-16 items-center">
        {/* Left: Text */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-2 mb-6"
          >
            <div className="h-px w-10 bg-gold-500" />
            <span className="font-accent text-gold-400 italic text-lg tracking-wide">
              Handcrafted with love
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="font-display text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6"
          >
            Where Thread
            <br />
            Becomes{' '}
            <span className="text-transparent bg-clip-text bg-gold-gradient">
              Art
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="font-body text-ivory-200/70 text-lg leading-relaxed max-w-md mb-10"
          >
            Premium handcrafted embroidery — Aari work, thread embroidery, bead work,
            and wedding frames. Each piece tells your unique story.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Link to="/products" className="btn-gold text-sm tracking-widest uppercase">
              Explore Gallery
              <ArrowRight size={16} />
            </Link>
            <Link to="/custom-order" className="btn-outline-gold text-sm tracking-widest uppercase border-ivory-300/40 text-ivory-200 hover:bg-ivory-200/10 hover:text-white">
              Custom Order
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="flex gap-10 mt-14 pt-10 border-t border-white/10"
          >
            {[
              { num: '500+', label: 'Pieces Crafted' },
              { num: '12+', label: 'Years Experience' },
              { num: '100%', label: 'Handmade' },
            ].map(stat => (
              <div key={stat.label}>
                <div className="font-display text-2xl font-bold text-gold-400">{stat.num}</div>
                <div className="font-body text-xs text-ivory-300/50 tracking-wide mt-0.5">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Right: Visual */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="hidden lg:flex justify-center items-center"
        >
          <motion.div
            variants={floatVariants}
            animate="animate"
            className="relative w-96 h-96"
          >
            {/* Mandala-style decorative artwork placeholder */}
            <div className="absolute inset-0 rounded-full border-2 border-gold-500/30" />
            <div className="absolute inset-4 rounded-full border border-gold-500/20" />
            <div className="absolute inset-8 rounded-full border border-gold-500/15 bg-gold-600/5" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <Sparkles size={48} className="text-gold-400 mx-auto mb-3 opacity-60" />
                <div className="font-display text-4xl font-bold text-gold-400/40">HA</div>
                <div className="font-accent text-xs text-gold-400/30 tracking-[0.3em] uppercase mt-1">Harsha Art</div>
              </div>
            </div>
            {/* Dots */}
            {[0, 60, 120, 180, 240, 300].map((deg) => (
              <div
                key={deg}
                className="absolute w-2 h-2 rounded-full bg-gold-500"
                style={{
                  top: `${50 - 47 * Math.cos((deg * Math.PI) / 180)}%`,
                  left: `${50 + 47 * Math.sin((deg * Math.PI) / 180)}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              />
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <span className="font-body text-xs text-ivory-300/40 tracking-widest uppercase">Scroll</span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-px h-10 bg-gradient-to-b from-gold-500 to-transparent"
        />
      </motion.div>
    </section>
  )
}
