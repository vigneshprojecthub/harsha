import { useCallback, useRef } from 'react'
import axios from 'axios'

let _sessionId = null

function getSessionId() {
  if (_sessionId) return _sessionId
  _sessionId = localStorage.getItem('hag_session') || `sess_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
  localStorage.setItem('hag_session', _sessionId)
  return _sessionId
}

/**
 * useAnalytics
 * Returns a `track(eventType, props)` function.
 * Fire-and-forget — never blocks or throws.
 *
 * Event types used across the app:
 *   product_view, add_to_cart, checkout_start,
 *   payment_start, order_complete, coupon_applied, review_submitted
 */
export function useAnalytics() {
  const queue = useRef([])
  const flushing = useRef(false)

  const flush = useCallback(async () => {
    if (flushing.current || queue.current.length === 0) return
    flushing.current = true
    const batch = queue.current.splice(0)
    try {
      // Send each event (could batch in production)
      await Promise.all(
        batch.map(ev =>
          axios.post('/api/analytics/event', ev).catch(() => { /* silent */ })
        )
      )
    } finally {
      flushing.current = false
      if (queue.current.length > 0) flush()
    }
  }, [])

  const track = useCallback((eventType, props = {}) => {
    queue.current.push({
      event_type: eventType,
      session_id: getSessionId(),
      ...props,
    })
    flush()
  }, [flush])

  return { track }
}

// Standalone helper for use outside of React components
export function trackEvent(eventType, props = {}) {
  axios.post('/api/analytics/event', {
    event_type: eventType,
    session_id: getSessionId(),
    ...props,
  }).catch(() => { /* silent */ })
}
