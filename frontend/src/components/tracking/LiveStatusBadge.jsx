import { motion, AnimatePresence } from 'framer-motion'
import { Wifi, WifiOff } from 'lucide-react'

export default function LiveStatusBadge({ connected, latestUpdate }) {
  return (
    <div className="flex items-center gap-3">
      {/* Connection indicator */}
      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-body font-semibold border ${
        connected
          ? 'bg-green-50 text-green-700 border-green-200'
          : 'bg-gray-50 text-gray-500 border-gray-200'
      }`}>
        <motion.div
          animate={connected ? { scale: [1, 1.4, 1], opacity: [1, 0.5, 1] } : {}}
          transition={{ duration: 2, repeat: Infinity }}
          className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-green-500' : 'bg-gray-400'}`}
        />
        {connected ? (
          <span className="flex items-center gap-1"><Wifi size={10} />Live</span>
        ) : (
          <span className="flex items-center gap-1"><WifiOff size={10} />Reconnecting…</span>
        )}
      </div>

      {/* Latest update flash */}
      <AnimatePresence>
        {latestUpdate && (
          <motion.div
            key={latestUpdate.timestamp || Date.now()}
            initial={{ opacity: 0, scale: 0.85, x: 8 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="font-body text-xs text-gold-700 bg-gold-50 border border-gold-200 px-2.5 py-1 rounded-full"
          >
            {latestUpdate.icon || '📌'} {latestUpdate.label || 'Updated'}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
