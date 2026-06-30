import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import axios from 'axios'

const AuthContext = createContext(null)
const TOKEN_KEY = 'harsha_admin_token'

export function AuthProvider({ children }) {
  const [admin,    setAdmin]    = useState(null)   // { username } or null
  const [checking, setChecking] = useState(true)   // verifying token on load

  // Set auth header globally when token changes
  const setToken = useCallback((token) => {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token)
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    } else {
      localStorage.removeItem(TOKEN_KEY)
      delete axios.defaults.headers.common['Authorization']
    }
  }, [])

  // Verify token on app load
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) { setChecking(false); return }

    setToken(token)
    axios.get('/api/auth/verify')
      .then(r => setAdmin({ username: r.data.username }))
      .catch(() => { setToken(null); setAdmin(null) })
      .finally(() => setChecking(false))
  }, [])

  const login = async (username, password) => {
    const { data } = await axios.post('/api/auth/login', { username, password })
    setToken(data.access_token)
    setAdmin({ username: data.username })
    return data
  }

  const logout = () => {
    setToken(null)
    setAdmin(null)
  }

  return (
    <AuthContext.Provider value={{ admin, checking, login, logout, isAdmin: !!admin }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
