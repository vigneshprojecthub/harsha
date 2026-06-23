import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, Eye, IndianRupee, Download, Package, FileText } from 'lucide-react'
import { ordersApi } from '../../utils/api'
import axios from 'axios'

const STATUS_COLORS = {
  pending:    'bg-amber-50 text-amber-700 border-amber-200',
  confirmed:  'bg-blue-50 text-blue-700 border-blue-200',
  processing: 'bg-purple-50 text-purple-700 border-purple-200',
  in_progress:'bg-purple-50 text-purple-700 border-purple-200',
  shipped:    'bg-indigo-50 text-indigo-700 border-indigo-200',
  delivered:  'bg-green-50 text-green-700 border-green-200',
  completed:  'bg-green-50 text-green-700 border-green-200',
  cancelled:  'bg-red-50 text-red-700 border-red-200',
}

function ShopOrdersTab() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    axios.get('/api/checkout/orders').then(r => setOrders(r.data)).finally(() => setLoading(false))
  }, [])

  const updateStatus = async (id, status) => {
    await axios.post(`/api/checkout/orders/${id}/status?status=${status}`)
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o))
    if (selected?.id === id) setSelected(p => ({ ...p, status }))
  }

  if (loading) return <div className="space-y-3">{Array(4).fill(null).map((_, i) => <div key={i} className="bg-white rounded-xl h-16 animate-pulse border border-gray-100" />)}</div>
  if (orders.length === 0) return (
    <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
      <Package size={40} className="mx-auto text-charcoal-800/20 mb-3" />
      <h3 className="font-display text-xl text-charcoal-800 mb-2">No shop orders yet</h3>
      <p className="font-body text-charcoal-800/40 text-sm">Cart orders will appear here after customers complete checkout</p>
    </div>
  )

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {['Order', 'Customer', 'Amount', 'Status', ''].map(h => (
                  <th key={h} className="text-left px-5 py-4 font-body text-xs font-semibold text-charcoal-800/50 tracking-wide uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {orders.map((order, i) => (
                <motion.tr key={order.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                  className={`hover:bg-gray-50/50 transition-colors cursor-pointer ${selected?.id === order.id ? 'bg-gold-50/50' : ''}`}
                  onClick={() => setSelected(order)}>
                  <td className="px-5 py-4">
                    <div className="font-body font-semibold text-charcoal-800 text-sm">{order.order_number}</div>
                    <div className="font-body text-xs text-charcoal-800/40">{new Date(order.created_at).toLocaleDateString('en-IN')}</div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="font-body text-sm text-charcoal-800">{order.customer_name}</div>
                    <div className="font-body text-xs text-charcoal-800/40">{order.customer_phone}</div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-0.5 font-body font-semibold text-gold-600 text-sm">
                      <IndianRupee size={12} />{Number(order.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <select value={order.status}
                      onChange={e => { e.stopPropagation(); updateStatus(order.id, e.target.value) }}
                      onClick={e => e.stopPropagation()}
                      className={`text-xs font-body border rounded-full px-2.5 py-1 focus:outline-none ${STATUS_COLORS[order.status] || 'bg-gray-50 text-gray-700 border-gray-200'}`}>
                      {['pending','confirmed','processing','shipped','delivered','cancelled'].map(s => (
                        <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-5 py-4">
                    <button onClick={e => { e.stopPropagation(); setSelected(order) }} className="p-1.5 text-charcoal-800/40 hover:text-charcoal-800 hover:bg-gray-100 rounded-lg transition-colors"><Eye size={14} /></button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div>
        {selected ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 sticky top-6 space-y-4">
            <div className="flex items-start justify-between">
              <h3 className="font-display font-semibold text-charcoal-800 text-sm">{selected.order_number}</h3>
              <span className={`text-xs font-body border rounded-full px-2 py-0.5 ${STATUS_COLORS[selected.status]}`}>{selected.status}</span>
            </div>
            <div>
              <div className="font-body text-xs font-semibold text-charcoal-800/40 uppercase tracking-wide mb-1">Customer</div>
              <div className="font-body text-sm text-charcoal-800">{selected.customer_name}</div>
              <div className="font-body text-xs text-charcoal-800/50">{selected.customer_phone}</div>
              {selected.customer_email && <div className="font-body text-xs text-charcoal-800/50">{selected.customer_email}</div>}
            </div>
            <div>
              <div className="font-body text-xs font-semibold text-charcoal-800/40 uppercase tracking-wide mb-1">Ship To</div>
              <div className="font-body text-xs text-charcoal-800/70 leading-relaxed">
                {selected.address_line1}{selected.address_line2 ? `, ${selected.address_line2}` : ''}<br/>{selected.city}, {selected.state} - {selected.pincode}
              </div>
            </div>
            {selected.items?.length > 0 && (
              <div>
                <div className="font-body text-xs font-semibold text-charcoal-800/40 uppercase tracking-wide mb-2">Items</div>
                <div className="space-y-1">
                  {selected.items.map(item => (
                    <div key={item.id} className="flex justify-between text-xs font-body">
                      <span className="text-charcoal-800/70 truncate max-w-[70%]">{item.product_name} × {item.quantity}</span>
                      <span className="text-charcoal-800 font-semibold">₹{Number(item.line_total).toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="border-t border-gray-100 pt-3">
              <div className="flex justify-between font-body font-bold text-sm text-charcoal-800">
                <span>Total</span>
                <span className="text-gold-600">₹{Number(selected.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <a href={`/api/checkout/invoice/${selected.id}`} target="_blank" rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 border border-gold-300 text-gold-700 font-body text-xs font-semibold rounded-xl hover:bg-gold-50 transition-colors">
                <Download size={13} />Invoice
              </a>
              <a href={`https://wa.me/${(selected.customer_phone || '').replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-green-600 text-white font-body text-xs font-semibold rounded-xl hover:bg-green-700 transition-colors">
                <MessageCircle size={13} />WhatsApp
              </a>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-charcoal-800/20">
            <Eye size={24} className="mx-auto mb-2" /><p className="font-body text-sm">Click an order to view details</p>
          </div>
        )}
      </div>
    </div>
  )
}

function CustomOrdersTab() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    ordersApi.getAll().then(r => setOrders(r.data)).finally(() => setLoading(false))
  }, [])

  const updateStatus = async (id, status) => {
    await ordersApi.updateStatus(id, status)
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o))
    if (selected?.id === id) setSelected(p => ({ ...p, status }))
  }

  const openWhatsApp = (order) => {
    const msg = `Hi ${order.customer_name}! This is Harsha Art Gallery regarding your custom order for "${order.product_type}". `
    window.open(`https://wa.me/${order.phone.replace(/\D/g,'')}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  if (loading) return <div className="space-y-3">{Array(4).fill(null).map((_,i) => <div key={i} className="bg-white rounded-xl h-16 animate-pulse border border-gray-100" />)}</div>
  if (orders.length === 0) return (
    <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
      <FileText size={40} className="mx-auto text-charcoal-800/20 mb-3" />
      <h3 className="font-display text-xl text-charcoal-800 mb-2">No custom orders yet</h3>
    </div>
  )

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {['Customer','Product Type','Delivery','Status',''].map(h => (
                  <th key={h} className="text-left px-5 py-4 font-body text-xs font-semibold text-charcoal-800/50 tracking-wide uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {orders.map((order, i) => (
                <motion.tr key={order.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                  className={`hover:bg-gray-50/50 transition-colors cursor-pointer ${selected?.id === order.id ? 'bg-gold-50/50' : ''}`}
                  onClick={() => setSelected(order)}>
                  <td className="px-5 py-4">
                    <div className="font-body font-semibold text-charcoal-800 text-sm">{order.customer_name}</div>
                    <div className="font-body text-xs text-charcoal-800/40">{order.phone}</div>
                  </td>
                  <td className="px-5 py-4"><div className="font-body text-sm text-charcoal-800/70 line-clamp-1 max-w-[140px]">{order.product_type}</div></td>
                  <td className="px-5 py-4"><div className="font-body text-xs text-charcoal-800/50">{order.delivery_date || '—'}</div></td>
                  <td className="px-5 py-4">
                    <select value={order.status}
                      onChange={e => { e.stopPropagation(); updateStatus(order.id, e.target.value) }}
                      onClick={e => e.stopPropagation()}
                      className={`text-xs font-body border rounded-full px-2.5 py-1 focus:outline-none ${STATUS_COLORS[order.status] || 'bg-gray-50 text-gray-700 border-gray-200'}`}>
                      {['pending','confirmed','in_progress','completed','cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex gap-1">
                      <button onClick={e => { e.stopPropagation(); setSelected(order) }} className="p-1.5 text-charcoal-800/40 hover:text-charcoal-800 rounded-lg"><Eye size={14} /></button>
                      <button onClick={e => { e.stopPropagation(); openWhatsApp(order) }} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg"><MessageCircle size={14} /></button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div>
        {selected ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 sticky top-6">
            <h3 className="font-display font-semibold text-charcoal-800 mb-4">Order #{selected.id}</h3>
            <dl className="space-y-2.5">
              {[['Customer',selected.customer_name],['Phone',selected.phone],['Product',selected.product_type],['Delivery',selected.delivery_date||'Flexible'],['Notes',selected.notes||'—']].map(([k,v]) => (
                <div key={k} className="flex gap-2">
                  <dt className="font-body text-xs font-semibold text-charcoal-800/40 w-20 flex-shrink-0 pt-0.5">{k}</dt>
                  <dd className="font-body text-xs text-charcoal-800">{v}</dd>
                </div>
              ))}
            </dl>
            {selected.reference_image_url && (
              <div className="mt-4">
                <div className="font-body text-xs font-semibold text-charcoal-800/40 mb-2">Reference</div>
                <img src={selected.reference_image_url} alt="Reference" className="w-full rounded-xl object-cover max-h-40" />
              </div>
            )}
            <button onClick={() => openWhatsApp(selected)}
              className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 bg-green-600 text-white font-body text-sm font-semibold rounded-xl hover:bg-green-700 transition-colors">
              <MessageCircle size={15} />Contact Customer
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-charcoal-800/20">
            <Eye size={24} className="mx-auto mb-2" /><p className="font-body text-sm">Click an order</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function AdminOrders() {
  const [tab, setTab] = useState('shop')
  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold text-charcoal-800">Orders</h1>
        <p className="font-body text-charcoal-800/50 mt-1">Manage shop orders and custom requests</p>
      </div>
      <div className="flex gap-2 mb-8 border-b border-gray-100">
        {[['shop','🛒 Shop Orders (Cart)'],['custom','🎨 Custom Orders']].map(([val,label]) => (
          <button key={val} onClick={() => setTab(val)}
            className={`px-5 py-2.5 font-body text-sm font-semibold rounded-t-xl border-b-2 transition-all -mb-px ${tab === val ? 'border-gold-500 text-gold-700 bg-gold-50' : 'border-transparent text-charcoal-800/50 hover:text-charcoal-800'}`}>
            {label}
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
          {tab === 'shop' ? <ShopOrdersTab /> : <CustomOrdersTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
