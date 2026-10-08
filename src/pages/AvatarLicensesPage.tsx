import { useEffect, useState } from 'react'
import { adminAPI } from '@/config/api'
import PageHeader from '@/components/common/PageHeader'
import DataTable from '@/components/common/DataTable'
import Pagination from '@/components/common/Pagination'
import {
  FiRefreshCw, FiCpu, FiUser, FiCheckCircle, FiClock,
  FiAlertCircle, FiEye, FiX, FiDollarSign, FiCalendar, FiTag,
  FiExternalLink, FiList, FiCheck, FiXCircle, FiGlobe, FiLayers
} from 'react-icons/fi'

export interface LicenseAuditEntry {
  event: string
  at: string
  by?: string
  detail?: string | null
}

export interface AvatarLicense {
  _id?: string
  license_id: string
  replica_id?: string
  actor_party_id?: string
  talent_profile_id?: string
  talent_name?: string
  talent_avatar?: string
  buyer_party_id?: string
  production_id?: string
  production_title?: string
  project_name?: string
  customer_name?: string
  customer_email?: string
  customer_phone?: string
  product?: string
  products?: string[]
  tier?: string
  territory?: string
  duration_days?: number
  character_name?: string
  use_description?: string
  negotiation_notes?: string
  approval_deadline?: string
  actor_approved_at?: string
  rejection_reason?: string
  purchased_uses?: string[]
  uses_allowed?: number
  uses_remaining?: number
  total_uses?: number
  amount_etb: number
  actor_payout_etb?: number
  platform_fee_etb?: number
  actor_rate_snapshot?: number
  platform_rate_snapshot?: number
  status: 'active' | 'pending' | 'pending_approval' | 'approved' | 'pending_payment' | 'completed' | 'exhausted' | 'expired' | 'rejected' | string
  checkout_url?: string
  created_at?: string
  createdAt?: string
  updated_at?: string
  updatedAt?: string
  expires_at?: string
  usage_log?: Array<{
    used_at: string
    scene_name?: string
    analysis_id?: string
    visual_type?: string
  }>
}

const STATUS_BADGE: Record<string, string> = {
  active:           'bg-green-100 text-green-700 border-green-200',
  approved:         'bg-emerald-100 text-emerald-700 border-emerald-200',
  pending:          'bg-yellow-100 text-yellow-800 border-yellow-200',
  pending_approval: 'bg-amber-100 text-amber-800 border-amber-200',
  pending_payment:  'bg-yellow-100 text-yellow-800 border-yellow-200',
  completed:        'bg-blue-100 text-blue-700 border-blue-200',
  exhausted:        'bg-purple-100 text-purple-700 border-purple-200',
  expired:          'bg-gray-100 text-gray-600 border-gray-200',
  rejected:         'bg-red-100 text-red-700 border-red-200',
}

const USE_LABELS: Record<string, string> = {
  action_scenes:         'Action Scenes',
  stunt_double:          'Stunt Double',
  background_appearance: 'Background Extra',
  crowd_scenes:          'Crowd Scenes',
  de_aging:              'De-Aging',
  digital_double:        'Digital Double',
  commercial:            'Commercial & Promo',
  dialogue:              'Spoken Dialogue',
  romantic_scenes:       'Romantic Scenes',
  voice_cloning:         'AI Voice Clone',
}

export default function AvatarLicensesPage() {
  const [licenses, setLicenses] = useState<AvatarLicense[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit] = useState(20)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [expiringApprovals, setExpiringApprovals] = useState(false)
  const [selectedLicense, setSelectedLicense] = useState<AvatarLicense | null>(null)
  
  // Audit log state
  const [activeModalTab, setActiveModalTab] = useState<'details' | 'audit'>('details')
  const [auditLog, setAuditLog] = useState<LicenseAuditEntry[]>([])
  const [auditLoading, setAuditLoading] = useState(false)
  const [auditError, setAuditError] = useState('')

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const load = async () => {
    setLoading(true); setError('')
    try {
      const res = await adminAPI.replicaLicenses({
        status: statusFilter === 'all' ? undefined : statusFilter,
        page,
        limit,
      })
      // Backend returns { licenses: [...], total, page, pages } or { data: [...], total }
      const list: AvatarLicense[] = res?.licenses || res?.data || (Array.isArray(res) ? res : [])
      const totalCount = res?.total ?? (Array.isArray(res) ? res.length : list.length)
      setLicenses(list)
      setTotal(totalCount)
    } catch (e: any) {
      setError(e.message || 'Failed to load avatar licenses')
      setLicenses([])
      setTotal(0)
    }
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [page, statusFilter])

  const handleExpireOverdue = async () => {
    if (!window.confirm('Expire all pending license approval requests exceeding the 48-hour deadline?')) {
      return
    }
    setExpiringApprovals(true)
    setError(''); setSuccess('')
    try {
      const res = await adminAPI.expireOverdueApprovals()
      const count = res?.expired ?? res?.count ?? 0
      setSuccess(res?.message || `Successfully expired ${count} overdue license approval request(s).`)
      await load()
    } catch (e: any) {
      setError(e.message || 'Failed to expire overdue approvals')
    }
    setExpiringApprovals(false)
  }

  const loadAuditLog = async (license: AvatarLicense) => {
    setAuditLoading(true)
    setAuditError('')
    setAuditLog([])
    try {
      const targetId = license.license_id || license._id || ''
      const res = await adminAPI.licenseAuditLog(targetId)
      const entries: LicenseAuditEntry[] = Array.isArray(res) ? res : (res?.data || res?.audit || [])
      setAuditLog(entries)
    } catch (e: any) {
      setAuditError(e.message || 'Failed to fetch license audit trail')
    }
    setAuditLoading(false)
  }

  const handleOpenModal = (l: AvatarLicense, tab: 'details' | 'audit' = 'details') => {
    setSelectedLicense(l)
    setActiveModalTab(tab)
    if (tab === 'audit') {
      loadAuditLog(l)
    }
  }

  const filtered = licenses.filter(l => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      l.license_id?.toLowerCase().includes(q) ||
      l.replica_id?.toLowerCase().includes(q) ||
      l.actor_party_id?.toLowerCase().includes(q) ||
      l.buyer_party_id?.toLowerCase().includes(q) ||
      l.talent_name?.toLowerCase().includes(q) ||
      l.customer_name?.toLowerCase().includes(q) ||
      l.production_title?.toLowerCase().includes(q) ||
      l.project_name?.toLowerCase().includes(q) ||
      l.character_name?.toLowerCase().includes(q) ||
      l.customer_email?.toLowerCase().includes(q)
    )
  })

  // Quick stats
  const activeCount = licenses.filter(l => l.status === 'active').length
  const pendingApprovalCount = licenses.filter(l => l.status === 'pending_approval' || l.status === 'pending').length
  const totalVolume = licenses.reduce((sum, l) => sum + (Number(l.amount_etb) || 0), 0)

  const columns = [
    {
      key: 'license_id', label: 'License ID & Date',
      render: (l: AvatarLicense) => {
        const dateStr = l.created_at || l.createdAt
        return (
          <div>
            <span className="font-mono text-xs font-bold text-purple-700 bg-purple-50 border border-purple-200/60 px-2 py-0.5 rounded block max-w-fit">
              {l.license_id || l._id || '—'}
            </span>
            <p className="text-[10px] text-gray-400 mt-1">
              {dateStr ? new Date(dateStr).toLocaleDateString() : '—'}
            </p>
          </div>
        )
      },
    },
    {
      key: 'talent_name', label: 'Actor & Replica',
      render: (l: AvatarLicense) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 font-black text-xs flex items-center justify-center overflow-hidden shrink-0 border border-purple-200">
            {l.talent_avatar ? (
              <img src={l.talent_avatar} alt="" className="w-full h-full object-cover" />
            ) : (
              <FiUser className="w-4 h-4" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-gray-900 truncate">{l.talent_name || l.actor_party_id || 'Talent'}</p>
            <p className="text-[10px] text-gray-400 font-mono truncate">
              {l.replica_id ? `Replica: ${l.replica_id}` : l.actor_party_id || '—'}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'customer_name', label: 'Buyer & Project',
      render: (l: AvatarLicense) => (
        <div>
          <p className="text-xs font-bold text-gray-900">{l.customer_name || l.buyer_party_id || 'Buyer'}</p>
          <p className="text-[10px] text-purple-600 font-medium truncate">
            {l.project_name || l.production_title || l.character_name || 'Direct Licensing'}
          </p>
          {l.customer_email && <p className="text-[10px] text-gray-400 truncate">{l.customer_email}</p>}
        </div>
      ),
    },
    {
      key: 'scope', label: 'Modality & Tier',
      render: (l: AvatarLicense) => {
        const prod = l.product || (l.purchased_uses && l.purchased_uses.length > 0 ? l.purchased_uses[0] : 'likeness')
        return (
          <div className="space-y-0.5">
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-bold bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded capitalize">
                {prod.replace('_', ' ')}
              </span>
              {l.tier && (
                <span className="text-[10px] font-bold bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded capitalize">
                  {l.tier}
                </span>
              )}
            </div>
            {l.territory && (
              <p className="text-[10px] text-gray-400 flex items-center gap-0.5">
                <FiGlobe className="w-2.5 h-2.5" /> {l.territory}
              </p>
            )}
          </div>
        )
      },
    },
    {
      key: 'uses_remaining', label: 'Uses / Duration',
      render: (l: AvatarLicense) => {
        const allowed = l.uses_allowed ?? l.total_uses ?? 1
        const remaining = l.uses_remaining ?? allowed
        return (
          <div>
            <div className="text-center">
              <span className="text-xs font-black text-gray-900">{remaining}</span>
              <span className="text-[10px] text-gray-400"> / {allowed} uses</span>
            </div>
            {l.duration_days && (
              <p className="text-[10px] text-gray-400 text-center">{l.duration_days} days</p>
            )}
          </div>
        )
      },
    },
    {
      key: 'amount_etb', label: 'Amount & Split',
      render: (l: AvatarLicense) => {
        const actorAmount = l.actor_payout_etb ?? Math.round(Number(l.amount_etb || 0) * (l.actor_rate_snapshot || 0.7))
        const platformAmount = l.platform_fee_etb ?? Math.round(Number(l.amount_etb || 0) * (l.platform_rate_snapshot || 0.3))
        return (
          <div className="text-right font-mono">
            <span className="text-xs font-black text-gray-900">{Number(l.amount_etb || 0).toLocaleString()} ETB</span>
            <p className="text-[10px] text-gray-400">Actor: {actorAmount} | Fee: {platformAmount}</p>
          </div>
        )
      },
    },
    {
      key: 'status', label: 'Status',
      render: (l: AvatarLicense) => (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${STATUS_BADGE[l.status] || 'bg-gray-100 text-gray-700'}`}>
          {l.status?.replace('_', ' ')}
        </span>
      ),
    },
    {
      key: 'actions', label: 'Actions',
      render: (l: AvatarLicense) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleOpenModal(l, 'details')}
            className="p-1.5 hover:bg-gray-100 text-gray-600 hover:text-purple-600 rounded-lg transition"
            title="Inspect license details"
          >
            <FiEye className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleOpenModal(l, 'audit')}
            className="p-1.5 hover:bg-purple-50 text-gray-400 hover:text-purple-700 rounded-lg transition"
            title="View audit event trail"
          >
            <FiList className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="AI Avatar Likeness Licenses"
        subtitle="Manage talent AI avatar marketplace licensing, SAG-AFTRA 48h approval workflows, and platform royalties"
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={handleExpireOverdue}
              disabled={expiringApprovals || loading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 rounded-lg text-xs font-bold transition disabled:opacity-40"
              title="Expire license approval requests that passed the 48-hour timeout"
            >
              <FiClock className={`w-3.5 h-3.5 ${expiringApprovals ? 'animate-spin' : ''}`} />
              <span>Expire Overdue (48h)</span>
            </button>
            <button
              onClick={load}
              disabled={loading}
              className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition disabled:opacity-40"
              title="Refresh licenses"
            >
              <FiRefreshCw className={`w-4 h-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        }
      />

      <div className="p-6 space-y-6">
        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-lg">
              <FiCpu className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Total Licenses</p>
              <p className="text-xl font-black text-gray-900">{total}</p>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center font-bold text-lg">
              <FiCheckCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Active in Page</p>
              <p className="text-xl font-black text-gray-900">{activeCount}</p>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-lg">
              <FiClock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Pending Approval</p>
              <p className="text-xl font-black text-gray-900">{pendingApprovalCount}</p>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold text-lg">
              <FiDollarSign className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Volume (Page)</p>
              <p className="text-xl font-black text-gray-900">{totalVolume.toLocaleString()} ETB</p>
            </div>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            {['all', 'pending', 'pending_approval', 'approved', 'active', 'completed', 'exhausted', 'expired', 'rejected'].map(st => (
              <button
                key={st}
                onClick={() => { setStatusFilter(st); setPage(1) }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition capitalize whitespace-nowrap ${
                  statusFilter === st
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                {st.replace('_', ' ')}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="w-full md:w-64">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search talent, buyer, ID..."
              className="w-full px-3.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-purple-500 transition"
            />
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
            <FiAlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl text-xs text-green-700 font-bold">
            <FiCheckCircle className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Data Table */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xs">
          <DataTable
            columns={columns}
            data={filtered}
            loading={loading}
            emptyMsg="No AI avatar licenses found"
          />

          <div className="p-4 border-t border-gray-100">
            <Pagination
              page={page}
              pages={Math.ceil(total / limit) || 1}
              total={total}
              onChange={setPage}
            />
          </div>
        </div>
      </div>

      {/* ── Inspect & Audit Trail Modal ─────────────────────────────────────── */}
      {selectedLicense && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-gray-200 overflow-hidden animate-scale-up max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <FiCpu className="w-5 h-5 text-purple-600" />
                <div>
                  <h3 className="text-sm font-black text-gray-900">License Dossier</h3>
                  <p className="text-[10px] text-gray-500 font-mono">ID: {selectedLicense.license_id || selectedLicense._id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLicense(null)}
                className="p-1 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="flex border-b border-gray-200 px-6 pt-2 bg-gray-50/50 shrink-0">
              <button
                onClick={() => setActiveModalTab('details')}
                className={`pb-2.5 px-3 text-xs font-bold transition border-b-2 flex items-center gap-1.5 ${
                  activeModalTab === 'details'
                    ? 'border-purple-600 text-purple-700'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <FiEye className="w-3.5 h-3.5" />
                <span>License Details</span>
              </button>
              <button
                onClick={() => {
                  setActiveModalTab('audit')
                  loadAuditLog(selectedLicense)
                }}
                className={`pb-2.5 px-3 text-xs font-bold transition border-b-2 flex items-center gap-1.5 ${
                  activeModalTab === 'audit'
                    ? 'border-purple-600 text-purple-700'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <FiList className="w-3.5 h-3.5" />
                <span>Audit Trail</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              {activeModalTab === 'details' ? (
                <>
                  <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-xl border border-purple-100">
                    <div className="w-12 h-12 rounded-xl bg-purple-200 text-purple-800 font-bold flex items-center justify-center overflow-hidden shrink-0">
                      {selectedLicense.talent_avatar ? (
                        <img src={selectedLicense.talent_avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <FiUser className="w-6 h-6" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-purple-600 font-bold uppercase tracking-wider">Represented Talent / Actor</p>
                      <p className="text-sm font-black text-gray-900">{selectedLicense.talent_name || selectedLicense.actor_party_id || 'Talent'}</p>
                      <div className="flex items-center gap-2 mt-0.5 text-[10px] text-gray-500 font-mono">
                        <span>Actor Party: {selectedLicense.actor_party_id || '—'}</span>
                        {selectedLicense.replica_id && <span>· Replica: {selectedLicense.replica_id}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <span className="text-[10px] text-gray-400 font-bold uppercase">Buyer / Licensee</span>
                      <p className="font-bold text-gray-900 mt-0.5">{selectedLicense.customer_name || selectedLicense.buyer_party_id || 'Direct Client'}</p>
                      <p className="text-[11px] text-gray-500">{selectedLicense.customer_email || `Party: ${selectedLicense.buyer_party_id || '—'}`}</p>
                      {selectedLicense.customer_phone && <p className="text-[11px] text-gray-500">{selectedLicense.customer_phone}</p>}
                    </div>

                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <span className="text-[10px] text-gray-400 font-bold uppercase">Project & Role</span>
                      <p className="font-bold text-gray-900 mt-0.5">{selectedLicense.project_name || selectedLicense.production_title || 'Direct Licensing'}</p>
                      {selectedLicense.character_name && (
                        <p className="text-[11px] text-purple-700 font-medium">Character: {selectedLicense.character_name}</p>
                      )}
                      <p className="text-[10px] text-gray-400 font-mono">{selectedLicense.production_id || '—'}</p>
                    </div>
                  </div>

                  {/* Scope & Terms */}
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-gray-400 font-bold uppercase">Modality</span>
                      <p className="font-bold text-gray-900 capitalize mt-0.5">{selectedLicense.product || 'Full Actor'}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 font-bold uppercase">Tier</span>
                      <p className="font-bold text-gray-900 capitalize mt-0.5">{selectedLicense.tier || 'Standard'}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 font-bold uppercase">Territory</span>
                      <p className="font-bold text-gray-900 capitalize mt-0.5">{selectedLicense.territory || 'Global'}</p>
                    </div>
                  </div>

                  {/* Description / Notes if any */}
                  {selectedLicense.use_description && (
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs">
                      <span className="text-[10px] text-gray-400 font-bold uppercase">Intended Use Description</span>
                      <p className="text-gray-700 mt-0.5">{selectedLicense.use_description}</p>
                    </div>
                  )}

                  {/* Approval deadline / Rejection reason if any */}
                  {selectedLicense.approval_deadline && (
                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 flex items-center justify-between text-xs">
                      <span className="text-amber-800 font-bold">48-Hour Actor Approval Deadline:</span>
                      <span className="font-mono text-amber-900">{new Date(selectedLicense.approval_deadline).toLocaleString()}</span>
                    </div>
                  )}
                  {selectedLicense.rejection_reason && (
                    <div className="p-3 bg-red-50 rounded-xl border border-red-100 text-xs">
                      <span className="text-red-700 font-bold">Rejection Reason:</span>
                      <p className="text-red-800 mt-0.5">{selectedLicense.rejection_reason}</p>
                    </div>
                  )}

                  {/* Revenue Split Breakdown */}
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-2 text-xs">
                    <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                      <span className="font-bold text-gray-700">Total License Fee</span>
                      <span className="font-black text-sm text-gray-900">{Number(selectedLicense.amount_etb || 0).toLocaleString()} ETB</span>
                    </div>
                    <div className="flex items-center justify-between text-gray-600 text-[11px]">
                      <span>
                        Actor Share ({Math.round((selectedLicense.actor_rate_snapshot || 0.7) * 100)}%)
                      </span>
                      <span className="font-bold text-green-700">
                        {Number(selectedLicense.actor_payout_etb ?? (Number(selectedLicense.amount_etb || 0) * (selectedLicense.actor_rate_snapshot || 0.7))).toLocaleString()} ETB
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-gray-600 text-[11px]">
                      <span>
                        Platform Commission ({Math.round((selectedLicense.platform_rate_snapshot || 0.3) * 100)}%)
                      </span>
                      <span className="font-bold text-purple-700">
                        {Number(selectedLicense.platform_fee_etb ?? (Number(selectedLicense.amount_etb || 0) * (selectedLicense.platform_rate_snapshot || 0.3))).toLocaleString()} ETB
                      </span>
                    </div>
                  </div>

                  {/* Allowed Use Rights */}
                  {selectedLicense.purchased_uses && selectedLicense.purchased_uses.length > 0 && (
                    <div>
                      <span className="text-xs font-bold text-gray-700 block mb-1.5">Licensed Use Cases</span>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedLicense.purchased_uses.map(u => (
                          <span key={u} className="text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-100 px-2.5 py-1 rounded-lg">
                            {USE_LABELS[u] || u}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Checkout Link if pending */}
                  {selectedLicense.checkout_url && (
                    <div className="p-3 bg-yellow-50 rounded-xl border border-yellow-200 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-yellow-800">AddisPay Checkout Link:</span>
                        <a
                          href={selectedLicense.checkout_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-purple-700 hover:underline font-bold"
                        >
                          <span>Open Checkout</span>
                          <FiExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Status & Validity */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs text-gray-500">
                    <span>
                      Remaining Uses: <strong className="text-gray-900">{selectedLicense.uses_remaining ?? selectedLicense.uses_allowed ?? 1}</strong> / {selectedLicense.uses_allowed || selectedLicense.total_uses || 1}
                    </span>
                    <span>
                      Status: <strong className="capitalize text-gray-900">{selectedLicense.status}</strong>
                    </span>
                  </div>
                </>
              ) : (
                /* ── Tab: License Audit Trail ── */
                <div className="space-y-4">
                  {auditLoading ? (
                    <div className="flex items-center justify-center py-12 text-gray-400">
                      <FiRefreshCw className="w-6 h-6 animate-spin text-purple-600" />
                      <span className="ml-2 text-xs font-bold">Loading audit logs...</span>
                    </div>
                  ) : auditError ? (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                      {auditError}
                    </div>
                  ) : auditLog.length === 0 ? (
                    <div className="text-center py-12 text-gray-400 text-xs font-medium">
                      No audit trail events recorded yet for this license.
                    </div>
                  ) : (
                    <div className="relative border-l-2 border-purple-200 ml-4 pl-4 space-y-4 py-2">
                      {auditLog.map((entry, idx) => (
                        <div key={idx} className="relative">
                          {/* Dot */}
                          <div className="absolute -left-[23px] top-1 w-3 h-3 rounded-full bg-purple-600 border-2 border-white ring-2 ring-purple-100" />
                          <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-black text-purple-900 uppercase tracking-wide">
                                {entry.event.replace(/_/g, ' ')}
                              </span>
                              <span className="text-[10px] text-gray-400 font-mono">
                                {entry.at ? new Date(entry.at).toLocaleString() : '—'}
                              </span>
                            </div>
                            {entry.by && (
                              <p className="text-[11px] text-gray-600">
                                <strong>By:</strong> <span className="font-mono text-purple-700">{entry.by}</span>
                              </p>
                            )}
                            {entry.detail && (
                              <p className="text-[11px] text-gray-700 bg-white p-2 rounded border border-gray-100 font-mono">
                                {entry.detail}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex justify-end shrink-0">
              <button
                onClick={() => setSelectedLicense(null)}
                className="px-4 py-2 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-gray-800 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
