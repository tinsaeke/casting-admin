import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { API } from '@/config/api'

export interface AdminUser {
  party_id: string
  name: string
  email?: string
  phonenumber?: string
  role?: string       // JWT role — 'admin' = besewpublic super admin
  casting_role?: string  // 'casting_admin' = casting-specific admin
}

interface AuthCtx {
  user: AdminUser | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (phone: string, password: string) => Promise<void>
  logout: () => void
}

const Ctx = createContext<AuthCtx>({
  user: null, token: null, isLoading: true, isAuthenticated: false,
  login: async () => {}, logout: () => {},
})

export const useAdminAuth = () => useContext(Ctx)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]           = useState<AdminUser | null>(null)
  const [token, setToken]         = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const t = localStorage.getItem('admin_token')
    const u = localStorage.getItem('admin_user')
    if (t && u) { setToken(t); setUser(JSON.parse(u)) }
    setIsLoading(false)
  }, [])

  const login = async (phonenumber: string, password: string) => {
    // Step 1 — authenticate
    const loginRes = await fetch(`${API.ACCOUNT}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phonenumber, password }),
    })
    const loginData = await loginRes.json()
    if (!loginRes.ok) throw new Error(loginData.message || 'Login failed')

    const tok      = loginData.access_token || loginData.token
    const partyId  = loginData.party_id || loginData.user?.party_id || ''
    const jwtRole  = loginData.role || loginData.user?.role || ''

    // Step 2 — fetch casting_role from party service
    let castingRole = ''
    if (partyId) {
      try {
        const cr = await fetch(`${API.PARTY}/party-profiles/${partyId}/casting-role`, {
          headers: { Authorization: `Bearer ${tok}` },
        })
        if (cr.ok) {
          const crData = await cr.json()
          castingRole = crData.casting_role || ''
        }
      } catch {}
    }

    // Step 3 — gate: only role=admin OR casting_role=casting_admin
    if (jwtRole !== 'admin' && castingRole !== 'casting_admin') {
      throw new Error('Access denied — admin or casting_admin role required')
    }

    const usr: AdminUser = {
      party_id:     partyId,
      name:         loginData.name || loginData.user?.name || loginData.profile_name || 'Admin',
      email:        loginData.email || loginData.user?.email,
      phonenumber:  loginData.phonenumber,
      role:         jwtRole,
      casting_role: castingRole,
    }

    localStorage.setItem('admin_token', tok)
    localStorage.setItem('admin_user', JSON.stringify(usr))
    setToken(tok); setUser(usr)
  }

  const logout = () => {
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_user')
    setToken(null); setUser(null)
  }

  return (
    <Ctx.Provider value={{ user, token, isLoading, isAuthenticated: !!token && !!user, login, logout }}>
      {children}
    </Ctx.Provider>
  )
}
