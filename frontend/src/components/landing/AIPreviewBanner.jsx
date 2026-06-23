import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Sparkles, Upload, Cpu, CheckCircle } from 'lucide-react'

const steps = [
  { icon: Upload,      label: 'Upload Garment',    desc: 'Photo of your shirt or dress' },
  { icon: Sparkles,    label: 'Choose Style',       desc: 'Pick from 6 embroidery styles' },
  { icon: Cpu,         label: 'AI Generates',       desc: 'Preview ready in ~30 seconds' },
  { icon: CheckCircle, label: 'Confirm & Order',    desc: 'Place your custom order' },
]

export default function AIPreviewBanner() {
  return (
    <section className="py-24 bg-charcoal-900 relative overflow-hidden">
      {/* Subtle grid */}
      <div className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `linear-gradient(rgba(200,134,15,1) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(200,134,15,1) 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}
      />

      {/* Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-48 rounded-full bg-gold-500/10 blur-3xl pointer-events-none" />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-14 items-center">
          {/* Left: copy */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-2 bg-gold-600/15 border border-gold-500/30 text-gold-400 text-xs font-body px-3 py-1.5 rounded-full mb-5 tracking-wide">
              <Sparkles size={11} />
              NEW · AI-Powered Preview
            </div>

            <h2 className="font-display text-4xl md:text-5xl font-bold text-white leading-tight mb-4">
              See It Before
              <br />
              <span className="text-transparent bg-clip-text bg-gold-gradient">
                We Stitch It
              </span>
            </h2>

            <p className="font-body text-ivory-200/60 leading-relaxed mb-8 max-w-md">
              Upload a photo of your garment and our AI shows you exactly how your custom embroidery will look — before a single thread is placed.
            </p>

            <Link to="/ai-preview" className="btn-gold">
              <Sparkles size={15} />
              Try AI Preview — Free
            </Link>

            <p className="font-body text-xs text-ivory-200/30 mt-3">
              No account needed · Takes &lt; 1 minute
            </p>
          </motion.div>

          {/* Right: steps */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 }}
            className="space-y-4"
          >
            {steps.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 + i * 0.1 }}
                className="flex items-center gap-4 p-4 rounded-2xl border border-white/5 bg-white/3 hover:border-gold-500/20 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-gold-gradient flex items-center justify-center flex-shrink-0">
                  <s.icon size={17} className="text-white" />
                </div>
                <div>
                  <div className="font-body font-semibold text-white text-sm">{s.label}</div>
                  <div className="font-body text-xs text-ivory-200/40 mt-0.5">{s.desc}</div>
                </div>
                <div className="ml-auto text-xs font-body font-bold text-charcoal-800/20">
                  {String(i + 1).padStart(2, '0')}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
