import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { IndianRupee, Sparkles, MessageCircle, ShoppingBag, Cpu, Check } from 'lucide-react'
import { productsApi } from '../utils/api'
import AddToCartButton from '../components/cart/AddToCartButton'
import CartDrawer from '../components/cart/CartDrawer'

export default function ProductDetailPage() {
  const { id } = useParams()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeImage, setActiveImage] = useState(0)
  const [qty, setQty] = useState(1)
  const [cartOpen, setCartOpen] = useState(false)

  useEffect(() => {
    productsApi.getOne(id).then(r => setProduct(r.data)).finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen pt-24 bg-ivory-50">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="grid md:grid-cols-2 gap-12 animate-pulse">
            <div className="bg-ivory-200 rounded-2xl h-96" />
            <div className="space-y-4 pt-8">
              <div className="h-8 bg-ivory-200 rounded w-3/4" />
              <div className="h-4 bg-ivory-200 rounded w-1/2" />
              <div className="h-20 bg-ivory-200 rounded" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">😕</div>
          <h2 className="font-display text-2xl text-charcoal-800 mb-3">Product not found</h2>
          <Link to="/products" className="btn-gold">Back to Gallery</Link>
        </div>
      </div>
    )
  }

  const whatsappMessage = `Hi! I'm interested in "${product.name}" (₹${product.price.toLocaleString('en-IN')}). Can you provide more details?`
  const whatsappUrl = `https://wa.me/919876543210?text=${encodeURIComponent(whatsappMessage)}`

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-ivory-50 pt-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-8 text-sm font-body text-charcoal-800/50">
          <Link to="/" className="hover:text-gold-600 transition-colors">Home</Link>
          <span>/</span>
          <Link to="/products" className="hover:text-gold-600 transition-colors">Gallery</Link>
          <span>/</span>
          <span className="text-charcoal-800">{product.name}</span>
        </div>

        <div className="grid md:grid-cols-2 gap-12">
          {/* Images */}
          <div>
            <div className="bg-white rounded-2xl overflow-hidden border border-ivory-200 mb-3 h-96">
              {product.images?.[activeImage] ? (
                <img src={product.images[activeImage]} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-ivory-100">
                  <div className="text-6xl mb-3 opacity-40">🪡</div>
                  <span className="font-body text-charcoal-800/30 text-sm">No image</span>
                </div>
              )}
            </div>
            {product.images?.length > 1 && (
              <div className="flex gap-2">
                {product.images.map((img, i) => (
                  <button key={i} onClick={() => setActiveImage(i)}
                    className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${activeImage === i ? 'border-gold-500' : 'border-ivory-200'}`}>
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="py-4">
            {product.category && (
              <div className="inline-block bg-gold-50 border border-gold-200 text-gold-700 text-xs font-body tracking-wide uppercase px-3 py-1 rounded-full mb-4">
                {product.category.name}
              </div>
            )}

            <h1 className="font-display text-3xl md:text-4xl font-bold text-charcoal-800 mb-3 leading-tight">
              {product.name}
            </h1>

            <div className="flex items-center gap-2 mb-5">
              <IndianRupee size={22} className="text-gold-600" />
              <span className="font-display text-3xl font-bold text-gold-600">
                {product.price.toLocaleString('en-IN')}
              </span>
              <span className="font-body text-xs text-charcoal-800/40 ml-1">incl. GST</span>
            </div>

            {product.description && (
              <p className="font-body text-charcoal-800/70 leading-relaxed mb-5 text-base">
                {product.description}
              </p>
            )}

            {/* Badges */}
            <div className="flex flex-wrap gap-2 mb-6">
              {product.is_featured && (
                <span className="inline-flex items-center gap-1 bg-gold-100 text-gold-700 text-xs font-body px-3 py-1.5 rounded-full border border-gold-200">
                  <Sparkles size={11} />Featured Piece
                </span>
              )}
              {product.customizable && (
                <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 text-xs font-body px-3 py-1.5 rounded-full border border-green-200">
                  <Check size={11} />Customizable
                </span>
              )}
              {product.stock > 0 && (
                <span className="bg-blue-50 text-blue-700 text-xs font-body px-3 py-1.5 rounded-full border border-blue-200">
                  {product.stock} in stock
                </span>
              )}
            </div>

            {/* Quantity selector */}
            <div className="flex items-center gap-3 mb-5">
              <span className="font-body text-sm font-semibold text-charcoal-800/60">Qty:</span>
              <div className="flex items-center border border-ivory-300 rounded-xl overflow-hidden">
                <button onClick={() => setQty(q => Math.max(1, q - 1))}
                  className="w-10 h-10 flex items-center justify-center hover:bg-ivory-100 transition-colors font-bold text-charcoal-800/60">−</button>
                <span className="w-10 text-center font-body font-semibold text-charcoal-800">{qty}</span>
                <button onClick={() => setQty(q => q + 1)}
                  className="w-10 h-10 flex items-center justify-center hover:bg-ivory-100 transition-colors font-bold text-charcoal-800/60">+</button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 mb-4">
              <div className="flex gap-3">
                <AddToCartButton
                  product={{ ...product, quantity: qty }}
                  className="flex-1 py-4 rounded-xl"
                  onAdded={() => setCartOpen(true)}
                />
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-4 py-4 bg-green-600 text-white font-body font-semibold rounded-xl hover:bg-green-700 transition-colors">
                  <MessageCircle size={18} />
                </a>
              </div>

              {product.customizable && (
                <Link to={`/custom-order?product=${encodeURIComponent(product.name)}`}
                  className="w-full flex items-center justify-center gap-2 py-3.5 border-2 border-charcoal-800/20 text-charcoal-800/70 hover:border-gold-400 hover:text-gold-700 font-body text-sm font-semibold rounded-xl transition-all">
                  <ShoppingBag size={16} />
                  Custom Order via WhatsApp
                </Link>
              )}

              <Link to={`/ai-preview?instructions=${encodeURIComponent('embroidery style similar to ' + product.name)}`}
                className="w-full flex items-center justify-center gap-2 py-3.5 border-2 border-gold-300 text-gold-700 font-body text-sm font-semibold rounded-xl hover:bg-gold-50 transition-colors">
                <Cpu size={16} />
                Preview This Style on Your Garment (AI)
              </Link>
            </div>

            <p className="font-body text-xs text-charcoal-800/40 leading-relaxed">
              Free shipping on orders above ₹2,000 · GST included · 15–21 day delivery
            </p>
          </div>
        </div>
      </div>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </motion.div>
  )
}
