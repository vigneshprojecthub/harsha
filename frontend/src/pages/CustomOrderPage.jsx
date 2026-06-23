import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Upload, MessageCircle, CheckCircle, Loader2, X } from 'lucide-react'
import { ordersApi } from '../utils/api'
import { openWhatsApp } from '../utils/whatsapp'

const productTypes = [
  'Aari Work Blouse', 'Aari Work Dupatta', 'Thread Embroidery Cushion',
  'Thread Embroidery Saree Border', 'Bead Work Saree Border', 'Bead Work Decoration',
  'Sequence Work Lehenga', 'Sequence Work Blouse', 'Wedding Frame',
  'Custom Product (Describe in Notes)'
]

export default function CustomOrderPage() {
  const [searchParams] = useSearchParams()
  const defaultProduct = searchParams.get('product') || ''

  const [form, setForm] = useState({
    customer_name: '',
    phone: '',
    product_type: defaultProduct,
    notes: '',
    delivery_date: '',
  })
  const [refImage, setRefImage] = useState(null)
  const [refImageUrl, setRefImageUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleChange = e => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleImageChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setRefImage(file)
    setUploading(true)
    try {
      const res = await ordersApi.uploadReference(file)
      setRefImageUrl(res.data.url)
    } catch {
      setError('Image upload failed. You can still submit the form.')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.customer_name || !form.phone || !form.product_type) {
      setError('Please fill in all required fields.')
      return
    }
    setError('')
    setSubmitting(true)
    try {
      const orderData = { ...form, reference_image_url: refImageUrl || null }
      const res = await ordersApi.createCustom(orderData)
      setSubmitted(true)
      // Open WhatsApp after a brief delay
      setTimeout(() => {
        openWhatsApp({ ...form, reference_image_url: refImageUrl })
      }, 800)
    } catch {
      setError('Failed to submit order. Please try again or contact us directly on WhatsApp.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-ivory-50 pt-24 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md mx-auto px-4"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: 'spring' }}
            className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircle size={40} className="text-green-600" />
          </motion.div>
          <h2 className="font-display text-3xl font-bold text-charcoal-800 mb-3">Order Received!</h2>
          <p className="font-body text-charcoal-800/60 mb-6 leading-relaxed">
            Your custom order request has been submitted. We're opening WhatsApp to connect you directly with our artisans.
          </p>
          <a
            href={`https://wa.me/919876543210?text=${encodeURIComponent(`Hi! I just submitted a custom order for ${form.product_type}. Please guide me further.`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-gold"
          >
            <MessageCircle size={16} />
            Open WhatsApp Chat
          </a>
        </motion.div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-ivory-50 pt-24"
    >
      {/* Header */}
      <div className="bg-charcoal-900 py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="font-accent text-gold-400 italic text-lg mb-2">Create Something Unique</div>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-white mb-4">Custom Order</h1>
          <div className="w-12 h-0.5 bg-gold-gradient mx-auto" />
          <p className="mt-4 text-ivory-200/60 font-body">
            Fill in the details and we'll connect you via WhatsApp to bring your vision to life.
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-ivory-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div>
              <label className="block font-body text-sm font-semibold text-charcoal-800 mb-2">
                Your Name <span className="text-gold-500">*</span>
              </label>
              <input
                type="text"
                name="customer_name"
                value={form.customer_name}
                onChange={handleChange}
                placeholder="Enter your full name"
                className="w-full px-4 py-3 border border-ivory-300 rounded-xl font-body text-sm focus:outline-none focus:border-gold-400 transition-colors"
                required
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block font-body text-sm font-semibold text-charcoal-800 mb-2">
                Phone Number <span className="text-gold-500">*</span>
              </label>
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="+91 98765 43210"
                className="w-full px-4 py-3 border border-ivory-300 rounded-xl font-body text-sm focus:outline-none focus:border-gold-400 transition-colors"
                required
              />
            </div>

            {/* Product Type */}
            <div>
              <label className="block font-body text-sm font-semibold text-charcoal-800 mb-2">
                Product Type <span className="text-gold-500">*</span>
              </label>
              <select
                name="product_type"
                value={form.product_type}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-ivory-300 rounded-xl font-body text-sm focus:outline-none focus:border-gold-400 transition-colors bg-white"
                required
              >
                <option value="">Select a product type...</option>
                {productTypes.map(pt => (
                  <option key={pt} value={pt}>{pt}</option>
                ))}
              </select>
            </div>

            {/* Reference Image */}
            <div>
              <label className="block font-body text-sm font-semibold text-charcoal-800 mb-2">
                Reference Image <span className="text-charcoal-800/40 font-normal">(Optional)</span>
              </label>
              <div className="border-2 border-dashed border-ivory-300 rounded-xl p-6 text-center hover:border-gold-400 transition-colors">
                {refImage ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {refImageUrl ? (
                        <img src={refImageUrl} alt="Reference" className="w-12 h-12 rounded-lg object-cover" />
                      ) : (
                        <div className="w-12 h-12 bg-ivory-200 rounded-lg flex items-center justify-center">
                          {uploading ? <Loader2 size={16} className="animate-spin" /> : '🖼️'}
                        </div>
                      )}
                      <div className="text-left">
                        <div className="font-body text-sm text-charcoal-800">{refImage.name}</div>
                        <div className="text-xs text-charcoal-800/40">
                          {uploading ? 'Uploading...' : refImageUrl ? 'Uploaded ✓' : 'Processing...'}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setRefImage(null); setRefImageUrl('') }}
                      className="text-charcoal-800/40 hover:text-red-500"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer">
                    <Upload size={24} className="mx-auto text-gold-400 mb-2" />
                    <div className="font-body text-sm text-charcoal-800/60">
                      Click to upload or drag & drop
                    </div>
                    <div className="text-xs text-charcoal-800/40 mt-1">PNG, JPG, WebP up to 5MB</div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Delivery Date */}
            <div>
              <label className="block font-body text-sm font-semibold text-charcoal-800 mb-2">
                Required By <span className="text-charcoal-800/40 font-normal">(Optional)</span>
              </label>
              <input
                type="date"
                name="delivery_date"
                value={form.delivery_date}
                onChange={handleChange}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 border border-ivory-300 rounded-xl font-body text-sm focus:outline-none focus:border-gold-400 transition-colors"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block font-body text-sm font-semibold text-charcoal-800 mb-2">
                Special Instructions <span className="text-charcoal-800/40 font-normal">(Optional)</span>
              </label>
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                rows={4}
                placeholder="Describe your requirements — colors, sizes, patterns, occasion..."
                className="w-full px-4 py-3 border border-ivory-300 rounded-xl font-body text-sm focus:outline-none focus:border-gold-400 transition-colors resize-none"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm font-body px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || uploading}
              className="w-full btn-gold justify-center py-4 rounded-xl disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <><Loader2 size={18} className="animate-spin" /> Submitting...</>
              ) : (
                <><MessageCircle size={18} /> Submit & Connect on WhatsApp</>
              )}
            </button>

            <p className="text-center text-xs text-charcoal-800/40 font-body">
              After submitting, WhatsApp will open with your order details pre-filled for easy communication.
            </p>
          </form>
        </div>
      </div>
    </motion.div>
  )
}
