import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Sparkles, IndianRupee } from 'lucide-react'
import AddToCartButton from '../cart/AddToCartButton'
import CartDrawer from '../cart/CartDrawer'

export default function ProductCard({ product }) {
  const mainImage = product.images?.[0]
  const [cartOpen, setCartOpen] = useState(false)

  return (
    <>
      <div className="group block">
        <motion.div
          whileHover={{ y: -4 }}
          transition={{ duration: 0.25 }}
          className="bg-white rounded-2xl overflow-hidden shadow-sm border border-ivory-200 hover:shadow-xl hover:border-gold-200 transition-all duration-300"
        >
          {/* Image */}
          <Link to={`/products/${product.id}`}>
            <div className="relative h-64 bg-ivory-100 overflow-hidden">
              {mainImage ? (
                <img src={mainImage} alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center">
                  <div className="text-4xl mb-2 opacity-40">🪡</div>
                  <span className="text-xs text-charcoal-800/30 font-body">No image yet</span>
                </div>
              )}
              <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                {product.is_featured && (
                  <span className="inline-flex items-center gap-1 bg-gold-gradient text-white text-[10px] font-body font-semibold px-2 py-0.5 rounded-full">
                    <Sparkles size={9} />Featured
                  </span>
                )}
                {product.customizable && (
                  <span className="bg-charcoal-800/80 backdrop-blur-sm text-white text-[10px] font-body px-2 py-0.5 rounded-full">
                    Customizable
                  </span>
                )}
              </div>
              {product.category && (
                <div className="absolute bottom-3 left-3">
                  <span className="bg-white/90 backdrop-blur-sm text-charcoal-800/70 text-[10px] font-body tracking-wide uppercase px-2 py-0.5 rounded-full">
                    {product.category.name}
                  </span>
                </div>
              )}
            </div>
          </Link>

          {/* Info */}
          <div className="p-5">
            <Link to={`/products/${product.id}`}>
              <h3 className="font-display text-charcoal-800 font-semibold text-base mb-1 line-clamp-1 group-hover:text-gold-600 transition-colors">
                {product.name}
              </h3>
              {product.description && (
                <p className="font-body text-charcoal-800/50 text-xs leading-relaxed line-clamp-2 mb-3">
                  {product.description}
                </p>
              )}
            </Link>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-0.5 text-gold-600 font-display font-bold text-lg">
                <IndianRupee size={16} />
                <span>{product.price.toLocaleString('en-IN')}</span>
              </div>
              <AddToCartButton
                product={product}
                size="sm"
                onAdded={() => setCartOpen(true)}
              />
            </div>
          </div>
        </motion.div>
      </div>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  )
}
