// WebSocket base: use current host in production, fallback to localhost in dev
const WS_BASE = import.meta.env.VITE_WS_URL ||
  (window.location.protocol === 'https:' ? 'wss://' : 'ws://') + window.location.host

// Fix previewApi.js too
