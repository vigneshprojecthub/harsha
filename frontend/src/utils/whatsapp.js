const WHATSAPP_NUMBER = '919876543210' // Replace with actual number

export function buildWhatsAppUrl(order) {
  const message = `
🎨 *New Custom Order - Harsha Art Gallery*

👤 *Customer:* ${order.customer_name}
📱 *Phone:* ${order.phone}
🧵 *Product Type:* ${order.product_type}
📅 *Delivery Date:* ${order.delivery_date || 'Flexible'}
📝 *Notes:* ${order.notes || 'None'}
${order.reference_image_url ? `🖼️ *Reference Image:* ${window.location.origin}${order.reference_image_url}` : ''}

Please confirm the order at your earliest convenience. Thank you!
  `.trim()

  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`
}

export function openWhatsApp(order) {
  const url = buildWhatsAppUrl(order)
  window.open(url, '_blank')
}
