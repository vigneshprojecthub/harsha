import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import {
  TrendingUp, TrendingDown, ShoppingBag, IndianRupee,
  Star, Users, Package, Tag, RefreshCw, Loader2
} from 'lucide-react'
import axios from 'axios'

const GOLD = '#c8860f'
const DARK = '#1a1510'
const COLORS = ['#c8860f','#9b59b6','#2980b9','#27ae60','#e67e22','#e74c3c','#16a085','#f39c12']

function StatCard({ icon: Icon, label, value, sub, delta, color = 'gold', delay = 0 }) {
  const isPos = delta >= 0
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm"
    >
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${
        color === 'gold' ? 'bg-gold-gradient' :
        color === 'purple' ? 'bg-purple-100' :
        color === 'blue' ? 'bg-blue-100' : 'bg-green-100'
      }`}>
        <Icon size={19} className={
          color === 'gold' ? 'text-white' :
          color === 'purple' ? 'text-purple-600' :
          color === 'blue' ? 'text-blue-600' : 'text-green-600'
        } />
      </div>
      <div className="font-display text-3xl font-bold text-charcoal-800">{value}</div>
      <div className="font-body text-sm text-charcoal-800/50 mt-1">{label}</div>
      {(sub || delta !== undefined) && (
        <div className="flex items-center gap-2 mt-2">
          {delta !== undefined && (
            <span className={`flex items-center gap-0.5 text-xs font-body font-semibold ${isPos ? 'text-green-600' : 'text-red-500'}`}>
              {isPos ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
              {Math.abs(delta)}%
            </span>
          )}
          {sub && <span className="text-xs font-body text-charcoal-800/30">{sub}</span>}
        </div>
      )}
    </motion.div>
  )
}

function FunnelBar({ label, value, max, pct, color }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs font-body">
        <span className="text-charcoal-800/60">{label}</span>
        <span className="font-semibold text-charcoal-800">{value.toLocaleString()} <span className="text-charcoal-800/30">({pct}%)</span></span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${(value / (max || 1)) * 100}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ background: color }}
        />
      </div>
    </div>
  )
}

export default function AdminAnalytics() {
  const [overview,    setOverview]    = useState(null)
  const [daily,       setDaily]       = useState([])
  const [topProducts, setTopProducts] = useState([])
  const [topCustomers,setTopCustomers]= useState([])
  const [days,        setDays]        = useState(30)
  const [loading,     setLoading]     = useState(true)
  const [refreshing,  setRefreshing]  = useState(false)

  const fetchAll = async (d = days) => {
    setRefreshing(true)
    try {
      const [ov, dv, tp, tc] = await Promise.all([
        axios.get(`/api/analytics/overview?days=${d}`),
        axios.get(`/api/analytics/daily-revenue?days=${d}`),
        axios.get('/api/analytics/top-products?limit=8'),
        axios.get('/api/analytics/top-customers?limit=8'),
      ])
      setOverview(ov.data)
      setDaily(dv.data)
      setTopProducts(tp.data)
      setTopCustomers(tc.data)
    } catch (e) {
      console.error('Analytics fetch failed', e)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { fetchAll(days) }, [days])

  const fmt = (n) => `₹${Number(n).toLocaleString('en-IN')}`

  if (loading) return (
    <div className="p-8 flex items-center justify-center h-96">
      <div className="text-center">
        <Loader2 size={36} className="animate-spin text-gold-500 mx-auto mb-3" />
        <p className="font-body text-charcoal-800/40">Loading analytics…</p>
      </div>
    </div>
  )

  const sales   = overview?.sales || {}
  const funnel  = overview?.funnel || {}
  const cats    = overview?.categories || []
  const reviews = overview?.reviews || {}
  const coupons = overview?.top_coupons || []

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-charcoal-800">Analytics</h1>
          <p className="font-body text-charcoal-800/50 mt-1">Business intelligence dashboard</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={days}
            onChange={e => setDays(Number(e.target.value))}
            className="px-3 py-2 border border-gray-200 rounded-xl font-body text-sm focus:outline-none focus:border-gold-400 bg-white"
          >
            {[7, 14, 30, 60, 90].map(d => (
              <option key={d} value={d}>Last {d} days</option>
            ))}
          </select>
          <button onClick={() => fetchAll(days)} disabled={refreshing}
            className="p-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50">
            <RefreshCw size={15} className={`text-charcoal-800/50 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard icon={IndianRupee} label="Total Revenue" color="gold"
          value={fmt(sales.total_revenue || 0)}
          delta={sales.revenue_delta_pct} sub={`vs prev ${days}d`} delay={0} />
        <StatCard icon={ShoppingBag} label="Confirmed Orders" color="purple"
          value={sales.confirmed_orders || 0}
          sub={`of ${sales.total_orders || 0} total`} delay={0.08} />
        <StatCard icon={IndianRupee} label="Avg Order Value" color="blue"
          value={fmt(sales.avg_order_value || 0)} delay={0.16} />
        <StatCard icon={Star} label="Avg Rating" color="green" delay={0.24}
          value={reviews.avg_rating ? `${reviews.avg_rating} ★` : '—'}
          sub={`${reviews.total_reviews || 0} reviews`} />
      </div>

      {/* Revenue Chart */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <h2 className="font-display font-bold text-charcoal-800 text-lg mb-6">Daily Revenue</h2>
        {daily.length > 0 ? (
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={daily}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0e9d4" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9a9080' }}
                tickFormatter={d => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} />
              <YAxis tick={{ fontSize: 11, fill: '#9a9080' }}
                tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v, n) => [fmt(v), n === 'revenue' ? 'Revenue' : 'Orders']}
                labelFormatter={d => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })} />
              <Line type="monotone" dataKey="revenue" stroke={GOLD} strokeWidth={2.5}
                dot={{ fill: GOLD, r: 3 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-40 flex items-center justify-center text-charcoal-800/30 font-body text-sm">
            No revenue data for this period
          </div>
        )}
      </div>

      {/* Top Products + Categories */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="font-display font-bold text-charcoal-800 text-lg mb-5">Top Products</h2>
          {topProducts.length > 0 ? (
            <div className="space-y-3">
              {topProducts.slice(0, 6).map((p, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-ivory-100 flex items-center justify-center text-xs font-body font-bold text-charcoal-800/40 flex-shrink-0">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-body text-sm font-semibold text-charcoal-800 truncate">{p.product_name}</div>
                    <div className="font-body text-xs text-charcoal-800/40">{p.category} · {p.order_count} orders</div>
                  </div>
                  <div className="text-right">
                    <div className="font-body font-semibold text-gold-600 text-sm">₹{Number(p.total_revenue).toLocaleString('en-IN')}</div>
                    <div className="font-body text-xs text-charcoal-800/30">{p.total_qty} units</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-charcoal-800/30 font-body text-sm">No product data yet</p>
          )}
        </div>

        {/* Category Pie */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="font-display font-bold text-charcoal-800 text-lg mb-5">Revenue by Category</h2>
          {cats.length > 0 ? (
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <ResponsiveContainer width={180} height={180}>
                <PieChart>
                  <Pie data={cats} dataKey="revenue" nameKey="category" innerRadius={50} outerRadius={80}>
                    {cats.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => fmt(v)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2 w-full">
                {cats.map((c, i) => (
                  <div key={i} className="flex items-center justify-between text-xs font-body">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="text-charcoal-800/70 truncate max-w-[120px]">{c.category}</span>
                    </div>
                    <span className="font-semibold text-charcoal-800">{c.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-charcoal-800/30 font-body text-sm">No category data yet</p>
          )}
        </div>
      </div>

      {/* Conversion Funnel */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display font-bold text-charcoal-800 text-lg">Conversion Funnel</h2>
          <span className="font-body text-xs text-charcoal-800/40">Overall: {funnel.overall || 0}%</span>
        </div>
        <div className="space-y-4 max-w-xl">
          {[
            { label: 'Product Views',    value: funnel.product_views  || 0, pct: 100,                         color: COLORS[0] },
            { label: 'Add to Cart',      value: funnel.add_to_cart    || 0, pct: funnel.view_to_cart    || 0, color: COLORS[1] },
            { label: 'Checkout Started', value: funnel.checkout_start || 0, pct: funnel.cart_to_checkout|| 0, color: COLORS[2] },
            { label: 'Payment Started',  value: funnel.payment_start  || 0, pct: funnel.checkout_to_pay || 0, color: COLORS[3] },
            { label: 'Order Complete',   value: funnel.order_complete || 0, pct: funnel.pay_to_complete  || 0, color: COLORS[4] },
          ].map(f => (
            <FunnelBar key={f.label} {...f} max={funnel.product_views || 1} />
          ))}
        </div>
      </div>

      {/* Top Customers + Coupon Performance */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top Customers */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="font-display font-bold text-charcoal-800 text-lg mb-5 flex items-center gap-2">
            <Users size={17} className="text-gold-500" />Top Customers
          </h2>
          {topCustomers.length > 0 ? (
            <div className="space-y-3">
              {topCustomers.map((c, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gold-gradient flex items-center justify-center text-white font-display font-bold text-xs flex-shrink-0">
                    {c.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="font-body text-sm font-semibold text-charcoal-800">{c.name}</div>
                    <div className="font-body text-xs text-charcoal-800/40">{c.order_count} orders · {c.phone}</div>
                  </div>
                  <div className="font-body font-bold text-gold-600 text-sm">₹{Number(c.total_spent).toLocaleString('en-IN')}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-charcoal-800/30 font-body text-sm">No customer data yet</p>
          )}
        </div>

        {/* Coupon Performance */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="font-display font-bold text-charcoal-800 text-lg mb-5 flex items-center gap-2">
            <Tag size={17} className="text-gold-500" />Coupon Performance
          </h2>
          {coupons.length > 0 ? (
            <div className="space-y-3">
              {coupons.map((c, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="inline-flex items-center justify-center font-mono text-xs font-bold bg-ivory-100 text-charcoal-800 px-2.5 py-1 rounded-lg border border-ivory-300 min-w-[80px]">
                    {c.code}
                  </span>
                  <div className="flex-1">
                    <div className="font-body text-xs text-charcoal-800/50">{c.campaign || 'General'}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-body text-sm font-semibold text-charcoal-800">{c.total_used} uses</div>
                    <div className="font-body text-xs text-red-500">-₹{Number(c.total_discount).toLocaleString('en-IN')}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-charcoal-800/30 font-body text-sm">No coupons used yet</p>
          )}
        </div>
      </div>
    </div>
  )
}
