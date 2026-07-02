import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowRight, Wand2 } from 'lucide-react'

// Coin flip animation — 3D Y-axis rotation giving a realistic coin spin
function SpinningLogo() {
  return (
    <div className="relative flex items-center justify-center select-none">
      {/* Outer glow rings — pulse in sync */}
      <motion.div
        animate={{ scale: [1, 1.08, 1], opacity: [0.15, 0.35, 0.15] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute w-72 h-72 md:w-80 md:h-80 rounded-full
          border border-gold-500/30 pointer-events-none"
      />
      <motion.div
        animate={{ scale: [1, 1.16, 1], opacity: [0.08, 0.2, 0.08] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
        className="absolute w-80 h-80 md:w-96 md:h-96 rounded-full
          border border-gold-400/15 pointer-events-none"
      />

      {/* Coin shadow on the "floor" */}
      <motion.div
        animate={{ scaleX: [0.7, 1, 0.7], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-0 w-44 h-5 rounded-full
          bg-gradient-radial from-gold-500/20 to-transparent blur-sm pointer-events-none"
      />

      {/* The spinning coin itself */}
      <motion.div
        animate={{ rotateY: [0, 360] }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'linear',
        }}
        style={{ transformStyle: 'preserve-3d', perspective: 800 }}
        className="relative w-52 h-52 md:w-64 md:h-64"
      >
        {/* Front face — the logo */}
        <img
          src="/assets/logo-transparent.png"
          alt="Harsha Art Gallery"
          style={{ backfaceVisibility: 'hidden' }}
          className="w-full h-full rounded-full object-cover
            drop-shadow-[0_8px_24px_rgba(200,134,15,0.45)]"
        />

        {/* Back face — mirror of the logo (slightly darker tint for coin depth) */}
        <img
          src="/assets/logo-transparent.png"
          alt=""
          aria-hidden="true"
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            position: 'absolute',
            inset: 0,
          }}
          className="w-full h-full rounded-full object-cover
            drop-shadow-[0_8px_24px_rgba(200,134,15,0.45)]
            brightness-75 sepia-[0.3]"
        />
      </motion.div>

      {/* Gold shimmer line sweeping across the coin */}
      <motion.div
        animate={{ x: [-120, 120], opacity: [0, 0.6, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute w-8 h-full rounded-full
          bg-gradient-to-b from-transparent via-gold-300/40 to-transparent
          blur-sm pointer-events-none"
        style={{ mixBlendMode: 'screen' }}
      />
    </div>
  )
}

export default function HeroSection() {
  return (
    <section className="relative flex items-center overflow-hidden bg-charcoal-900
      pt-20 pb-6 md:pt-24 md:pb-8">

      {/* Subtle fabric texture */}
      <div className="absolute inset-0 opacity-10"
        style={{ backgroundImage: `repeating-linear-gradient(45deg,transparent,transparent 2px,rgba(200,134,15,0.3) 2px,rgba(200,134,15,0.3) 4px)` }} />
      {/* Gradient — stronger on left so text stays readable */}
      <div className="absolute inset-0 bg-gradient-to-r from-charcoal-900 via-charcoal-900/85 to-charcoal-900/20" />
      <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-charcoal-900 to-transparent" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex items-center justify-between gap-8">

          {/* ── Left: Text content ─────────────────────────────────────── */}
          <div className="flex-1 max-w-lg">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex items-center gap-2 mb-3">
              <div className="h-px w-8 bg-gold-500" />
              <span className="font-accent text-gold-400 italic text-sm tracking-wide">
                Handcrafted with love
              </span>
            </motion.div>

            <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-3">
              Where Thread<br />Becomes{' '}
              <span className="text-transparent bg-clip-text bg-gold-gradient">Art</span>
            </motion.h1>

            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
              className="font-body text-ivory-200/60 text-sm md:text-base max-w-sm mb-6 leading-relaxed">
              Premium Aari work, bead &amp; thread embroidery, and wedding frames.
              Every piece, your story.
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-row gap-3">
              <Link to="/products" className="btn-gold text-xs sm:text-sm py-2.5 px-4">
                Explore <ArrowRight size={14} />
              </Link>
              <Link to="/ai-preview"
                className="btn-outline-gold text-xs sm:text-sm py-2.5 px-4 border-gold-500/50 text-gold-300 hover:bg-gold-500/10">
                <Wand2 size={14} /> AI Preview
              </Link>
              <Link to="/custom-order"
                className="hidden sm:flex btn-outline-gold text-xs sm:text-sm py-2.5 px-4 border-ivory-300/30 text-ivory-300 hover:bg-white/5">
                Custom Order
              </Link>
            </motion.div>

            {/* Stats row */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="flex gap-6 mt-5 pt-5 border-t border-white/10">
              {[['500+','Pieces'],['12+','Years'],['100%','Handmade']].map(([n,l]) => (
                <div key={l}>
                  <div className="font-display text-lg font-bold text-gold-400">{n}</div>
                  <div className="font-body text-[10px] text-ivory-300/40 tracking-wide uppercase">{l}</div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* ── Right: Spinning coin logo ──────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.7, ease: 'easeOut' }}
            className="hidden md:flex flex-shrink-0 items-center justify-center"
          >
            <SpinningLogo />
          </motion.div>

        </div>
      </div>
    </section>
  )
}
