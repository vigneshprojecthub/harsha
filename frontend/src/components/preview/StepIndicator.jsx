import { motion } from 'framer-motion'
import { Check } from 'lucide-react'

const STEPS = [
  { label: 'Upload Garment', short: 'Garment' },
  { label: 'Embroidery Style', short: 'Style' },
  { label: 'Instructions', short: 'Details' },
  { label: 'AI Preview', short: 'Preview' },
]

export default function StepIndicator({ currentStep }) {
  return (
    <div className="flex items-center justify-center gap-0 w-full max-w-xl mx-auto">
      {STEPS.map((step, i) => {
        const idx = i + 1
        const done = idx < currentStep
        const active = idx === currentStep
        const upcoming = idx > currentStep

        return (
          <div key={idx} className="flex items-center flex-1 last:flex-none">
            {/* Node */}
            <div className="flex flex-col items-center">
              <motion.div
                initial={false}
                animate={{
                  scale: active ? 1.1 : 1,
                  backgroundColor: done
                    ? '#c8860f'
                    : active
                    ? '#1a1510'
                    : '#e4d4b0',
                }}
                transition={{ duration: 0.25 }}
                className={`
                  w-9 h-9 rounded-full flex items-center justify-center font-body text-sm font-bold
                  border-2 transition-all
                  ${done ? 'border-gold-500 text-white' : ''}
                  ${active ? 'border-charcoal-800 text-white shadow-lg' : ''}
                  ${upcoming ? 'border-ivory-400 text-charcoal-800/40' : ''}
                `}
              >
                {done ? <Check size={15} strokeWidth={3} className="text-white" /> : idx}
              </motion.div>
              <span className={`mt-1.5 font-body text-[10px] text-center whitespace-nowrap tracking-wide ${
                active ? 'text-charcoal-800 font-semibold' : done ? 'text-gold-600' : 'text-charcoal-800/30'
              }`}>
                <span className="hidden sm:block">{step.label}</span>
                <span className="sm:hidden">{step.short}</span>
              </span>
            </div>

            {/* Connector line (not after last) */}
            {i < STEPS.length - 1 && (
              <div className="flex-1 h-px mx-1 mb-5 relative overflow-hidden bg-ivory-300">
                <motion.div
                  initial={false}
                  animate={{ scaleX: done ? 1 : 0 }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                  style={{ transformOrigin: 'left' }}
                  className="absolute inset-0 bg-gold-500"
                />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
