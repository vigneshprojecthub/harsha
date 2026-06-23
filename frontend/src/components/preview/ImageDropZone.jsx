import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, X, ImageIcon } from 'lucide-react'

export default function ImageDropZone({ label, hint, value, onChange, required = false }) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef()

  const preview = value ? URL.createObjectURL(value) : null

  const handleFile = (file) => {
    if (!file) return
    if (!file.type.startsWith('image/')) return
    onChange(file)
  }

  const onDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    handleFile(e.dataTransfer.files[0])
  }

  const clear = (e) => {
    e.stopPropagation()
    onChange(null)
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <label className="font-body text-sm font-semibold text-charcoal-800">
          {label}
          {required && <span className="text-gold-500 ml-1">*</span>}
        </label>
        {hint && <span className="font-body text-xs text-charcoal-800/40">{hint}</span>}
      </div>

      <div
        onClick={() => !value && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`
          relative w-full rounded-2xl overflow-hidden transition-all duration-200
          ${value ? 'cursor-default' : 'cursor-pointer'}
          ${dragging
            ? 'ring-2 ring-gold-500 ring-offset-2 bg-gold-50'
            : value
            ? 'border border-ivory-300'
            : 'border-2 border-dashed border-ivory-300 hover:border-gold-400 bg-ivory-50 hover:bg-gold-50/30'
          }
        `}
        style={{ minHeight: 180 }}
      >
        <AnimatePresence mode="wait">
          {value ? (
            <motion.div
              key="preview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="relative w-full"
              style={{ minHeight: 180 }}
            >
              <img
                src={preview}
                alt={label}
                className="w-full object-cover rounded-2xl"
                style={{ maxHeight: 280, minHeight: 180 }}
              />
              {/* Overlay controls */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent rounded-2xl" />
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                <span className="font-body text-xs text-white/80 truncate max-w-[70%]">
                  {value.name}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => inputRef.current?.click()}
                    className="text-xs font-body bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm px-2.5 py-1 rounded-full transition-colors"
                  >
                    Change
                  </button>
                  <button
                    onClick={clear}
                    className="w-6 h-6 bg-red-500/80 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors"
                  >
                    <X size={11} />
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-10 px-6 text-center"
              style={{ minHeight: 180 }}
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3 transition-colors ${
                dragging ? 'bg-gold-100' : 'bg-ivory-200'
              }`}>
                {dragging
                  ? <Upload size={22} className="text-gold-600" />
                  : <ImageIcon size={22} className="text-charcoal-800/30" />
                }
              </div>
              <p className="font-body text-sm font-medium text-charcoal-800/60">
                {dragging ? 'Drop to upload' : 'Click or drag image here'}
              </p>
              <p className="font-body text-xs text-charcoal-800/30 mt-1">
                JPG, PNG, WebP · max 10 MB
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files[0])}
        />
      </div>
    </div>
  )
}
