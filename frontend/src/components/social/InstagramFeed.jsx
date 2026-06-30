import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Instagram, ExternalLink } from 'lucide-react'
import axios from 'axios'

export default function InstagramFeed({ limit = 6, showHeader = false }) {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get(`/api/instagram/posts?limit=${limit}`)
      .then(r => setPosts(r.data.posts || []))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false))
  }, [limit])

  // Demo posts if empty
  const items = posts.length > 0 ? posts : Array(6).fill(null).map((_, i) => ({ id: i, demo: true }))

  return (
    <section className="pt-4 pb-2">
      <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 mb-3">
        <div className="flex items-center gap-2">
          <Instagram size={14} className="text-gold-400" />
          <h2 className="font-display text-base sm:text-lg font-bold text-white">@harsha_art_gallery</h2>
        </div>
        <a href="https://instagram.com/harsha_art_gallery" target="_blank" rel="noopener noreferrer"
          className="font-body text-xs text-gold-400 hover:text-gold-300 flex items-center gap-1">
          Follow <ExternalLink size={10} />
        </a>
      </div>

      <div className="flex gap-2 overflow-x-auto scrollbar-hide px-4 sm:px-6 lg:px-8 pb-2
        md:grid md:grid-cols-6 md:overflow-visible">
        {loading
          ? Array(6).fill(null).map((_, i) => (
              <div key={i} className="flex-shrink-0 w-24 h-24 md:w-auto md:aspect-square rounded-xl bg-charcoal-800 animate-pulse" />
            ))
          : items.map((post, i) => (
              <motion.a key={post.id}
                href={post.permalink || 'https://instagram.com/harsha_art_gallery'}
                target="_blank" rel="noopener noreferrer"
                initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
                viewport={{ once: true }} transition={{ delay: i * 0.05 }}
                className="group flex-shrink-0 w-24 h-24 md:w-auto md:aspect-square rounded-xl overflow-hidden
                  bg-charcoal-800 border border-white/5 hover:border-gold-500/30 transition-all">
                {post.media_url
                  ? <img src={post.media_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  : <div className="w-full h-full flex items-center justify-center">
                      <Instagram size={20} className="text-gold-400/30" />
                    </div>
                }
              </motion.a>
            ))
        }
      </div>
    </section>
  )
}
