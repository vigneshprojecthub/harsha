import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Sparkles, Eye, EyeOff, Loader2, Lock, User } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export default function AdminLoginPage() {
  const { login } = useAuth()
  const navigate   = useNavigate()
  const [form,     setForm]     = useState({ username: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(form.username, form.password)
      navigate('/admin', { replace: true })
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid username or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-charcoal-900 flex items-center justify-center p-4">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5"
        style={{ backgroundImage: `repeating-linear-gradient(45deg,transparent,transparent 2px,rgba(200,134,15,0.5) 2px,rgba(200,134,15,0.5) 4px)` }} />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="relative w-full max-w-md"
      >
        {/* Card */}
        <div className="bg-charcoal-800 border border-white/10 rounded-3xl p-8 shadow-2xl shadow-black/50">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gold-gradient flex items-center justify-center mx-auto mb-4 shadow-lg shadow-gold-500/30">
              <Sparkles size={28} className="text-white" />
            </div>
            <h1 className="font-display text-2xl font-bold text-white mb-1">Admin Panel</h1>
            <p className="font-body text-ivory-300/40 text-sm">Harsha Art Gallery</p>
          </div>

          {/* Form */}
          <form onSubmit={submit} className="space-y-4">
            {/* Username */}
            <div>
              <label className="block font-body text-xs font-semibold text-ivory-300/50 mb-1.5 tracking-wide uppercase">
                Username
              </label>
              <div className="relative">
                <User size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-ivory-300/30" />
                <input
                  type="text"
                  value={form.username}
                  onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                  placeholder="Admin username"
                  required
                  autoComplete="username"
                  className="w-full bg-charcoal-900 border border-white/10 rounded-xl pl-10 pr-4 py-3
                    font-body text-sm text-white placeholder-ivory-300/20
                    focus:outline-none focus:border-gold-500 transition-colors"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block font-body text-xs font-semibold text-ivory-300/50 mb-1.5 tracking-wide uppercase">
                Password
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-ivory-300/30" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  placeholder="••••••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full bg-charcoal-900 border border-white/10 rounded-xl pl-10 pr-12 py-3
                    font-body text-sm text-white placeholder-ivory-300/20
                    focus:outline-none focus:border-gold-500 transition-colors"
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-ivory-300/30 hover:text-ivory-300/60 transition-colors">
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400
                  font-body text-sm px-4 py-3 rounded-xl">
                <span className="text-base">⚠️</span> {error}
              </motion.div>
            )}

            {/* Submit */}
            <button type="submit" disabled={loading}
              className="w-full btn-gold justify-center py-3.5 rounded-xl text-sm font-semibold
                disabled:opacity-50 disabled:cursor-not-allowed mt-2">
              {loading
                ? <><Loader2 size={16} className="animate-spin" /> Signing in…</>
                : <><Lock size={15} /> Sign In to Admin Panel</>
              }
            </button>
          </form>

          {/* Footer note */}
          <p className="text-center font-body text-xs text-ivory-300/20 mt-6">
            This page is for authorized staff only.<br />
            Unauthorized access is prohibited.
          </p>
        </div>
      </motion.div>
    </div>
  )
}
