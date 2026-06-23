import { useEffect, useState } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, Download, MessageCircle, Package, Home, MapPin, Copy, Check } from 'lucide-react'

const confetti = ['🎉','✨','🪡','💛','🎊','⭐','🧵','💎']

function ConfettiPiece({ delay, left, emoji }) {
  return (
    <motion.div
      className="fixed top-0 text-2xl pointer-events-none select-none z-50"
      style={{ left: `${left}%` }}
      initial={{ y: -50, opacity: 1, rotate: 0 }}
      animate={{ y: '110vh', opacity: [1, 1, 0], rotate: 720 }}
      transition={{ duration: 3 + Math.random(), delay, ease: 'easeIn' }}
    >
      {emoji}
    </motion.div>
  )
}

export default function OrderConfirmationPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [data, setData]           = useState(null)
  const [showConfetti, setShowConfetti] = useState(true)
  const [copied, setCopied]       = useState(false)

  useEffect(() => {
    const state = location.state
    if (!state?.order_number) { navigate('/'); return }
    setData(state)
    const t = setTimeout(() => setShowConfetti(false), 4500)
    return () => clearTimeout(t)
  }, [])

  if (!data) return null

  const trackingUrl = data.tracking_url
    ? `${window.location.origin}${data.tracking_url}`
    : null

  const copyTrackingUrl = () => {
    if (!trackingUrl) return
    navigator.clipboard.writeText(trackingUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const confettiPieces = Array.from({ length: 22 }, (_, i) => ({
    delay: i * 0.13,
    left:  Math.random() * 100,
    emoji: confetti[i % confetti.length],
  }))

  return (
    <div className="min-h-screen bg-ivory-50 pt-20">
      {showConfetti && confettiPieces.map((p, i) => <ConfettiPiece key={i} {...p} />)}

      <div className="max-w-2xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="bg-white rounded-3xl border border-ivory-200 shadow-xl overflow-hidden"
        >
          {/* Gold banner */}
          <div className="bg-gold-gradient px-8 py-10 text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-10"
              style={{ backgroundImage: 'repeating-linear-gradient(-45deg,transparent,transparent 8px,rgba(255,255,255,.2) 8px,rgba(255,255,255,.2) 16px)' }} />
            <motion.div
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
              className="relative w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-4 border-2 border-white/40"
            >
              <CheckCircle size={40} className="text-white" />
            </motion.div>
            <h1 className="font-display text-3xl font-bold text-white relative">Order Confirmed!</h1>
            <p className="font-body text-white/80 mt-2 relative">
              Your handcrafted piece is on its way to being made.
            </p>
          </div>

          {/* Order meta */}
          <div className="px-8 py-6 border-b border-ivory-200">
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Order Number',  value: data.order_number },
                { label: 'Invoice',       value: data.invoice_number },
                { label: 'Amount Paid',   value: `₹${data.total_amount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` },
                { label: 'Status',        value: '✅ Payment Successful' },
              ].map(row => (
                <div key={row.label}>
                  <div className="font-body text-xs text-charcoal-800/40 tracking-wide uppercase mb-0.5">{row.label}</div>
                  <div className="font-body font-semibold text-charcoal-800 text-sm">{row.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Live tracking card — NEW in Phase 4 */}
          {trackingUrl && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="px-8 py-5 border-b border-ivory-200 bg-gradient-to-r from-charcoal-900 to-charcoal-800"
            >
              <div className="flex items-center gap-2 mb-3">
                <MapPin size={15} className="text-gold-400" />
                <span className="font-body text-sm font-semibold text-white">Live Order Tracking</span>
                <span className="flex items-center gap-1 text-[10px] font-body bg-green-500/20 text-green-400 border border-green-500/30 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block animate-pulse" />
                  Active
                </span>
              </div>
              <p className="font-body text-xs text-ivory-200/50 mb-3">
                Bookmark this link to track your order status in real-time. Share it with anyone.
              </p>
              <div className="flex gap-2">
                <div className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 font-mono text-[11px] text-ivory-200/60 truncate">
                  {trackingUrl}
                </div>
                <button
                  onClick={copyTrackingUrl}
                  className={`px-3 py-2 rounded-xl text-xs font-body font-semibold transition-all flex items-center gap-1.5 ${
                    copied
                      ? 'bg-green-600 text-white'
                      : 'bg-gold-gradient text-white hover:shadow-md'
                  }`}
                >
                  {copied ? <><Check size={12} />Copied</> : <><Copy size={12} />Copy</>}
                </button>
              </div>
              <Link
                to={data.tracking_url}
                className="mt-3 w-full flex items-center justify-center gap-2 py-3 bg-white/10 hover:bg-white/15 text-white font-body text-sm font-semibold rounded-xl transition-colors border border-white/10"
              >
                <MapPin size={15} />
                Open Live Tracker
              </Link>
            </motion.div>
          )}

          {/* What's next */}
          <div className="px-8 py-6 border-b border-ivory-200">
            <h3 className="font-display font-semibold text-charcoal-800 mb-4">What happens next?</h3>
            <div className="space-y-3">
              {[
                { emoji: '🪡', step: 'Artisan Assigned',      desc: 'Your order goes to our skilled artisan team' },
                { emoji: '📱', step: 'WhatsApp Update',        desc: "We'll connect to confirm design details" },
                { emoji: '🔍', step: 'Progress Updates',       desc: 'Track every step live — design, stitching, quality check' },
                { emoji: '🎁', step: 'Delivered with Love',    desc: 'Premium packaging, at your door in 15–21 days' },
              ].map((s, i) => (
                <motion.div key={s.step}
                  initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  className="flex items-start gap-3"
                >
                  <div className="w-8 h-8 rounded-full bg-ivory-100 flex items-center justify-center flex-shrink-0 text-base">{s.emoji}</div>
                  <div>
                    <div className="font-body font-semibold text-charcoal-800 text-sm">{s.step}</div>
                    <div className="font-body text-xs text-charcoal-800/50">{s.desc}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="px-8 py-6 space-y-3">
            {data.invoice_pdf_url && (
              <a href={data.invoice_pdf_url} download target="_blank" rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-3.5 border-2 border-gold-400 text-gold-700 font-body font-semibold rounded-xl hover:bg-gold-50 transition-colors">
                <Download size={16} />Download Invoice PDF
              </a>
            )}
            {data.whatsapp_url && (
              <a href={data.whatsapp_url} target="_blank" rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-green-600 text-white font-body font-semibold rounded-xl hover:bg-green-700 transition-colors">
                <MessageCircle size={16} />Connect on WhatsApp
              </a>
            )}
            <div className="grid grid-cols-2 gap-3">
              <Link to="/products"
                className="flex items-center justify-center gap-1.5 py-3 border border-ivory-300 text-charcoal-800/60 font-body text-sm rounded-xl hover:bg-ivory-100 transition-colors">
                <Package size={14} />Shop More
              </Link>
              <Link to="/"
                className="flex items-center justify-center gap-1.5 py-3 border border-ivory-300 text-charcoal-800/60 font-body text-sm rounded-xl hover:bg-ivory-100 transition-colors">
                <Home size={14} />Home
              </Link>
            </div>
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
          className="text-center text-xs font-body text-charcoal-800/30 mt-5"
        >
          Invoice & tracking link sent to your email (if provided).
        </motion.p>
      </div>
    </div>
  )
}
