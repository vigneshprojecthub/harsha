import { useEffect, useRef, useState, useCallback } from 'react'

/**
 * useOrderTracking — polls the REST API every 15s instead of WebSocket.
 * Render free tier does not support persistent WebSocket connections.
 * This gives "live-ish" updates without WS complexity.
 */
export function useOrderTracking(orderId, token) {
  const [status,  setStatus]  = useState(null)
  const [events,  setEvents]  = useState([])
  const [photos,  setPhotos]  = useState([])
  const [loading, setLoading] = useState(true)
  const [wsState, setWsState] = useState('open')  // always "open" for UI compat
  const timerRef = useRef(null)

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

  const fetchData = useCallback(async () => {
    if (!orderId && !token) return
    try {
      const url = token
        ? `/api/tracking/token/${token}`
        : `/api/tracking/order/${orderId}`
      const { data } = await (await import('axios')).default.get(url)
      setStatus(data.current_status)
      setEvents(data.events || [])
      setPhotos(data.photos || [])
    } catch { /* silent on poll errors */ }
    finally { setLoading(false) }
  }, [orderId, token])

  useEffect(() => {
    if (!orderId && !token) return
    fetchData()
    // Poll every 15 seconds
    timerRef.current = setInterval(fetchData, 15000)
    return () => clearInterval(timerRef.current)
  }, [fetchData])

  const statusIndex = STATUSES.indexOf(status)

  return {
    status,
    statusLabel: STATUS_LABELS[status] || status,
    statusIndex,
    events,
    photos,
    loading,
    wsState,
    connected: true,   // always show as connected for UI compat
    latestUpdate: null,
    STATUSES,
    STATUS_LABELS,
    isDelivered: status === 'delivered',
  }
}
