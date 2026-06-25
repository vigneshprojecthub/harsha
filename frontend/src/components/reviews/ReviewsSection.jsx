import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, CheckCircle, X, Upload, Loader2 } from 'lucide-react'
import axios from 'axios'

function StarInput({ value, onChange }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map(n => (
        <button key={n} type="button" onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)}>
          <Star size={24} className={`transition-all ${n <= (hover||value) ? 'text-gold-500 fill-gold-500 scale-110' : 'text-gray-600 fill-gray-600'}`} />
        </button>
      ))}
    </div>
  )
}

function ReviewCard({ review, index }) {
  return (
    <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }} transition={{ delay: index * 0.06 }}
      className="flex-shrink-0 w-64 sm:w-72 md:w-auto bg-charcoal-800/60 border border-white/5
        rounded-xl p-4 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-gold-gradient flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
          {review.reviewer_name.charAt(0).toUpperCase()}
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-body font-semibold text-white text-sm">{review.reviewer_name}</span>
            {review.is_verified && <CheckCircle size={11} className="text-green-400" />}
          </div>
          <div className="flex">
            {Array(5).fill(0).map((_,i) => (
              <Star key={i} size={10} className={i < review.rating ? 'text-gold-500 fill-gold-500' : 'text-gray-600 fill-gray-600'} />
            ))}
          </div>
        </div>
      </div>
      {review.body && <p className="font-body text-ivory-300/60 text-xs leading-relaxed line-clamp-3">"{review.body}"</p>}
    </motion.div>
  )
}

function ReviewFormModal({ onClose, onSubmitted }) {
  const [form, setForm] = useState({ reviewer_name: '', rating: 0, body: '' })
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (!form.rating || !form.reviewer_name.trim()) return
    setSubmitting(true)
    try {
      await axios.post('/api/reviews', form)
      setDone(true)
      setTimeout(() => { onClose(); onSubmitted?.() }, 1500)
    } catch { /* silent */ } finally { setSubmitting(false) }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/80 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}>
      <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
        className="w-full sm:max-w-md bg-charcoal-900 rounded-t-3xl sm:rounded-2xl border border-white/10 p-6"
        onClick={e => e.stopPropagation()}>
        {done ? (
          <div className="text-center py-6">
            <CheckCircle size={40} className="text-green-400 mx-auto mb-3" />
            <div className="font-display text-white font-bold text-lg">Thank you!</div>
            <p className="font-body text-ivory-300/50 text-sm mt-1">Review submitted for moderation.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display font-bold text-white text-lg">Write a Review</h3>
              <button onClick={onClose} className="text-ivory-300/40 hover:text-white"><X size={20} /></button>
            </div>
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="block font-body text-xs text-ivory-300/50 mb-1.5">Your Rating *</label>
                <StarInput value={form.rating} onChange={r => setForm(p => ({ ...p, rating: r }))} />
              </div>
              <div>
                <label className="block font-body text-xs text-ivory-300/50 mb-1.5">Your Name *</label>
                <input value={form.reviewer_name} onChange={e => setForm(p => ({ ...p, reviewer_name: e.target.value }))}
                  placeholder="Priya Sharma" required
                  className="w-full px-4 py-2.5 bg-charcoal-800 border border-white/10 rounded-xl font-body text-sm text-white focus:outline-none focus:border-gold-500" />
              </div>
              <div>
                <label className="block font-body text-xs text-ivory-300/50 mb-1.5">Your Review</label>
                <textarea value={form.body} onChange={e => setForm(p => ({ ...p, body: e.target.value }))}
                  rows={3} placeholder="Share your experience…"
                  className="w-full px-4 py-2.5 bg-charcoal-800 border border-white/10 rounded-xl font-body text-sm text-white focus:outline-none focus:border-gold-500 resize-none" />
              </div>
              <button type="submit" disabled={submitting || !form.rating}
                className="w-full btn-gold justify-center py-3 rounded-xl disabled:opacity-40">
                {submitting ? <><Loader2 size={15} className="animate-spin" />Submitting…</> : 'Submit Review'}
              </button>
            </form>
          </>
        )}
      </motion.div>
    </motion.div>
  )
}

export default function ReviewsSection({ showForm = true, title = 'Reviews' }) {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [summary, setSummary] = useState(null)

  const load = () => {
    axios.get('/api/reviews?featured=true&limit=8')
      .then(r => setReviews(r.data)).finally(() => setLoading(false))
    axios.get('/api/reviews/summary').then(r => setSummary(r.data)).catch(() => {})
  }
  useEffect(load, [])

  return (
    <section className="pt-4 pb-2">
      <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 mb-3">
        <div className="flex items-center gap-2">
          <h2 className="font-display text-base sm:text-lg font-bold text-white">{title}</h2>
          {summary?.avg_rating && (
            <span className="font-body text-gold-400 text-xs bg-gold-500/10 px-2 py-0.5 rounded-full">
              ★ {summary.avg_rating} ({summary.total_reviews})
            </span>
          )}
        </div>
        {showForm && (
          <button onClick={() => setShowModal(true)}
            className="font-body text-xs text-gold-400 hover:text-gold-300">+ Write one</button>
        )}
      </div>

      <div className="flex gap-3 overflow-x-auto scrollbar-hide px-4 sm:px-6 lg:px-8 pb-2
        md:grid md:grid-cols-3 lg:grid-cols-4 md:overflow-visible">
        {loading
          ? Array(3).fill(null).map((_,i) => (
              <div key={i} className="flex-shrink-0 w-64 h-28 bg-charcoal-800 rounded-xl animate-pulse" />
            ))
          : reviews.length === 0
            ? <p className="font-body text-ivory-300/30 text-sm px-1">No reviews yet — be the first!</p>
            : reviews.map((r, i) => <ReviewCard key={r.id} review={r} index={i} />)
        }
      </div>

      <AnimatePresence>
        {showModal && (
          <ReviewFormModal onClose={() => setShowModal(false)} onSubmitted={load} />
        )}
      </AnimatePresence>
    </section>
  )
}
