import { useEffect, useRef, useState, useCallback } from 'react'

const WS_BASE = import.meta.env.VITE_WS_URL || 'ws://localhost:8000'
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

/**
 * useOrderTracking
 * ─────────────────
 * Subscribes to live order updates via WebSocket.
 * Falls back to HTTP polling every 15s if WebSocket isn't available.
 *
 * @param {number|null} orderId
 * @param {'order'|'admin'} role
 * @returns {{ events, connected, latestUpdate }}
 */
export function useOrderTracking(orderId = null, role = 'order') {
  const [events,       setEvents]       = useState([])    // incoming WS messages
  const [connected,    setConnected]    = useState(false)
  const [latestUpdate, setLatestUpdate] = useState(null)

  const wsRef       = useRef(null)
  const retryTimer  = useRef(null)
  const retryCount  = useRef(0)
  const mountedRef  = useRef(true)

  const pushEvent = useCallback((evt) => {
    if (!mountedRef.current) return
    setLatestUpdate(evt)
    setEvents(prev => [evt, ...prev].slice(0, 50))  // keep last 50
  }, [])

  const connect = useCallback(() => {
    if (!mountedRef.current) return
    if (role === 'order' && !orderId) return

    const url = role === 'admin'
      ? `${WS_BASE}/api/tracking/ws/admin`
      : `${WS_BASE}/api/tracking/ws/order/${orderId}`

    try {
      const ws = new WebSocket(url)
      wsRef.current = ws

      ws.onopen = () => {
        if (!mountedRef.current) return
        setConnected(true)
        retryCount.current = 0
        // Heartbeat every 25s
        const hb = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) ws.send('ping')
        }, 25_000)
        ws._heartbeat = hb
      }

      ws.onmessage = (e) => {
        if (!mountedRef.current) return
        try {
          const data = JSON.parse(e.data)
          if (data.type === 'pong' || data.type === 'connected') return
          pushEvent(data)
        } catch { /* ignore malformed */ }
      }

      ws.onclose = () => {
        if (!mountedRef.current) return
        clearInterval(ws._heartbeat)
        setConnected(false)
        // Exponential back-off: 1s, 2s, 4s, 8s, max 30s
        const delay = Math.min(1000 * Math.pow(2, retryCount.current), 30_000)
        retryCount.current += 1
        retryTimer.current = setTimeout(connect, delay)
      }

      ws.onerror = () => {
        ws.close()
      }
    } catch {
      // WebSocket not available — use polling
      startPolling()
    }
  }, [orderId, role, pushEvent])

  // HTTP polling fallback
  const startPolling = useCallback(() => {
    if (!orderId || role !== 'order') return
    const poll = async () => {
      if (!mountedRef.current) return
      try {
        const r = await fetch(`/api/tracking/order/${orderId}`)
        if (r.ok) {
          const data = await r.json()
          if (data.current_status) {
            pushEvent({ type: 'status_update', ...data, polled: true })
          }
        }
      } catch { /* ignore */ }
      retryTimer.current = setTimeout(poll, 15_000)
    }
    poll()
  }, [orderId, pushEvent, role])

  useEffect(() => {
    mountedRef.current = true
    connect()
    return () => {
      mountedRef.current = false
      clearTimeout(retryTimer.current)
      if (wsRef.current) {
        clearInterval(wsRef.current._heartbeat)
        wsRef.current.close()
      }
    }
  }, [connect])

  return { events, connected, latestUpdate }
}
