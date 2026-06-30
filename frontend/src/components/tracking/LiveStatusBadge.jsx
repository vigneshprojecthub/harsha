// LiveStatusBadge — shows polling status (always connected)
export default function LiveStatusBadge({ connected = true }) {
  return (
    <div className="flex items-center gap-1.5 text-xs font-body">
      <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
      <span className="text-green-600 font-semibold">Live</span>
      <span className="text-charcoal-800/30">· refreshes every 15s</span>
    </div>
  )
}
