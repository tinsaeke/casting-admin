'use client'
import { useEffect, useState, useCallback } from 'react'
import { adminAPI } from '@/config/api'
import PageHeader from '@/components/common/PageHeader'
import DataTable from '@/components/common/DataTable'
import Pagination from '@/components/common/Pagination'
import {
  FiRefreshCw, FiShield, FiUser, FiCheckCircle, FiXCircle,
  FiAlertCircle, FiEye, FiX, FiDollarSign, FiCalendar,
  FiClock, FiList, FiExternalLink, FiLoader, FiHash,
  FiPlayCircle, FiPause, FiTrash2, FiFilm,
} from 'react-icons/fi'

// ── Types ─────────────────────────────────────────────────────────────────────
interface ReplicaLicense {
  _id?: string
  license_id: string
  replica_id?: string
  actor_party_id?: string
  actor_name?: string
  actor_avatar?: string
  buyer_party_id?: string
  customer_name?: string
  customer_email?: string
  customer_phone?: string
  production_id?: string
  project_name?: string
  generation_type?: string
  products?: string[]
  territory?: string
  duration_days?: number
  character_name?: string
  use_description?: string
  status: 'pending_approval' | 'approved' | 'active' | 'exhausted' | 'rejected' | 'negotiating' | 'cancelled' | 'expired' | 'revoked' | string
  amount_etb?: number
  actor_payout_etb?: number
  platform_fee_etb?: number
  actor_rate_snapshot?: number
  checkout_url?: string
  renders?: any[]
  audit_log?: AuditEntry[]
  created_at?: string
  createdAt?: string
  approved_at?: string
  expires_at?: string
}

interface AuditEntry {
  event: string
  at: string
  by?: string
  detail?: string
}

// ── Badge maps ────────────────────────────────────────────────────────────────
const STATUS_BADGE: Record<string, string> = {
  active:           'bg-green-100 text-green-700 border-green-200',
  approved:         'bg-blue-100 text-blue-700 border-blue-200',
  pending_approval: 'bg-yellow-100 text-yellow-800 border-yellow-200 animate-pulse',
  negotiating:      'bg-purple-100 text-purple-700 border-purple-200',
  exhausted:        'bg-orange-100 text-orange-700 border-orange-200',
  expired:          'bg-gray-100 text-gray-500 border-gray-200',
  rejected:         'bg-red-100 text-red-700 border-red-200',
  cancelled:        'bg-gray-100 text-gray-500 border-gray-200',
  revoked:          'bg-red-200 text-red-800 border-red-300',
}

const STATUS_TABS = ['all', 'pending_approval', 'approved', 'active', 'exhausted', 'expired', 'rejected', 'revoked']

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ReplicaLicensesPage() {
  const [licenses, setLicenses]           = useState<ReplicaLicense[]>([])
  const [loading, setLoading]             = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [error, setError]                 = useState<string | null>(null)
  const [success, setSuccess]             = useState<string | null>(null)
  const [page, setPage]                   = useState(1)
  const [total, setTotal]                 = useState(0)
  const [statusFilter, setStatusFilter]   = useState('all')
  const [search, setSearch]               = useState('')
  const [selectedLicense, setSelectedLicense] = useState<ReplicaLicense | null>(null)
  const [auditLog, setAuditLog]           = useState<AuditEntry[]>([])
  const [auditLoading, setAuditLoading]   = useState(false)
  const limit = 20

  const load = useCallback(async (p = 1) => {
    setLoading(true)
    setError(null)
    try {
      const res = await adminAPI.replicaLicenses({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        page: p,
        limit,
      })
      const list: ReplicaLicense[] = Array.isArray(res) ? res : (res?.data || res?.licenses || [])
      setLicenses(list)
      setTotal(res?.pagination?.total ?? res?.total ?? list.length)
      setPage(p)
    } catch (e: any) {
      setError(e?.message || 'Failed to load replica licenses')
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => { load(1) }, [load])

  // Auto-dismiss success
  useEffect(() => {
    if (!success) return
    const t = setTimeout(() => setSuccess(null), 4000)
    return () => clearTimeout(t)
  }, [success])

  const loadAuditLog = async (licenseId: string) => {
    setAuditLoading(true)
    try {
      const res = await adminAPI.licenseAuditLog(licenseId)
      setAuditLog(Array.isArray(res) ? res : (res?.data || res?.audit_log || []))
    } catch {
      setAuditLog([])
    } finally {
      setAuditLoading(false)
    }
  }

  const openDetail = (lic: ReplicaLicense) => {
    setSelectedLicense(lic)
    setAuditLog([])
    loadAuditLog(lic.license_id)
  }

  const handleExpireApprovals = async () => {
    if (!confirm('Expire all overdue 48h approval requests?')) return
    setActionLoading('expire-approvals')
    try {
      await adminAPI.expireOverdueApprovals()
      setSuccess('Overdue approval requests expired.')
      load(1)
    } catch (e: any) {
      setError(e?.message || 'Failed to expire approvals')
    } finally {
      setActionLoading(null)
    }
  }

  const handleExpireLicenses = async () => {
    if (!confirm('Expire all overdue licenses?')) return
    setActionLoading('expire-licenses')
    try {
      await adminAPI.expireOverdueLicenses()
      setSuccess('Overdue licenses expired.')
      load(1)
    } catch (e: any) {
      setError(e?.message || 'Failed to expire licenses')
    } finally {
      setActionLoading(null)
    }
  }

  // Client-side search filter
  const filtered = licenses.filter(l => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      l.license_id?.toLowerCase().includes(q) ||
      l.actor_name?.toLowerCase().includes(q) ||
      l.customer_name?.toLowerCase().includes(q) ||
      l.customer_email?.toLowerCase().includes(q) ||
      l.project_name?.toLowerCase().includes(q) ||
      l.actor_party_id?.toLowerCase().includes(q) ||
      l.buyer_party_id?.toLowerCase().includes(q)
    )
  })

  // Stat counts from loaded page
  const pendingCount  = licenses.filter(l => l.status === 'pending_approval').length
  const activeCount   = licenses.filter(l => l.status === 'active').length
  const totalEtb      = licenses.reduce((s, l) => s + (Number(l.amount_etb) || 0), 0)

  const columns = [
    {
      key: 'license_id', label: 'License',
      render: (l: ReplicaLicense) => {
        const dateStr = l.created_at || l.createdAt
        return (
          <div>
            <span className="font-mono text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded">
              {l.license_id?.slice(0, 14)}…
            </span>
            <p className="text-[10px] text-gray-400 mt-0.5">
              {dateStr ? new Date(dateStr).toLocaleDateString() : '—'}
            </p>
          </div>
        )
      },
    },
    {
      key: 'actor_name', label: 'Actor / Replica',
      render: (l: ReplicaLicense) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 border border-purple-200 overflow-hidden">
            {l.actor_avatar
              ? <img src={l.actor_avatar} alt="" className="w-full h-full object-cover" />
              : <FiUser className="w-3.5 h-3.5" />}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-gray-900 truncate">{l.actor_name || l.actor_party_id || '—'}</p>
            {l.replica_id && (
              <p className="text-[10px] text-gray-400 font-mono truncate">
                {l.replica_id.slice(0, 10)}…
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'customer_name', label: 'Buyer / Producer',
      render: (l: ReplicaLicense) => (
        <div>
          <p className="text-xs font-bold text-gray-900">{l.customer_name || l.buyer_party_id || '—'}</p>
          <p className="text-[10px] text-gray-400 truncate">{l.customer_email || l.project_name || '—'}</p>
        </div>
      ),
    },
    {
      key: 'products', label: 'Use / Products',
      render: (l: ReplicaLicense) => (
        <div className="flex flex-wrap gap-1 max-w-[140px]">
          {(l.products || [l.generation_type]).filter(Boolean).map((p, i) => (
            <span key={i} className="text-[10px] font-semibold bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded capitalize">
              {String(p).replace(/_/g, ' ')}
            </span>
          ))}
          {l.territory && (
            <span className="text-[10px] text-gray-400">📍{l.territory}</span>
          )}
        </div>
      ),
    },
    {
      key: 'amount_etb', label: 'Amount',
      render: (l: ReplicaLicense) => (
        <div className="font-mono text-right">
          <p className="text-xs font-black text-gray-900">
            {l.amount_etb ? `${Number(l.amount_etb).toLocaleString()} ETB` : '—'}
          </p>
          {l.actor_payout_etb !== undefined && (
            <p className="text-[10px] text-green-600">Actor: {Number(l.actor_payout_etb).toLocaleString()}</p>
          )}
          {l.platform_fee_etb !== undefined && (
            <p className="text-[10px] text-blue-600">Platform: {Number(l.platform_fee_etb).toLocaleString()}</p>
          )}
        </div>
      ),
    },
    {
      key: 'status', label: 'Status',
      render: (l: ReplicaLicense) => (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${STATUS_BADGE[l.status] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
          {l.status?.replace(/_/g, ' ') || '—'}
        </span>
      ),
    },
    {
      key: 'actions', label: 'Actions',
      render: (l: ReplicaLicense) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => openDetail(l)}
            className="p-1.5 hover:bg-purple-50 text-gray-500 hover:text-purple-700 rounded-lg transition"
            title="View detail & audit log"
          >
            <FiEye className="w-3.5 h-3.5" />
          </button>
          {l.checkout_url && l.status === 'approved' && (
            <a
              href={l.checkout_url}
              target="_blank"
              rel="noreferrer"
              className="p-1.5 hover:bg-blue-50 text-gray-500 hover:text-blue-700 rounded-lg transition"
              title="Open checkout URL"
            >
              <FiExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="p-6 space-y-5">
      <PageHeader
        title="Digital Replica Licenses"
        subtitle={`${total} total licenses`}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={handleExpireApprovals}
              disabled={actionLoading === 'expire-approvals'}
              className="flex items-center gap-1.5 px-3 py-2 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-xl text-xs font-bold hover:bg-yellow-100 transition disabled:opacity-50"
            >
              {actionLoading === 'expire-approvals'
                ? <FiLoader className="w-3.5 h-3.5 animate-spin" />
                : <FiClock className="w-3.5 h-3.5" />}
              Expire Overdue Approvals
            </button>
            <button
              onClick={handleExpireLicenses}
              disabled={actionLoading === 'expire-licenses'}
              className="flex items-center gap-1.5 px-3 py-2 bg-orange-50 text-orange-700 border border-orange-200 rounded-xl text-xs font-bold hover:bg-orange-100 transition disabled:opacity-50"
            >
              {actionLoading === 'expire-licenses'
                ? <FiLoader className="w-3.5 h-3.5 animate-spin" />
                : <FiPause className="w-3.5 h-3.5" />}
              Expire Overdue Licenses
            </button>
            <button
              onClick={() => load(1)}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 transition disabled:opacity-50"
            >
              <FiRefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        }
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Pending Approval', value: pendingCount, color: 'text-yellow-600', bg: 'bg-yellow-50', icon: FiClock },
          { label: 'Active Licenses', value: activeCount,  color: 'text-green-600',  bg: 'bg-green-50',  icon: FiCheckCircle },
          { label: 'Total ETB (page)', value: `${totalEtb.toLocaleString()} ETB`, color: 'text-purple-600', bg: 'bg-purple-50', icon: FiDollarSign },
        ].map(({ label, value, color, bg, icon: Icon }) => (
          <div key={label} className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center ${color}`}>
              <Icon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">{label}</p>
              <p className={`text-lg font-black ${color}`}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Status Tabs + Search */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1.5">
          {STATUS_TABS.map(s => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); load(1) }}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition ${
                statusFilter === s
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'
              }`}
            >
              {s.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Search by ID, actor, buyer, project…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] px-3 py-2 text-xs border border-gray-200 rounded-xl focus:border-purple-400 focus:outline-none bg-white"
        />
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

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <DataTable
          columns={columns}
          data={filtered}
          loading={loading}
          keyField="license_id"
          emptyMsg="No replica licenses found"
          onRowClick={openDetail}
        />
        <div className="p-4 border-t border-gray-100">
          <Pagination
            page={page}
            pages={Math.ceil(total / limit) || 1}
            total={total}
            onChange={p => load(p)}
          />
        </div>
      </div>

      {/* Detail Modal */}
      {selectedLicense && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-gray-200 overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <FiShield className="w-5 h-5 text-purple-600" />
                <div>
                  <h3 className="text-sm font-black text-gray-900">Replica License Detail</h3>
                  <p className="text-[10px] text-gray-400 font-mono">{selectedLicense.license_id}</p>
                </div>
              </div>
              <button onClick={() => setSelectedLicense(null)} className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition">
                <FiX className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 overflow-y-auto flex-1">
              {/* Status badge */}
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-black border uppercase tracking-wider ${STATUS_BADGE[selectedLicense.status] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                {selectedLicense.status?.replace(/_/g, ' ')}
              </span>

              {/* Parties */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-purple-50 rounded-xl border border-purple-100">
                  <p className="text-[10px] font-black uppercase text-purple-500 tracking-wider mb-1">Actor / Replica</p>
                  <p className="text-sm font-black text-gray-900">{selectedLicense.actor_name || selectedLicense.actor_party_id || '—'}</p>
                  {selectedLicense.replica_id && (
                    <p className="text-[10px] text-gray-400 font-mono mt-0.5">{selectedLicense.replica_id}</p>
                  )}
                </div>
                <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                  <p className="text-[10px] font-black uppercase text-blue-500 tracking-wider mb-1">Buyer / Producer</p>
                  <p className="text-sm font-black text-gray-900">{selectedLicense.customer_name || selectedLicense.buyer_party_id || '—'}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">{selectedLicense.customer_email || '—'}</p>
                  <p className="text-[10px] text-gray-500">{selectedLicense.customer_phone || '—'}</p>
                </div>
              </div>

              {/* License details */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                {[
                  { label: 'Project', value: selectedLicense.project_name },
                  { label: 'Production ID', value: selectedLicense.production_id },
                  { label: 'Territory', value: selectedLicense.territory },
                  { label: 'Duration (days)', value: selectedLicense.duration_days },
                  { label: 'Character', value: selectedLicense.character_name },
                  { label: 'Generation Type', value: selectedLicense.generation_type },
                  { label: 'Amount', value: selectedLicense.amount_etb ? `${Number(selectedLicense.amount_etb).toLocaleString()} ETB` : undefined },
                  { label: 'Actor Payout', value: selectedLicense.actor_payout_etb ? `${Number(selectedLicense.actor_payout_etb).toLocaleString()} ETB` : undefined },
                  { label: 'Platform Fee', value: selectedLicense.platform_fee_etb ? `${Number(selectedLicense.platform_fee_etb).toLocaleString()} ETB` : undefined },
                  { label: 'Approved At', value: selectedLicense.approved_at ? new Date(selectedLicense.approved_at).toLocaleString() : undefined },
                  { label: 'Expires At', value: selectedLicense.expires_at ? new Date(selectedLicense.expires_at).toLocaleString() : undefined },
                ].filter(f => f.value !== undefined && f.value !== null && f.value !== '').map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider">{label}</p>
                    <p className="font-bold text-gray-800">{String(value)}</p>
                  </div>
                ))}
              </div>

              {/* Products */}
              {selectedLicense.products && selectedLicense.products.length > 0 && (
                <div>
                  <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider mb-1.5">Licensed Products</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedLicense.products.map(p => (
                      <span key={p} className="text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-lg capitalize">
                        {p.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Checkout URL */}
              {selectedLicense.checkout_url && (
                <div>
                  <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider mb-1">Checkout URL</p>
                  <a
                    href={selectedLicense.checkout_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <FiExternalLink className="w-3 h-3" />
                    {selectedLicense.checkout_url.slice(0, 60)}…
                  </a>
                </div>
              )}

              {/* Audit Log */}
              <div>
                <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider mb-2 flex items-center gap-1.5">
                  <FiList className="w-3.5 h-3.5" /> Audit Log
                </p>
                {auditLoading ? (
                  <div className="flex items-center gap-2 text-xs text-gray-400 py-3">
                    <FiLoader className="w-3.5 h-3.5 animate-spin" /> Loading…
                  </div>
                ) : auditLog.length === 0 ? (
                  <p className="text-xs text-gray-400 py-2">No audit entries.</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {auditLog.map((entry, i) => (
                      <div key={i} className="flex items-start gap-2.5 p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-gray-800">{entry.event}</p>
                          <p className="text-[10px] text-gray-400">
                            {entry.at ? new Date(entry.at).toLocaleString() : '—'}
                            {entry.by ? ` · by ${entry.by}` : ''}
                          </p>
                          {entry.detail && (
                            <p className="text-[10px] text-gray-500 mt-0.5 truncate">{entry.detail}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
