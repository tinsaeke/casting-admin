import { useEffect, useState } from 'react'
import { adminAPI } from '@/config/api'
import PageHeader from '@/components/common/PageHeader'
import DataTable from '@/components/common/DataTable'
import Pagination from '@/components/common/Pagination'
import { FiRefreshCw, FiExternalLink, FiTrash2 } from 'react-icons/fi'

const STATUS_CLS: Record<string, string> = {
  draft: 'bg-yellow-100 text-yellow-700',
  active: 'bg-green-100 text-green-700',
  completed: 'bg-blue-100 text-blue-700',
  archived: 'bg-gray-100 text-gray-500',
}

export default function ProductionsPage() {
  const [data, setData]       = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage]       = useState(1)
  const [total, setTotal]     = useState(0)
  const [pages, setPages]     = useState(1)
  const [search, setSearch]   = useState('')

  const load = async (p = 1) => {
    setLoading(true)
    try {
      const res = await adminAPI.productions(p, search || undefined)
      setData(res.data || [])
      setTotal(res.pagination?.total ?? res.total ?? 0)
      setPages(res.pagination?.pages ?? 1)
      setPage(p)
    } catch {}
    setLoading(false)
  }

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete production "${title}"? This cannot be undone.`)) return
    try { await adminAPI.deleteProduction(id); load(page) } catch (e: any) { alert(e.message) }
  }

  useEffect(() => { load() }, [])

  return (
    <div>
      <PageHeader title="Productions" subtitle={`${total} projects`} actions={
        <div className="flex gap-2">
          <input value={search} onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && load(1)}
            placeholder="Search…" className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs w-40 focus:outline-none focus:border-orange-400" />
          <button onClick={() => load(1)} className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
            <FiRefreshCw className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      } />
      <div className="p-6">
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <DataTable loading={loading} data={data} keyField="project_id" emptyMsg="No productions found"
            columns={[
              { key: 'title', label: 'Title', render: r => <span className="font-bold">{r.title}</span> },
              { key: 'production_type', label: 'Type', render: r => r.production_type?.replace(/_/g,' ') || '—' },
              { key: 'status', label: 'Status', render: r => (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${STATUS_CLS[r.status] || STATUS_CLS.draft}`}>{r.status}</span>
              )},
              { key: 'city', label: 'City' },
              { key: 'budget_level', label: 'Budget' },
              { key: 'casting_calls_count', label: 'Cast Calls', render: r => r.casting_calls_count ?? '—' },
              { key: 'created_at', label: 'Created', render: r => r.created_at ? new Date(r.created_at).toLocaleDateString() : '—' },
              { key: 'actions', label: '', render: r => (
                <div className="flex gap-1">
                  <a href={`https://cast.besewonline.com/casting/productions/${r.project_id}`} target="_blank" rel="noopener"
                    className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition inline-flex">
                    <FiExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <button onClick={() => handleDelete(r.project_id || r._id, r.title)}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition" title="Delete">
                    <FiTrash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )},
            ]}
          />
          <Pagination page={page} pages={pages} total={total} onChange={p => load(p)} />
        </div>
      </div>
    </div>
  )
}
