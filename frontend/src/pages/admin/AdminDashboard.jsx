import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Package, ShoppingBag, Tag, TrendingUp, Plus, Database } from 'lucide-react'
import { adminApi } from '../../utils/api'

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [seeding, setSeeding] = useState(false)
  const [seedMsg, setSeedMsg] = useState('')

  useEffect(() => {
    adminApi.getStats().then(r => setStats(r.data)).catch(() => {})
  }, [])

  const handleSeed = async () => {
    setSeeding(true)
    setSeedMsg('')
    try {
      const res = await adminApi.seed()
      setSeedMsg(`✓ Seeded: ${res.data.categories} categories, ${res.data.products} products`)
      const r = await adminApi.getStats()
      setStats(r.data)
    } catch {
      setSeedMsg('Seed failed. Make sure the backend is running.')
    } finally {
      setSeeding(false)
    }
  }

  const statCards = stats ? [
    { label: 'Total Products', value: stats.total_products, icon: Package, color: 'text-blue-600 bg-blue-50' },
    { label: 'Categories', value: stats.total_categories, icon: Tag, color: 'text-purple-600 bg-purple-50' },
    { label: 'Total Orders', value: stats.total_orders, icon: ShoppingBag, color: 'text-green-600 bg-green-50' },
    { label: 'Pending Orders', value: stats.pending_orders, icon: TrendingUp, color: 'text-amber-600 bg-amber-50' },
  ] : []

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-charcoal-800">Dashboard</h1>
        <p className="font-body text-charcoal-800/50 mt-1">Welcome to Harsha Art Gallery Admin</p>
      </div>

      {/* Seed Button */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8 flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="font-body font-semibold text-amber-800 text-sm">First Time Setup</div>
          <div className="font-body text-xs text-amber-700/70">Seed the database with initial categories and sample products</div>
        </div>
        <div className="flex items-center gap-3">
          {seedMsg && <span className="text-xs text-green-700 font-body">{seedMsg}</span>}
          <button
            onClick={handleSeed}
            disabled={seeding}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white text-sm font-body rounded-lg hover:bg-amber-700 disabled:opacity-60 transition-colors"
          >
            <Database size={14} />
            {seeding ? 'Seeding...' : 'Seed Database'}
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-10">
          {statCards.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm"
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 ${s.color}`}>
                <s.icon size={18} />
              </div>
              <div className="font-display text-3xl font-bold text-charcoal-800">{s.value}</div>
              <div className="font-body text-sm text-charcoal-800/50 mt-1">{s.label}</div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="font-display text-xl font-semibold text-charcoal-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link to="/admin/products/new"
            className="flex items-center gap-3 p-5 bg-white border border-gray-100 rounded-xl shadow-sm hover:border-gold-300 hover:shadow-md transition-all group">
            <div className="w-10 h-10 bg-gold-gradient rounded-lg flex items-center justify-center">
              <Plus size={18} className="text-white" />
            </div>
            <div>
              <div className="font-body font-semibold text-charcoal-800 group-hover:text-gold-700 transition-colors">Add Product</div>
              <div className="font-body text-xs text-charcoal-800/40">Create a new product listing</div>
            </div>
          </Link>
          <Link to="/admin/products"
            className="flex items-center gap-3 p-5 bg-white border border-gray-100 rounded-xl shadow-sm hover:border-gold-300 hover:shadow-md transition-all group">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Package size={18} className="text-blue-600" />
            </div>
            <div>
              <div className="font-body font-semibold text-charcoal-800 group-hover:text-gold-700 transition-colors">Manage Products</div>
              <div className="font-body text-xs text-charcoal-800/40">Edit or delete products</div>
            </div>
          </Link>
          <Link to="/admin/orders"
            className="flex items-center gap-3 p-5 bg-white border border-gray-100 rounded-xl shadow-sm hover:border-gold-300 hover:shadow-md transition-all group">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <ShoppingBag size={18} className="text-green-600" />
            </div>
            <div>
              <div className="font-body font-semibold text-charcoal-800 group-hover:text-gold-700 transition-colors">View Orders</div>
              <div className="font-body text-xs text-charcoal-800/40">Manage custom orders</div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
