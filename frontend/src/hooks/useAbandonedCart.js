import { useEffect, useRef } from 'react'
import axios from 'axios'
import { useCart } from '../context/CartContext'

/**
 * useAbandonedCart
 * Silently saves cart state to the backend whenever the cart changes.
 * Triggers after a 3-second debounce so we don't spam the API.
 *
 * Call this in a top-level component (Layout or App) so it runs site-wide.
 */
export function useAbandonedCart(contactInfo = {}) {
  const { items, total } = useCart()
  const timer = useRef(null)

  // Generate/retrieve a stable session ID
  const sessionId = (() => {
    let id = localStorage.getItem('hag_session')
    if (!id) {
      id = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
      localStorage.setItem('hag_session', id)
    }
    return id
  })()

  useEffect(() => {
    if (items.length === 0) return   // nothing to track

    clearTimeout(timer.current)
    timer.current = setTimeout(async () => {
      try {
        await axios.post('/api/abandoned-cart', {
          session_id:  sessionId,
          phone:       contactInfo.phone  || null,
          email:       contactInfo.email  || null,
          name:        contactInfo.name   || null,
          cart_data:   items.map(i => ({
            product_id:   i.product_id,
            product_name: i.product_name,
            quantity:     i.quantity,
            unit_price:   i.unit_price,
          })),
          total_value: total,
        })
      } catch { /* silent — don't disrupt UX */ }
    }, 3000)

    return () => clearTimeout(timer.current)
  }, [items, total, contactInfo.phone])

  /**
   * Call this after a successful checkout to mark the cart as recovered.
   */
  const markRecovered = async (orderId) => {
    try {
      await axios.post(`/api/abandoned-cart/${sessionId}/recover?order_id=${orderId}`)
    } catch { /* silent */ }
  }

  return { sessionId, markRecovered }
}
