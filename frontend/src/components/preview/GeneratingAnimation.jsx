import { motion } from 'framer-motion'

const MESSAGES = [
  'Analysing your garment shape…',
  'Reading the embroidery reference…',
  'Weaving thread patterns…',
  'Applying Aari stitch details…',
  'Blending colours with your fabric…',
  'Refining fine stitch work…',
  'Almost ready — final touches…',
]

const THREAD_COLORS = ['#c8860f', '#e8be4a', '#d4845a', '#9b7fa6', '#5e9e8f', '#d45a7a']

function ThreadSpiral({ color, delay, radius, speed }) {
  return (
    <motion.div
      className="absolute rounded-full"
      style={{
        width: radius * 2,
        height: radius * 2,
        top: `calc(50% - ${radius}px)`,
        left: `calc(50% - ${radius}px)`,
        border: `2px solid transparent`,
        borderTopColor: color,
        borderRightColor: color + '40',
      }}
      animate={{ rotate: 360 }}
      transition={{ duration: speed, delay, repeat: Infinity, ease: 'linear' }}
    />
  )
}

export default function GeneratingAnimation({ messageIndex = 0 }) {
  const msg = MESSAGES[Math.min(messageIndex, MESSAGES.length - 1)]

  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center select-none">
      {/* Mandala spinner */}
      <div className="relative w-36 h-36 mb-8">
        {THREAD_COLORS.map((color, i) => (
          <ThreadSpiral
            key={i}
            color={color}
            delay={i * 0.15}
            radius={28 + i * 8}
            speed={2.5 + i * 0.4}
          />
        ))}

        {/* Centre needle icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            animate={{ scale: [1, 1.12, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="w-12 h-12 rounded-full bg-gold-gradient flex items-center justify-center shadow-lg shadow-gold-400/30"
          >
            <span className="text-xl">🪡</span>
          </motion.div>
        </div>
      </div>

      {/* Animated dots bar */}
      <div className="flex gap-1.5 mb-5">
        {[0, 1, 2, 3, 4].map(i => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-gold-400"
            animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
            transition={{ duration: 1.4, delay: i * 0.18, repeat: Infinity }}
          />
        ))}
      </div>

      {/* Status message */}
      <motion.p
        key={msg}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        className="font-accent text-lg italic text-charcoal-800/70"
      >
        {msg}
      </motion.p>
      <p className="font-body text-xs text-charcoal-800/30 mt-2">
        AI generation usually takes 20–60 seconds
      </p>
    </div>
  )
}
