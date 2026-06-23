import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Shield, CreditCard, Smartphone, Building2, Loader2, AlertCircle } from 'lucide-react'
import axios from 'axios'
import { useCart } from '../../context/CartContext'

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true)
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload  = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

export default function PaymentPage() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const { clearCart } = useCart()

  const [checkoutData, setCheckoutData] = useState(null)
  const [status, setStatus] = useState('loading')   // loading | ready | paying | verifying | error | demo
  const [error,  setError]  = useState('')

  useEffect(() => {
    // Recover from sessionStorage (handles page refresh)
    const raw = sessionStorage.getItem('hag_checkout')
    const data = location.state || (raw ? JSON.parse(raw) : null)

    if (!data) {
      navigate('/checkout')
      return
    }
    setCheckoutData(data)

    loadRazorpayScript().then(loaded => {
      if (!loaded) {
        setError('Failed to load Razorpay. Please check your internet connection.')
        setStatus('error')
      } else if (data.demo_mode) {
        setStatus('demo')
      } else {
        setStatus('ready')
      }
    })
  }, [])

  const handlePayNow = async () => {
    if (!checkoutData || !window.Razorpay) return
    setStatus('paying')

    const options = {
      key:           checkoutData.key_id,
      amount:        checkoutData.amount_paise,
      currency:      'INR',
      name:          'Harsha Art Gallery',
      description:   `Order ${checkoutData.order_number}`,
      order_id:      checkoutData.razorpay_order_id,
      prefill: {
        name:    checkoutData.customer_name || '',
        contact: checkoutData.customerPhone || '',
      },
      theme: { color: '#c8860f' },
      modal: {
        ondismiss: () => setStatus('ready'),
      },
      handler: async (response) => {
        setStatus('verifying')
        try {
          const { data } = await axios.post('${import.meta.env.VITE_API_URL}/api/checkout/verify-payment', {
            razorpay_order_id:   response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature:  response.razorpay_signature,
          })
          clearCart()
          sessionStorage.removeItem('hag_checkout')
          navigate('/order-confirmation', { state: data })
        } catch (err) {
          setError(err.response?.data?.detail || 'Payment verification failed. Please contact support.')
          setStatus('error')
        }
      },
    }

    const rz = new window.Razorpay(options)
    rz.on('payment.failed', (resp) => {
      setError(`Payment failed: ${resp.error.description}`)
      setStatus('error')
    })
    rz.open()
  }

  const handleDemoSuccess = async () => {
    setStatus('verifying')
    try {
      const { data } = await axios.post(`${import.meta.env.VITE_API_URL}/api/checkout/verify-payment`, {
        razorpay_order_id:   checkoutData.razorpay_order_id,
        razorpay_payment_id: `demo_pay_${Date.now()}`,
        razorpay_signature:  'demo_signature',
      })
      clearCart()
      sessionStorage.removeItem('hag_checkout')
      navigate('/order-confirmation', { state: data })
    } catch (err) {
      setError(err.response?.data?.detail || 'Demo checkout failed.')
      setStatus('error')
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-ivory-50 pt-20">
      <div className="bg-charcoal-900 py-12">
        <div className="max-w-lg mx-auto px-4 text-center">
          <h1 className="font-display text-4xl font-bold text-white">Payment</h1>
          <div className="w-12 h-0.5 bg-gold-gradient mx-auto mt-3" />
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-10">
        {/* Order summary card */}
        {checkoutData && (
          <div className="bg-white rounded-2xl border border-ivory-200 p-6 mb-6">
            <div className="flex justify-between items-center mb-3">
              <span className="font-body text-sm text-charcoal-800/50">Order</span>
              <span className="font-body font-semibold text-charcoal-800">{checkoutData.order_number}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-display font-bold text-charcoal-800 text-lg">Amount to Pay</span>
              <span className="font-display font-bold text-gold-600 text-2xl">
                ₹{checkoutData.amount_inr?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        )}

        {/* Payment methods info */}
        <div className="bg-white rounded-2xl border border-ivory-200 p-6 mb-6">
          <h3 className="font-display font-semibold text-charcoal-800 mb-4">Accepted Payment Methods</h3>
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: CreditCard,  label: 'Cards'       },
              { icon: Smartphone,  label: 'UPI'         },
              { icon: Building2,   label: 'Net Banking' },
            ].map(m => (
              <div key={m.label} className="flex flex-col items-center gap-1.5 p-3 bg-ivory-50 rounded-xl border border-ivory-200">
                <m.icon size={20} className="text-gold-500" />
                <span className="font-body text-xs text-charcoal-800/60">{m.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Status / action area */}
        {(status === 'loading') && (
          <div className="text-center py-8">
            <Loader2 size={32} className="animate-spin text-gold-500 mx-auto" />
            <p className="font-body text-charcoal-800/50 mt-3">Loading payment gateway…</p>
          </div>
        )}

        {status === 'error' && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
            <AlertCircle size={28} className="text-red-500 mx-auto mb-3" />
            <p className="font-body text-red-700 mb-4">{error}</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => { setStatus('ready'); setError('') }}
                className="btn-outline-gold text-sm">Try Again</button>
              <a href="/checkout" className="btn-gold text-sm">Back to Checkout</a>
            </div>
          </div>
        )}

        {status === 'verifying' && (
          <div className="text-center py-8">
            <Loader2 size={32} className="animate-spin text-gold-500 mx-auto" />
            <p className="font-body text-charcoal-800/50 mt-3">Verifying payment & generating invoice…</p>
          </div>
        )}

        {status === 'ready' && (
          <div className="space-y-4">
            <button onClick={handlePayNow} className="w-full btn-gold justify-center py-4 rounded-xl text-base">
              <Shield size={18} />
              Pay Securely with Razorpay
            </button>
            <p className="text-center text-xs font-body text-charcoal-800/30">
              🔒 Your payment is protected by 256-bit SSL encryption
            </p>
          </div>
        )}

        {status === 'demo' && (
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center">
              <p className="font-body font-semibold text-amber-800 text-sm mb-1">Demo Mode</p>
              <p className="font-body text-xs text-amber-700">
                Razorpay keys not configured. Click below to simulate a successful payment.
              </p>
            </div>
            <button onClick={handleDemoSuccess} className="w-full btn-gold justify-center py-4 rounded-xl">
              Simulate Successful Payment
            </button>
          </div>
        )}

        {status === 'paying' && (
          <div className="text-center py-8">
            <div className="text-4xl mb-3">💳</div>
            <p className="font-body font-semibold text-charcoal-800">Razorpay checkout is open…</p>
            <p className="font-body text-xs text-charcoal-800/40 mt-1">Complete the payment in the popup window</p>
          </div>
        )}
      </div>
    </motion.div>
  )
}
