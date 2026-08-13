import { useEffect, useState } from 'react'
import { adminAPI } from '@/config/api'
import PageHeader from '@/components/common/PageHeader'
import DataTable from '@/components/common/DataTable'
import Pagination from '@/components/common/Pagination'
import { FiRefreshCw, FiTrash2 } from 'react-icons/fi'

type TabType = 'agencies' | 'requests'

const REQ_BADGE: Record<string, string> = {
  pending:   'bg-yellow-100 text-yellow-700',
  accepted:  'bg-green-100 text-green-700',
  declined:  'bg-red-100 text-red-600',
  withdrawn: 'bg-gray-100 text-gray-500',
}

export default function AgenciesPage() {
  const [tab, setTab]             = useState<TabType>('agencies')
  const [data, setData]           = useState<any[]>([])
  const [loading, setLoading]     = useState(true)
  const [page, setPage]           = useState(1)
  const [total, setTotal]         = useState(0)
  const [pages, setPages]         = useState(1)
  const [reqStatus, setReqStatus] = useState('pending')

  const load = async (p = 1) => {
    setLoading(true)
    try {
      const res = tab === 'agencies'
        ? await adminAPI.agencies(p)
        : await adminAPI.joinRequests(p, reqStatus || undefined)
      setData(res.data || [])
      setTotal(res.pagination?.total ?? res.total ?? 0)
      setPages(res.pagination?.pages ?? 1)
      setPage(p)
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [tab, reqStatus])

  return (
    <div>
      <PageHeader title="Agencies" subtitle={`${total} records`} actions={
        <button onClick={() => load(1)} className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
          <FiRefreshCw className="w-4 h-4 text-gray-400" />
        </button>
      } />

      <div className="px-6 pt-4 flex gap-1 border-b border-gray-200 bg-white">
        {([['agencies','Agencies'],['requests','Join Requests']] as const).map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-xs font-bold border-b-2 transition ${tab === t ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-400 hover:text-gray-700'}`}>
            {label}
          </button>
        ))}
      </div>

      <div className="p-6">
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          {tab === 'agencies' ? (
            <DataTable loading={loading} data={data} keyField="agency_id" emptyMsg="No agencies"
              columns={[
                { key: 'logo', label: '', width: 'w-12', render: r => r.logo || r.photo
                  ? <img src={r.logo || r.photo} alt="" className="w-8 h-8 rounded-lg object-cover" />
                  : <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-500 text-xs font-black">{(r.name||r.company_name||'A')[0]}</div>
                },
                { key: 'name', label: 'Agency', render: r => (
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold">{r.name || r.company_name || '—'}</span>
                      {r.company_verification === 'VERIFIED' && (
                        <span className="text-[9px] px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-full font-bold">✓ Verified</span>
                      )}
                      {r.company_verification === 'PENDING' && (
                        <span className="text-[9px] px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded-full font-bold">Pending</span>
                      )}
                    </div>
                    {r.city && <p className="text-[10px] text-gray-400">{r.city}</p>}
                    {r.registered_date && (
                      <p className="text-[9px] text-gray-300">
                        Active {Math.floor((Date.now() - new Date(r.registered_date).getTime()) / 86400000)}d
                      </p>
                    )}
                  </div>
                )},
                { key: 'contact_phone', label: 'Phone', render: r => r.contact_phone || '—' },
                { key: 'roster_count', label: 'Roster', render: r => (
                  <div className="text-center">
                    <span className="font-bold text-gray-900">{r.roster_count ?? 0}</span>
                    {r.active_count != null && (
                      <span className="ml-1 text-[10px] text-green-600">({r.active_count} active)</span>
                    )}
                  </div>
                )},
                { key: 'cast_calls_count', label: 'Cast Calls', render: r => (
                  <span className="font-semibold text-gray-700">{r.cast_calls_count ?? 0}</span>
                )},
                { key: 'auditions_count', label: 'Auditions', render: r => (
                  <span className="font-semibold text-gray-700">{r.auditions_count ?? 0}</span>
                )},
                { key: 'trust_score', label: 'Trust', render: r => r.trust_score != null ? (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    r.trust_score >= 80 ? 'bg-green-100 text-green-700'
                    : r.trust_score >= 50 ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-red-100 text-red-600'
                  }`}>{r.trust_score}</span>
                ) : <span className="text-gray-300 text-[10px]">—</span> },
              ]}
            />
          ) : (
            <>
              <div className="px-4 py-2 border-b border-gray-100 flex gap-2">
                <select value={reqStatus} onChange={e => setReqStatus(e.target.value)}
                  className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-orange-400">
                  {['pending','accepted','declined','withdrawn'].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <DataTable loading={loading} data={data} keyField="request_id" emptyMsg="No join requests"
                columns={[
                  { key: 'talent_name', label: 'Talent', render: r => <span className="font-bold">{r.talent_name || r.talent_id || '—'}</span> },
                  { key: 'agency_name', label: 'Agency', render: r => r.agency_name || r.agency_id || '—' },
                  { key: 'status', label: 'Status', render: r => (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${REQ_BADGE[r.status] || REQ_BADGE.pending}`}>
                      {r.status}
                    </span>
                  )},
                  { key: 'message', label: 'Message', render: r => (
                    <span className="text-[11px] text-gray-500 truncate max-w-[160px] block">{r.message || '—'}</span>
                  )},
                  { key: 'response_message', label: 'Response', render: r => (
                    <span className="text-[11px] text-gray-500 truncate max-w-[160px] block">{r.response_message || '—'}</span>
                  )},
                  { key: 'created_at', label: 'Date', render: r => r.created_at ? new Date(r.created_at).toLocaleDateString() : '—' },
                  { key: 'actions', label: '', render: r => (
                    <button onClick={async () => {
                      if (!confirm(`Delete join request from "${r.talent_name}"?`)) return
                      try { await adminAPI.deleteJoinRequest(r.request_id || r._id); load(1) } catch (e: any) { alert(e.message) }
                    }} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition" title="Delete">
                      <FiTrash2 className="w-3.5 h-3.5" />
                    </button>
                  )},
                ]}
              />
            </>
          )}
          <Pagination page={page} pages={pages} total={total} onChange={p => load(p)} />
        </div>
      </div>
    </div>
  )
}
