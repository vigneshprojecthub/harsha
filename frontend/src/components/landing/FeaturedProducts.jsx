import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { productsApi } from '../../utils/api'
import ProductCard from '../products/ProductCard'

export default function FeaturedProducts() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    productsApi.getAll({ featured: true, limit: 8 })
      .then(r => setProducts(r.data))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <section className="py-6 sm:py-8">
      <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 mb-4">
        <h2 className="font-display text-base sm:text-lg font-bold text-white">Featured Collection</h2>
        <Link to="/products" className="font-body text-xs text-gold-400 hover:text-gold-300">See all →</Link>
      </div>

      {/* Horizontal scroll on mobile/tablet, grid on large desktop */}
      <div className="flex gap-4 overflow-x-auto scrollbar-hide px-4 sm:px-6 lg:px-8 pb-2
        lg:grid lg:grid-cols-4 lg:overflow-visible">
        {loading
          ? Array(4).fill(null).map((_, i) => (
              <div key={i} className="flex-shrink-0 w-44 sm:w-52 lg:w-auto bg-charcoal-800 rounded-xl h-64 animate-pulse" />
            ))
          : products.map((product, i) => (
              <motion.div key={product.id}
                initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.07 }}
                className="flex-shrink-0 w-44 sm:w-52 lg:w-auto">
                <ProductCard product={product} compact />
              </motion.div>
            ))
        }
        {/* "View all" card */}
        {!loading && products.length > 0 && (
          <div className="flex-shrink-0 w-44 sm:w-52 lg:w-auto">
            <Link to="/products"
              className="flex flex-col items-center justify-center h-full min-h-[200px] rounded-xl
                border-2 border-dashed border-gold-600/30 text-gold-400 hover:border-gold-500/60
                hover:bg-gold-500/5 transition-all duration-200 gap-2 px-4">
              <span className="text-2xl">→</span>
              <span className="font-body text-xs text-center">View full gallery</span>
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}
