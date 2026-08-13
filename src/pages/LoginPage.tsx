import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdminAuth } from '@/contexts/AuthContext'
import { FiLoader, FiShield } from 'react-icons/fi'

export default function LoginPage() {
  const { login, isAuthenticated } = useAdminAuth()
  const navigate = useNavigate()
  const [phone, setPhone]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  if (isAuthenticated) { navigate('/'); return null }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      await login(phone, password)
      navigate('/')
    } catch (err: any) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <FiShield className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl font-black text-gray-900">Admin Panel</h1>
          <p className="text-xs text-gray-400 mt-1">Besew Casting — Restricted Access</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+251900000000"
              required
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20"
            />
          </div>

          {error && (
            <div className="px-3 py-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-medium">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-black rounded-xl transition flex items-center justify-center gap-2"
          >
            {loading ? <FiLoader className="w-4 h-4 animate-spin" /> : <FiShield className="w-4 h-4" />}
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}
