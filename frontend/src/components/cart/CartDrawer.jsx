import { Fragment } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Minus, ShoppingBag, Trash2, ArrowRight, IndianRupee } from 'lucide-react'
import { useCart } from '../../context/CartContext'

function CartItem({ item }) {
  const { removeItem, updateQty } = useCart()

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex gap-3 py-4 border-b border-ivory-200 last:border-0"
    >
      {/* Image / placeholder */}
      <div className="w-16 h-16 rounded-xl overflow-hidden bg-ivory-100 flex-shrink-0 border border-ivory-200">
        {item.image_url ? (
          <img src={item.image_url} alt={item.product_name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xl">🪡</div>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="font-body font-semibold text-charcoal-800 text-sm leading-tight line-clamp-1">
          {item.product_name}
        </div>
        {item.product_category && (
          <div className="font-body text-xs text-charcoal-800/40 mt-0.5">{item.product_category}</div>
        )}
        {item.is_custom && (
          <span className="inline-block mt-1 text-[10px] font-body bg-gold-50 text-gold-700 border border-gold-200 px-2 py-0.5 rounded-full">
            Custom
          </span>
        )}

        <div className="flex items-center justify-between mt-2">
          {/* Qty controls */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => updateQty(item.id, item.quantity - 1)}
              className="w-6 h-6 rounded-full border border-ivory-300 flex items-center justify-center hover:border-gold-400 hover:bg-gold-50 transition-colors"
            >
              <Minus size={10} />
            </button>
            <span className="font-body text-sm font-semibold w-5 text-center">{item.quantity}</span>
            <button
              onClick={() => updateQty(item.id, item.quantity + 1)}
              className="w-6 h-6 rounded-full border border-ivory-300 flex items-center justify-center hover:border-gold-400 hover:bg-gold-50 transition-colors"
            >
              <Plus size={10} />
            </button>
          </div>

          {/* Price + remove */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-0.5 font-display font-bold text-gold-600 text-sm">
              <IndianRupee size={12} />
              {(item.unit_price * item.quantity).toLocaleString('en-IN')}
            </div>
            <button
              onClick={() => removeItem(item.id)}
              className="w-6 h-6 flex items-center justify-center text-charcoal-800/30 hover:text-red-500 transition-colors"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default function CartDrawer({ open, onClose }) {
  const { items, itemCount, subtotal, shipping, taxAmount, total, clearCart } = useCart()

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white z-50 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-ivory-200">
              <div className="flex items-center gap-2">
                <ShoppingBag size={18} className="text-gold-600" />
                <span className="font-display font-bold text-charcoal-800 text-lg">Your Cart</span>
                {itemCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-gold-500 text-white text-[10px] font-body font-bold flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                {items.length > 0 && (
                  <button
                    onClick={clearCart}
                    className="text-xs font-body text-charcoal-800/40 hover:text-red-500 transition-colors"
                  >
                    Clear all
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-ivory-100 hover:bg-ivory-200 flex items-center justify-center transition-colors"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-6">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                  <div className="text-5xl mb-4">🛒</div>
                  <div className="font-display text-xl font-semibold text-charcoal-800 mb-2">Your cart is empty</div>
                  <p className="font-body text-sm text-charcoal-800/50 mb-6">
                    Browse our collection and add pieces you love.
                  </p>
                  <button onClick={onClose} className="btn-gold">
                    Continue Shopping
                  </button>
                </div>
              ) : (
                <AnimatePresence>
                  {items.map(item => (
                    <CartItem key={item.id} item={item} />
                  ))}
                </AnimatePresence>
              )}
            </div>

            {/* Footer totals + checkout */}
            {items.length > 0 && (
              <div className="border-t border-ivory-200 px-6 py-5 space-y-3">
                <div className="space-y-1.5">
                  <div className="flex justify-between font-body text-sm text-charcoal-800/60">
                    <span>Subtotal</span>
                    <span>₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between font-body text-sm text-charcoal-800/60">
                    <span>Shipping</span>
                    <span>{shipping === 0 ? <span className="text-green-600 font-semibold">Free</span> : `₹${shipping}`}</span>
                  </div>
                  <div className="flex justify-between font-body text-sm text-charcoal-800/60">
                    <span>GST (18%)</span>
                    <span>₹{taxAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  {subtotal < 2000 && subtotal > 0 && (
                    <p className="text-[11px] text-gold-600 font-body">
                      Add ₹{(2000 - subtotal).toLocaleString('en-IN')} more for free shipping
                    </p>
                  )}
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-ivory-200">
                  <span className="font-display font-bold text-charcoal-800">Total</span>
                  <div className="flex items-center gap-0.5 font-display font-bold text-gold-600 text-xl">
                    <IndianRupee size={17} />
                    {total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <Link
                  to="/checkout"
                  onClick={onClose}
                  className="btn-gold w-full justify-center py-4 rounded-xl"
                >
                  Proceed to Checkout
                  <ArrowRight size={16} />
                </Link>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
