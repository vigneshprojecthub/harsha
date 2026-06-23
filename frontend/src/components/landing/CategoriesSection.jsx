import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

const categories = [
  {
    name: 'Aari Work',
    slug: 'aari-work',
    desc: 'Traditional needle embroidery with gold & silver threads',
    emoji: '🪡',
    color: 'from-amber-900/80 to-amber-700/60',
  },
  {
    name: 'Thread Embroidery',
    slug: 'thread-embroidery',
    desc: 'Vibrant multi-color thread work on silk and cotton',
    emoji: '🧵',
    color: 'from-rose-900/80 to-rose-700/60',
  },
  {
    name: 'Bead Work',
    slug: 'bead-work',
    desc: 'Hand-placed bead arrangements creating stunning patterns',
    emoji: '💎',
    color: 'from-indigo-900/80 to-indigo-700/60',
  },
  {
    name: 'Sequence Work',
    slug: 'sequence-work',
    desc: 'Glamorous sequin embellishments for special occasions',
    emoji: '✨',
    color: 'from-purple-900/80 to-purple-700/60',
  },
  {
    name: 'Wedding Frames',
    slug: 'wedding-frames',
    desc: 'Cherished wedding memories in handcrafted embroidered frames',
    emoji: '💍',
    color: 'from-teal-900/80 to-teal-700/60',
  },
]

export default function CategoriesSection() {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <div className="section-subtitle mb-2">What We Create</div>
          <h2 className="section-title mb-4">Our Collections</h2>
          <div className="gold-divider" />
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
          {categories.map((cat, i) => (
            <motion.div
              key={cat.slug}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <Link
                to={`/products?category=${cat.slug}`}
                className="group block relative h-64 rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-400 hover:-translate-y-1"
              >
                {/* Gradient background */}
                <div className={`absolute inset-0 bg-gradient-to-b ${cat.color}`} />
                {/* Pattern overlay */}
                <div className="absolute inset-0 opacity-10"
                  style={{
                    backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(255,255,255,.1) 5px, rgba(255,255,255,.1) 10px)`
                  }}
                />

                <div className="relative h-full flex flex-col items-center justify-center p-5 text-center">
                  <div className="text-5xl mb-3 group-hover:scale-110 transition-transform duration-300">
                    {cat.emoji}
                  </div>
                  <h3 className="font-display text-white text-lg font-bold mb-2">{cat.name}</h3>
                  <p className="font-body text-white/70 text-xs leading-relaxed mb-4">{cat.desc}</p>
                  <div className="flex items-center gap-1 text-gold-300 text-xs font-body group-hover:gap-2 transition-all">
                    <span>Explore</span>
                    <ArrowRight size={12} />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
