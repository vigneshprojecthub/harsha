import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RefreshCw, CheckCircle, Download, ZoomIn, X, MessageCircle } from 'lucide-react'

function LightboxModal({ src, alt, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <button
        className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
        onClick={onClose}
      >
        <X size={18} />
      </button>
      <motion.img
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        src={src}
        alt={alt}
        className="max-w-full max-h-[90vh] rounded-xl object-contain"
        onClick={(e) => e.stopPropagation()}
      />
    </motion.div>
  )
}

export default function PreviewResult({
  preview,
  onRegenerate,
  onConfirm,
  regenerating,
}) {
  const [lightbox, setLightbox] = useState(null)
  const [instructions, setInstructions] = useState(preview.custom_instructions || '')

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = preview.generated_preview_url
    link.download = `harsha-preview-${preview.id}.png`
    link.click()
  }

  return (
    <div className="space-y-6">
      {/* Before / After grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Original */}
        <div className="space-y-2">
          <div className="font-body text-xs font-semibold text-charcoal-800/50 tracking-wide uppercase">Your Garment</div>
          <div
            className="relative group rounded-2xl overflow-hidden border border-ivory-200 bg-ivory-50 cursor-zoom-in"
            style={{ aspectRatio: '3/4' }}
            onClick={() => setLightbox({ src: preview.original_image_url, alt: 'Original garment' })}
          >
            <img
              src={preview.original_image_url}
              alt="Original garment"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
              <ZoomIn size={20} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        </div>

        {/* Generated */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <div className="font-body text-xs font-semibold text-gold-600 tracking-wide uppercase">AI Preview</div>
            <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 text-[10px] font-body px-1.5 py-0.5 rounded-full border border-green-200">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
              Ready
            </span>
          </div>
          <div
            className="relative group rounded-2xl overflow-hidden border-2 border-gold-200 shadow-md shadow-gold-100 cursor-zoom-in"
            style={{ aspectRatio: '3/4' }}
            onClick={() => setLightbox({ src: preview.generated_preview_url, alt: 'AI generated preview' })}
          >
            <img
              src={preview.generated_preview_url}
              alt="AI generated preview"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
              <ZoomIn size={20} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            {/* Gold corner accent */}
            <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-gold-gradient flex items-center justify-center shadow">
              <span className="text-[10px]">✨</span>
            </div>
          </div>
        </div>
      </div>

      {/* Reference image (small) */}
      {preview.reference_image_url && (
        <div className="flex items-center gap-3 p-3 bg-ivory-100 rounded-xl border border-ivory-200">
          <img
            src={preview.reference_image_url}
            alt="Reference"
            className="w-14 h-14 rounded-lg object-cover border border-ivory-300 flex-shrink-0"
          />
          <div>
            <div className="font-body text-xs font-semibold text-charcoal-800/60">Reference Style Used</div>
            <div className="font-body text-xs text-charcoal-800/40 mt-0.5 line-clamp-2">
              {preview.prompt?.split(',').slice(0, 3).join(', ')}…
            </div>
          </div>
        </div>
      )}

      {/* Generation info */}
      <div className="flex flex-wrap gap-3 text-xs font-body text-charcoal-800/40">
        {preview.generation_seconds && (
          <span>Generated in {preview.generation_seconds}s</span>
        )}
        {preview.replicate_prediction_id && (
          <span className="truncate">ID: {preview.replicate_prediction_id.slice(0, 12)}…</span>
        )}
      </div>

      {/* Refine instructions for regeneration */}
      <div>
        <label className="block font-body text-sm font-semibold text-charcoal-800 mb-2">
          Refine Instructions
          <span className="font-normal text-charcoal-800/40 ml-1">(optional — for next generation)</span>
        </label>
        <textarea
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          rows={3}
          placeholder="e.g. 'more gold thread', 'peacock motif on collar', 'less dense pattern'…"
          className="w-full px-4 py-3 border border-ivory-300 rounded-xl font-body text-sm focus:outline-none focus:border-gold-400 transition-colors resize-none"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => onRegenerate(instructions)}
          disabled={regenerating}
          className="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 border-2 border-charcoal-800/20 text-charcoal-800/70 hover:border-gold-400 hover:text-gold-700 font-body text-sm font-semibold rounded-xl transition-all disabled:opacity-50"
        >
          <RefreshCw size={15} className={regenerating ? 'animate-spin' : ''} />
          {regenerating ? 'Regenerating…' : 'Regenerate'}
        </button>

        <button
          onClick={handleDownload}
          className="flex items-center justify-center gap-2 px-4 py-3.5 border border-ivory-300 text-charcoal-800/60 hover:bg-ivory-100 font-body text-sm rounded-xl transition-colors"
        >
          <Download size={15} />
          Save
        </button>

        <button
          onClick={onConfirm}
          className="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 bg-gold-gradient text-white font-body text-sm font-semibold rounded-xl hover:shadow-lg hover:shadow-gold-400/30 transition-all"
        >
          <CheckCircle size={15} />
          Confirm Design
        </button>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <LightboxModal src={lightbox.src} alt={lightbox.alt} onClose={() => setLightbox(null)} />
        )}
      </AnimatePresence>
    </div>
  )
}
