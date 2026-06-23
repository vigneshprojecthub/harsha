import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Tag, Check, X, Loader2 } from 'lucide-react'
import axios from 'axios'

export default function CouponInput({ orderValue, phone, onApply }) {
  const [code,    setCode]    = useState('')
  const [loading, setLoading] = useState(false)
  const [result,  setResult]  = useState(null)   // { valid, discount_amount, message }
  const [applied, setApplied] = useState(false)

  const validate = async () => {
    if (!code.trim()) return
    setLoading(true)
    setResult(null)
    try {
      const { data } = await axios.post(`${import.meta.env.VITE_API_URL}/api/coupons/validate`, {
        code:        code.trim().toUpperCase(),
        order_value: orderValue,
        phone:       phone || null,
      })
      setResult(data)
      if (data.valid) {
        setApplied(true)
        onApply?.(data.discount_amount, code.trim().toUpperCase())
      }
    } catch {
      setResult({ valid: false, message: 'Failed to validate coupon' })
    } finally {
      setLoading(false)
    }
  }

  const remove = () => {
    setCode('')
    setResult(null)
    setApplied(false)
    onApply?.(0, null)
  }

  return (
    <div className="space-y-2">
      <label className="block font-body text-sm font-semibold text-charcoal-800 mb-1.5 flex items-center gap-1.5">
        <Tag size={14} className="text-gold-500" />
        Coupon Code
      </label>

      {applied && result?.valid ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-xl"
        >
          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
            <Check size={15} className="text-green-600" />
          </div>
          <div className="flex-1">
            <div className="font-mono font-bold text-green-800 text-sm">{code.toUpperCase()}</div>
            <div className="font-body text-xs text-green-700">{result.message}</div>
          </div>
          <button onClick={remove} className="text-green-600 hover:text-red-500 transition-colors">
            <X size={15} />
          </button>
        </motion.div>
      ) : (
        <div className="flex gap-2">
          <input
            type="text"
            value={code}
            onChange={e => { setCode(e.target.value.toUpperCase()); setResult(null) }}
            placeholder="DIWALI25"
            maxLength={30}
            onKeyDown={e => e.key === 'Enter' && validate()}
            className="flex-1 px-4 py-3 border border-ivory-300 rounded-xl font-mono text-sm font-bold tracking-wider focus:outline-none focus:border-gold-400 transition-colors uppercase"
          />
          <button
            onClick={validate}
            disabled={loading || !code.trim()}
            className="px-5 py-3 bg-charcoal-900 text-white font-body text-sm font-semibold rounded-xl hover:bg-charcoal-800 disabled:opacity-40 transition-colors flex items-center gap-2"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Tag size={14} />}
            Apply
          </button>
        </div>
      )}

      <AnimatePresence>
        {result && !result.valid && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 text-xs font-body text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-xl"
          >
            <X size={12} />
            {result.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
