import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Package, ChevronRight, IndianRupee, Search,
  Clock, CheckCircle, Truck, AlertCircle
} from 'lucide-react'
import axios from 'axios'
import TrackingTimeline from '../../components/tracking/TrackingTimeline'
import LiveStatusBadge from '../../components/tracking/LiveStatusBadge'
import { useOrderTracking } from '../../hooks/useOrderTracking'

const STATUS_META = {
  order_placed:       { label: 'Order Placed',       icon: '📋', color: 'text-amber-600  bg-amber-50  border-amber-200'  },
  design_approval:    { label: 'Design Approval',    icon: '✏️',  color: 'text-purple-600 bg-purple-50 border-purple-200' },
  embroidery_started: { label: 'Embroidery Started', icon: '🪡',  color: 'text-blue-600   bg-blue-50   border-blue-200'   },
  in_progress:        { label: 'In Progress',        icon: '⚙️',  color: 'text-orange-600 bg-orange-50 border-orange-200' },
  quality_check:      { label: 'Quality Check',      icon: '🔍',  color: 'text-teal-600   bg-teal-50   border-teal-200'   },
  packed:             { label: 'Packed',             icon: '📦',  color: 'text-cyan-600   bg-cyan-50   border-cyan-200'   },
  shipped:            { label: 'Shipped',            icon: '🚚',  color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
  delivered:          { label: 'Delivered',          icon: '🎉',  color: 'text-green-600  bg-green-50  border-green-200'  },
  pending:            { label: 'Pending',            icon: '🕐',  color: 'text-gray-600   bg-gray-50   border-gray-200'   },
  confirmed:          { label: 'Confirmed',          icon: '✅',  color: 'text-blue-600   bg-blue-50   border-blue-200'   },
  cancelled:          { label: 'Cancelled',          icon: '❌',  color: 'text-red-600    bg-red-50    border-red-200'    },
}

function StatusBadge({ status }) {
  const meta = STATUS_META[status] || STATUS_META.pending
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-body font-semibold px-2.5 py-1 rounded-full border ${meta.color}`}>
      {meta.icon} {meta.label}
    </span>
  )
}

// ── Single order detail panel ────────────────────────────────────────────────
function OrderDetailPanel({ order, onClose }) {
  const [timeline, setTimeline] = useState(null)
  const [loading, setLoading]   = useState(true)

  const { events: wsEvents, connected, latestUpdate } = useOrderTracking(order.id, 'order')

  useEffect(() => {
    axios.get(`/api/tracking/order/${order.id}`)
      .then(r => setTimeline(r.data))
      .catch(() => setTimeline(null))
      .finally(() => setLoading(false))
  }, [order.id])

  // Patch timeline on live WS update
  useEffect(() => {
    if (!wsEvents.length || !timeline) return
    const latest = wsEvents[0]
    if (latest.type === 'status_update') {
      setTimeline(prev => ({
        ...prev,
        current_status:       latest.status,
        current_status_label: latest.label,
        current_status_icon:  latest.icon,
        events: [
          ...(prev.events || []),
          {
            id:         Date.now(),
            order_id:   order.id,
            status:     latest.status,
            notes:      latest.notes,
            updated_by: latest.updated_by,
            created_at: latest.timestamp,
            photos:     [],
          }
        ],
        all_statuses: prev.all_statuses?.map(s => ({
          ...s,
          state: s.key === latest.status ? 'active'
               : (prev.all_statuses.findIndex(x => x.key === s.key) <
                  prev.all_statuses.findIndex(x => x.key === latest.status))
               ? 'completed' : 'upcoming'
        })),
      }))
    }
    if (latest.type === 'photo_added') {
      setTimeline(prev => {
        if (!prev) return prev
        const events = [...(prev.events || [])]
        if (events.length) {
          events[events.length - 1] = {
            ...events[events.length - 1],
            photos: [
              ...(events[events.length - 1].photos || []),
              { id: Date.now(), url: latest.photo_url, caption: latest.caption, created_at: latest.timestamp }
            ]
          }
        }
        return { ...prev, events }
      })
    }
  }, [wsEvents])

  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 30 }}
      className="fixed inset-0 z-40 lg:relative lg:inset-auto flex"
    >
      {/* Mobile backdrop */}
      <div className="lg:hidden absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative lg:static w-full lg:w-auto bg-ivory-50 overflow-y-auto lg:overflow-visible h-full lg:h-auto">
        <div className="p-4 lg:p-0 max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-5 bg-white rounded-2xl border border-ivory-200 p-4">
            <div>
              <div className="font-body text-xs text-charcoal-800/40 uppercase tracking-wide mb-0.5">Order Details</div>
              <div className="font-display font-bold text-charcoal-800 text-lg">{order.order_number}</div>
              <div className="font-body text-xs text-charcoal-800/50 mt-0.5">
                ₹{Number(order.total_amount).toLocaleString('en-IN')} ·{' '}
                {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <LiveStatusBadge connected={connected} latestUpdate={latestUpdate} />
              <button onClick={onClose} className="lg:hidden text-xs text-charcoal-800/40 hover:text-charcoal-800">✕ Close</button>
            </div>
          </div>

          {/* Items */}
          {order.items?.length > 0 && (
            <div className="bg-white rounded-2xl border border-ivory-200 p-5 mb-5">
              <div className="font-body text-xs font-semibold text-charcoal-800/40 uppercase tracking-wide mb-3">Items Ordered</div>
              <div className="space-y-2">
                {order.items.map(item => (
                  <div key={item.id} className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-ivory-100 flex items-center justify-center text-sm">🪡</div>
                      <div>
                        <div className="font-body text-sm font-semibold text-charcoal-800">{item.product_name}</div>
                        <div className="font-body text-xs text-charcoal-800/40">Qty: {item.quantity}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5 font-body font-semibold text-charcoal-800 text-sm">
                      <IndianRupee size={11} />{Number(item.line_total).toLocaleString('en-IN')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Timeline */}
          {loading ? (
            <div className="bg-white rounded-2xl border border-ivory-200 p-8 text-center">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="w-8 h-8 rounded-full border-2 border-gold-500 border-t-transparent mx-auto mb-3" />
              <p className="font-body text-sm text-charcoal-800/40">Loading timeline…</p>
            </div>
          ) : timeline ? (
            <TrackingTimeline timeline={timeline} />
          ) : (
            <div className="bg-white rounded-2xl border border-ivory-200 p-8 text-center">
              <Package size={32} className="mx-auto text-charcoal-800/20 mb-3" />
              <p className="font-body text-sm text-charcoal-800/40">No tracking events yet</p>
            </div>
          )}

          {/* Track publicly */}
          {timeline?.tracking_token && (
            <div className="mt-4 bg-gold-50 border border-gold-200 rounded-xl p-4 flex items-center justify-between">
              <div>
                <div className="font-body text-xs font-semibold text-gold-700">Share Tracking Link</div>
                <div className="font-body text-xs text-gold-600/70 mt-0.5">Anyone with this link can view your order status</div>
              </div>
              <Link
                to={`/track/${timeline.tracking_token}`}
                className="text-xs font-body font-semibold text-gold-700 hover:text-gold-800 flex items-center gap-1"
              >
                Open <ChevronRight size={12} />
              </Link>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// ── Main Dashboard ──────────────────────────────────────────────────────────
export default function CustomerDashboard() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [orders,  setOrders]  = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')
  const [phone,   setPhone]   = useState(searchParams.get('phone') || '')
  const [searched, setSearched] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)

  const fetchOrders = async (phoneNum) => {
    if (!phoneNum.trim()) return
    setLoading(true)
    setError('')
    try {
      // Search orders by phone from checkout API
      const { data } = await axios.get('/api/checkout/orders', {
        params: { phone: phoneNum.trim(), limit: 50 }
      })
      // Filter client-side by phone (backend returns all; TODO: add server filter)
      const filtered = data.filter(o =>
        o.customer_phone?.replace(/\D/g, '').includes(phoneNum.replace(/\D/g, ''))
      )
      setOrders(filtered)
      setSearched(true)
    } catch {
      setError('Failed to load orders. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const p = searchParams.get('phone')
    if (p) fetchOrders(p)
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    setSearchParams({ phone })
    fetchOrders(phone)
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-ivory-50 pt-20">
      {/* Header */}
      <div className="bg-charcoal-900 py-14">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h1 className="font-display text-4xl md:text-5xl font-bold text-white mb-3">My Orders</h1>
          <div className="w-12 h-0.5 bg-gold-gradient mx-auto" />
          <p className="mt-4 text-ivory-200/50 font-body text-sm">
            Enter your phone number to view your order history and live tracking.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10">
        {/* Phone search */}
        <form onSubmit={handleSearch} className="flex gap-3 mb-8 max-w-md mx-auto">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal-800/30" />
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full pl-10 pr-4 py-3.5 border border-ivory-300 rounded-xl font-body text-sm focus:outline-none focus:border-gold-400 bg-white"
            />
          </div>
          <button type="submit" className="btn-gold px-5 rounded-xl">
            Find Orders
          </button>
        </form>

        {/* Main content */}
        {loading && searched ? (
          <div className="text-center py-16">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="w-10 h-10 rounded-full border-2 border-gold-500 border-t-transparent mx-auto mb-4" />
            <p className="font-body text-charcoal-800/50">Loading your orders…</p>
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <AlertCircle size={40} className="mx-auto text-red-400 mb-3" />
            <p className="font-body text-red-600">{error}</p>
          </div>
        ) : searched && orders.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-ivory-200">
            <Package size={48} className="mx-auto text-charcoal-800/20 mb-4" />
            <h3 className="font-display text-xl text-charcoal-800 mb-2">No orders found</h3>
            <p className="font-body text-charcoal-800/50 text-sm">
              No orders found for this phone number. Check the number and try again.
            </p>
          </div>
        ) : !searched ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-ivory-200">
            <div className="text-5xl mb-4">📱</div>
            <h3 className="font-display text-xl text-charcoal-800 mb-2">Find your orders</h3>
            <p className="font-body text-charcoal-800/50 text-sm">Enter the phone number you used when placing your order.</p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Order list */}
            <div className="space-y-3">
              {orders.map((order, i) => {
                const meta = STATUS_META[order.status] || STATUS_META.pending
                const isSelected = selectedOrder?.id === order.id
                return (
                  <motion.button
                    key={order.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.07 }}
                    onClick={() => setSelectedOrder(isSelected ? null : order)}
                    className={`w-full text-left p-5 rounded-2xl border transition-all ${
                      isSelected
                        ? 'border-gold-400 bg-gold-50 shadow-md shadow-gold-100'
                        : 'border-ivory-200 bg-white hover:border-gold-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0 ${
                          isSelected ? 'bg-gold-gradient' : 'bg-ivory-100'
                        }`}>
                          {meta.icon}
                        </div>
                        <div>
                          <div className="font-display font-bold text-charcoal-800 text-base">{order.order_number}</div>
                          <div className="font-body text-xs text-charcoal-800/40 mt-0.5">
                            {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </div>
                        </div>
                      </div>
                      <ChevronRight size={16} className={`text-charcoal-800/30 mt-1 transition-transform ${isSelected ? 'rotate-90 text-gold-500' : ''}`} />
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <StatusBadge status={order.status} />
                      <div className="flex items-center gap-0.5 font-display font-bold text-charcoal-800 text-sm">
                        <IndianRupee size={12} />
                        {Number(order.total_amount).toLocaleString('en-IN')}
                      </div>
                    </div>

                    {order.items?.length > 0 && (
                      <div className="mt-2 font-body text-xs text-charcoal-800/40 line-clamp-1">
                        {order.items.map(i => i.product_name).join(', ')}
                      </div>
                    )}
                  </motion.button>
                )
              })}
            </div>

            {/* Detail panel */}
            <AnimatePresence mode="wait">
              {selectedOrder && (
                <div className="lg:sticky lg:top-24 lg:self-start">
                  <OrderDetailPanel
                    key={selectedOrder.id}
                    order={selectedOrder}
                    onClose={() => setSelectedOrder(null)}
                  />
                </div>
              )}
            </AnimatePresence>

            {!selectedOrder && (
              <div className="hidden lg:flex items-center justify-center bg-white rounded-2xl border border-ivory-200 border-dashed p-12">
                <div className="text-center">
                  <Package size={32} className="mx-auto text-charcoal-800/20 mb-3" />
                  <p className="font-body text-sm text-charcoal-800/30">Select an order to view details</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}
