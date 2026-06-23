import { motion } from 'framer-motion'
import { Star, Quote } from 'lucide-react'

const testimonials = [
  {
    name: 'Priya Sharma',
    location: 'Chennai',
    text: 'The bridal blouse Aari work exceeded all my expectations. Every stitch was perfect and the delivery was right on time for my wedding. Harsha truly understands the art.',
    rating: 5,
    occasion: 'Wedding',
    initials: 'PS',
  },
  {
    name: 'Kavitha Rajan',
    location: 'Coimbatore',
    text: 'I ordered a custom wedding frame for my parents\' anniversary and it came out beautifully. The attention to detail and the personalization made it so special.',
    rating: 5,
    occasion: 'Anniversary Gift',
    initials: 'KR',
  },
  {
    name: 'Meena Krishnan',
    location: 'Bangalore',
    text: 'The thread embroidery on my daughter\'s pattu pavadai is stunning. People keep asking me where I got it done. Will definitely be a repeat customer!',
    rating: 5,
    occasion: 'Custom Dress',
    initials: 'MK',
  },
  {
    name: 'Sunitha Velu',
    location: 'Madurai',
    text: 'The bead work on the saree border was exactly what I had envisioned. The WhatsApp consultation made the whole process so easy and personal.',
    rating: 5,
    occasion: 'Saree Border',
    initials: 'SV',
  },
]

export default function Testimonials() {
  return (
    <section className="py-24 bg-ivory-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <div className="section-subtitle mb-2">Happy Clients</div>
          <h2 className="section-title mb-4">What They Say</h2>
          <div className="gold-divider" />
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="bg-white rounded-2xl p-8 shadow-sm border border-ivory-200 hover:shadow-md transition-shadow duration-300"
            >
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full bg-gold-gradient flex items-center justify-center flex-shrink-0">
                  <span className="font-display text-white font-bold text-sm">{t.initials}</span>
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <div>
                      <div className="font-display font-semibold text-charcoal-800">{t.name}</div>
                      <div className="font-body text-xs text-charcoal-800/50">{t.location} · {t.occasion}</div>
                    </div>
                    <Quote size={20} className="text-gold-300 flex-shrink-0" />
                  </div>

                  <div className="flex gap-0.5 my-2">
                    {Array(t.rating).fill(0).map((_, si) => (
                      <Star key={si} size={12} className="text-gold-500 fill-gold-500" />
                    ))}
                  </div>

                  <p className="font-body text-charcoal-800/70 leading-relaxed text-sm italic">
                    "{t.text}"
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
