import { useEffect, useState } from 'react'
import { adminAPI } from '@/config/api'
import PageHeader from '@/components/common/PageHeader'
import DataTable from '@/components/common/DataTable'
import Pagination from '@/components/common/Pagination'
import { FiRefreshCw, FiExternalLink, FiTrash2, FiCheck, FiX, FiShield } from 'react-icons/fi'

type TabType = 'all' | 'pending'

export default function LocationsPage() {
  const [tab, setTab]           = useState<TabType>('all')
  const [data, setData]         = useState<any[]>([])
  const [loading, setLoading]   = useState(true)
  const [page, setPage]         = useState(1)
  const [total, setTotal]       = useState(0)
  const [pages, setPages]       = useState(1)
  const [search, setSearch]     = useState('')
  const [verifyModal, setVerifyModal] = useState<{ id: string; name: string } | null>(null)
  const [verifyNotes, setVerifyNotes] = useState('')
  const [verifying, setVerifying]     = useState(false)

  const load = async (p = 1) => {
    setLoading(true)
    try {
      const res = tab === 'all'
        ? await adminAPI.locations(p, search || undefined)
        : await adminAPI.pendingVerification(p)
      setData(res.data || [])
      setTotal(res.pagination?.total ?? res.total ?? 0)
      setPages(res.pagination?.pages ?? 1)
      setPage(p)
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [tab])

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete location "${name}"?`)) return
    await adminAPI.deleteLocation(id)
    load(page)
  }

  const handleVerify = async (status: 'verified' | 'rejected') => {
    if (!verifyModal) return
    setVerifying(true)
    try {
      await adminAPI.setLocationVerification(verifyModal.id, status, verifyNotes || undefined)
      setVerifyModal(null)
      setVerifyNotes('')
      load(page)
    } catch {}
    setVerifying(false)
  }

  return (
    <div>
      <PageHeader title="Locations" subtitle={`${total} filming locations`} actions={
        <div className="flex gap-2">
          {tab === 'all' && (
            <input value={search} onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && load(1)}
              placeholder="Search…" className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs w-40 focus:outline-none focus:border-orange-400" />
          )}
          <button onClick={() => load(1)} className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
            <FiRefreshCw className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      } />

      {/* Tabs */}
      <div className="px-6 pt-4 flex gap-1 border-b border-gray-200 bg-white">
        {([['all','All Locations'],['pending','Pending Verification']] as const).map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-xs font-bold border-b-2 transition ${tab === t ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-400 hover:text-gray-700'}`}>
            {label}
          </button>
        ))}
      </div>

      <div className="p-6">
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <DataTable loading={loading} data={data} keyField="location_id" emptyMsg="No locations found"
            columns={[
              { key: 'cover', label: '', width: 'w-12', render: r => r.cover_photo
                ? <img src={r.cover_photo} alt="" className="w-8 h-8 rounded-lg object-cover" />
                : <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center text-teal-500 text-xs font-black">L</div>
              },
              { key: 'name', label: 'Name', render: r => (
                <div>
                  <span className="font-bold text-gray-900">{r.name}</span>
                  {r.owner_name && <p className="text-[10px] text-gray-400">{r.owner_name}</p>}
                </div>
              )},
              { key: 'location_type', label: 'Type', render: r => r.location_type?.replace(/_/g,' ') || '—' },
              { key: 'city', label: 'City' },
              { key: 'daily_rate', label: 'Rate/Day', render: r => r.daily_rate?.amount
                ? `${Number(r.daily_rate.amount).toLocaleString()} ${r.daily_rate.currency || 'ETB'}` : '—'
              },
              { key: 'availability_status', label: 'Available', render: r => (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${r.availability_status === 'available' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {r.availability_status || 'unknown'}
                </span>
              )},
              { key: 'verified_badge', label: 'Verified', render: r => r.verified_badge
                ? <span className="flex items-center gap-1 text-[10px] font-bold text-blue-600"><FiShield className="w-3.5 h-3.5" /> Verified</span>
                : <span className="text-[10px] text-gray-400">—</span>
              },
              { key: 'actions', label: '', render: r => (
                <div className="flex gap-1.5">
                  {(tab === 'pending' || r.verification_status === 'pending') && (
                    <button onClick={() => { setVerifyModal({ id: r.location_id, name: r.name }); setVerifyNotes('') }}
                      className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition" title="Verify">
                      <FiShield className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <a href={`https://cast.besewonline.com/casting/locations/${r.location_id}`} target="_blank" rel="noopener"
                    className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition inline-flex">
                    <FiExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <button onClick={() => handleDelete(r.location_id, r.name)}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition">
                    <FiTrash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )},
            ]}
          />
          <Pagination page={page} pages={pages} total={total} onChange={p => load(p)} />
        </div>
      </div>

      {/* Verification Modal */}
      {verifyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <FiShield className="w-5 h-5 text-blue-500" />
              <div>
                <h3 className="font-black text-gray-900 text-sm">Verify Location</h3>
                <p className="text-[11px] text-gray-400">{verifyModal.name}</p>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Notes (optional)</label>
              <textarea value={verifyNotes} onChange={e => setVerifyNotes(e.target.value)} rows={3}
                placeholder="e.g. Payment received, inspection done"
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-orange-400 resize-none" />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setVerifyModal(null)}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 transition">
                Cancel
              </button>
              <button onClick={() => handleVerify('rejected')} disabled={verifying}
                className="flex items-center gap-1 px-4 py-2 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-bold hover:bg-red-100 transition disabled:opacity-50">
                <FiX className="w-3.5 h-3.5" /> Reject
              </button>
              <button onClick={() => handleVerify('verified')} disabled={verifying}
                className="flex items-center gap-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl text-xs font-bold transition disabled:opacity-50">
                <FiCheck className="w-3.5 h-3.5" /> Verify
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
