import axios from 'axios'
const API_URL = "";  // use relative /api path — proxied by Vercel to Render
const api = axios.create({ baseURL: `${API_URL}/api`, timeout: 15000 })

export const previewApi = {
  /** Upload garment + optional reference → kicks off generation */
  upload: (originalFile, referenceFile, instructions, autoGenerate = true) => {
    const fd = new FormData()
    fd.append('original_image', originalFile)
    if (referenceFile) fd.append('reference_image', referenceFile)
    if (instructions) fd.append('custom_instructions', instructions)
    fd.append('auto_generate', autoGenerate)
    return api.post('/preview/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
  },

  /** Poll a preview's status */
  get: (id) => api.get(`/preview/${id}`),

  /** Re-run generation with (optionally) new instructions */
  regenerate: (id, instructions) => {
    const fd = new FormData()
    if (instructions !== undefined) fd.append('custom_instructions', instructions)
    return api.post(`/preview/${id}/regenerate`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
  },

  /** Link a completed preview to a custom order */
  confirm: (previewId, orderId) =>
    api.post(`/preview/${previewId}/confirm`, { order_id: orderId }),

  /** Get all previews for an order */
  byOrder: (orderId) => api.get(`/preview/order/${orderId}`),

  /** Delete a preview */
  delete: (id) => api.delete(`/preview/${id}`),
}

/**
 * Long-poll until status is 'completed' or 'failed'.
 * Calls onProgress(status, preview) on each tick.
 */
export async function pollUntilDone(previewId, onProgress, intervalMs = 2500, maxMs = 180_000) {
  const start = Date.now()
  while (Date.now() - start < maxMs) {
    const { data } = await previewApi.get(previewId)
    onProgress(data.status, data)
    if (data.status === 'completed' || data.status === 'failed') return data
    await new Promise(r => setTimeout(r, intervalMs))
  }
  throw new Error('Preview generation timed out after 3 minutes')
}
