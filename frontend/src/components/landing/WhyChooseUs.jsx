import { motion } from 'framer-motion'
import { Gem, Clock, MessageCircle, Award, Leaf, RefreshCw } from 'lucide-react'

const features = [
  {
    icon: Gem,
    title: 'Premium Quality',
    desc: 'Only the finest threads, beads, and materials sourced from trusted suppliers to ensure lasting beauty.',
  },
  {
    icon: Clock,
    title: 'Timely Delivery',
    desc: 'We respect your timeline. Every custom order is delivered on or before the promised date.',
  },
  {
    icon: MessageCircle,
    title: 'Personal Consultation',
    desc: 'Work directly with our artisans via WhatsApp to bring your exact vision to life.',
  },
  {
    icon: Award,
    title: '12+ Years Expertise',
    desc: 'Over a decade of experience in traditional embroidery arts passed down through generations.',
  },
  {
    icon: Leaf,
    title: 'Eco-Conscious',
    desc: 'Natural dyes and sustainable sourcing practices that honor both craft and environment.',
  },
  {
    icon: RefreshCw,
    title: 'Unlimited Revisions',
    desc: 'Your satisfaction is paramount. We work with you until every stitch is perfect.',
  },
]

export default function WhyChooseUs() {
  return (
    <section className="py-24 bg-charcoal-900 relative overflow-hidden">
      {/* Decorative grid */}
      <div className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `
            linear-gradient(rgba(200,134,15,.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(200,134,15,.5) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px'
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="font-accent text-gold-400 italic text-lg tracking-wide mb-2">
            The Harsha Promise
          </div>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-4">
            Why Choose Us
          </h2>
          <div className="w-16 h-0.5 bg-gold-gradient mx-auto" />
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feat, i) => (
            <motion.div
              key={feat.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group p-8 rounded-2xl border border-white/5 bg-white/3 hover:border-gold-500/30 hover:bg-gold-500/5 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-gold-gradient flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                <feat.icon size={20} className="text-white" />
              </div>
              <h3 className="font-display text-white text-xl font-semibold mb-3">{feat.title}</h3>
              <p className="font-body text-ivory-300/60 leading-relaxed text-sm">{feat.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
