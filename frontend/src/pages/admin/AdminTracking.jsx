import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Package, Upload, MessageCircle, CheckCircle,
  Loader2, AlertCircle, Camera, Send, Wifi, WifiOff, X
} from 'lucide-react'
import axios from 'axios'
import TrackingTimeline from '../../components/tracking/TrackingTimeline'

const STATUSES = [
  { key: 'order_placed',       label: 'Order Placed',       icon: '📋' },
  { key: 'design_approval',    label: 'Design Approval',    icon: '✏️'  },
  { key: 'embroidery_started', label: 'Embroidery Started', icon: '🪡'  },
  { key: 'in_progress',        label: 'In Progress',        icon: '⚙️'  },
  { key: 'quality_check',      label: 'Quality Check',      icon: '🔍'  },
  { key: 'packed',             label: 'Packed',             icon: '📦'  },
  { key: 'shipped',            label: 'Shipped',            icon: '🚚'  },
  { key: 'delivered',          label: 'Delivered',          icon: '🎉'  },
]

// ── Order Tracking Panel ────────────────────────────────────────────────────
function OrderTrackingPanel({ order, onStatusUpdate }) {
  const [timeline,    setTimeline]    = useState(null)
  const [loading,     setLoading]     = useState(true)
  const [newStatus,   setNewStatus]   = useState('')
  const [notes,       setNotes]       = useState('')
  const [adminNote,   setAdminNote]   = useState('')
  const [saving,      setSaving]      = useState(false)
  const [photoFile,   setPhotoFile]   = useState(null)
  const [photoCaption, setPhotoCaption] = useState('')
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [toast,       setToast]       = useState(null)
  const fileRef = useRef()

  const connected = true  // polling-based, always "connected"

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const loadTimeline = async () => {
    try {
      const { data } = await axios.get(`/api/tracking/order/${order.id}`)
      setTimeline(data)
      if (!newStatus) setNewStatus(data.current_status || STATUSES[0].key)
    } catch { /* ok */ }
    finally { setLoading(false) }
  }

  useEffect(() => { loadTimeline() }, [order.id])

  const handleStatusUpdate = async () => {
    if (!newStatus) return
    setSaving(true)
    try {
      await axios.post(`/api/tracking/order/${order.id}/status`, {
        status:     newStatus,
        notes:      notes || null,
        admin_note: adminNote || null,
        updated_by: 'Admin',
      })
      setNotes('')
      setAdminNote('')
      await loadTimeline()
      onStatusUpdate?.(order.id, newStatus)
      showToast('Status updated & notifications sent!')
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to update status', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handlePhotoUpload = async () => {
    if (!photoFile) return
    setUploadingPhoto(true)
    try {
      const fd = new FormData()
      fd.append('file', photoFile)
      if (photoCaption) fd.append('caption', photoCaption)
      await axios.post(`/api/tracking/order/${order.id}/photo`, fd)
      setPhotoFile(null)
      setPhotoCaption('')
      fileRef.current.value = ''
      await loadTimeline()
      showToast('Progress photo uploaded!')
    } catch {
      showToast('Photo upload failed', 'error')
    } finally {
      setUploadingPhoto(false)
    }
  }

  const generateToken = async () => {
    try {
      await axios.post(`/api/tracking/token/${order.id}/generate`)
      await loadTimeline()
      showToast('Tracking link generated!')
    } catch { showToast('Failed to generate token', 'error') }
  }

  return (
    <div className="space-y-5">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-body font-semibold ${
              toast.type === 'error'
                ? 'bg-red-50 text-red-700 border border-red-200'
                : 'bg-green-50 text-green-700 border border-green-200'
            }`}
          >
            {toast.type === 'error' ? <AlertCircle size={15} /> : <CheckCircle size={15} />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Order info bar */}
      <div className="flex items-center justify-between bg-charcoal-900 rounded-2xl px-5 py-4">
        <div>
          <div className="font-display font-bold text-white">{order.order_number}</div>
          <div className="font-body text-xs text-ivory-200/50 mt-0.5">{order.customer_name} · {order.customer_phone}</div>
        </div>
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1.5 text-xs font-body px-2.5 py-1 rounded-full border ${
            connected ? 'bg-green-900/30 text-green-400 border-green-800' : 'bg-gray-800 text-gray-500 border-gray-700'
          }`}>
            {connected ? <Wifi size={10} /> : <WifiOff size={10} />}
            {connected ? 'Live' : 'Polling'}
          </div>
        </div>
      </div>

      {/* Status updater */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
        <h3 className="font-display font-semibold text-charcoal-800">Update Status</h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {STATUSES.map(s => (
            <button key={s.key} onClick={() => setNewStatus(s.key)}
              className={`p-3 rounded-xl border text-center text-xs font-body transition-all ${
                newStatus === s.key
                  ? 'bg-charcoal-900 border-charcoal-900 text-white shadow-md'
                  : 'bg-white border-gray-200 text-charcoal-800/60 hover:border-gold-300'
              }`}>
              <div className="text-lg mb-0.5">{s.icon}</div>
              <div className="font-semibold leading-tight">{s.label}</div>
            </button>
          ))}
        </div>

        <div>
          <label className="block font-body text-xs font-semibold text-charcoal-800/50 mb-1.5">
            Customer Note <span className="font-normal">(shown to customer)</span>
          </label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={2}
            placeholder="e.g. Your embroidery work has started! Expected to finish by Friday."
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl font-body text-sm focus:outline-none focus:border-gold-400 resize-none"
          />
        </div>

        <div>
          <label className="block font-body text-xs font-semibold text-charcoal-800/50 mb-1.5">
            Internal Note <span className="font-normal">(not shown to customer)</span>
          </label>
          <textarea
            value={adminNote}
            onChange={e => setAdminNote(e.target.value)}
            rows={2}
            placeholder="Internal notes for the team…"
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl font-body text-sm focus:outline-none focus:border-gold-400 resize-none bg-gray-50"
          />
        </div>

        <button
          onClick={handleStatusUpdate}
          disabled={saving || !newStatus}
          className="w-full btn-gold justify-center py-3 rounded-xl disabled:opacity-60"
        >
          {saving
            ? <><Loader2 size={15} className="animate-spin" />Updating…</>
            : <><Send size={15} />Update Status & Notify Customer</>
          }
        </button>
      </div>

      {/* Photo upload */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
        <h3 className="font-display font-semibold text-charcoal-800 flex items-center gap-2">
          <Camera size={16} className="text-gold-500" />Progress Photos
        </h3>

        <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:border-gold-300 transition-colors">
          {photoFile ? (
            <div className="flex items-center gap-3">
              <img src={URL.createObjectURL(photoFile)} alt="" className="w-16 h-16 rounded-xl object-cover border border-gray-200" />
              <div className="flex-1 text-left">
                <div className="font-body text-sm font-semibold text-charcoal-800 truncate">{photoFile.name}</div>
                <button onClick={() => { setPhotoFile(null); fileRef.current.value = '' }}
                  className="text-xs text-red-500 hover:text-red-600 font-body mt-0.5">Remove</button>
              </div>
            </div>
          ) : (
            <label className="cursor-pointer flex flex-col items-center py-3">
              <Upload size={22} className="text-gray-400 mb-2" />
              <span className="font-body text-sm text-gray-500">Click to upload photo</span>
              <span className="font-body text-xs text-gray-400 mt-0.5">JPG, PNG, WebP</span>
              <input ref={fileRef} type="file" accept="image/*" onChange={e => setPhotoFile(e.target.files[0])} className="hidden" />
            </label>
          )}
        </div>

        {photoFile && (
          <>
            <input
              value={photoCaption}
              onChange={e => setPhotoCaption(e.target.value)}
              placeholder="Photo caption (optional)"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl font-body text-sm focus:outline-none focus:border-gold-400"
            />
            <button
              onClick={handlePhotoUpload}
              disabled={uploadingPhoto}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white font-body text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-60 transition-colors"
            >
              {uploadingPhoto ? <><Loader2 size={14} className="animate-spin" />Uploading…</> : <><Upload size={14} />Upload Photo</>}
            </button>
          </>
        )}
      </div>

      {/* Tracking token */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h3 className="font-display font-semibold text-charcoal-800 mb-3">Customer Tracking Link</h3>
        {timeline?.tracking_token ? (
          <div className="space-y-2">
            <div className="bg-ivory-50 border border-ivory-200 rounded-xl px-4 py-2.5 font-mono text-xs text-charcoal-800/70 break-all">
              {`${window.location.origin}/track/${timeline.tracking_token}`}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => navigator.clipboard.writeText(`${window.location.origin}/track/${timeline.tracking_token}`).then(() => showToast('Link copied!'))}
                className="flex-1 py-2 border border-gray-200 text-charcoal-800/60 font-body text-xs rounded-xl hover:bg-gray-50"
              >
                Copy Link
              </button>
              <a
                href={`https://wa.me/${order.customer_phone?.replace(/\D/g,'')}?text=${encodeURIComponent(`Hi ${order.customer_name}! Track your order here: ${window.location.origin}/track/${timeline.tracking_token}`)}`}
                target="_blank" rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-green-600 text-white font-body text-xs rounded-xl hover:bg-green-700"
              >
                <MessageCircle size={12} /> Send via WhatsApp
              </a>
            </div>
          </div>
        ) : (
          <button onClick={generateToken}
            className="w-full py-2.5 border border-gold-300 text-gold-700 font-body text-sm font-semibold rounded-xl hover:bg-gold-50 transition-colors">
            Generate Tracking Link
          </button>
        )}
      </div>

      {/* Timeline preview */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
          <Loader2 size={24} className="animate-spin text-gold-500 mx-auto" />
        </div>
      ) : timeline ? (
        <TrackingTimeline timeline={timeline} compact />
      ) : null}
    </div>
  )
}

// ── Main Admin Tracking Page ────────────────────────────────────────────────
export default function AdminTracking() {
  const [activeOrders, setActiveOrders] = useState([])
  const [loading,      setLoading]      = useState(true)
  const [selected,     setSelected]     = useState(null)
  const [search,       setSearch]       = useState('')

  const loadActiveOrders = async () => {
    try {
      const { data } = await axios.get('/api/tracking/admin/active')
      setActiveOrders(data)
    } catch { /* ok */ }
    finally { setLoading(false) }
  }

  useEffect(() => {
    loadActiveOrders()
    // Poll every 20s instead of WebSocket (Render free tier doesn't support persistent WS)
    const interval = setInterval(loadActiveOrders, 20000)
    return () => clearInterval(interval)
  }, [])

  const connected = true  // polling-based — always shows as live

  const handleStatusUpdate = (orderId, newStatus) => {
    setActiveOrders(prev => prev.map(o =>
      o.id === orderId ? { ...o, status: newStatus } : o
    ))
  }

  const filtered = activeOrders.filter(o =>
    !search || o.order_number.toLowerCase().includes(search.toLowerCase()) ||
    o.customer_name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-8 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl font-bold text-charcoal-800">Order Tracking</h1>
          <p className="font-body text-charcoal-800/50 mt-1">
            {activeOrders.length} active orders · {' '}
            <span className={`font-semibold ${connected ? 'text-green-600' : 'text-gray-400'}`}>
              {connected ? '🟢 Live' : '⚫ Reconnecting'}
            </span>
          </p>
        </div>
        <button onClick={loadActiveOrders}
          className="px-4 py-2 border border-gray-200 text-charcoal-800/60 font-body text-sm rounded-xl hover:bg-gray-50 transition-colors">
          Refresh
        </button>
      </div>

      <div className="grid xl:grid-cols-5 gap-6">
        {/* Left: Active orders list */}
        <div className="xl:col-span-2 space-y-3">
          {/* Search */}
          <div className="relative">
            <Package size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search order or customer…"
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl font-body text-sm focus:outline-none focus:border-gold-400 bg-white"
            />
          </div>

          {loading ? (
            Array(5).fill(null).map((_, i) => (
              <div key={i} className="bg-white rounded-xl h-20 animate-pulse border border-gray-100" />
            ))
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
              <Package size={32} className="mx-auto text-gray-300 mb-3" />
              <p className="font-body text-sm text-gray-400">No active orders</p>
            </div>
          ) : (
            filtered.map((order, i) => (
              <motion.button
                key={order.id}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                onClick={() => setSelected(selected?.id === order.id ? null : order)}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  selected?.id === order.id
                    ? 'border-gold-400 bg-gold-50 shadow-sm'
                    : 'border-gray-100 bg-white hover:border-gold-200 hover:shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-body font-semibold text-charcoal-800 text-sm">{order.order_number}</div>
                    <div className="font-body text-xs text-charcoal-800/50 mt-0.5">{order.customer_name}</div>
                  </div>
                  <div className="text-xl flex-shrink-0">{order.status_icon}</div>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="font-body text-xs text-charcoal-800/50">{order.status_label}</span>
                  <span className="font-body text-xs text-charcoal-800/30">
                    {new Date(order.last_update).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
              </motion.button>
            ))
          )}
        </div>

        {/* Right: Tracking panel */}
        <div className="xl:col-span-3">
          <AnimatePresence mode="wait">
            {selected ? (
              <motion.div key={selected.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <OrderTrackingPanel
                  order={selected}
                  onStatusUpdate={handleStatusUpdate}
                />
              </motion.div>
            ) : (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="bg-white rounded-2xl border border-gray-100 border-dashed p-16 text-center h-full flex flex-col items-center justify-center">
                <Package size={40} className="text-gray-300 mb-4" />
                <p className="font-body text-gray-400">Select an order to manage tracking</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
