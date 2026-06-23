import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, Edit2, Trash2, Sparkles, IndianRupee } from 'lucide-react'
import { productsApi } from '../../utils/api'

export default function AdminProducts() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(null)

  const fetchProducts = () => {
    productsApi.getAll({ limit: 100 }).then(r => setProducts(r.data)).finally(() => setLoading(false))
  }

  useEffect(() => { fetchProducts() }, [])

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return
    setDeleting(id)
    try {
      await productsApi.delete(id)
      setProducts(prev => prev.filter(p => p.id !== id))
    } catch {
      alert('Failed to delete product.')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-charcoal-800">Products</h1>
          <p className="font-body text-charcoal-800/50 mt-1">{products.length} total products</p>
        </div>
        <Link to="/admin/products/new" className="btn-gold">
          <Plus size={16} />
          Add Product
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array(5).fill(null).map((_, i) => (
            <div key={i} className="bg-white rounded-xl h-20 animate-pulse border border-gray-100" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <div className="text-5xl mb-4">📦</div>
          <h3 className="font-display text-xl text-charcoal-800 mb-2">No products yet</h3>
          <p className="font-body text-charcoal-800/50 mb-5">Add your first product to get started</p>
          <Link to="/admin/products/new" className="btn-gold">Add First Product</Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-6 py-4 font-body text-xs font-semibold text-charcoal-800/50 tracking-wide uppercase">Product</th>
                <th className="text-left px-6 py-4 font-body text-xs font-semibold text-charcoal-800/50 tracking-wide uppercase">Category</th>
                <th className="text-left px-6 py-4 font-body text-xs font-semibold text-charcoal-800/50 tracking-wide uppercase">Price</th>
                <th className="text-left px-6 py-4 font-body text-xs font-semibold text-charcoal-800/50 tracking-wide uppercase">Flags</th>
                <th className="text-right px-6 py-4 font-body text-xs font-semibold text-charcoal-800/50 tracking-wide uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {products.map((product, i) => (
                <motion.tr
                  key={product.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="hover:bg-gray-50/50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-ivory-100 overflow-hidden flex-shrink-0">
                        {product.images?.[0] ? (
                          <img src={product.images[0]} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-lg">🪡</div>
                        )}
                      </div>
                      <div>
                        <div className="font-body font-semibold text-charcoal-800 text-sm">{product.name}</div>
                        <div className="font-body text-xs text-charcoal-800/40 line-clamp-1 max-w-48">
                          {product.description || '—'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-body text-sm text-charcoal-800/60">{product.category?.name}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-0.5 font-body font-semibold text-gold-600 text-sm">
                      <IndianRupee size={13} />
                      {product.price.toLocaleString('en-IN')}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-1 flex-wrap">
                      {product.is_featured && (
                        <span className="inline-flex items-center gap-1 bg-gold-50 text-gold-700 text-[10px] font-body px-2 py-0.5 rounded-full">
                          <Sparkles size={9} />Featured
                        </span>
                      )}
                      {product.customizable && (
                        <span className="bg-green-50 text-green-700 text-[10px] font-body px-2 py-0.5 rounded-full">Custom</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        to={`/admin/products/${product.id}/edit`}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-body text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        <Edit2 size={12} />
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(product.id, product.name)}
                        disabled={deleting === product.id}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-body text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                      >
                        <Trash2 size={12} />
                        {deleting === product.id ? '...' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
