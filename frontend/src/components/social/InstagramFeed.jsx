import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Instagram, ExternalLink, Play, Layers } from 'lucide-react'
import axios from 'axios'

function PostThumb({ post, index }) {
  return (
    <motion.a
      href={post.permalink || 'https://instagram.com/harsha_art_gallery'}
      target="_blank" rel="noopener noreferrer"
      initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
      viewport={{ once: true }} transition={{ delay: Math.min(index * 0.03, 0.4) }}
      className="group relative aspect-square w-full rounded-lg sm:rounded-xl overflow-hidden
        bg-charcoal-800 border border-white/5 hover:border-gold-500/40 transition-colors duration-200"
    >
      {post.media_url
        ? <img src={post.media_url} alt="" loading="lazy"
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        : <div className="absolute inset-0 flex items-center justify-center">
            <Instagram size={18} className="text-gold-400/25" />
          </div>
      }

      {/* Video play badge */}
      {post.media_type === 'VIDEO' && (
        <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-black/70 backdrop-blur-sm
          flex items-center justify-center z-10">
          <Play size={9} className="text-white fill-white ml-0.5" />
        </div>
      )}

      {/* Carousel badge */}
      {post.media_type === 'CAROUSEL_ALBUM' && (
        <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-black/70 backdrop-blur-sm
          flex items-center justify-center z-10">
          <Layers size={9} className="text-white" />
        </div>
      )}

      {/* Hover overlay with stats */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent
        opacity-0 group-hover:opacity-100 transition-opacity duration-200
        flex items-end justify-center pb-2">
        {post.like_count > 0 && (
          <span className="text-white text-[11px] font-body font-semibold flex items-center gap-1">
            ❤️ {post.like_count}
          </span>
        )}
      </div>
    </motion.a>
  )
}

export default function InstagramFeed({ limit = 18, showHeader = false }) {
  const [posts,   setPosts]   = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get(`/api/instagram/posts?limit=${limit}`)
      .then(r => setPosts(r.data.posts || []))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false))
  }, [limit])

  // Demo placeholders if API returns nothing at all
  const items = posts.length > 0
    ? posts
    : Array(Math.min(limit, 12)).fill(null).map((_, i) => ({ id: i, demo: true }))

  return (
    <section className="py-6 sm:py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 mb-4">
          <div className="flex items-center gap-2">
            <Instagram size={15} className="text-gold-400" />
            <h2 className="font-display text-base sm:text-lg font-bold text-white">@harsha_art_gallery</h2>
          </div>
          <a href="https://instagram.com/harsha_art_gallery" target="_blank" rel="noopener noreferrer"
            className="font-body text-xs text-gold-400 hover:text-gold-300 flex items-center gap-1 transition-colors">
            Follow <ExternalLink size={10} />
          </a>
        </div>

        {/* Grid — consistent everywhere, no flex/grid mixing */}
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-1.5 sm:gap-2">
            {loading
              ? Array(12).fill(null).map((_, i) => (
                  <div key={i} className="aspect-square rounded-lg sm:rounded-xl bg-charcoal-800 animate-pulse" />
                ))
              : items.map((post, i) => <PostThumb key={post.id} post={post} index={i} />)
            }
          </div>
        </div>
      </div>
    </section>
  )
}
