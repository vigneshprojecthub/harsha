import { motion } from 'framer-motion'
import { Shield, Clock, Award, Heart } from 'lucide-react'

const features = [
  { icon: Award,  title: '12+ Years',         desc: 'Of crafting excellence',  color: 'text-gold-400' },
  { icon: Heart,  title: '100% Handmade',      desc: 'Every stitch by hand',    color: 'text-rose-400' },
  { icon: Shield, title: 'Quality Guaranteed', desc: 'Or we redo it free',      color: 'text-green-400' },
  { icon: Clock,  title: 'On-time Delivery',   desc: 'We respect your timeline', color: 'text-blue-400' },
]

export default function WhyChooseUs() {
  return (
    <section className="pt-4 pb-2">
      <div className="px-4 sm:px-6 lg:px-8 mb-3">
        <h2 className="font-display text-base sm:text-lg font-bold text-white">Why Choose Us</h2>
      </div>
      <div className="flex gap-3 overflow-x-auto scrollbar-hide px-4 sm:px-6 lg:px-8 pb-2
        md:grid md:grid-cols-4 md:overflow-visible">
        {features.map((f, i) => (
          <motion.div key={f.title}
            initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ delay: i * 0.08 }}
            className="flex-shrink-0 w-36 md:w-auto bg-charcoal-800/60 border border-white/5
              rounded-xl p-4 flex flex-col gap-2">
            <f.icon size={20} className={f.color} />
            <div className="font-display text-white font-bold text-sm">{f.title}</div>
            <div className="font-body text-ivory-300/50 text-xs leading-snug">{f.desc}</div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
