import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { productsApi } from '../../utils/api'
import ProductCard from '../products/ProductCard'

export default function FeaturedProducts() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    productsApi.getAll({ featured: true, limit: 6 })
      .then(r => setProducts(r.data))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false))
  }, [])

  // Skeleton placeholders while loading
  const skeletons = Array(6).fill(null)

  return (
    <section className="py-24 bg-ivory-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <div className="section-subtitle mb-2">Our Finest Work</div>
          <h2 className="section-title mb-4">Featured Collection</h2>
          <div className="gold-divider" />
          <p className="mt-5 text-charcoal-800/60 max-w-xl mx-auto font-body leading-relaxed">
            Each piece in our featured collection represents the pinnacle of handcraft artistry —
            selected for its exceptional detail and timeless appeal.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {loading
            ? skeletons.map((_, i) => (
                <div key={i} className="bg-white rounded-xl h-80 animate-pulse">
                  <div className="h-56 bg-ivory-200 rounded-t-xl" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-ivory-200 rounded w-3/4" />
                    <div className="h-4 bg-ivory-200 rounded w-1/2" />
                  </div>
                </div>
              ))
            : products.map((product, i) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <ProductCard product={product} />
                </motion.div>
              ))
          }
        </div>

        {!loading && products.length === 0 && (
          <div className="text-center py-16">
            <p className="text-charcoal-800/40 font-body mb-6">
              Products are being added. Check back soon!
            </p>
            <Link to="/admin" className="btn-gold">
              Add Products (Admin)
            </Link>
          </div>
        )}

        {products.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <Link to="/products" className="btn-outline-gold">
              View Full Gallery
            </Link>
          </motion.div>
        )}
      </div>
    </section>
  )
}
