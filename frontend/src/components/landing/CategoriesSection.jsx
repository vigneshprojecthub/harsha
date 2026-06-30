import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

const categories = [
  { name: 'Aari Work',         slug: 'aari-work',         emoji: '🪡', color: 'from-amber-800 to-amber-600' },
  { name: 'Thread Embroidery', slug: 'thread-embroidery', emoji: '🧵', color: 'from-rose-800 to-rose-600' },
  { name: 'Bead Work',         slug: 'bead-work',         emoji: '💎', color: 'from-indigo-800 to-indigo-600' },
  { name: 'Sequence Work',     slug: 'sequence-work',     emoji: '✨', color: 'from-purple-800 to-purple-600' },
  { name: 'Wedding Frames',    slug: 'wedding-frames',    emoji: '💍', color: 'from-teal-800 to-teal-600' },
]

export default function CategoriesSection() {
  return (
    <section className="py-6 sm:py-8">
      <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 mb-4">
        <h2 className="font-display text-base sm:text-lg font-bold text-white">Collections</h2>
        <Link to="/products" className="font-body text-xs text-gold-400 hover:text-gold-300">See all →</Link>
      </div>

      {/* Horizontal scroll on mobile, grid on desktop */}
      <div className="flex gap-3 overflow-x-auto scrollbar-hide px-4 sm:px-6 lg:px-8 pb-2
        md:grid md:grid-cols-5 md:overflow-visible">
        {categories.map((cat, i) => (
          <motion.div key={cat.slug}
            initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }} transition={{ delay: i * 0.07 }}
            className="flex-shrink-0 w-28 md:w-auto">
            <Link to={`/products?category=${cat.slug}`}
              className={`group relative flex flex-col items-center justify-center
                h-28 md:h-36 rounded-xl overflow-hidden bg-gradient-to-b ${cat.color}
                hover:scale-105 transition-transform duration-200`}>
              <div className="text-3xl md:text-4xl mb-1 group-hover:scale-110 transition-transform duration-200">
                {cat.emoji}
              </div>
              <span className="font-body text-white text-[11px] md:text-xs font-semibold text-center px-2 leading-tight">
                {cat.name}
              </span>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
