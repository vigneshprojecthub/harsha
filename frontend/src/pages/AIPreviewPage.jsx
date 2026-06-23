import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, ArrowLeft, AlertCircle, Sparkles } from 'lucide-react'

import StepIndicator from '../components/preview/StepIndicator'
import ImageDropZone from '../components/preview/ImageDropZone'
import GeneratingAnimation from '../components/preview/GeneratingAnimation'
import PreviewResult from '../components/preview/PreviewResult'
import ConfirmOrderModal from '../components/preview/ConfirmOrderModal'
import { previewApi, pollUntilDone } from '../utils/previewApi'

const EMBROIDERY_STYLES = [
  { id: 'aari', label: 'Aari Work', desc: 'Fine needle with gold & silk thread', emoji: '🪡' },
  { id: 'thread', label: 'Thread Embroidery', desc: 'Vibrant multi-colour threads', emoji: '🧵' },
  { id: 'bead', label: 'Bead Work', desc: 'Crystal & glass bead patterns', emoji: '💎' },
  { id: 'sequence', label: 'Sequence Work', desc: 'Glamorous sequin overlays', emoji: '✨' },
  { id: 'zardosi', label: 'Zardosi', desc: 'Heavy metallic gold embroidery', emoji: '👑' },
  { id: 'mirror', label: 'Mirror Work', desc: 'Traditional Rajasthani mirrors', emoji: '🪞' },
]

// Slide animation direction controlled by step change
const slideVariants = (dir) => ({
  initial: { opacity: 0, x: dir > 0 ? 48 : -48 },
  animate: { opacity: 1, x: 0 },
  exit:    { opacity: 0, x: dir > 0 ? -48 : 48 },
})

export default function AIPreviewPage() {
  const [searchParams] = useSearchParams()

  // ── wizard state ──
  const [step, setStep] = useState(1)
  const [dir,  setDir]  = useState(1)

  // ── form state ──
  const [garmentFile, setGarmentFile] = useState(null)
  const [refFile, setRefFile] = useState(null)
  const [selectedStyle, setSelectedStyle] = useState('')
  const [instructions, setInstructions] = useState(
    searchParams.get('instructions') || ''
  )

  // ── generation state ──
  const [previewRecord, setPreviewRecord] = useState(null)
  const [genStatus, setGenStatus] = useState('idle') // idle | uploading | processing | completed | failed | regenerating
  const [genError, setGenError] = useState('')
  const [msgIdx, setMsgIdx] = useState(0)
  const msgTimer = useRef(null)

  // ── modal state ──
  const [showConfirm, setShowConfirm] = useState(false)

  // Cycle through loading messages during generation
  useEffect(() => {
    if (genStatus === 'processing') {
      setMsgIdx(0)
      msgTimer.current = setInterval(() => {
        setMsgIdx(i => (i < 6 ? i + 1 : i))
      }, 8000)
    } else {
      clearInterval(msgTimer.current)
    }
    return () => clearInterval(msgTimer.current)
  }, [genStatus])

  // ── navigation helpers ──
  const goTo = (n) => { setDir(n > step ? 1 : -1); setStep(n) }
  const next = () => goTo(step + 1)
  const back = () => goTo(step - 1)

  // ── can user proceed? ──
  const canProceed = {
    1: !!garmentFile,
    2: true,                // reference optional
    3: true,                // instructions optional
  }

  // ── main generation trigger ──
  const startGeneration = async () => {
    setGenError('')
    setGenStatus('uploading')
    goTo(4)

    try {
      // Combine style + free-text instructions into a single string
      const styleLabel = selectedStyle ? EMBROIDERY_STYLES.find(s => s.id === selectedStyle)?.label : ''
      const fullInstructions = [styleLabel, instructions].filter(Boolean).join(', ')

      const { data } = await previewApi.upload(
        garmentFile,
        refFile || null,
        fullInstructions || null,
        true,
      )
      setPreviewRecord(data)
      setGenStatus('processing')

      // Long-poll until done
      const final = await pollUntilDone(
        data.id,
        (status, rec) => {
          setPreviewRecord(rec)
          setGenStatus(status === 'completed' ? 'completed' : status === 'failed' ? 'failed' : 'processing')
        }
      )

      setPreviewRecord(final)
      setGenStatus(final.status)
      if (final.status === 'failed') {
        setGenError(final.error_message || 'Generation failed. Please try again.')
      }
    } catch (err) {
      setGenStatus('failed')
      setGenError(err.message || 'Something went wrong. Please try again.')
    }
  }

  // ── regenerate ──
  const handleRegenerate = async (newInstructions) => {
    if (!previewRecord) return
    setGenError('')
    setGenStatus('processing')
    try {
      const { data } = await previewApi.regenerate(previewRecord.id, newInstructions)
      setPreviewRecord(data)
      const final = await pollUntilDone(data.id, (_, rec) => setPreviewRecord(rec))
      setPreviewRecord(final)
      setGenStatus(final.status)
    } catch (err) {
      setGenStatus('failed')
      setGenError(err.message || 'Regeneration failed.')
    }
  }

  // ── retry from scratch ──
  const handleRetry = () => {
    setGenStatus('idle')
    setPreviewRecord(null)
    setGenError('')
    goTo(1)
  }

  return (
    <div className="min-h-screen bg-ivory-50 pt-20 pb-16">
      {/* Page header */}
      <div className="bg-charcoal-900 py-14">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Sparkles size={16} className="text-gold-400" />
            <span className="font-accent text-gold-400 italic text-base">AI-Powered</span>
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-white mb-3 leading-tight">
            Design Your Embroidery
          </h1>
          <p className="font-body text-ivory-200/50 text-sm max-w-sm mx-auto">
            Upload your garment, choose a style, and watch AI bring your vision to life in seconds.
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-10">
        {/* Step indicator */}
        <div className="mb-10">
          <StepIndicator currentStep={step} />
        </div>

        {/* Step panels */}
        <div className="relative overflow-hidden">
          <AnimatePresence mode="wait" custom={dir}>
            {/* ── STEP 1: Upload Garment ── */}
            {step === 1 && (
              <motion.div key="step1" custom={dir} variants={slideVariants(dir)}
                initial="initial" animate="animate" exit="exit"
                transition={{ duration: 0.28, ease: 'easeInOut' }}
              >
                <div className="bg-white rounded-3xl border border-ivory-200 shadow-sm p-8">
                  <div className="mb-6">
                    <h2 className="font-display text-2xl font-bold text-charcoal-800">Upload Your Garment</h2>
                    <p className="font-body text-charcoal-800/50 text-sm mt-1">
                      A clear, well-lit photo gives the best results. The AI preserves your garment shape.
                    </p>
                  </div>

                  <ImageDropZone
                    label="Garment Photo"
                    hint="shirt / blouse / dupatta / saree"
                    value={garmentFile}
                    onChange={setGarmentFile}
                    required
                  />

                  <div className="mt-5 grid grid-cols-3 gap-2 text-center">
                    {['Clear background', 'Good lighting', 'Full garment visible'].map(tip => (
                      <div key={tip} className="bg-ivory-50 rounded-xl p-2.5 border border-ivory-200">
                        <div className="font-body text-[11px] text-charcoal-800/50">{tip}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end mt-5">
                  <button onClick={next} disabled={!canProceed[1]} className="btn-gold disabled:opacity-40">
                    Next <ArrowRight size={15} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── STEP 2: Embroidery Style ── */}
            {step === 2 && (
              <motion.div key="step2" custom={dir} variants={slideVariants(dir)}
                initial="initial" animate="animate" exit="exit"
                transition={{ duration: 0.28, ease: 'easeInOut' }}
              >
                <div className="bg-white rounded-3xl border border-ivory-200 shadow-sm p-8">
                  <div className="mb-6">
                    <h2 className="font-display text-2xl font-bold text-charcoal-800">Choose Embroidery Style</h2>
                    <p className="font-body text-charcoal-800/50 text-sm mt-1">
                      Pick a style — or upload your own reference image below for a custom look.
                    </p>
                  </div>

                  {/* Style tiles */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                    {EMBROIDERY_STYLES.map(style => (
                      <button
                        key={style.id}
                        onClick={() => setSelectedStyle(style.id === selectedStyle ? '' : style.id)}
                        className={`p-4 rounded-2xl border-2 text-left transition-all duration-200 ${
                          selectedStyle === style.id
                            ? 'border-gold-500 bg-gold-50 shadow-sm shadow-gold-200'
                            : 'border-ivory-200 hover:border-gold-300 bg-white hover:bg-gold-50/40'
                        }`}
                      >
                        <div className="text-2xl mb-1.5">{style.emoji}</div>
                        <div className="font-body text-sm font-semibold text-charcoal-800">{style.label}</div>
                        <div className="font-body text-[11px] text-charcoal-800/40 mt-0.5 leading-tight">{style.desc}</div>
                      </button>
                    ))}
                  </div>

                  {/* Optional reference upload */}
                  <div className="border-t border-ivory-200 pt-5">
                    <ImageDropZone
                      label="Reference Image"
                      hint="optional"
                      value={refFile}
                      onChange={setRefFile}
                    />
                    <p className="font-body text-xs text-charcoal-800/40 mt-2">
                      Upload an embroidery photo to guide the AI's style more precisely.
                    </p>
                  </div>
                </div>

                <div className="flex justify-between mt-5">
                  <button onClick={back} className="flex items-center gap-1.5 text-sm font-body text-charcoal-800/50 hover:text-charcoal-800 transition-colors px-2">
                    <ArrowLeft size={14} /> Back
                  </button>
                  <button onClick={next} className="btn-gold">
                    Next <ArrowRight size={15} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── STEP 3: Instructions ── */}
            {step === 3 && (
              <motion.div key="step3" custom={dir} variants={slideVariants(dir)}
                initial="initial" animate="animate" exit="exit"
                transition={{ duration: 0.28, ease: 'easeInOut' }}
              >
                <div className="bg-white rounded-3xl border border-ivory-200 shadow-sm p-8">
                  <div className="mb-6">
                    <h2 className="font-display text-2xl font-bold text-charcoal-800">Custom Instructions</h2>
                    <p className="font-body text-charcoal-800/50 text-sm mt-1">
                      Describe exactly what you want — the more specific, the better the result.
                    </p>
                  </div>

                  <textarea
                    value={instructions}
                    onChange={e => setInstructions(e.target.value)}
                    rows={5}
                    placeholder="e.g. gold thread peacock motif on the collar and cuffs, deep blue silk base, intricate geometric border pattern at the hem…"
                    className="w-full px-4 py-3.5 border border-ivory-300 rounded-2xl font-body text-sm focus:outline-none focus:border-gold-400 transition-colors resize-none"
                  />

                  {/* Prompt inspiration chips */}
                  <div className="mt-4">
                    <div className="font-body text-xs text-charcoal-800/40 mb-2">Quick add:</div>
                    <div className="flex flex-wrap gap-2">
                      {[
                        'gold thread border',
                        'peacock motif',
                        'floral collar',
                        'geometric pattern',
                        'rose design',
                        'heavy embroidery',
                        'subtle delicate work',
                        'bridal style',
                      ].map(chip => (
                        <button
                          key={chip}
                          onClick={() => setInstructions(prev =>
                            prev ? `${prev}, ${chip}` : chip
                          )}
                          className="text-xs font-body px-3 py-1.5 bg-ivory-100 hover:bg-gold-100 text-charcoal-800/60 hover:text-gold-700 rounded-full border border-ivory-200 hover:border-gold-300 transition-all"
                        >
                          + {chip}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Summary card */}
                  <div className="mt-6 p-4 bg-charcoal-900/5 rounded-2xl border border-charcoal-800/10 space-y-2">
                    <div className="font-body text-xs font-semibold text-charcoal-800/40 uppercase tracking-wide">Your Order Summary</div>
                    <div className="flex items-center gap-2 text-xs font-body">
                      <span className="text-charcoal-800/40">Garment:</span>
                      <span className="text-charcoal-800/70 font-medium truncate">{garmentFile?.name || '—'}</span>
                    </div>
                    {selectedStyle && (
                      <div className="flex items-center gap-2 text-xs font-body">
                        <span className="text-charcoal-800/40">Style:</span>
                        <span className="text-gold-600 font-medium">
                          {EMBROIDERY_STYLES.find(s => s.id === selectedStyle)?.label}
                        </span>
                      </div>
                    )}
                    {refFile && (
                      <div className="flex items-center gap-2 text-xs font-body">
                        <span className="text-charcoal-800/40">Reference:</span>
                        <span className="text-charcoal-800/70">{refFile.name}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-between mt-5">
                  <button onClick={back} className="flex items-center gap-1.5 text-sm font-body text-charcoal-800/50 hover:text-charcoal-800 transition-colors px-2">
                    <ArrowLeft size={14} /> Back
                  </button>
                  <button onClick={startGeneration} className="btn-gold">
                    <Sparkles size={15} />
                    Generate Preview
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── STEP 4: AI Generation + Result ── */}
            {step === 4 && (
              <motion.div key="step4" custom={dir} variants={slideVariants(dir)}
                initial="initial" animate="animate" exit="exit"
                transition={{ duration: 0.28, ease: 'easeInOut' }}
              >
                <div className="bg-white rounded-3xl border border-ivory-200 shadow-sm overflow-hidden">
                  {/* Header */}
                  <div className="px-8 pt-8 pb-0">
                    <h2 className="font-display text-2xl font-bold text-charcoal-800">
                      {genStatus === 'completed' ? 'Your Preview is Ready' :
                       genStatus === 'failed'    ? 'Generation Failed' :
                       'Generating Your Preview'}
                    </h2>
                    <p className="font-body text-charcoal-800/50 text-sm mt-1">
                      {genStatus === 'completed' ? 'Review and refine, then confirm to place your order.' :
                       genStatus === 'failed'    ? 'Something went wrong. Check the error and retry.' :
                       'Our AI is weaving your custom embroidery design…'}
                    </p>
                  </div>

                  <div className="px-8 pb-8 pt-4">
                    {/* Loading state */}
                    {(genStatus === 'uploading' || genStatus === 'processing') && (
                      <GeneratingAnimation messageIndex={msgIdx} />
                    )}

                    {/* Error state */}
                    {genStatus === 'failed' && (
                      <div className="py-8 text-center space-y-5">
                        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto">
                          <AlertCircle size={28} className="text-red-500" />
                        </div>
                        <div>
                          <p className="font-body font-semibold text-charcoal-800">Generation failed</p>
                          <p className="font-body text-sm text-charcoal-800/50 mt-1 max-w-sm mx-auto">
                            {genError || 'An unexpected error occurred.'}
                          </p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                          <button
                            onClick={() => previewRecord
                              ? handleRegenerate(instructions)
                              : startGeneration()
                            }
                            className="btn-gold"
                          >
                            <Sparkles size={15} />
                            Try Again
                          </button>
                          <button onClick={handleRetry} className="btn-outline-gold">
                            Start Over
                          </button>
                        </div>
                        {genError?.includes('API token') && (
                          <p className="font-body text-xs text-amber-700 bg-amber-50 border border-amber-200 px-4 py-3 rounded-xl max-w-sm mx-auto">
                            ⚠️ Set your <code className="font-mono">REPLICATE_API_TOKEN</code> in the backend <code className="font-mono">.env</code> file to enable AI generation.
                          </p>
                        )}
                      </div>
                    )}

                    {/* Success state */}
                    {genStatus === 'completed' && previewRecord && (
                      <PreviewResult
                        preview={previewRecord}
                        onRegenerate={handleRegenerate}
                        regenerating={false}
                        onConfirm={() => setShowConfirm(true)}
                      />
                    )}
                  </div>
                </div>

                {genStatus === 'failed' || genStatus === 'completed' ? (
                  <div className="flex justify-start mt-5">
                    <button onClick={handleRetry} className="flex items-center gap-1.5 text-sm font-body text-charcoal-800/50 hover:text-charcoal-800 transition-colors px-2">
                      <ArrowLeft size={14} /> Start New Design
                    </button>
                  </div>
                ) : null}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Confirm Order Modal */}
      <AnimatePresence>
        {showConfirm && previewRecord && (
          <ConfirmOrderModal
            preview={previewRecord}
            onClose={() => setShowConfirm(false)}
            onSuccess={() => {}}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
