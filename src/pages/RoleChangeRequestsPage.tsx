import { useEffect, useState } from 'react'
import { adminAPI } from '@/config/api'
import PageHeader from '@/components/common/PageHeader'
import DataTable from '@/components/common/DataTable'
import Pagination from '@/components/common/Pagination'
import {
  FiRefreshCw, FiCheck, FiX, FiAlertCircle, FiCheckCircle,
  FiUser, FiCreditCard, FiArrowRight,
} from 'react-icons/fi'

// ── Types & Constants ─────────────────────────────────────────────────────────

interface RoleChangeRequest {
  _id?: string
  request_id?: string
  id?: string
  party_id?: string
  partyId?: string
  user_name?: string
  user_phone?: string
  current_role?: string
  requested_role: string
  reason?: string
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'
  admin_note?: string
  created_at?: string
  createdAt?: string
  updated_at?: string
  updatedAt?: string
}

const STATUSES = [
  { id: 'pending',   label: 'Pending Review' },
  { id: 'approved',  label: 'Approved' },
  { id: 'rejected',  label: 'Rejected' },
  { id: 'cancelled', label: 'Cancelled' },
  { id: 'all',       label: 'All Requests' },
]

const STATUS_BADGE: Record<string, { cls: string; label: string; icon: string }> = {
  pending:   { cls: 'bg-yellow-100 text-yellow-800 border-yellow-200', label: 'Pending Review', icon: '🟡' },
  approved:  { cls: 'bg-green-100 text-green-800 border-green-200',   label: 'Approved',       icon: '✅' },
  rejected:  { cls: 'bg-red-100 text-red-700 border-red-200',       label: 'Rejected',       icon: '❌' },
  cancelled: { cls: 'bg-gray-100 text-gray-600 border-gray-200',     label: 'Cancelled',      icon: '⚫' },
}

const ROLE_BADGE: Record<string, { cls: string; label: string }> = {
  talent:            { cls: 'bg-blue-100 text-blue-800 border-blue-200',     label: 'Talent' },
  cast_agency:       { cls: 'bg-orange-100 text-orange-800 border-orange-200', label: 'Casting Agency' },
  production_studio: { cls: 'bg-purple-100 text-purple-800 border-purple-200', label: 'Production Studio' },
  content_creator:   { cls: 'bg-pink-100 text-pink-800 border-pink-200',     label: 'Content Creator' },
  production_crew:   { cls: 'bg-emerald-100 text-emerald-800 border-emerald-200', label: 'Production Crew' },
  aggregator_scout:  { cls: 'bg-cyan-100 text-cyan-800 border-cyan-200',     label: 'Aggregator Scout' },
  location_scout:    { cls: 'bg-teal-100 text-teal-800 border-teal-200',     label: 'Location Scout' },
  academy:           { cls: 'bg-indigo-100 text-indigo-800 border-indigo-200', label: 'Academy' },
}

const PAID_ROLES = ['cast_agency', 'production_studio', 'content_creator']

function formatRole(role?: string) {
  if (!role) return '—'
  return ROLE_BADGE[role]?.label || role.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function formatDate(dateStr?: string) {
  if (!dateStr) return '—'
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  } catch {
    return dateStr
  }
}

// ── Main Page Component ───────────────────────────────────────────────────────

export default function RoleChangeRequestsPage() {
  const [data, setData]           = useState<RoleChangeRequest[]>([])
  const [loading, setLoading]     = useState(true)
  const [page, setPage]           = useState(1)
  const [total, setTotal]         = useState(0)
  const [pages, setPages]         = useState(1)
  const [statusFilter, setStatus] = useState('pending')
  const [search, setSearch]       = useState('')
  const [pendingCount, setPendingCount] = useState(0)

  // Action modal state
  const [modal, setModal] = useState<{
    type: 'approve' | 'reject'
    req: RoleChangeRequest
  } | null>(null)
  const [adminNote, setAdminNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const load = async (p = 1) => {
    setLoading(true)
    setError('')
    try {
      const res = await adminAPI.roleChangeRequests(statusFilter, p, 20)
      const list = Array.isArray(res) ? res : res?.requests || res?.data || []
      setData(list)
      const totalCount = res?.total ?? res?.pagination?.total ?? res?.meta?.total ?? list.length
      const totalPages = res?.pages ?? res?.pagination?.pages ?? res?.meta?.totalPages ?? Math.max(1, Math.ceil(totalCount / 20))
      setTotal(totalCount)
      setPages(totalPages)
      setPage(p)

      // Also count pending
      if (statusFilter === 'pending') {
        setPendingCount(totalCount)
      } else {
        const pendingRes = await adminAPI.roleChangeRequests('pending', 1, 1).catch(() => null)
        if (pendingRes) {
          const count = pendingRes?.total ?? pendingRes?.pagination?.total ?? (Array.isArray(pendingRes?.requests) ? pendingRes.requests.length : Array.isArray(pendingRes) ? pendingRes.length : 0)
          setPendingCount(count)
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load role change requests')
    }
    setLoading(false)
  }

  useEffect(() => { load(1) }, [statusFilter])

  const openActionModal = (type: 'approve' | 'reject', req: RoleChangeRequest) => {
    setModal({ type, req })
    setAdminNote(type === 'approve' ? 'Approved.' : '')
    setError('')
    setSuccess('')
  }

  const closeActionModal = () => {
    setModal(null)
    setAdminNote('')
    setError('')
  }

  const handleActionSubmit = async () => {
    if (!modal) return
    const id = modal.req.request_id || modal.req._id || modal.req.id || ''
    if (!id) {
      setError('Invalid request ID')
      return
    }

    if (modal.type === 'reject' && !adminNote.trim()) {
      setError('Rejection reason (admin note) is required.')
      return
    }

    setSubmitting(true)
    setError('')
    try {
      if (modal.type === 'approve') {
        await adminAPI.approveRoleChangeRequest(id, adminNote.trim() || undefined)
        setSuccess('Role change request approved successfully! User has been notified.')
      } else {
        await adminAPI.rejectRoleChangeRequest(id, adminNote.trim())
        setSuccess('Role change request rejected. User has been notified.')
      }
      setTimeout(() => {
        closeActionModal()
        load(page)
      }, 1000)
    } catch (err: any) {
      setError(err.message || 'Action failed')
    }
    setSubmitting(false)
  }

  // Client-side search filtering
  const filteredData = data.filter(r => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    const pId = (r.party_id || r.partyId || '').toLowerCase()
    const uName = (r.user_name || '').toLowerCase()
    const reqRole = (r.requested_role || '').toLowerCase()
    const curRole = (r.current_role || '').toLowerCase()
    const reason = (r.reason || '').toLowerCase()
    return pId.includes(q) || uName.includes(q) || reqRole.includes(q) || curRole.includes(q) || reason.includes(q)
  })

  return (
    <div>
      <PageHeader
        title="Role Change Requests"
        subtitle="Review and process user role upgrade and transfer requests"
        actions={
          <button
            onClick={() => load(1)}
            disabled={loading}
            className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition disabled:opacity-40"
            title="Refresh"
          >
            <FiRefreshCw className={`w-4 h-4 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
        }
      />

      {/* Filter Tabs */}
      <div className="px-6 py-2 border-b border-gray-100 bg-white flex items-center justify-between gap-3 overflow-x-auto">
        <div className="flex gap-1">
          {STATUSES.map(s => {
            const isSelected = statusFilter === s.id
            return (
              <button
                key={s.id}
                onClick={() => setStatus(s.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                  isSelected
                    ? 'bg-orange-500 text-white shadow-xs'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                <span>{s.label}</span>
                {s.id === 'pending' && pendingCount > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black ${
                    isSelected ? 'bg-white text-orange-600' : 'bg-red-500 text-white'
                  }`}>
                    {pendingCount}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        <div className="relative shrink-0">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search party ID, role, or reason…"
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs w-56 focus:outline-none focus:border-orange-400"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-2 text-gray-400 hover:text-gray-600"
            >
              <FiX className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="p-6">
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs">
          <DataTable
            loading={loading}
            data={filteredData}
            keyField="_id"
            emptyMsg="No role change requests found in this status"
            columns={[
              {
                key: 'party_id',
                label: 'User / Party ID',
                render: r => {
                  const pId = r.party_id || r.partyId || '—'
                  return (
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-200 text-orange-600 flex items-center justify-center shrink-0 font-black text-xs">
                        {r.user_name ? r.user_name.charAt(0).toUpperCase() : <FiUser className="w-3.5 h-3.5" />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-gray-900 text-xs truncate">{r.user_name || pId}</p>
                        <p className="font-mono text-[10px] text-gray-400">{pId}</p>
                      </div>
                    </div>
                  )
                },
              },
              {
                key: 'current_role',
                label: 'Current Role',
                render: r => {
                  const role = r.current_role
                  const badge = role ? (ROLE_BADGE[role] || { cls: 'bg-gray-100 text-gray-700 border-gray-200', label: role }) : null
                  return badge ? (
                    <span className={`px-2 py-0.5 rounded-full border text-[10px] font-black uppercase ${badge.cls}`}>
                      {badge.label}
                    </span>
                  ) : (
                    <span className="text-gray-400 text-xs">—</span>
                  )
                },
              },
              {
                key: 'transfer',
                label: '',
                width: 'w-6',
                render: () => <FiArrowRight className="w-3.5 h-3.5 text-gray-400" />,
              },
              {
                key: 'requested_role',
                label: 'Requested Role',
                render: r => {
                  const role = r.requested_role
                  const badge = ROLE_BADGE[role] || { cls: 'bg-purple-100 text-purple-800 border-purple-200', label: role }
                  const isPaid = PAID_ROLES.includes(role)
                  return (
                    <div className="space-y-1">
                      <span className={`px-2 py-0.5 rounded-full border text-[10px] font-black uppercase ${badge.cls}`}>
                        {badge.label}
                      </span>
                      {isPaid && (
                        <span className="flex items-center gap-1 text-[9px] font-bold text-amber-600">
                          <FiCreditCard className="w-2.5 h-2.5" /> Requires Active Subscription
                        </span>
                      )}
                    </div>
                  )
                },
              },
              {
                key: 'reason',
                label: 'Reason & Notes',
                render: r => (
                  <div className="max-w-xs space-y-0.5">
                    {r.reason ? (
                      <p className="text-xs text-gray-700 italic line-clamp-2">"{r.reason}"</p>
                    ) : (
                      <span className="text-gray-400 text-[11px]">No reason provided</span>
                    )}
                    {r.admin_note && (
                      <p className="text-[10px] text-gray-500 font-medium bg-gray-50 p-1.5 rounded-md border border-gray-100">
                        <span className="font-bold text-gray-700">Admin Note:</span> {r.admin_note}
                      </p>
                    )}
                  </div>
                ),
              },
              {
                key: 'status',
                label: 'Status',
                render: r => {
                  const badge = STATUS_BADGE[r.status] || STATUS_BADGE.pending
                  return (
                    <span className={`px-2.5 py-1 rounded-full border text-[10px] font-black flex items-center gap-1.5 w-max ${badge.cls}`}>
                      <span>{badge.icon}</span>
                      <span>{badge.label}</span>
                    </span>
                  )
                },
              },
              {
                key: 'created_at',
                label: 'Requested On',
                render: r => (
                  <span className="text-[11px] text-gray-500 whitespace-nowrap">
                    {formatDate(r.created_at || r.createdAt)}
                  </span>
                ),
              },
              {
                key: 'actions',
                label: 'Actions',
                render: r => {
                  const isPending = r.status === 'pending'
                  if (!isPending) {
                    return (
                      <span className="text-[10px] text-gray-400 uppercase font-bold">
                        {r.status}
                      </span>
                    )
                  }
                  return (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => openActionModal('approve', r)}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 rounded-lg text-xs font-bold transition shadow-2xs"
                        title="Approve Role Change"
                      >
                        <FiCheck className="w-3.5 h-3.5" />
                        <span>Approve</span>
                      </button>
                      <button
                        onClick={() => openActionModal('reject', r)}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg text-xs font-bold transition shadow-2xs"
                        title="Reject Role Change"
                      >
                        <FiX className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                    </div>
                  )
                },
              },
            ]}
          />
          <Pagination page={page} pages={pages} total={total} onChange={p => load(p)} />
        </div>
      </div>

      {/* ── Approval / Rejection Modal ── */}
      {modal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                {modal.type === 'approve' ? (
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                    <FiCheckCircle className="w-5 h-5" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                    <FiAlertCircle className="w-5 h-5" />
                  </div>
                )}
                <div>
                  <h3 className="font-black text-gray-900 text-sm">
                    {modal.type === 'approve' ? 'Approve Role Change' : 'Reject Role Change'}
                  </h3>
                  <p className="text-[11px] text-gray-500 font-mono">
                    {modal.req.party_id || modal.req.partyId}
                  </p>
                </div>
              </div>
              <button
                onClick={closeActionModal}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition text-gray-400 hover:text-gray-600"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>

            {/* Change details preview */}
            <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200/60 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-gray-500 font-medium">Transfer:</span>
                <div className="flex items-center gap-1.5 font-bold">
                  <span className="text-gray-700">{formatRole(modal.req.current_role)}</span>
                  <FiArrowRight className="w-3 h-3 text-gray-400" />
                  <span className="text-orange-600 font-black">{formatRole(modal.req.requested_role)}</span>
                </div>
              </div>
              {modal.req.reason && (
                <div className="pt-2 border-t border-gray-200/60">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">User's Stated Reason:</span>
                  <p className="text-gray-700 italic mt-0.5">"{modal.req.reason}"</p>
                </div>
              )}
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
                <FiAlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-xs text-green-700 font-bold flex items-start gap-2">
                <FiCheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{success}</span>
              </div>
            )}

            {/* Note form */}
            <div>
              <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                Admin Note {modal.type === 'reject' ? <span className="text-red-500">* (Required)</span> : <span className="text-gray-400 font-normal">(Optional)</span>}
              </label>
              <textarea
                rows={3}
                value={adminNote}
                onChange={e => setAdminNote(e.target.value)}
                placeholder={
                  modal.type === 'approve'
                    ? 'e.g. Approved. Verified portfolio and identity.'
                    : 'e.g. Insufficient portfolio / Please subscribe to a casting agency plan first.'
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-orange-500 resize-none"
              />
              <p className="text-[10px] text-gray-400 mt-1">
                This note will be sent directly to the user as an in-app notification.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={closeActionModal}
                disabled={submitting}
                className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl text-xs font-bold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleActionSubmit}
                disabled={submitting}
                className={`flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-black text-white transition shadow-sm ${
                  modal.type === 'approve'
                    ? 'bg-green-600 hover:bg-green-700 disabled:opacity-50'
                    : 'bg-red-600 hover:bg-red-700 disabled:opacity-50'
                }`}
              >
                {submitting ? (
                  <FiRefreshCw className="w-4 h-4 animate-spin" />
                ) : modal.type === 'approve' ? (
                  <>
                    <FiCheck className="w-4 h-4" />
                    <span>Confirm Approval</span>
                  </>
                ) : (
                  <>
                    <FiX className="w-4 h-4" />
                    <span>Confirm Rejection</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
