import { useEffect, useState, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Package, Search, ArrowRight } from 'lucide-react'
import axios from 'axios'
import TrackingTimeline from '../../components/tracking/TrackingTimeline'
import LiveStatusBadge from '../../components/tracking/LiveStatusBadge'
import { useOrderTracking } from '../../hooks/useOrderTracking'

function TrackByToken({ token }) {
  const [timeline, setTimeline]  = useState(null)
  const [loading,  setLoading]   = useState(true)
  const [error,    setError]     = useState('')

  const { events: wsEvents, connected, latestUpdate } = useOrderTracking(
    timeline?.order_id || null,
    'order'
  )

  useEffect(() => {
    if (!token) return
    axios.get(`/api/tracking/token/${token}`)
      .then(r => setTimeline(r.data))
      .catch(() => setError('Tracking link not found or expired.'))
      .finally(() => setLoading(false))
  }, [token])

  // Refresh timeline when a WebSocket status update arrives
  useEffect(() => {
    if (!wsEvents.length || !timeline?.order_id) return
    const latest = wsEvents[0]
    if (latest.type === 'status_update') {
      setTimeline(prev => prev ? {
        ...prev,
        current_status:       latest.status,
        current_status_label: latest.label,
        current_status_icon:  latest.icon,
      } : prev)
    }
  }, [wsEvents])

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <div className="text-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 rounded-full border-2 border-gold-500 border-t-transparent mx-auto mb-4" />
        <p className="font-body text-charcoal-800/50">Loading your order…</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="text-center py-24">
      <div className="text-5xl mb-4">🔍</div>
      <h3 className="font-display text-xl text-charcoal-800 mb-2">{error}</h3>
      <Link to="/" className="btn-gold mt-4">Go Home</Link>
    </div>
  )

  return (
    <div>
      {/* Order header */}
      <div className="bg-white rounded-2xl border border-ivory-200 p-6 mb-6">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="font-body text-xs text-charcoal-800/40 tracking-wide uppercase mb-1">Your Order</div>
            <div className="font-display text-2xl font-bold text-charcoal-800">{timeline.order_number}</div>
            <div className="font-body text-sm text-charcoal-800/50 mt-1">
              {timeline.current_status_icon} Currently: <span className="text-gold-700 font-semibold">{timeline.current_status_label}</span>
            </div>
          </div>
          <LiveStatusBadge connected={connected} latestUpdate={latestUpdate} />
        </div>
      </div>

      <TrackingTimeline timeline={timeline} />
    </div>
  )
}

export default function OrderTrackingPage() {
  const { token } = useParams()
  const [searchInput, setSearchInput] = useState('')
  const [searchToken, setSearchToken] = useState(token || '')

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchInput.trim()) setSearchToken(searchInput.trim())
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-ivory-50 pt-20">
      {/* Header */}
      <div className="bg-charcoal-900 py-14">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Package size={16} className="text-gold-400" />
            <span className="font-accent text-gold-400 italic">Live Order Tracking</span>
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-white mb-3">Track Your Order</h1>
          <div className="w-12 h-0.5 bg-gold-gradient mx-auto" />
          <p className="mt-4 text-ivory-200/50 font-body text-sm">
            Enter your tracking number or use the link from your confirmation email.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* Search bar */}
        <form onSubmit={handleSearch} className="flex gap-3 mb-8">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal-800/30" />
            <input
              type="text"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Enter tracking token (e.g. abc123def456…)"
              className="w-full pl-10 pr-4 py-3.5 border border-ivory-300 rounded-xl font-body text-sm focus:outline-none focus:border-gold-400 bg-white"
            />
          </div>
          <button type="submit" className="btn-gold px-6 rounded-xl">
            Track <ArrowRight size={15} />
          </button>
        </form>

        {/* Timeline */}
        <AnimatePresence mode="wait">
          {searchToken ? (
            <motion.div key={searchToken} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <TrackByToken token={searchToken} />
            </motion.div>
          ) : (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="text-center py-12 bg-white rounded-2xl border border-ivory-200">
              <div className="text-5xl mb-4">📦</div>
              <h3 className="font-display text-xl text-charcoal-800 mb-2">Enter your tracking token</h3>
              <p className="font-body text-charcoal-800/50 text-sm">
                Find it in your order confirmation email or WhatsApp message.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
