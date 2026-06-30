import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle, MessageCircle, Loader2 } from 'lucide-react'
import { ordersApi } from '../../utils/api'
import { previewApi } from '../../utils/previewApi'

export default function ConfirmOrderModal({ preview, onClose, onSuccess }) {
  const [step, setStep] = useState('form')  // form | saving | done
  const [form, setForm] = useState({ customer_name: '', phone: '', notes: '' })
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.customer_name || !form.phone) {
      setError('Name and phone are required.')
      return
    }
    setStep('saving')
    try {
      // 1. Create the order
      const { data: order } = await ordersApi.createCustom({
        customer_name: form.customer_name,
        phone: form.phone,
        product_type: 'AI Customized Design',
        notes: form.notes || '',
        reference_image_url: preview.generated_preview_url,
      })

      // 2. Link the preview to the order
      await previewApi.confirm(preview.id, order.id)

      setStep('done')
      onSuccess?.(order)
    } catch {
      setError('Failed to submit order. Please try again.')
      setStep('form')
    }
  }

  const openWhatsApp = () => {
    const msg =
      `Hi! I've just confirmed a custom AI design order on Harsha Art Gallery.\n` +
      `Name: ${form.customer_name}\nPhone: ${form.phone}\nNotes: ${form.notes || 'None'}\n` +
      `Preview: ${window.location.origin}${preview.generated_preview_url}`
    window.open(`https://wa.me/919344946069?text=${encodeURIComponent(msg)}`, '_blank')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 16 }}
        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
      >
        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-ivory-100 flex items-center justify-center hover:bg-ivory-200 transition-colors z-10">
          <X size={14} />
        </button>

        {step === 'done' ? (
          <div className="p-8 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300 }}
              className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4"
            >
              <CheckCircle size={32} className="text-green-600" />
            </motion.div>
            <h3 className="font-display text-2xl font-bold text-charcoal-800 mb-2">Design Confirmed!</h3>
            <p className="font-body text-charcoal-800/60 text-sm mb-6 leading-relaxed">
              Your order has been saved. Connect with us on WhatsApp to finalise the details and get started.
            </p>

            {/* Preview thumbnail */}
            <div className="flex justify-center mb-6">
              <img
                src={preview.generated_preview_url}
                alt="Your design"
                className="w-32 h-40 object-cover rounded-xl border-2 border-gold-200 shadow-md"
              />
            </div>

            <button
              onClick={openWhatsApp}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-green-600 text-white font-body font-semibold rounded-xl hover:bg-green-700 transition-colors"
            >
              <MessageCircle size={17} />
              Continue on WhatsApp
            </button>
          </div>
        ) : (
          <div>
            <div className="bg-charcoal-900 px-6 py-5">
              <h3 className="font-display text-xl font-bold text-white">Confirm Your Design</h3>
              <p className="font-body text-ivory-200/60 text-sm mt-1">
                Enter your details to place this custom order
              </p>
            </div>

            {/* Preview strip */}
            <div className="flex gap-3 px-6 py-4 bg-ivory-50 border-b border-ivory-200">
              <img
                src={preview.original_image_url}
                alt="Original"
                className="w-14 h-18 object-cover rounded-lg border border-ivory-200"
                style={{ height: 72 }}
              />
              <span className="text-xl self-center text-charcoal-800/20">→</span>
              <img
                src={preview.generated_preview_url}
                alt="Preview"
                className="w-14 h-18 object-cover rounded-lg border-2 border-gold-300 shadow-sm"
                style={{ height: 72 }}
              />
              <div className="flex-1 self-center pl-1">
                <div className="font-body text-xs font-semibold text-charcoal-800/50">AI Custom Design</div>
                <div className="font-body text-xs text-charcoal-800/30 mt-0.5 line-clamp-2">
                  {preview.custom_instructions || 'Handcrafted embroidery preview'}
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block font-body text-sm font-semibold text-charcoal-800 mb-1.5">
                  Your Name <span className="text-gold-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Full name"
                  value={form.customer_name}
                  onChange={e => setForm(p => ({ ...p, customer_name: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-ivory-300 rounded-xl font-body text-sm focus:outline-none focus:border-gold-400 transition-colors"
                />
              </div>

              <div>
                <label className="block font-body text-sm font-semibold text-charcoal-800 mb-1.5">
                  WhatsApp Number <span className="text-gold-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+91 98765 43210"
                  value={form.phone}
                  onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-ivory-300 rounded-xl font-body text-sm focus:outline-none focus:border-gold-400 transition-colors"
                />
              </div>

              <div>
                <label className="block font-body text-sm font-semibold text-charcoal-800 mb-1.5">
                  Additional Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Anything else for the artisan?"
                  value={form.notes}
                  onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-ivory-300 rounded-xl font-body text-sm focus:outline-none focus:border-gold-400 transition-colors resize-none"
                />
              </div>

              {error && (
                <p className="text-xs font-body text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
              )}

              <button
                type="submit"
                disabled={step === 'saving'}
                className="w-full btn-gold justify-center py-3.5 rounded-xl disabled:opacity-60"
              >
                {step === 'saving'
                  ? <><Loader2 size={16} className="animate-spin" /> Placing Order…</>
                  : <><CheckCircle size={16} /> Place Order</>
                }
              </button>
            </form>
          </div>
        )}
      </motion.div>
    </div>
  )
}
