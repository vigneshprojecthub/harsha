import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingBag, Check } from 'lucide-react'
import { useCart } from '../../context/CartContext'

export default function AddToCartButton({ product, className = '', size = 'md', onAdded }) {
  const { addItem } = useCart()
  const [added, setAdded] = useState(false)

  const handleAdd = (e) => {
    e.preventDefault()
    e.stopPropagation()

    addItem({
      id:               `product-${product.id}`,
      product_id:       product.id,
      product_name:     product.name,
      product_category: product.category?.name,
      unit_price:       product.price,
      quantity:         1,
      is_custom:        false,
      image_url:        product.images?.[0] || null,
    })

    setAdded(true)
    onAdded?.()
    setTimeout(() => setAdded(false), 2000)
  }

  const sizeClasses = size === 'sm'
    ? 'text-xs px-3 py-2 gap-1.5'
    : 'text-sm px-5 py-3 gap-2'

  return (
    <motion.button
      onClick={handleAdd}
      whileTap={{ scale: 0.96 }}
      className={`
        inline-flex items-center justify-center font-body font-semibold rounded-xl
        transition-all duration-300 overflow-hidden
        ${added
          ? 'bg-green-600 text-white'
          : 'bg-gold-gradient text-white hover:shadow-lg hover:shadow-gold-400/30'
        }
        ${sizeClasses} ${className}
      `}
    >
      <AnimatePresence mode="wait">
        {added ? (
          <motion.span key="done" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-center gap-1.5">
            <Check size={14} /> Added!
          </motion.span>
        ) : (
          <motion.span key="add" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex items-center gap-1.5">
            <ShoppingBag size={14} /> Add to Cart
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  )
}
