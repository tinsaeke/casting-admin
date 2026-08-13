import { useEffect, useState } from 'react'
import { adminAPI } from '@/config/api'
import PageHeader from '@/components/common/PageHeader'
import DataTable from '@/components/common/DataTable'
import Pagination from '@/components/common/Pagination'
import { FiRefreshCw, FiExternalLink, FiTrash2, FiGlobe, FiEyeOff } from 'react-icons/fi'

const STATUS_CLS: Record<string, string> = {
  open:   'bg-green-100 text-green-700',
  draft:  'bg-yellow-100 text-yellow-700',
  closed: 'bg-gray-100 text-gray-500',
}
const STATUS_LIST = ['', 'open', 'draft', 'closed']

export default function CastCallsPage() {
  const [data, setData]       = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage]       = useState(1)
  const [total, setTotal]     = useState(0)
  const [pages, setPages]     = useState(1)
  const [search, setSearch]   = useState('')
  const [status, setStatus]   = useState('')

  const load = async (p = 1) => {
    setLoading(true)
    try {
      const res = await adminAPI.castCalls(p, status || undefined, search || undefined)
      setData(res.data || [])
      setTotal(res.pagination?.total ?? res.total ?? 0)
      setPages(res.pagination?.pages ?? 1)
      setPage(p)
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [status])

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"?`)) return
    await adminAPI.deleteCastCall(id)
    load(page)
  }

  const handleSetStatus = async (id: string, newStatus: string) => {
    await adminAPI.setCastCallStatus(id, newStatus)
    load(page)
  }

  return (
    <div>
      <PageHeader title="Cast Calls" subtitle={`${total} total`} actions={
        <div className="flex gap-2">
          <select value={status} onChange={e => setStatus(e.target.value)}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-orange-400">
            <option value="">All status</option>
            {['open','draft','closed'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <input value={search} onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && load(1)}
            placeholder="Search title…" className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs w-40 focus:outline-none focus:border-orange-400" />
          <button onClick={() => load(1)} className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
            <FiRefreshCw className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      } />
      <div className="p-6">
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <DataTable loading={loading} data={data} keyField="_id" emptyMsg="No cast calls found"
            columns={[
              { key: 'title', label: 'Title', render: r => <span className="font-bold text-gray-900">{r.title}</span> },
              { key: 'status', label: 'Status', render: r => (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${STATUS_CLS[r.status] || STATUS_CLS.draft}`}>{r.status}</span>
              )},
              { key: 'location', label: 'Location' },
              { key: 'roles', label: 'Roles', render: r => r.roles?.length ?? 0 },
              { key: 'deadline', label: 'Deadline', render: r => r.deadline ? new Date(r.deadline).toLocaleDateString() : '—' },
              { key: 'created_at', label: 'Created', render: r => r.created_at ? new Date(r.created_at).toLocaleDateString() : '—' },
              { key: 'actions', label: '', render: r => {
                const id = r.casting_call_id || r._id
                return (
                  <div className="flex items-center gap-1.5">
                    <a href={`https://cast.besewonline.com/casting/calls/${id}`} target="_blank" rel="noopener"
                      className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition" title="View on site">
                      <FiExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <button onClick={() => handleSetStatus(id, r.status === 'open' ? 'closed' : 'open')}
                      className={`p-1.5 rounded-lg transition ${r.status === 'open' ? 'text-amber-500 hover:bg-amber-50' : 'text-green-500 hover:bg-green-50'}`}
                      title={r.status === 'open' ? 'Close' : 'Open'}>
                      {r.status === 'open' ? <FiEyeOff className="w-3.5 h-3.5" /> : <FiGlobe className="w-3.5 h-3.5" />}
                    </button>
                    <button onClick={() => handleDelete(id, r.title)}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition" title="Delete">
                      <FiTrash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )
              }},
            ]}
          />
          <Pagination page={page} pages={pages} total={total} onChange={p => load(p)} />
        </div>
      </div>
    </div>
  )
}
