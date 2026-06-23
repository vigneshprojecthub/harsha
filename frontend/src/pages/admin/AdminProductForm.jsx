import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Upload, X, Loader2, ChevronLeft, Plus } from 'lucide-react'
import { productsApi, categoriesApi } from '../../utils/api'

export default function AdminProductForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [form, setForm] = useState({
    name: '',
    description: '',
    category_id: '',
    price: '',
    images: [],
    customizable: false,
    is_featured: false,
    stock: 0,
  })
  const [categories, setCategories] = useState([])
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    categoriesApi.getAll().then(r => setCategories(r.data))
    if (isEdit) {
      productsApi.getOne(id).then(r => {
        const p = r.data
        setForm({
          name: p.name,
          description: p.description || '',
          category_id: p.category_id,
          price: p.price,
          images: p.images || [],
          customizable: p.customizable,
          is_featured: p.is_featured,
          stock: p.stock,
        })
      })
    }
  }, [id, isEdit])

  const handleChange = e => {
    const { name, value, type, checked } = e.target
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files)
    setUploading(true)
    try {
      const uploads = await Promise.all(files.map(f => productsApi.uploadImage(f)))
      const urls = uploads.map(r => r.data.url)
      setForm(prev => ({ ...prev, images: [...prev.images, ...urls] }))
    } catch {
      setError('Image upload failed.')
    } finally {
      setUploading(false)
    }
  }

  const removeImage = (index) => {
    setForm(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.category_id || !form.price) {
      setError('Please fill in all required fields.')
      return
    }
    setError('')
    setSaving(true)
    try {
      const data = { ...form, price: parseFloat(form.price), stock: parseInt(form.stock), category_id: parseInt(form.category_id) }
      if (isEdit) {
        await productsApi.update(id, data)
      } else {
        await productsApi.create(data)
      }
      navigate('/admin/products')
    } catch (err) {
      setError('Failed to save product. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-8 max-w-3xl">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm font-body text-charcoal-800/50 hover:text-charcoal-800 mb-6 transition-colors">
        <ChevronLeft size={15} />
        Back to Products
      </button>

      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-charcoal-800">
          {isEdit ? 'Edit Product' : 'Add New Product'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
          <h2 className="font-display font-semibold text-charcoal-800 text-lg border-b border-gray-100 pb-3">Basic Information</h2>

          <div>
            <label className="block font-body text-sm font-semibold text-charcoal-800 mb-2">
              Product Name <span className="text-gold-500">*</span>
            </label>
            <input type="text" name="name" value={form.name} onChange={handleChange} required
              className="w-full px-4 py-3 border border-gray-200 rounded-xl font-body text-sm focus:outline-none focus:border-gold-400 transition-colors"
              placeholder="e.g. Bridal Blouse Aari Work" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-body text-sm font-semibold text-charcoal-800 mb-2">
                Category <span className="text-gold-500">*</span>
              </label>
              <select name="category_id" value={form.category_id} onChange={handleChange} required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl font-body text-sm focus:outline-none focus:border-gold-400 bg-white transition-colors">
                <option value="">Select category...</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-body text-sm font-semibold text-charcoal-800 mb-2">
                Price (₹) <span className="text-gold-500">*</span>
              </label>
              <input type="number" name="price" value={form.price} onChange={handleChange} required min="0" step="0.01"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl font-body text-sm focus:outline-none focus:border-gold-400 transition-colors"
                placeholder="2500" />
            </div>
          </div>

          <div>
            <label className="block font-body text-sm font-semibold text-charcoal-800 mb-2">Stock Quantity</label>
            <input type="number" name="stock" value={form.stock} onChange={handleChange} min="0"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl font-body text-sm focus:outline-none focus:border-gold-400 transition-colors"
              placeholder="0" />
          </div>

          <div>
            <label className="block font-body text-sm font-semibold text-charcoal-800 mb-2">Description</label>
            <textarea name="description" value={form.description} onChange={handleChange} rows={4}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl font-body text-sm focus:outline-none focus:border-gold-400 transition-colors resize-none"
              placeholder="Describe the product in detail..." />
          </div>
        </div>

        {/* Images */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
          <h2 className="font-display font-semibold text-charcoal-800 text-lg border-b border-gray-100 pb-3">Product Images</h2>

          <div className="grid grid-cols-4 gap-3">
            {form.images.map((img, i) => (
              <div key={i} className="relative group aspect-square rounded-xl overflow-hidden border border-gray-200">
                <img src={img} alt="" className="w-full h-full object-cover" />
                <button type="button" onClick={() => removeImage(i)}
                  className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <X size={10} className="text-white" />
                </button>
                {i === 0 && (
                  <div className="absolute bottom-1 left-1 bg-black/50 text-white text-[9px] font-body px-1.5 py-0.5 rounded">Main</div>
                )}
              </div>
            ))}

            <label className="aspect-square rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-gold-400 transition-colors">
              {uploading ? (
                <Loader2 size={20} className="text-gold-400 animate-spin" />
              ) : (
                <>
                  <Plus size={20} className="text-gray-400 mb-1" />
                  <span className="text-[10px] font-body text-gray-400">Add Image</span>
                </>
              )}
              <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" disabled={uploading} />
            </label>
          </div>
          <p className="text-xs font-body text-gray-400">First image will be used as the main product image. Max 5MB each.</p>
        </div>

        {/* Options */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-display font-semibold text-charcoal-800 text-lg border-b border-gray-100 pb-3 mb-4">Options</h2>
          <div className="flex flex-col gap-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" name="customizable" checked={form.customizable} onChange={handleChange}
                className="w-4 h-4 accent-gold-600" />
              <div>
                <div className="font-body text-sm font-semibold text-charcoal-800">Customizable</div>
                <div className="font-body text-xs text-charcoal-800/50">Allow customers to request custom variations</div>
              </div>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" name="is_featured" checked={form.is_featured} onChange={handleChange}
                className="w-4 h-4 accent-gold-600" />
              <div>
                <div className="font-body text-sm font-semibold text-charcoal-800">Featured</div>
                <div className="font-body text-xs text-charcoal-800/50">Show on homepage featured section</div>
              </div>
            </label>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm font-body px-4 py-3 rounded-xl">{error}</div>
        )}

        <div className="flex gap-3">
          <button type="button" onClick={() => navigate(-1)}
            className="flex-1 px-6 py-3 border border-gray-200 text-charcoal-800/60 font-body text-sm rounded-xl hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={saving}
            className="flex-1 btn-gold justify-center rounded-xl disabled:opacity-60">
            {saving ? <><Loader2 size={16} className="animate-spin" />Saving...</> : (isEdit ? 'Update Product' : 'Add Product')}
          </button>
        </div>
      </form>
    </div>
  )
}
