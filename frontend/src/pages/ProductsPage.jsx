import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search, Filter, X } from 'lucide-react'
import { productsApi, categoriesApi } from '../utils/api'
import ProductCard from '../components/products/ProductCard'

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '')

  useEffect(() => {
    categoriesApi.getAll().then(r => setCategories(r.data))
  }, [])

  useEffect(() => {
    setLoading(true)
    const params = {}
    if (search) params.search = search
    if (selectedCategory) {
      const cat = categories.find(c => c.slug === selectedCategory)
      if (cat) params.category_id = cat.id
    }
    productsApi.getAll(params)
      .then(r => setProducts(r.data))
      .finally(() => setLoading(false))
  }, [search, selectedCategory, categories])

  const clearFilters = () => {
    setSearch('')
    setSelectedCategory('')
    setSearchParams({})
  }

  const hasFilters = search || selectedCategory

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-ivory-50 pt-24"
    >
      {/* Page Header */}
      <div className="bg-charcoal-900 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="font-accent text-gold-400 italic text-lg mb-2">Handcrafted Excellence</div>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-white mb-4">Our Gallery</h1>
          <div className="w-12 h-0.5 bg-gold-gradient mx-auto" />
          <p className="mt-4 text-ivory-200/60 font-body max-w-lg mx-auto">
            Browse our collection of premium handcrafted embroidery pieces
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-10">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal-800/40" />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-ivory-300 rounded-xl font-body text-sm focus:outline-none focus:border-gold-400 bg-white"
            />
          </div>

          {/* Category filter */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setSelectedCategory('')}
              className={`px-4 py-2 rounded-xl text-sm font-body transition-all border ${
                !selectedCategory
                  ? 'bg-gold-500 text-white border-gold-500'
                  : 'bg-white text-charcoal-800/70 border-ivory-300 hover:border-gold-400'
              }`}
            >
              All
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.slug === selectedCategory ? '' : cat.slug)}
                className={`px-4 py-2 rounded-xl text-sm font-body transition-all border ${
                  selectedCategory === cat.slug
                    ? 'bg-gold-500 text-white border-gold-500'
                    : 'bg-white text-charcoal-800/70 border-ivory-300 hover:border-gold-400'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 px-3 py-2 text-xs text-charcoal-800/60 hover:text-charcoal-800 transition-colors"
            >
              <X size={14} />
              Clear
            </button>
          )}
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array(8).fill(null).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl h-80 animate-pulse border border-ivory-200">
                <div className="h-56 bg-ivory-100 rounded-t-2xl" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-ivory-100 rounded w-3/4" />
                  <div className="h-4 bg-ivory-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="font-display text-xl text-charcoal-800 mb-2">No products found</h3>
            <p className="font-body text-charcoal-800/50 mb-6">Try adjusting your search or filters</p>
            <button onClick={clearFilters} className="btn-gold">Clear Filters</button>
          </div>
        ) : (
          <>
            <div className="mb-5 font-body text-sm text-charcoal-800/50">
              Showing {products.length} product{products.length !== 1 ? 's' : ''}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product, i) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>
    </motion.div>
  )
}
