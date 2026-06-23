import { createContext, useContext, useReducer, useEffect } from 'react'

const CartContext = createContext(null)

// ── shape of a cart item ────────────────────────────────────────────────────
// { id, product_id, product_name, product_category, unit_price,
//   quantity, is_custom, custom_config, ai_preview_id, image_url }

function cartReducer(state, action) {
  switch (action.type) {

    case 'ADD_ITEM': {
      const existing = state.items.findIndex(i => i.id === action.item.id)
      if (existing >= 0) {
        const updated = [...state.items]
        updated[existing] = {
          ...updated[existing],
          quantity: updated[existing].quantity + (action.item.quantity || 1),
        }
        return { ...state, items: updated }
      }
      return { ...state, items: [...state.items, { ...action.item, quantity: action.item.quantity || 1 }] }
    }

    case 'REMOVE_ITEM':
      return { ...state, items: state.items.filter(i => i.id !== action.id) }

    case 'UPDATE_QTY': {
      if (action.quantity < 1) {
        return { ...state, items: state.items.filter(i => i.id !== action.id) }
      }
      return {
        ...state,
        items: state.items.map(i =>
          i.id === action.id ? { ...i, quantity: action.quantity } : i
        ),
      }
    }

    case 'CLEAR':
      return { ...state, items: [] }

    default:
      return state
  }
}

const STORAGE_KEY = 'hag_cart_v1'

function loadCart() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : { items: [] }
  } catch {
    return { items: [] }
  }
}

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, undefined, loadCart)

  // Persist to localStorage on every change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  // Derived totals
  const itemCount = state.items.reduce((s, i) => s + i.quantity, 0)
  const subtotal  = state.items.reduce((s, i) => s + i.unit_price * i.quantity, 0)
  const shipping  = subtotal >= 2000 ? 0 : subtotal > 0 ? 150 : 0
  const taxAmount = ((subtotal + shipping) * 0.18)
  const total     = subtotal + shipping + taxAmount

  const addItem    = (item) => dispatch({ type: 'ADD_ITEM', item })
  const removeItem = (id)   => dispatch({ type: 'REMOVE_ITEM', id })
  const updateQty  = (id, quantity) => dispatch({ type: 'UPDATE_QTY', id, quantity })
  const clearCart  = ()     => dispatch({ type: 'CLEAR' })

  return (
    <CartContext.Provider value={{
      items: state.items,
      itemCount,
      subtotal,
      shipping,
      taxAmount,
      total,
      addItem,
      removeItem,
      updateQty,
      clearCart,
    }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
