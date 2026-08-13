import { useEffect, useState } from 'react'
import { adminAPI } from '@/config/api'
import PageHeader from '@/components/common/PageHeader'
import DataTable from '@/components/common/DataTable'
import Pagination from '@/components/common/Pagination'
import { FiRefreshCw, FiCheck, FiX, FiShield, FiTrash2 } from 'react-icons/fi'

const STATUS_BADGE: Record<string, string> = {
  PENDING:  'bg-yellow-100 text-yellow-700 border-yellow-200',
  VERIFIED: 'bg-green-100 text-green-700 border-green-200',
  REJECTED: 'bg-red-100 text-red-600 border-red-200',
}

const TYPE_BADGE: Record<string, string> = {
  Agency:             'bg-purple-100 text-purple-700',
  'Production Studio':'bg-indigo-100 text-indigo-700',
  Academy:            'bg-amber-100 text-amber-700',
}

export default function CompaniesPage() {
  const [data, setData]               = useState<any[]>([])
  const [loading, setLoading]         = useState(true)
  const [page, setPage]               = useState(1)
  const [total, setTotal]             = useState(0)
  const [pages, setPages]             = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [verifyModal, setVerifyModal] = useState<{ id: string; name: string; action: 'verified' | 'rejected' } | null>(null)
  const [reason, setReason]           = useState('')
  const [submitting, setSubmitting]   = useState(false)

  const load = async (p = 1) => {
    setLoading(true)
    try {
      const res = await adminAPI.companies(p, statusFilter || undefined)
      setData(res.data || [])
      setTotal(res.pagination?.total ?? res.total ?? 0)
      setPages(res.pagination?.pages ?? 1)
      setPage(p)
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [statusFilter])

  const openModal = (id: string, name: string, action: 'verified' | 'rejected') => {
    setVerifyModal({ id, name, action })
    setReason('')
  }

  const handleVerify = async () => {
    if (!verifyModal) return
    setSubmitting(true)
    try {
      await adminAPI.verifyCompany(verifyModal.id, verifyModal.action, reason || undefined)
      setVerifyModal(null)
      load(page)
    } catch {}
    setSubmitting(false)
  }

  return (
    <div>
      <PageHeader title="Companies" subtitle={`${total} companies`} actions={
        <div className="flex gap-2">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-orange-400">
            <option value="">All</option>
            <option value="PENDING">Pending</option>
            <option value="VERIFIED">Verified</option>
            <option value="REJECTED">Rejected</option>
          </select>
          <button onClick={() => load(1)} className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
            <FiRefreshCw className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      } />

      <div className="p-6">
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <DataTable loading={loading} data={data} keyField="company_id" emptyMsg="No companies found"
            columns={[
              { key: 'name', label: 'Company', render: r => (
                <div>
                  <span className="font-bold">{r.company_name || r.name || '—'}</span>
                  <p className="text-[10px] font-mono text-gray-400">{r.company_id || r._id}</p>
                </div>
              )},
              { key: 'company_type', label: 'Type', render: r => {
                const name = r.company_type?.name || r.company_type || '—'
                return (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${TYPE_BADGE[name] || 'bg-gray-100 text-gray-500'}`}>
                    {name}
                  </span>
                )
              }},
              { key: 'license_type', label: 'License', render: r => (
                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-[10px] font-bold">
                  {r.license_type?.name || r.license_type || '—'}
                </span>
              )},
              { key: 'city', label: 'City', render: r => r.city || '—' },
              { key: 'tin_number', label: 'TIN', render: r => r.tin_number || '—' },
              { key: 'phone_number', label: 'Phone', render: r => r.phone_number || '—' },
              { key: 'verification_status', label: 'Status', render: r => {
                const s = r.verification_status || 'PENDING'
                return (
                  <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase ${STATUS_BADGE[s] || STATUS_BADGE.PENDING}`}>
                    {s}
                  </span>
                )
              }},
              { key: 'actions', label: '', render: r => {
                const id = r.company_id || r._id
                const name = r.company_name || r.name || id
                const status = r.verification_status || 'PENDING'
                if (status === 'VERIFIED') return (
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 text-[10px] font-bold text-green-600">
                      <FiShield className="w-3.5 h-3.5" /> Verified
                    </span>
                    <button onClick={async () => {
                      if (!confirm(`Delete company "${name}"? This cannot be undone.`)) return
                      try { await adminAPI.deleteCompany(id); load(page) } catch (e: any) { alert(e.message) }
                    }} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition" title="Delete company">
                      <FiTrash2 className="w-3 h-3" />
                    </button>
                  </div>
                )
                return (
                  <div className="flex gap-1.5">
                    <button onClick={() => openModal(id, name, 'verified')}
                      className="flex items-center gap-1 px-2.5 py-1 bg-green-500 hover:bg-green-600 text-white rounded-lg text-[10px] font-bold transition">
                      <FiCheck className="w-3 h-3" /> Verify
                    </button>
                    {status !== 'REJECTED' && (
                      <button onClick={() => openModal(id, name, 'rejected')}
                        className="flex items-center gap-1 px-2.5 py-1 bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 rounded-lg text-[10px] font-bold transition">
                        <FiX className="w-3 h-3" /> Reject
                      </button>
                    )}
                    <button onClick={async () => {
                      if (!confirm(`Delete company "${name}"? This cannot be undone.`)) return
                      try { await adminAPI.deleteCompany(id); load(page) } catch (e: any) { alert(e.message) }
                    }} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition" title="Delete company">
                      <FiTrash2 className="w-3 h-3" />
                    </button>
                  </div>
                )
              }},
            ]}
          />
          <Pagination page={page} pages={pages} total={total} onChange={p => load(p)} />
        </div>
      </div>

      {/* Verify / Reject Modal */}
      {verifyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              {verifyModal.action === 'verified'
                ? <FiCheck className="w-5 h-5 text-green-500" />
                : <FiX className="w-5 h-5 text-red-500" />}
              <div>
                <h3 className="font-black text-gray-900 text-sm capitalize">{verifyModal.action} Company</h3>
                <p className="text-[11px] text-gray-400">{verifyModal.name}</p>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                Reason {verifyModal.action === 'rejected' ? '(required)' : '(optional)'}
              </label>
              <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3}
                placeholder={verifyModal.action === 'verified'
                  ? 'e.g. TIN confirmed, documents checked'
                  : 'e.g. Invalid license number'}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-orange-400 resize-none" />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setVerifyModal(null)}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 transition">
                Cancel
              </button>
              <button
                onClick={handleVerify}
                disabled={submitting || (verifyModal.action === 'rejected' && !reason.trim())}
                className={`flex-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black transition disabled:opacity-50 text-white ${
                  verifyModal.action === 'verified' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'
                }`}>
                {verifyModal.action === 'verified' ? <FiCheck className="w-3.5 h-3.5" /> : <FiX className="w-3.5 h-3.5" />}
                {submitting ? 'Saving…' : verifyModal.action === 'verified' ? 'Verify' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
