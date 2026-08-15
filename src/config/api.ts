export const API = {
  CASTING:  'https://casting.besewonline.com/api',
  PARTY:    'https://party.besewonline.com',
  ACCOUNT:  'https://account.besewonline.com',
}

export function getToken(): string {
  return localStorage.getItem('admin_token') || ''
}

export function authHeaders(): Record<string, string> {
  const t = getToken()
  return {
    'Content-Type': 'application/json',
    ...(t ? { Authorization: `Bearer ${t}` } : {}),
  }
}

export async function request<T>(method: string, url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: authHeaders(),
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  const data = text ? JSON.parse(text) : {}
  if (!res.ok) {
    throw Object.assign(
      new Error(Array.isArray(data?.message) ? data.message.join(', ') : data?.message || `HTTP ${res.status}`),
      { status: res.status },
    )
  }
  return data as T
}

const C = (path: string, qs?: Record<string, string | number | undefined>) => {
  const url = `${API.CASTING}${path}`
  if (!qs) return url
  const params = new URLSearchParams()
  Object.entries(qs).forEach(([k, v]) => { if (v !== undefined && v !== '') params.set(k, String(v)) })
  const s = params.toString()
  return s ? `${url}?${s}` : url
}

export const adminAPI = {
  // ── Dashboard ────────────────────────────────────────────────────────────────
  stats: () =>
    request<any>('GET', C('/admin/stats')),
  castingRoles: () =>
    request<any>('GET', C('/admin/casting-roles')),
  usersByRole: (role: string, page = 1) =>
    request<any>('GET', C(`/admin/users/by-role/${role}`, { page, limit: 20 })),

  // ── Talent Profiles ───────────────────────────────────────────────────────────
  talents: (page = 1, search?: string, visibility?: string) =>
    request<any>('GET', C('/admin/talent-profiles', { page, limit: 20, search, visibility })),
  setTalentVisibility: (profileId: string, visibility: string) =>
    request<any>('PATCH', C(`/admin/talent-profiles/${profileId}/visibility`), { visibility }),
  deleteTalent: (profileId: string) =>
    request<any>('DELETE', C(`/admin/talent-profiles/${profileId}`)),

  // ── Casting Calls ─────────────────────────────────────────────────────────────
  castCalls: (page = 1, status?: string, search?: string) =>
    request<any>('GET', C('/admin/casting-calls', { page, limit: 20, status, search })),
  setCastCallStatus: (id: string, status: string) =>
    request<any>('PATCH', C(`/admin/casting-calls/${id}/status`), { status }),
  deleteCastCall: (id: string) =>
    request<any>('DELETE', C(`/admin/casting-calls/${id}`)),

  // ── Productions ───────────────────────────────────────────────────────────────
  productions: (page = 1, search?: string) =>
    request<any>('GET', C('/admin/productions', { page, limit: 20, search })),
  deleteProduction: (projectId: string) =>
    request<any>('DELETE', C(`/admin/productions/${projectId}`)),

  // ── Agencies ──────────────────────────────────────────────────────────────────
  agencies: (page = 1) =>
    request<any>('GET', C('/admin/agencies', { page, limit: 20 })),

  // ── Join Requests ─────────────────────────────────────────────────────────────
  joinRequests: (page = 1, status?: string) =>
    request<any>('GET', C('/admin/join-requests', { page, limit: 20, status })),
  deleteJoinRequest: (requestId: string) =>
    request<any>('DELETE', C(`/admin/join-requests/${requestId}`)),

  // ── Auditions ─────────────────────────────────────────────────────────────────
  auditions: (page = 1, status?: string, casting_call_id?: string) =>
    request<any>('GET', C('/admin/auditions', { page, limit: 20, status, casting_call_id })),
  deleteAudition: (auditionId: string) =>
    request<any>('DELETE', C(`/admin/auditions/${auditionId}`)),

  // ── Locations ─────────────────────────────────────────────────────────────────
  locations: (page = 1, search?: string) =>
    request<any>('GET', C('/admin/locations', { page, limit: 20, search })),
  pendingVerification: (page = 1) =>
    request<any>('GET', C('/admin/locations/pending-verification', { page, limit: 20 })),
  setLocationVerification: (locationId: string, status: 'verified' | 'rejected', notes?: string) =>
    request<any>('PATCH', C(`/admin/locations/${locationId}/verification`), { status, notes }),
  deleteLocation: (locationId: string) =>
    request<any>('DELETE', C(`/admin/locations/${locationId}`)),

  // ── Bookings ──────────────────────────────────────────────────────────────────
  bookings: (page = 1, status?: string) =>
    request<any>('GET', C('/admin/bookings', { page, limit: 20, status })),
  deleteBooking: (bookingId: string) =>
    request<any>('DELETE', C(`/admin/bookings/${bookingId}`)),

  // ── Users (party service) ─────────────────────────────────────────────────────
  users: (page = 1, q?: string) =>
    request<any>('GET', `${API.PARTY}/party-profiles?page=${page}&limit=20${q ? `&q=${encodeURIComponent(q)}` : ''}`),
  assignCastingRole: (partyId: string, casting_role: string) =>
    request<any>('PATCH', `${API.PARTY}/party-profiles/${partyId}/casting-role`, { casting_role }),
  deleteUser: (partyId: string) =>
    request<any>('DELETE', C(`/admin/users/${partyId}`)),

  // ── Companies Verification ────────────────────────────────────────────────────
  companies: (page = 1, verification_status?: string) =>
    request<any>('GET', C('/admin/companies', { page, limit: 20, verification_status })),
  verifyCompany: (companyId: string, status: 'verified' | 'rejected', reason?: string) =>
    request<any>('PATCH', C(`/admin/companies/${companyId}/verify`), { status, reason }),
  deleteCompany: (companyId: string) =>
    request<any>('DELETE', C(`/admin/companies/${companyId}`)),

  // ── Casting Subscription Plans (catalog) ─────────────────────────────────────
  subPlans: (qs?: { isActive?: boolean; audience?: string }) =>
    request<any>('GET', C('/admin/casting/subscription-options', {
      isActive: qs?.isActive !== undefined ? String(qs.isActive) as any : undefined,
      audience: qs?.audience,
    })),
  subPlanStats: () =>
    request<any>('GET', C('/admin/casting/subscription-options/stats')),
  createSubPlan: (body: any) =>
    request<any>('POST', C('/admin/casting/subscription-options'), body),
  updateSubPlan: (id: string, body: any) =>
    request<any>('PUT', C(`/admin/casting/subscription-options/${id}`), body),
  toggleSubPlan: (id: string) =>
    request<any>('PUT', C(`/admin/casting/subscription-options/${id}/toggle-active`)),
  deleteSubPlan: (id: string) =>
    request<any>('DELETE', C(`/admin/casting/subscription-options/${id}`)),

  // ── Casting User Subscriptions ────────────────────────────────────────────────
  castingSubscriptions: (qs?: { type?: string; status?: string; page?: number; limit?: number }) =>
    request<any>('GET', C('/admin/casting/subscriptions', {
      type:   qs?.type,
      status: qs?.status,
      page:   qs?.page,
      limit:  qs?.limit ?? 20,
    })),
  getUserSubscription: (partyId: string) =>
    request<any>('GET', C(`/admin/casting/subscriptions/${partyId}`)),
  assignSubscription: (partyId: string, body: { type: string; period: string; status: string }) =>
    request<any>('POST', C(`/admin/casting/subscriptions/${partyId}`), body),
  cancelSubscription: (partyId: string, reason: string) =>
    request<any>('DELETE', C(`/admin/casting/subscriptions/${partyId}`), { reason }),
  upgradeSubscription: (partyId: string, body: { newType: string; newPeriod: string }) =>
    request<any>('POST', C(`/admin/casting/subscriptions/${partyId}/upgrade`), body),

  // ── Casting Subscription Usage ────────────────────────────────────────────────
  getUsage: (partyId: string) =>
    request<any>('GET', C(`/admin/casting/subscription-usage/${partyId}`)),
  resetUsage: (partyId: string, subscriptionType: string) =>
    request<any>('POST', C(`/admin/casting/subscription-usage/${partyId}/reset`), { subscriptionType }),
  syncLimits: (partyId: string) =>
    request<any>('POST', C(`/admin/casting/subscription-usage/${partyId}/sync-limits`)),
  syncAllLimits: (planId: string) =>
    request<any>('POST', C(`/admin/casting/subscription-usage/${planId}/sync-limits`)),

  // ── Account service ───────────────────────────────────────────────────────────
  reports: () =>
    request<any>('GET', `${API.ACCOUNT}/account-report/admin`),
  subscriptions: () =>
    request<any>('GET', `${API.ACCOUNT}/admin/subscriptions`),
}

// ── Commission service helpers ─────────────────────────────────────────────────
const COMMISSION_BASE = 'https://commission.besewonline.com/api'
const CC = (path: string) => `${COMMISSION_BASE}${path}`

export const commissionAPI = {
  // Platform fee config
  getFees: () =>
    request<any>('GET', CC('/commission/admin/platform-config/booking-fees')),
  updateFees: (body: { direct_rate: number; agency_self_rate: number; agency_mediated_rate: number; agency_commission_rate: number }) =>
    request<any>('PUT', CC('/commission/admin/platform-config/booking-fees'), body),

  // Withdrawals
  pendingWithdrawals: () =>
    request<any>('GET', CC('/commission/admin/wallet/withdrawals/pending')),
  withdrawals: (status?: string, page = 1, limit = 20) =>
    request<any>('GET', `${CC('/commission/admin/wallet/withdrawals')}?${new URLSearchParams({ ...(status ? { status } : {}), page: String(page), limit: String(limit) })}`),
  approveWithdrawal: (id: string, transaction_reference?: string) =>
    request<any>('PUT', CC(`/commission/admin/wallet/withdrawals/${id}/approve`), { transaction_reference }),
  completeWithdrawal: (id: string, transaction_reference: string) =>
    request<any>('PUT', CC(`/commission/admin/wallet/withdrawals/${id}/complete`), { transaction_reference }),
  rejectWithdrawal: (id: string, reason: string) =>
    request<any>('PUT', CC(`/commission/admin/wallet/withdrawals/${id}/reject`), { reason }),

  // Party wallet
  getWallet: (partyId: string) =>
    request<any>('GET', CC(`/commission/admin/wallet/party/${partyId}`)),
  getTransactions: (partyId: string, page = 1, limit = 20) =>
    request<any>('GET', `${CC(`/commission/admin/wallet/party/${partyId}/transactions`)}?page=${page}&limit=${limit}`),
}
