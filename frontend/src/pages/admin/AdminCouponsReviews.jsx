import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Tag, Plus, Trash2, ToggleLeft, ToggleRight, Star, Check, Eye, EyeOff, Loader2 } from 'lucide-react'
import axios from 'axios'

// ── Coupons Tab ──────────────────────────────────────────────────────────────
function CouponsTab() {
  const [coupons,  setCoupons]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving,   setSaving]   = useState(false)
  const [form, setForm] = useState({
    code: '', description: '', discount_type: 'percent',
    discount_value: '', min_order_value: '0',
    max_discount: '', max_uses: '', valid_until: '',
    campaign: '', uses_per_user: '1',
  })

  const load = () => {
    axios.get('/api/coupons').then(r => setCoupons(r.data)).finally(() => setLoading(false))
  }
  useEffect(load, [])

  const toggle = async (id) => {
    await axios.patch(`/api/coupons/${id}/toggle`)
    load()
  }

  const remove = async (id, code) => {
    if (!confirm(`Delete coupon ${code}?`)) return
    await axios.delete(`/api/coupons/${id}`)
    setCoupons(prev => prev.filter(c => c.id !== id))
  }

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        ...form,
        code: form.code.toUpperCase(),
        discount_value: parseFloat(form.discount_value),
        min_order_value: parseFloat(form.min_order_value || 0),
        max_discount: form.max_discount ? parseFloat(form.max_discount) : null,
        max_uses: form.max_uses ? parseInt(form.max_uses) : null,
        uses_per_user: parseInt(form.uses_per_user || 1),
        valid_until: form.valid_until || null,
      }
      await axios.post(`${import.meta.env.VITE_API_URL}/api/coupons`, payload)
      setShowForm(false)
      setForm({ code:'',description:'',discount_type:'percent',discount_value:'',min_order_value:'0',max_discount:'',max_uses:'',valid_until:'',campaign:'',uses_per_user:'1' })
      load()
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to create coupon')
    } finally { setSaving(false) }
  }

  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }))

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="font-body text-charcoal-800/50 text-sm">{coupons.length} coupons</p>
        <button onClick={() => setShowForm(!showForm)} className="btn-gold py-2.5 px-5 rounded-xl">
          <Plus size={15} />{showForm ? 'Cancel' : 'New Coupon'}
        </button>
      </div>

      {/* Create form */}
      <AnimatePresence>
        {showForm && (
          <motion.form initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
            onSubmit={submit}
            className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
            <h3 className="font-display font-bold text-charcoal-800">New Coupon</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                ['code', 'Coupon Code *', 'DIWALI25'],
                ['campaign', 'Campaign Tag', 'diwali2025'],
              ].map(([f, l, ph]) => (
                <div key={f}>
                  <label className="block font-body text-xs font-semibold text-charcoal-800/50 mb-1">{l}</label>
                  <input value={form[f]} onChange={set(f)} placeholder={ph} required={l.includes('*')}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl font-body text-sm focus:outline-none focus:border-gold-400 uppercase" />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block font-body text-xs font-semibold text-charcoal-800/50 mb-1">Type *</label>
                <select value={form.discount_type} onChange={set('discount_type')}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl font-body text-sm focus:outline-none focus:border-gold-400 bg-white">
                  <option value="percent">Percent (%)</option>
                  <option value="flat">Flat (₹)</option>
                </select>
              </div>
              <div>
                <label className="block font-body text-xs font-semibold text-charcoal-800/50 mb-1">Value *</label>
                <input type="number" value={form.discount_value} onChange={set('discount_value')} placeholder={form.discount_type === 'percent' ? '15' : '200'} required
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl font-body text-sm focus:outline-none focus:border-gold-400" />
              </div>
              <div>
                <label className="block font-body text-xs font-semibold text-charcoal-800/50 mb-1">Min Order (₹)</label>
                <input type="number" value={form.min_order_value} onChange={set('min_order_value')} placeholder="500"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl font-body text-sm focus:outline-none focus:border-gold-400" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block font-body text-xs font-semibold text-charcoal-800/50 mb-1">Max Discount (₹)</label>
                <input type="number" value={form.max_discount} onChange={set('max_discount')} placeholder="500"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl font-body text-sm focus:outline-none focus:border-gold-400" />
              </div>
              <div>
                <label className="block font-body text-xs font-semibold text-charcoal-800/50 mb-1">Max Total Uses</label>
                <input type="number" value={form.max_uses} onChange={set('max_uses')} placeholder="100"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl font-body text-sm focus:outline-none focus:border-gold-400" />
              </div>
              <div>
                <label className="block font-body text-xs font-semibold text-charcoal-800/50 mb-1">Expires</label>
                <input type="datetime-local" value={form.valid_until} onChange={set('valid_until')}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl font-body text-sm focus:outline-none focus:border-gold-400" />
              </div>
            </div>
            <div>
              <label className="block font-body text-xs font-semibold text-charcoal-800/50 mb-1">Description</label>
              <input value={form.description} onChange={set('description')} placeholder="Diwali festival offer — 25% off all products!"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl font-body text-sm focus:outline-none focus:border-gold-400" />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowForm(false)}
                className="flex-1 py-2.5 border border-gray-200 text-charcoal-800/60 font-body text-sm rounded-xl hover:bg-gray-50">Cancel</button>
              <button type="submit" disabled={saving} className="flex-1 btn-gold justify-center py-2.5 rounded-xl disabled:opacity-60">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                {saving ? 'Creating…' : 'Create Coupon'}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Coupon list */}
      {loading ? (
        <div className="space-y-3">{Array(3).fill(null).map((_,i) => <div key={i} className="bg-white h-16 rounded-xl animate-pulse border border-gray-100" />)}</div>
      ) : coupons.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
          <Tag size={32} className="mx-auto text-gray-300 mb-3" />
          <p className="font-body text-gray-400 text-sm">No coupons yet</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {['Code','Type','Value','Uses','Expires','Status',''].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-body text-xs font-semibold text-charcoal-800/50 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {coupons.map(c => (
                <tr key={c.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3">
                    <div className="font-mono font-bold text-sm text-charcoal-800">{c.code}</div>
                    {c.campaign && <div className="text-xs text-charcoal-800/40">{c.campaign}</div>}
                  </td>
                  <td className="px-4 py-3 font-body text-sm text-charcoal-800/60 capitalize">{c.discount_type}</td>
                  <td className="px-4 py-3 font-body font-semibold text-gold-600 text-sm">
                    {c.discount_type === 'percent' ? `${c.discount_value}%` : `₹${c.discount_value}`}
                  </td>
                  <td className="px-4 py-3 font-body text-sm text-charcoal-800/60">
                    {c.total_used}{c.max_uses ? `/${c.max_uses}` : ''}
                  </td>
                  <td className="px-4 py-3 font-body text-xs text-charcoal-800/50">
                    {c.valid_until ? new Date(c.valid_until).toLocaleDateString('en-IN') : '∞'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-body font-semibold px-2 py-0.5 rounded-full border ${
                      c.is_active ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-500 border-gray-200'
                    }`}>{c.is_active ? 'Active' : 'Inactive'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      <button onClick={() => toggle(c.id)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                        {c.is_active ? <ToggleRight size={16} className="text-green-600" /> : <ToggleLeft size={16} className="text-gray-400" />}
                      </button>
                      <button onClick={() => remove(c.id, c.code)} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 size={14} className="text-red-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── Reviews Tab ───────────────────────────────────────────────────────────────
function ReviewsTab() {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    axios.get('/api/reviews?limit=50').then(r => setReviews(r.data)).finally(() => setLoading(false))
  }
  useEffect(load, [])

  const update = async (id, patch) => {
    await axios.patch(`/api/reviews/${id}`, patch)
    load()
  }

  const remove = async (id) => {
    if (!confirm('Delete this review?')) return
    await axios.delete(`/api/reviews/${id}`)
    setReviews(prev => prev.filter(r => r.id !== id))
  }

  return (
    <div className="space-y-4">
      {loading ? (
        Array(3).fill(null).map((_,i) => <div key={i} className="bg-white h-24 rounded-xl animate-pulse border border-gray-100" />)
      ) : reviews.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
          <Star size={32} className="mx-auto text-gray-300 mb-3" />
          <p className="font-body text-gray-400 text-sm">No reviews yet</p>
        </div>
      ) : (
        reviews.map(r => (
          <div key={r.id} className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex">
                    {Array(5).fill(0).map((_,i) => (
                      <Star key={i} size={13} className={i < r.rating ? 'text-gold-500 fill-gold-500' : 'text-gray-200 fill-gray-200'} />
                    ))}
                  </div>
                  <span className="font-body font-semibold text-sm text-charcoal-800">{r.reviewer_name}</span>
                  {r.is_verified && (
                    <span className="text-[10px] font-body bg-green-50 text-green-700 border border-green-200 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                      <Check size={9} />Verified
                    </span>
                  )}
                </div>
                {r.title && <div className="font-body font-semibold text-charcoal-800 text-sm mb-0.5">{r.title}</div>}
                {r.body && <div className="font-body text-charcoal-800/60 text-sm leading-relaxed">{r.body}</div>}
                {r.photos?.length > 0 && (
                  <div className="flex gap-2 mt-2">
                    {r.photos.map((ph, i) => (
                      <img key={i} src={ph} alt="" className="w-12 h-12 rounded-lg object-cover border border-gray-200" />
                    ))}
                  </div>
                )}
                <div className="font-body text-xs text-charcoal-800/30 mt-2">
                  {new Date(r.created_at).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}
                  {r.product_id && ` · Product #${r.product_id}`}
                </div>
              </div>
              <div className="flex flex-col gap-1.5 flex-shrink-0">
                <button onClick={() => update(r.id, { is_featured: !r.is_featured })}
                  title="Toggle featured"
                  className={`p-1.5 rounded-lg transition-colors ${r.is_featured ? 'bg-gold-50 text-gold-600' : 'hover:bg-gray-100 text-gray-400'}`}>
                  <Star size={14} className={r.is_featured ? 'fill-gold-500' : ''} />
                </button>
                <button onClick={() => update(r.id, { is_published: !r.is_published })}
                  title="Toggle visibility"
                  className={`p-1.5 rounded-lg transition-colors ${r.is_published ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'}`}>
                  {r.is_published ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>
                <button onClick={() => update(r.id, { is_verified: !r.is_verified })}
                  title="Toggle verified"
                  className={`p-1.5 rounded-lg transition-colors ${r.is_verified ? 'text-blue-600 bg-blue-50' : 'text-gray-400 hover:bg-gray-100'}`}>
                  <Check size={14} />
                </button>
                <button onClick={() => remove(r.id)} className="p-1.5 hover:bg-red-50 rounded-lg">
                  <Trash2 size={14} className="text-red-400" />
                </button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  )
}

export default function AdminCouponsReviews() {
  const [tab, setTab] = useState('coupons')

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold text-charcoal-800">Coupons & Reviews</h1>
      </div>
      <div className="flex gap-2 mb-8 border-b border-gray-100">
        {[['coupons','🏷️ Coupons'],['reviews','⭐ Reviews']].map(([val,label]) => (
          <button key={val} onClick={() => setTab(val)}
            className={`px-5 py-2.5 font-body text-sm font-semibold rounded-t-xl border-b-2 transition-all -mb-px ${
              tab === val ? 'border-gold-500 text-gold-700 bg-gold-50' : 'border-transparent text-charcoal-800/50 hover:text-charcoal-800'
            }`}>
            {label}
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
          {tab === 'coupons' ? <CouponsTab /> : <ReviewsTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
