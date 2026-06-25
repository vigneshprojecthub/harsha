import { useEffect, useRef, useState, useCallback } from 'react'

// In production: connects directly to Render backend for WebSockets
// (Vercel can't proxy WebSocket connections)
const WS_BASE = import.meta.env.VITE_WS_URL || 'wss://harsha-rxfv.onrender.com'

const STATUSES = [
  'order_placed', 'confirmed', 'materials_sourced',
  'embroidery_started', 'embroidery_complete',
  'quality_check', 'packed', 'shipped', 'delivered'
]

const STATUS_LABELS = {
  order_placed:        'Order Placed',
  confirmed:           'Confirmed',
  materials_sourced:   'Materials Sourced',
  embroidery_started:  'Embroidery Started',
  embroidery_complete: 'Embroidery Complete',
  quality_check:       'Quality Check',
  packed:              'Packed',
  shipped:             'Shipped',
  delivered:           'Delivered',
}

export function useOrderTracking(orderId, token) {
  const [status,   setStatus]   = useState(null)
  const [events,   setEvents]   = useState([])
  const [photos,   setPhotos]   = useState([])
  const [loading,  setLoading]  = useState(true)
  const [wsState,  setWsState]  = useState('connecting') // connecting|open|closed
  const wsRef      = useRef(null)
  const retryRef   = useRef(0)
  const retryTimer = useRef(null)

  const connect = useCallback(() => {
    if (!orderId && !token) return

    const url = token
      ? `${WS_BASE}/api/tracking/ws/token/${token}`
      : `${WS_BASE}/api/tracking/ws/${orderId}`

    const ws = new WebSocket(url)
    wsRef.current = ws
    setWsState('connecting')

    ws.onopen = () => {
      setWsState('open')
      retryRef.current = 0
    }

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data)
        if (msg.type === 'initial_state') {
          setStatus(msg.current_status)
          setEvents(msg.events || [])
          setPhotos(msg.photos || [])
          setLoading(false)
        } else if (msg.type === 'status_update') {
          setStatus(msg.status)
          setEvents(prev => [msg.event, ...prev])
        } else if (msg.type === 'photo_added') {
          setPhotos(prev => [msg.photo, ...prev])
        }
      } catch { /* ignore malformed messages */ }
    }

    ws.onerror = () => setWsState('closed')

    ws.onclose = () => {
      setWsState('closed')
      setLoading(false)
      // Exponential backoff retry (max 30s)
      const delay = Math.min(1000 * 2 ** retryRef.current, 30000)
      retryRef.current += 1
      retryTimer.current = setTimeout(connect, delay)
    }
  }, [orderId, token])

  useEffect(() => {
    connect()
    return () => {
      clearTimeout(retryTimer.current)
      wsRef.current?.close()
    }
  }, [connect])

  const statusIndex = STATUSES.indexOf(status)

  return {
    status,
    statusLabel: STATUS_LABELS[status] || status,
    statusIndex,
    events,
    photos,
    loading,
    wsState,
    STATUSES,
    STATUS_LABELS,
    isDelivered: status === 'delivered',
  }
}
