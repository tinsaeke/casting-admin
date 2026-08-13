import { useEffect, useState } from 'react'
import { adminAPI } from '@/config/api'
import PageHeader from '@/components/common/PageHeader'
import DataTable from '@/components/common/DataTable'
import Pagination from '@/components/common/Pagination'
import { FiRefreshCw, FiTrash2 } from 'react-icons/fi'

const BADGE: Record<string, string> = {
  submitted:   'bg-blue-100 text-blue-700',
  reviewed:    'bg-yellow-100 text-yellow-700',
  shortlisted: 'bg-green-100 text-green-700',
  callback:    'bg-purple-100 text-purple-700',
  booked:      'bg-teal-100 text-teal-700',
  rejected:    'bg-red-100 text-red-600',
}

export default function AuditionsPage() {
  const [data, setData]       = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage]       = useState(1)
  const [total, setTotal]     = useState(0)
  const [pages, setPages]     = useState(1)
  const [status, setStatus]   = useState('')

  const load = async (p = 1) => {
    setLoading(true)
    try {
      const res = await adminAPI.auditions(p, status || undefined)
      setData(res.data || [])
      setTotal(res.pagination?.total ?? res.total ?? 0)
      setPages(res.pagination?.pages ?? 1)
      setPage(p)
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [status])

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete audition by "${name}"?`)) return
    try { await adminAPI.deleteAudition(id); load(page) } catch (e: any) { alert(e.message) }
  }

  return (
    <div>
      <PageHeader title="Auditions" subtitle={`${total} submissions`} actions={
        <div className="flex gap-2">
          <select value={status} onChange={e => setStatus(e.target.value)}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-orange-400">
            <option value="">All status</option>
            {['submitted','reviewed','shortlisted','callback','booked','rejected'].map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <button onClick={() => load(1)} className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
            <FiRefreshCw className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      } />
      <div className="p-6">
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <DataTable loading={loading} data={data} keyField="audition_id" emptyMsg="No auditions"
            columns={[
              { key: 'talent_name', label: 'Talent', render: r => <span className="font-bold">{r.talent_name || '—'}</span> },
              { key: 'casting_call_title', label: 'Cast Call', render: r => r.casting_call_title || '—' },
              { key: 'role_name', label: 'Role', render: r => r.role_name || '—' },
              { key: 'status', label: 'Status', render: r => (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${BADGE[r.status] || BADGE.submitted}`}>
                  {r.status}
                </span>
              )},
              { key: 'media_count', label: 'Media', render: r => r.media_count ?? 0 },
              { key: 'submitted_at', label: 'Submitted', render: r => r.submitted_at ? new Date(r.submitted_at).toLocaleDateString() : '—' },
              { key: 'actions', label: '', render: r => (
                <button onClick={() => handleDelete(r.audition_id || r._id, r.talent_name || r.audition_id)}
                  className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition" title="Delete">
                  <FiTrash2 className="w-3.5 h-3.5" />
                </button>
              )},
            ]}
          />
          <Pagination page={page} pages={pages} total={total} onChange={p => load(p)} />
        </div>
      </div>
    </div>
  )
}
