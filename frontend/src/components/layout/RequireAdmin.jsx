import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Loader2 } from 'lucide-react'

/**
 * RequireAdmin — wraps admin routes.
 * - If still checking token: show spinner
 * - If not logged in: redirect to /admin/login
 * - If logged in: render children
 */
export default function RequireAdmin({ children }) {
  const { isAdmin, checking } = useAuth()
  const location = useLocation()

  if (checking) {
    return (
      <div className="min-h-screen bg-charcoal-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={32} className="animate-spin text-gold-500 mx-auto mb-3" />
          <p className="font-body text-ivory-300/40 text-sm">Checking authentication…</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />
  }

  return children
}
