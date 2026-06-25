import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { IndianRupee, MapPin, User, Phone, Mail, FileText, ChevronRight, Loader2, ShoppingBag } from 'lucide-react'
import { useCart } from '../../context/CartContext'
import axios from 'axios'

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat',
  'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
  'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab',
  'Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh',
  'Uttarakhand','West Bengal','Delhi','Jammu and Kashmir','Ladakh',
  'Puducherry','Chandigarh',
]

function FormField({ label, required, error, children }) {
  return (
    <div>
      <label className="block font-body text-sm font-semibold text-charcoal-800 mb-1.5">
        {label} {required && <span className="text-gold-500">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500 font-body mt-1">{error}</p>}
    </div>
  )
}

export default function CheckoutPage() {
  const navigate = useNavigate()
  const { items, subtotal, shipping, taxAmount, total, clearCart } = useCart()

  const [form, setForm] = useState({
    customer_name:  '',
    customer_email: '',
    customer_phone: '',
    address_line1:  '',
    address_line2:  '',
    city:           '',
    state:          'Tamil Nadu',
    pincode:        '',
    country:        'India',
    delivery_notes: '',
  })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  const set = (field) => (e) => setForm(p => ({ ...p, [field]: e.target.value }))

  const validate = () => {
    const e = {}
    if (!form.customer_name.trim())  e.customer_name  = 'Name is required'
    if (!form.customer_phone.trim()) e.customer_phone = 'Phone is required'
    if (form.customer_email && !/\S+@\S+\.\S+/.test(form.customer_email))
      e.customer_email = 'Invalid email'
    if (!form.address_line1.trim()) e.address_line1 = 'Address is required'
    if (!form.city.trim())          e.city          = 'City is required'
    if (!form.state.trim())         e.state         = 'State is required'
    if (!form.pincode.trim() || !/^\d{6}$/.test(form.pincode))
      e.pincode = 'Valid 6-digit pincode required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleCheckout = async () => {
    if (!validate()) return
    if (items.length === 0) return

    setSubmitting(true)
    try {
      const payload = {
        ...form,
        items: items.map(i => ({
          product_id:       i.product_id,
          product_name:     i.product_name,
          product_category: i.product_category || null,
          unit_price:       i.unit_price,
          quantity:         i.quantity,
          is_custom:        i.is_custom,
          custom_config:    i.custom_config || null,
          ai_preview_id:    i.ai_preview_id || null,
        })),
      }

      const { data } = await axios.post('/api/checkout/initiate', payload)

      // Store checkout data for payment page
      sessionStorage.setItem('hag_checkout', JSON.stringify({ ...data, customerPhone: form.customer_phone }))
      navigate('/checkout/payment', { state: data })
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to initiate checkout. Please try again.'
      setErrors({ _general: msg })
    } finally {
      setSubmitting(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-ivory-50 pt-24 flex items-center justify-center">
        <div className="text-center py-12">
          <ShoppingBag size={48} className="mx-auto text-charcoal-800/20 mb-4" />
          <h2 className="font-display text-2xl font-bold text-charcoal-800 mb-2">Your cart is empty</h2>
          <p className="font-body text-charcoal-800/50 mb-6">Add some products before checking out.</p>
          <a href="/products" className="btn-gold">Browse Gallery</a>
        </div>
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-ivory-50 pt-20">
      {/* Header */}
      <div className="bg-charcoal-900 py-12">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h1 className="font-display text-4xl font-bold text-white">Checkout</h1>
          <div className="w-12 h-0.5 bg-gold-gradient mx-auto mt-3" />
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10 grid lg:grid-cols-3 gap-8">
        {/* Left: Form */}
        <div className="lg:col-span-2 space-y-6">

          {/* Contact */}
          <div className="bg-white rounded-2xl border border-ivory-200 p-6 space-y-4">
            <h2 className="font-display font-bold text-charcoal-800 text-lg flex items-center gap-2">
              <User size={17} className="text-gold-500" /> Contact Details
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <FormField label="Full Name" required error={errors.customer_name}>
                <input value={form.customer_name} onChange={set('customer_name')} placeholder="Your full name"
                  className={`w-full px-4 py-3 border rounded-xl font-body text-sm focus:outline-none focus:border-gold-400 transition-colors ${errors.customer_name ? 'border-red-300' : 'border-ivory-300'}`} />
              </FormField>
              <FormField label="Phone Number" required error={errors.customer_phone}>
                <input value={form.customer_phone} onChange={set('customer_phone')} placeholder="+91 98765 43210" type="tel"
                  className={`w-full px-4 py-3 border rounded-xl font-body text-sm focus:outline-none focus:border-gold-400 transition-colors ${errors.customer_phone ? 'border-red-300' : 'border-ivory-300'}`} />
              </FormField>
            </div>
            <FormField label="Email Address" error={errors.customer_email}>
              <input value={form.customer_email} onChange={set('customer_email')} placeholder="you@email.com" type="email"
                className={`w-full px-4 py-3 border rounded-xl font-body text-sm focus:outline-none focus:border-gold-400 transition-colors ${errors.customer_email ? 'border-red-300' : 'border-ivory-300'}`} />
              <p className="text-xs text-charcoal-800/40 font-body mt-1">Invoice will be emailed here</p>
            </FormField>
          </div>

          {/* Shipping Address */}
          <div className="bg-white rounded-2xl border border-ivory-200 p-6 space-y-4">
            <h2 className="font-display font-bold text-charcoal-800 text-lg flex items-center gap-2">
              <MapPin size={17} className="text-gold-500" /> Shipping Address
            </h2>
            <FormField label="Address Line 1" required error={errors.address_line1}>
              <input value={form.address_line1} onChange={set('address_line1')} placeholder="House / Flat No., Street"
                className={`w-full px-4 py-3 border rounded-xl font-body text-sm focus:outline-none focus:border-gold-400 transition-colors ${errors.address_line1 ? 'border-red-300' : 'border-ivory-300'}`} />
            </FormField>
            <FormField label="Address Line 2">
              <input value={form.address_line2} onChange={set('address_line2')} placeholder="Area, Landmark (optional)"
                className="w-full px-4 py-3 border border-ivory-300 rounded-xl font-body text-sm focus:outline-none focus:border-gold-400 transition-colors" />
            </FormField>
            <div className="grid sm:grid-cols-3 gap-4">
              <FormField label="City" required error={errors.city}>
                <input value={form.city} onChange={set('city')} placeholder="Chennai"
                  className={`w-full px-4 py-3 border rounded-xl font-body text-sm focus:outline-none focus:border-gold-400 transition-colors ${errors.city ? 'border-red-300' : 'border-ivory-300'}`} />
              </FormField>
              <FormField label="State" required error={errors.state}>
                <select value={form.state} onChange={set('state')}
                  className="w-full px-4 py-3 border border-ivory-300 rounded-xl font-body text-sm focus:outline-none focus:border-gold-400 transition-colors bg-white">
                  {INDIAN_STATES.map(s => <option key={s}>{s}</option>)}
                </select>
              </FormField>
              <FormField label="Pincode" required error={errors.pincode}>
                <input value={form.pincode} onChange={set('pincode')} placeholder="600001" maxLength={6}
                  className={`w-full px-4 py-3 border rounded-xl font-body text-sm focus:outline-none focus:border-gold-400 transition-colors ${errors.pincode ? 'border-red-300' : 'border-ivory-300'}`} />
              </FormField>
            </div>
          </div>

          {/* Delivery Notes */}
          <div className="bg-white rounded-2xl border border-ivory-200 p-6">
            <h2 className="font-display font-bold text-charcoal-800 text-lg flex items-center gap-2 mb-4">
              <FileText size={17} className="text-gold-500" /> Delivery Notes
            </h2>
            <textarea value={form.delivery_notes} onChange={set('delivery_notes')} rows={3}
              placeholder="Any special instructions for delivery or the artisan…"
              className="w-full px-4 py-3 border border-ivory-300 rounded-xl font-body text-sm focus:outline-none focus:border-gold-400 transition-colors resize-none" />
          </div>

          {errors._general && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm font-body px-4 py-3 rounded-xl">
              {errors._general}
            </div>
          )}
        </div>

        {/* Right: Order Summary */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-4">
            <div className="bg-white rounded-2xl border border-ivory-200 p-6">
              <h2 className="font-display font-bold text-charcoal-800 text-lg mb-4">Order Summary</h2>
              <div className="space-y-3 mb-4">
                {items.map(item => (
                  <div key={item.id} className="flex gap-3 items-start">
                    <div className="w-10 h-10 rounded-lg bg-ivory-100 overflow-hidden flex-shrink-0 border border-ivory-200">
                      {item.image_url
                        ? <img src={item.image_url} alt="" className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-base">🪡</div>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-body text-xs font-semibold text-charcoal-800 line-clamp-1">{item.product_name}</div>
                      <div className="font-body text-xs text-charcoal-800/40">Qty: {item.quantity}</div>
                    </div>
                    <div className="flex items-center gap-0.5 font-body font-semibold text-charcoal-800 text-xs whitespace-nowrap">
                      <IndianRupee size={10} />
                      {(item.unit_price * item.quantity).toLocaleString('en-IN')}
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-ivory-200 pt-3 space-y-1.5">
                <div className="flex justify-between font-body text-xs text-charcoal-800/60">
                  <span>Subtotal</span><span>₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between font-body text-xs text-charcoal-800/60">
                  <span>Shipping</span>
                  <span>{shipping === 0 ? <span className="text-green-600 font-semibold">Free</span> : `₹${shipping}`}</span>
                </div>
                <div className="flex justify-between font-body text-xs text-charcoal-800/60">
                  <span>GST (18%)</span><span>₹{taxAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-ivory-200">
                  <span className="font-display font-bold text-charcoal-800">Total</span>
                  <div className="flex items-center gap-0.5 font-display font-bold text-gold-600 text-lg">
                    <IndianRupee size={15} />
                    {total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={submitting}
              className="w-full btn-gold justify-center py-4 rounded-xl disabled:opacity-60"
            >
              {submitting
                ? <><Loader2 size={17} className="animate-spin" /> Processing…</>
                : <>Proceed to Payment <ChevronRight size={16} /></>
              }
            </button>

            <p className="text-center text-xs font-body text-charcoal-800/30">
              🔒 Secured by Razorpay · 256-bit SSL
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
