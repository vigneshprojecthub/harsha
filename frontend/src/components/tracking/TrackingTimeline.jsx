import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, Circle, Clock, Image as ImageIcon, ZoomIn, X } from 'lucide-react'
import { useState } from 'react'

const STATUS_ORDER = [
  { key: 'order_placed',       label: 'Order Placed',       icon: '📋' },
  { key: 'design_approval',    label: 'Design Approval',    icon: '✏️' },
  { key: 'embroidery_started', label: 'Embroidery Started', icon: '🪡' },
  { key: 'in_progress',        label: 'In Progress',        icon: '⚙️' },
  { key: 'quality_check',      label: 'Quality Check',      icon: '🔍' },
  { key: 'packed',             label: 'Packed',             icon: '📦' },
  { key: 'shipped',            label: 'Shipped',            icon: '🚚' },
  { key: 'delivered',          label: 'Delivered',          icon: '🎉' },
]

function PhotoLightbox({ src, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <button onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white">
        <X size={18} />
      </button>
      <motion.img initial={{ scale: 0.9 }} animate={{ scale: 1 }} src={src}
        className="max-w-full max-h-[88vh] rounded-xl object-contain"
        onClick={e => e.stopPropagation()} />
    </motion.div>
  )
}

function PhotoGrid({ photos }) {
  const [lightbox, setLightbox] = useState(null)
  if (!photos?.length) return null

  return (
    <>
      <div className="flex gap-2 flex-wrap mt-3">
        {photos.map((p, i) => (
          <motion.button key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.08 }}
            onClick={() => setLightbox(p.url)}
            className="group relative w-20 h-20 rounded-xl overflow-hidden border-2 border-ivory-200 hover:border-gold-400 transition-all shadow-sm">
            <img src={p.url} alt={p.caption || 'Progress'} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
              <ZoomIn size={16} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </motion.button>
        ))}
      </div>
      <AnimatePresence>
        {lightbox && <PhotoLightbox src={lightbox} onClose={() => setLightbox(null)} />}
      </AnimatePresence>
    </>
  )
}

export default function TrackingTimeline({ timeline, compact = false }) {
  if (!timeline) return null

  const { all_statuses = [], events = [], current_status } = timeline
  const currentIdx = STATUS_ORDER.findIndex(s => s.key === current_status)

  return (
    <div className="space-y-8">
      {/* ── Progress stepper ────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-ivory-200 p-6 sm:p-8">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-display font-bold text-charcoal-800 text-lg">Order Progress</h3>
          <span className="font-body text-xs text-charcoal-800/40">
            Step {currentIdx + 1} of {STATUS_ORDER.length}
          </span>
        </div>

        {/* Progress bar */}
        <div className="relative mb-8">
          <div className="h-1.5 bg-ivory-200 rounded-full">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${((currentIdx) / (STATUS_ORDER.length - 1)) * 100}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="h-full bg-gold-gradient rounded-full"
            />
          </div>
        </div>

        {/* Status grid */}
        <div className={`grid gap-3 ${compact ? 'grid-cols-4' : 'grid-cols-2 sm:grid-cols-4'}`}>
          {STATUS_ORDER.map((s, i) => {
            const isDone    = i < currentIdx
            const isActive  = i === currentIdx
            const isUpcoming = i > currentIdx

            return (
              <motion.div key={s.key}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className={`
                  relative p-3 rounded-xl border text-center transition-all
                  ${isDone    ? 'bg-gold-50 border-gold-200' : ''}
                  ${isActive  ? 'bg-charcoal-900 border-charcoal-800 shadow-lg' : ''}
                  ${isUpcoming ? 'bg-ivory-50 border-ivory-200 opacity-50' : ''}
                `}
              >
                {/* Icon */}
                <div className={`text-xl mb-1 ${isUpcoming ? 'grayscale opacity-50' : ''}`}>
                  {isDone ? '✅' : s.icon}
                </div>
                <div className={`font-body text-[11px] font-semibold leading-tight ${
                  isActive ? 'text-white' : isDone ? 'text-gold-700' : 'text-charcoal-800/40'
                }`}>
                  {s.label}
                </div>
                {isActive && (
                  <motion.div
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"
                  />
                )}
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* ── Event timeline ───────────────────────────────────────────────── */}
      {events.length > 0 && (
        <div className="bg-white rounded-2xl border border-ivory-200 p-6 sm:p-8">
          <h3 className="font-display font-bold text-charcoal-800 text-lg mb-6">Activity Timeline</h3>
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-5 top-0 bottom-0 w-px bg-ivory-300" />

            <div className="space-y-6">
              {[...events].reverse().map((event, i) => {
                const meta = STATUS_ORDER.find(s => s.key === event.status) || {}
                const isLatest = i === 0

                return (
                  <motion.div key={event.id}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.07 }}
                    className="flex gap-4 relative"
                  >
                    {/* Node */}
                    <div className={`
                      w-10 h-10 rounded-full flex items-center justify-center text-base flex-shrink-0 z-10
                      border-2 transition-all
                      ${isLatest
                        ? 'bg-gold-gradient border-gold-400 shadow-md shadow-gold-200'
                        : 'bg-white border-ivory-300'}
                    `}>
                      {meta.icon || '📌'}
                    </div>

                    {/* Content */}
                    <div className="flex-1 pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className={`font-body font-semibold text-sm ${isLatest ? 'text-gold-700' : 'text-charcoal-800'}`}>
                            {meta.label || event.status}
                          </span>
                          {event.updated_by && (
                            <span className="ml-2 font-body text-xs text-charcoal-800/30">
                              by {event.updated_by}
                            </span>
                          )}
                        </div>
                        <span className="font-body text-[10px] text-charcoal-800/30 whitespace-nowrap flex items-center gap-1">
                          <Clock size={9} />
                          {new Date(event.created_at).toLocaleDateString('en-IN', {
                            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                          })}
                        </span>
                      </div>

                      {event.notes && (
                        <p className="font-body text-sm text-charcoal-800/60 mt-1.5 bg-ivory-50 rounded-xl px-3 py-2 border border-ivory-200">
                          {event.notes}
                        </p>
                      )}

                      {event.photos?.length > 0 && (
                        <PhotoGrid photos={event.photos} />
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
