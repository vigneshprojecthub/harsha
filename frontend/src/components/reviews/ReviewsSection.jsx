import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, Camera, Loader2, CheckCircle, X, Upload } from 'lucide-react'
import axios from 'axios'

// ── Star Rating Input ─────────────────────────────────────────────────────────
function StarInput({ value, onChange }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
        >
          <Star
            size={28}
            className={`transition-all duration-100 ${
              n <= (hover || value)
                ? 'text-gold-500 fill-gold-500 scale-110'
                : 'text-gray-200 fill-gray-200'
            }`}
          />
        </button>
      ))}
    </div>
  )
}

// ── Single Review Card ─────────────────────────────────────────────────────────
function ReviewCard({ review, delay = 0 }) {
  const [lightbox, setLightbox] = useState(null)
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay }}
      className="bg-white rounded-2xl border border-ivory-200 p-6 shadow-sm"
    >
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-gold-gradient flex items-center justify-center text-white font-display font-bold text-sm flex-shrink-0">
          {review.reviewer_name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-body font-semibold text-charcoal-800 text-sm">{review.reviewer_name}</span>
            {review.is_verified && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-body bg-green-50 text-green-700 border border-green-200 px-1.5 py-0.5 rounded-full">
                <CheckCircle size={9} />Verified
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            {Array(5).fill(0).map((_, i) => (
              <Star key={i} size={11} className={i < review.rating ? 'text-gold-500 fill-gold-500' : 'text-gray-200 fill-gray-200'} />
            ))}
            <span className="font-body text-xs text-charcoal-800/30 ml-1">
              {new Date(review.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>
        </div>
      </div>

      {review.title && (
        <div className="font-body font-semibold text-charcoal-800 text-sm mb-1">{review.title}</div>
      )}
      {review.body && (
        <p className="font-body text-charcoal-800/60 text-sm leading-relaxed mb-3">
          "{review.body}"
        </p>
      )}

      {review.photos?.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {review.photos.map((ph, i) => (
            <button key={i} onClick={() => setLightbox(ph)}
              className="w-16 h-16 rounded-xl overflow-hidden border border-ivory-200 hover:opacity-90 transition-opacity">
              <img src={ph} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      <AnimatePresence>
        {lightbox && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
            <button className="absolute top-4 right-4 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white">
              <X size={18} />
            </button>
            <img src={lightbox} className="max-w-full max-h-[88vh] rounded-xl" onClick={e => e.stopPropagation()} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ── Review Submission Form ────────────────────────────────────────────────────
function ReviewForm({ productId, onSubmitted }) {
  const [form, setForm] = useState({ reviewer_name: '', rating: 0, title: '', body: '' })
  const [photoFile, setPhotoFile] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [savedId, setSavedId] = useState(null)
  const [error, setError] = useState('')

  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    if (!form.rating) { setError('Please select a star rating'); return }
    if (!form.reviewer_name.trim()) { setError('Please enter your name'); return }
    setError('')
    setSubmitting(true)
    try {
      const { data } = await axios.post(`${import.meta.env.VITE_API_URL}/api/reviews`, {
        ...form,
        product_id: productId || null,
      })
      setSavedId(data.id)

      if (photoFile) {
        const fd = new FormData()
        fd.append('file', photoFile)
        await axios.post(`/api/reviews/${data.id}/photos`, fd)
      }

      setDone(true)
      onSubmitted?.()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit review')
    } finally {
      setSubmitting(false)
    }
  }

  if (done) return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
      className="text-center py-10">
      <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
        <CheckCircle size={32} className="text-green-600" />
      </div>
      <h3 className="font-display text-xl font-bold text-charcoal-800 mb-2">Thank you!</h3>
      <p className="font-body text-charcoal-800/50 text-sm">Your review has been submitted for moderation.</p>
    </motion.div>
  )

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="block font-body text-sm font-semibold text-charcoal-800 mb-2">Your Rating *</label>
        <StarInput value={form.rating} onChange={r => setForm(p => ({ ...p, rating: r }))} />
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block font-body text-xs font-semibold text-charcoal-800/50 mb-1.5">Your Name *</label>
          <input value={form.reviewer_name} onChange={set('reviewer_name')} placeholder="Priya Sharma" required
            className="w-full px-4 py-2.5 border border-ivory-300 rounded-xl font-body text-sm focus:outline-none focus:border-gold-400" />
        </div>
        <div>
          <label className="block font-body text-xs font-semibold text-charcoal-800/50 mb-1.5">Review Title</label>
          <input value={form.title} onChange={set('title')} placeholder="Beautiful craftsmanship!"
            className="w-full px-4 py-2.5 border border-ivory-300 rounded-xl font-body text-sm focus:outline-none focus:border-gold-400" />
        </div>
      </div>
      <div>
        <label className="block font-body text-xs font-semibold text-charcoal-800/50 mb-1.5">Your Review</label>
        <textarea value={form.body} onChange={set('body')} rows={3} placeholder="Tell others about your experience…"
          className="w-full px-4 py-2.5 border border-ivory-300 rounded-xl font-body text-sm focus:outline-none focus:border-gold-400 resize-none" />
      </div>
      <div>
        <label className="block font-body text-xs font-semibold text-charcoal-800/50 mb-1.5 flex items-center gap-1.5">
          <Camera size={12} />Add Photo (optional)
        </label>
        <label className="flex items-center gap-3 p-3 border border-dashed border-ivory-300 rounded-xl hover:border-gold-400 cursor-pointer transition-colors">
          <Upload size={16} className="text-charcoal-800/30" />
          <span className="font-body text-xs text-charcoal-800/50">
            {photoFile ? photoFile.name : 'Click to upload a product photo'}
          </span>
          <input type="file" accept="image/*" onChange={e => setPhotoFile(e.target.files[0])} className="hidden" />
        </label>
      </div>
      {error && <p className="text-xs font-body text-red-600 bg-red-50 px-3 py-2 rounded-xl border border-red-200">{error}</p>}
      <button type="submit" disabled={submitting} className="w-full btn-gold justify-center py-3.5 rounded-xl disabled:opacity-60">
        {submitting ? <><Loader2 size={15} className="animate-spin" />Submitting…</> : <>Submit Review</>}
      </button>
    </form>
  )
}

// ── Full Reviews Section (used on product page + landing page) ────────────────
export default function ReviewsSection({ productId, showForm = true, title = 'Customer Reviews' }) {
  const [reviews,     setReviews]     = useState([])
  const [loading,     setLoading]     = useState(true)
  const [showingForm, setShowingForm] = useState(false)
  const [summary,     setSummary]     = useState(null)

  const load = () => {
    const params = productId ? { product_id: productId, limit: 6 } : { featured: true, limit: 6 }
    axios.get('/api/reviews', { params })
      .then(r => setReviews(r.data))
      .finally(() => setLoading(false))
    axios.get('/api/reviews/summary').then(r => setSummary(r.data))
  }
  useEffect(load, [productId])

  const avgRating = summary?.avg_rating || 0
  const total     = summary?.total_reviews || 0

  return (
    <section className="py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <div className="font-accent text-gold-600 italic text-lg mb-1">What our customers say</div>
            <h2 className="section-title">{title}</h2>
            {total > 0 && (
              <div className="flex items-center gap-3 mt-3">
                <div className="flex">
                  {Array(5).fill(0).map((_, i) => (
                    <Star key={i} size={18} className={i < Math.round(avgRating) ? 'text-gold-500 fill-gold-500' : 'text-gray-200 fill-gray-200'} />
                  ))}
                </div>
                <span className="font-display font-bold text-charcoal-800 text-lg">{avgRating}</span>
                <span className="font-body text-charcoal-800/40 text-sm">({total} reviews)</span>
              </div>
            )}
          </div>
          {showForm && (
            <button onClick={() => setShowingForm(!showingForm)}
              className={showingForm ? 'btn-outline-gold' : 'btn-gold'}>
              {showingForm ? 'Cancel' : '✏️ Write a Review'}
            </button>
          )}
        </div>

        {/* Write Review Panel */}
        <AnimatePresence>
          {showingForm && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-10">
              <div className="bg-white rounded-2xl border border-ivory-200 p-7 shadow-sm">
                <h3 className="font-display font-bold text-charcoal-800 text-xl mb-5">Share Your Experience</h3>
                <ReviewForm
                  productId={productId}
                  onSubmitted={() => { setShowingForm(false); load() }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Reviews grid */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array(3).fill(null).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl h-40 animate-pulse border border-ivory-200" />
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-ivory-200">
            <Star size={36} className="mx-auto text-charcoal-800/20 mb-3" />
            <p className="font-body text-charcoal-800/40">No reviews yet — be the first!</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {reviews.map((r, i) => <ReviewCard key={r.id} review={r} delay={i * 0.07} />)}
          </div>
        )}
      </div>
    </section>
  )
}
