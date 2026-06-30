import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Package, Search, ArrowRight, RefreshCw } from 'lucide-react'
import axios from 'axios'
import TrackingTimeline from '../../components/tracking/TrackingTimeline'

// Single fetch — no WebSocket needed
function TrackByToken({ token }) {
  const [timeline, setTimeline] = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')
  const [refreshing, setRefreshing] = useState(false)

  const load = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    try {
      // Try as tracking token first, then as order number
      let data
      try {
        const r = await axios.get(`/api/tracking/token/${token}`)
        data = r.data
      } catch (e1) {
        if (e1.response?.status === 404) {
          // Try searching by order number
          const r2 = await axios.get(`/api/tracking/by-order-number/${token}`)
          data = r2.data
        } else throw e1
      }
      setTimeline(data)
      setError('')
    } catch {
      setError('Tracking link not found. Please check your tracking number.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { if (token) load() }, [token])

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
    <div className="text-center py-16 bg-white rounded-2xl border border-ivory-200">
      <div className="text-5xl mb-4">🔍</div>
      <h3 className="font-display text-xl text-charcoal-800 mb-2">Not Found</h3>
      <p className="font-body text-charcoal-800/50 text-sm max-w-xs mx-auto">{error}</p>
      <p className="font-body text-xs text-charcoal-800/30 mt-3">
        Tip: Use the hex token from your confirmation message,<br/>not the order number (HAG-…)
      </p>
      <Link to="/" className="btn-gold mt-6 inline-flex">Go Home</Link>
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-ivory-200 p-6">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="font-body text-xs text-charcoal-800/40 tracking-wide uppercase mb-1">Your Order</div>
            <div className="font-display text-2xl font-bold text-charcoal-800">{timeline.order_number}</div>
            <div className="font-body text-sm text-charcoal-800/50 mt-1">
              {timeline.current_status_icon} <span className="text-gold-700 font-semibold">{timeline.current_status_label}</span>
            </div>
            <div className="font-body text-xs text-charcoal-800/30 mt-1">For: {timeline.customer_name}</div>
          </div>
          <button onClick={() => load(true)} disabled={refreshing}
            className="flex items-center gap-1.5 text-xs font-body text-charcoal-800/40 hover:text-gold-600 transition-colors">
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
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
      <div className="bg-charcoal-900 py-14">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Package size={16} className="text-gold-400" />
            <span className="font-accent text-gold-400 italic">Live Order Tracking</span>
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-white mb-3">Track Your Order</h1>
          <div className="w-12 h-0.5 bg-gold-gradient mx-auto" />
          <p className="mt-4 text-ivory-200/50 font-body text-sm">
            Enter your tracking token from your order confirmation.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10">
        <form onSubmit={handleSearch} className="flex gap-3 mb-8">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal-800/30" />
            <input type="text" value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Enter tracking token from your confirmation message…"
              className="w-full pl-10 pr-4 py-3.5 border border-ivory-300 rounded-xl font-body text-sm focus:outline-none focus:border-gold-400 bg-white"
            />
          </div>
          <button type="submit" className="btn-gold px-6 rounded-xl">
            Track <ArrowRight size={15} />
          </button>
        </form>

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
                Find it in your order confirmation WhatsApp message or email.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
