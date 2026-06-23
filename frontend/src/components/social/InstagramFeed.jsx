import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Instagram, Heart, MessageCircle, ExternalLink } from 'lucide-react'
import axios from 'axios'

function PostCard({ post, index }) {
  const isVideo = post.media_type === 'VIDEO'
  return (
    <motion.a
      href={post.permalink || 'https://instagram.com/harshaartgallery'}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, scale: 0.92 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.07 }}
      whileHover={{ scale: 1.02 }}
      className="group relative aspect-square rounded-2xl overflow-hidden bg-ivory-100 block border border-ivory-200"
    >
      {post.media_url ? (
        <img
          src={post.media_url}
          alt={post.caption?.slice(0, 60) || 'Instagram post'}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      ) : (
        /* Demo placeholder */
        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-ivory-100 to-ivory-200">
          <Instagram size={32} className="text-gold-400 mb-2 opacity-50" />
          <span className="font-body text-xs text-charcoal-800/30 text-center px-4 line-clamp-2">
            {post.caption?.slice(0, 80) || 'Instagram post'}
          </span>
        </div>
      )}

      {/* Video badge */}
      {isVideo && (
        <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] font-body px-2 py-0.5 rounded-full">
          ▶ Reel
        </div>
      )}

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-300 flex items-center justify-center">
        <div className="opacity-0 group-hover:opacity-100 transition-opacity text-white text-center p-3">
          <div className="flex items-center justify-center gap-4 mb-2">
            <span className="flex items-center gap-1 text-sm font-body font-semibold">
              <Heart size={14} className="fill-white" />{post.like_count || 0}
            </span>
            <span className="flex items-center gap-1 text-sm font-body font-semibold">
              <MessageCircle size={14} />{post.comments_count || 0}
            </span>
          </div>
          {post.caption && (
            <p className="font-body text-xs text-white/80 line-clamp-3 leading-relaxed">
              {post.caption.replace(/#\w+/g, '').trim().slice(0, 100)}
            </p>
          )}
        </div>
      </div>
    </motion.a>
  )
}

export default function InstagramFeed({ limit = 9, showHeader = true }) {
  const [posts,   setPosts]   = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get(`/api/instagram/posts?limit=${limit}`)
      .then(r => setPosts(r.data.posts || []))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false))
  }, [limit])

  return (
    <section className="py-16 bg-ivory-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {showHeader && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <Instagram size={18} className="text-gold-500" />
              <span className="font-accent text-gold-600 italic text-lg">Follow our journey</span>
            </div>
            <h2 className="section-title mb-3">@harshaartgallery</h2>
            <div className="gold-divider" />
            <p className="mt-4 font-body text-charcoal-800/50 text-sm max-w-md mx-auto">
              Behind-the-scenes, finished pieces, and happy customers — follow us for daily craft inspiration.
            </p>
            <a
              href="https://instagram.com/harshaartgallery"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-body text-sm font-semibold rounded-full hover:shadow-lg hover:shadow-purple-300/40 transition-all"
            >
              <Instagram size={15} />Follow on Instagram
              <ExternalLink size={12} />
            </a>
          </motion.div>
        )}

        {loading ? (
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            {Array(9).fill(null).map((_, i) => (
              <div key={i} className="aspect-square rounded-2xl bg-ivory-200 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            {posts.map((post, i) => (
              <PostCard key={post.id} post={post} index={i} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
