import { motion } from 'framer-motion'

/**
 * LoadingScreen — shown as app initial splash while React loads.
 * The logo pulses with a golden glow ring animation.
 */
export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-[9999] bg-charcoal-900 flex flex-col items-center justify-center">
      {/* Pulsing glow ring behind logo */}
      <div className="relative flex items-center justify-center mb-8">
        {/* Outer pulse ring */}
        <motion.div
          animate={{ scale: [1, 1.25, 1], opacity: [0.3, 0, 0.3] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute w-40 h-40 rounded-full border-2 border-gold-500/50"
        />
        {/* Inner pulse ring */}
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
          className="absolute w-32 h-32 rounded-full border border-gold-400/40"
        />
        {/* Logo */}
        <motion.img
          src="/assets/logo-loading.png"
          alt="Harsha Art Gallery"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="w-28 h-28 rounded-full object-cover relative z-10
            shadow-2xl shadow-gold-500/20"
        />
      </div>

      {/* Brand name */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="text-center"
      >
        <div className="font-display text-2xl font-bold text-white tracking-wide mb-1">
          Harsha Art Gallery
        </div>
        <div className="font-accent text-gold-400 italic text-sm tracking-widest">
          Handmade with LOVE
        </div>
      </motion.div>

      {/* Subtle loading dots */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="flex gap-1.5 mt-8"
      >
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            animate={{ opacity: [0.2, 1, 0.2] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
            className="w-1.5 h-1.5 rounded-full bg-gold-500"
          />
        ))}
      </motion.div>
    </div>
  )
}
