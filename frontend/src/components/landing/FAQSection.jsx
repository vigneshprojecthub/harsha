import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'

const faqs = [
  {
    q: 'How long does a custom order take?',
    a: 'Depending on the complexity, custom orders typically take 7–21 days. Simple pieces like cushion covers may take 7–10 days, while bridal work or wedding frames can take 15–21 days. We always confirm the timeline before starting.',
  },
  {
    q: 'Can I request a fully unique design?',
    a: 'Absolutely! That\'s our specialty. You can share reference images, color preferences, and specific motifs via WhatsApp and our artisans will craft it exclusively for you.',
  },
  {
    q: 'What materials do you use?',
    a: 'We use premium quality threads including silk, cotton, and metallic threads. Our beads are imported glass and crystal. All materials are carefully selected for longevity and beauty.',
  },
  {
    q: 'Do you ship outside Chennai/Tamil Nadu?',
    a: 'Yes! We ship pan-India and can arrange international shipping upon request. Shipping costs and timelines will be discussed before order confirmation.',
  },
  {
    q: 'How do I place a custom order?',
    a: 'Simply fill out our Custom Order form on the website, upload a reference image if you have one, and we\'ll connect you on WhatsApp to finalize details. It\'s that simple!',
  },
  {
    q: 'What is your return or revision policy?',
    a: 'Since all pieces are custom-made, we don\'t offer returns but we do offer revisions. If something isn\'t right, we\'ll work with you until you\'re completely satisfied.',
  },
]

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState(null)

  return (
    <section className="py-24 bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <div className="section-subtitle mb-2">Got Questions?</div>
          <h2 className="section-title mb-4">Frequently Asked</h2>
          <div className="gold-divider" />
        </motion.div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07 }}
              className="border border-ivory-300 rounded-xl overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-ivory-50 transition-colors"
              >
                <span className="font-display font-semibold text-charcoal-800 pr-4">{faq.q}</span>
                <motion.div
                  animate={{ rotate: openIndex === i ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex-shrink-0"
                >
                  <ChevronDown size={18} className="text-gold-500" />
                </motion.div>
              </button>

              <AnimatePresence>
                {openIndex === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5 font-body text-charcoal-800/70 leading-relaxed text-sm border-t border-ivory-200 pt-4">
                      {faq.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
