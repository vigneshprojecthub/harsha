import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingBag } from 'lucide-react'
import { useCart } from '../../context/CartContext'

export default function CartIcon({ onClick }) {
  const { itemCount } = useCart()

  return (
    <button
      onClick={onClick}
      className="relative p-2 text-white hover:text-gold-300 transition-colors"
      aria-label={`Cart (${itemCount} items)`}
    >
      <ShoppingBag size={20} />
      <AnimatePresence>
        {itemCount > 0 && (
          <motion.span
            key="badge"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 min-w-[18px] min-h-[18px] flex items-center justify-center rounded-full bg-gold-500 text-white text-[9px] font-bold font-body"
          >
            {itemCount > 99 ? '99+' : itemCount}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  )
}
