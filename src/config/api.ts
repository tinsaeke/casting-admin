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

// ── Account-service URL builder ───────────────────────────────────────────────
const A = (path: string) => `${API.ACCOUNT}${path}`

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

  // ── Casting Subscription Plans — NOW on account-service ──────────────────────
  // All /admin/casting/subscription-options/* endpoints removed from casting-service.
  // Replaced by /platform-subscriptions/admin/casting/options/* on account-service.
  // These methods now route to account-service via A() helper.
  subPlans: (qs?: { isActive?: boolean; audience?: string }) => {
    const params = new URLSearchParams()
    if (qs?.isActive !== undefined) params.set('active', String(qs.isActive))
    if (qs?.audience) params.set('audience', qs.audience)
    const qStr = params.toString() ? `?${params}` : ''
    return request<any>('GET', A(`/platform-subscriptions/admin/casting/options/list${qStr}`))
  },
  subPlanStats: () =>
    request<any>('GET', A('/platform-subscriptions/admin/casting/options/stats')),
  getSubPlan: (id: string) =>
    request<any>('GET', A(`/platform-subscriptions/admin/casting/options/${encodeURIComponent(id)}`)),
  createSubPlan: (body: any) =>
    request<any>('POST', A('/platform-subscriptions/admin/casting/options'), body),
  updateSubPlan: (id: string, body: any) =>
    request<any>('PUT', A(`/platform-subscriptions/admin/casting/options/${encodeURIComponent(id)}`), body),
  toggleSubPlan: (id: string) =>
    request<any>('PUT', A(`/platform-subscriptions/admin/casting/options/${encodeURIComponent(id)}/toggle-active`)),
  deleteSubPlan: (id: string) =>
    request<any>('DELETE', A(`/platform-subscriptions/admin/casting/options/${encodeURIComponent(id)}`)),

  // ── Casting User Subscriptions — NOW on account-service ───────────────────────
  // All /admin/casting/subscriptions/* endpoints removed from casting-service.
  // Replaced by /platform-subscriptions/admin/casting/* on account-service.
  castingSubscriptions: (qs?: { type?: string; status?: string; plan?: string; page?: number; limit?: number }) => {
    const params = new URLSearchParams()
    if (qs?.status && qs.status !== 'all') params.set('status', qs.status)
    if (qs?.plan) params.set('plan', qs.plan)
    if (qs?.type) params.set('plan', qs.type)  // 'type' was the old field name, maps to 'plan'
    if (qs?.page) params.set('page', String(qs.page))
    params.set('limit', String(qs?.limit ?? 20))
    return request<any>('GET', A(`/platform-subscriptions/admin/casting/list?${params}`))
  },
  getUserSubscription: (partyId: string) =>
    request<any>('GET', A(`/platform-subscriptions/admin/casting/${encodeURIComponent(partyId)}`)),
  assignSubscription: (partyId: string, body: { type?: string; plan?: string; period: string; status: string; [k: string]: any }) =>
    // body.type → body.plan normalisation
    request<any>('POST', A(`/platform-subscriptions/admin/casting/${encodeURIComponent(partyId)}`),
      { ...body, plan: body.plan || body.type }),
  updateSubscription: (partyId: string, body: { status?: string; type?: string; plan?: string; [k: string]: any }) =>
    request<any>('PUT', A(`/platform-subscriptions/admin/casting/${encodeURIComponent(partyId)}`),
      { ...body, ...(body.type && !body.plan ? { plan: body.type } : {}) }),
  cancelSubscription: (partyId: string, reason?: string) =>
    request<any>('DELETE', A(`/platform-subscriptions/admin/casting/${encodeURIComponent(partyId)}`),
      reason ? { reason } : undefined),
  upgradeSubscription: (partyId: string, body: { newType: string; newPeriod?: string }) =>
    request<any>('POST', A(`/platform-subscriptions/admin/casting/${encodeURIComponent(partyId)}/upgrade`), body),
  renewSubscription: (partyId: string, body?: { period?: string }) =>
    request<any>('POST', A(`/platform-subscriptions/admin/casting/${encodeURIComponent(partyId)}/renew`), body || {}),

  // ── Casting Subscription Usage — UNCHANGED in casting-service ─────────────────
  getUsage: (partyId: string) =>
    request<any>('GET', C(`/admin/casting/subscription-usage/${partyId}`)),
  resetUsage: (partyId: string) =>
    request<any>('POST', C(`/admin/casting/subscription-usage/${partyId}/reset`)),
  syncLimits: (partyId: string) =>
    request<any>('POST', C(`/admin/casting/subscription-usage/${partyId}/sync-limits`)),
  syncAllLimits: (planId: string) =>
    request<any>('POST', C(`/admin/casting/subscription-usage/${planId}/sync-limits`)),

  // ── Role Change Requests ───────────────────────────────────────────────────
  roleChangeRequests: (status?: string, page = 1, limit = 20) =>
    request<any>('GET', C('/admin/casting/role-change-requests', {
      status: status && status !== 'all' ? status : undefined,
      page,
      limit,
    })),
  approveRoleChangeRequest: (requestId: string, admin_note?: string) =>
    request<any>('PATCH', C(`/admin/casting/role-change-requests/${requestId}/approve`), { admin_note }),
  rejectRoleChangeRequest: (requestId: string, admin_note: string) =>
    request<any>('PATCH', C(`/admin/casting/role-change-requests/${requestId}/reject`), { admin_note }),

  // ── AI Digital Replica Likeness Licenses ─────────────────────────────────────
  avatarLicenses: (params?: { status?: string; page?: number; limit?: number }) =>
    request<any>('GET', C('/admin/avatar/licenses', {
      status: params?.status && params.status !== 'all' ? params.status : undefined,
      page:   params?.page || 1,
      limit:  params?.limit || 20,
    })),
  replicaLicenses: async (params?: { status?: string; page?: number; limit?: number }) => {
    try {
      return await request<any>('GET', C('/replica-licenses/admin/licenses', {
        status: params?.status && params.status !== 'all' ? params.status : undefined,
        page:   params?.page || 1,
        limit:  params?.limit || 20,
      }))
    } catch (e: any) {
      // Fallback to avatar licenses endpoint if needed
      return await request<any>('GET', C('/admin/avatar/licenses', {
        status: params?.status && params.status !== 'all' ? params.status : undefined,
        page:   params?.page || 1,
        limit:  params?.limit || 20,
      }))
    }
  },
  licenseAuditLog: (licenseId: string) =>
    request<any>('GET', C(`/replica-licenses/admin/licenses/${encodeURIComponent(licenseId)}/audit`)),
  expireOverdueApprovals: () =>
    request<any>('POST', C('/replica-licenses/admin/expire-approvals')),
  expireOverdueLicenses: () =>
    request<any>('POST', C('/replica-licenses/admin/expire-licenses')),

  // ── Digital Replica KYC & Verification ───────────────────────────────────────
  replicas: (params?: { kyc_status?: string; status?: string; page?: number; limit?: number }) =>
    request<any>('GET', C('/replica/admin/replicas', {
      kyc_status: params?.kyc_status && params.kyc_status !== 'all' ? params.kyc_status : undefined,
      status:     params?.status && params.status !== 'all' ? params.status : undefined,
      page:       params?.page || 1,
      limit:      params?.limit || 20,
    })),
  approveReplicaKyc: (replicaId: string) =>
    request<any>('POST', C(`/replica/admin/${replicaId}/kyc/approve`)),
  rejectReplicaKyc: (replicaId: string, reason: string) =>
    request<any>('POST', C(`/replica/admin/${replicaId}/kyc/reject`), { reason }),
  revokeReplica: (replicaId: string, reason: string) =>
    request<any>('POST', C(`/replica/admin/${replicaId}/revoke`), { reason }),

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
  // Platform booking fee config
  getFees: () =>
    request<any>('GET', CC('/commission/admin/platform-config/booking-fees')),
  updateFees: (body: { direct_rate: number; agency_self_rate: number; agency_mediated_rate: number; agency_commission_rate: number }) =>
    request<any>('PUT', CC('/commission/admin/platform-config/booking-fees'), body),

  // Platform avatar fee config
  getAvatarFees: () =>
    request<any>('GET', CC('/commission/admin/platform-config/avatar-fees')),
  updateAvatarFees: (body: { avatar_platform_rate?: number; avatar_actor_rate?: number; [k: string]: any }) =>
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

// ── Unified Platform Subscriptions (Account Service) ──────────────────────────
// These endpoints show casting subscriptions from the unified collection.
// Writes (assign, upgrade, cancel) still go through adminAPI on casting-service.
const ACCOUNT_BASE = API.ACCOUNT

export const unifiedSubAPI = {
  // List all casting subscriptions from unified collection
  listCasting: (params?: { page?: number; limit?: number }) =>
    request<any>('GET', `${ACCOUNT_BASE}/platform-subscriptions/admin/casting/list${params?.page ? `?page=${params.page}&limit=${params.limit ?? 20}` : ''}`),

  // Get a single user's unified casting subscription
  getCasting: (partyId: string) =>
    request<any>('GET', `${ACCOUNT_BASE}/platform-subscriptions/admin/casting/${encodeURIComponent(partyId)}`),

  // Summary stats for casting subscriptions
  castingStats: () =>
    request<any>('GET', `${ACCOUNT_BASE}/platform-subscriptions/admin/casting/stats/summary`),

  // Stats across all platforms
  allPlatformStats: () =>
    request<any>('GET', `${ACCOUNT_BASE}/platform-subscriptions/admin/casting/stats/all-platforms`),
}

// ── Casting Menu Configuration (Account Service) ───────────────────────────────
export interface MenuConfigItem {
  _id?: string
  menuId: string
  label: string
  path: string
  icon?: string
  isActive: boolean
  order?: number
  parentMenuId?: string | null
  platform: 'casting' | string
  allowedUserTypes?: string[]
  allowedWorkerTypes?: string[]
  allowedSubscriptionTiers?: string[]
  minTrustScore?: number
  badge?: string | null
  translations?: {
    am?: string
    en?: string
    [k: string]: string | undefined
  }
  createdAt?: string
  updatedAt?: string
}


export const menuConfigAPI = {
  // Get all casting menus
  getCastingMenus: (platform = 'casting') =>
    request<any>('GET', `${API.ACCOUNT}/api/v1/menu-config?platform=${encodeURIComponent(platform)}`),

  // Create menu item
  createMenu: (menu: Partial<MenuConfigItem>) =>
    request<any>('POST', `${API.ACCOUNT}/api/v1/menu-config`, {
      platform: 'casting',
      ...menu,
    }),

  // Update single menu item
  updateMenu: (menuId: string, updates: Partial<MenuConfigItem>) =>
    request<any>('PUT', `${API.ACCOUNT}/api/v1/menu-config/${encodeURIComponent(menuId)}`, updates),

  // Toggle active status
  toggleActive: (menuId: string, isActive: boolean) =>
    request<any>('PUT', `${API.ACCOUNT}/api/v1/menu-config/${encodeURIComponent(menuId)}`, { isActive }),

  // Set badge
  setBadge: (menuId: string, badge: string | null) =>
    request<any>('PUT', `${API.ACCOUNT}/api/v1/menu-config/${encodeURIComponent(menuId)}`, { badge }),

  // Set allowed user types
  setUserTypes: (menuId: string, allowedUserTypes: string[]) =>
    request<any>('PUT', `${API.ACCOUNT}/api/v1/menu-config/${encodeURIComponent(menuId)}`, { allowedUserTypes }),

  // Set allowed subscription tiers
  setSubscriptionTiers: (menuId: string, allowedSubscriptionTiers: string[]) =>
    request<any>('PUT', `${API.ACCOUNT}/api/v1/menu-config/${encodeURIComponent(menuId)}`, { allowedSubscriptionTiers }),

  // Delete menu item
  deleteMenu: (menuId: string) =>
    request<any>('DELETE', `${API.ACCOUNT}/api/v1/menu-config/${encodeURIComponent(menuId)}`),

  // Bulk update
  bulkUpdate: (updates: Array<Partial<MenuConfigItem> & { menuId: string }>) =>
    request<any>('POST', `${API.ACCOUNT}/api/v1/menu-config/bulk-update`, updates),
}

