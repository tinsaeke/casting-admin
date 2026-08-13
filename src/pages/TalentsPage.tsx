import { useEffect, useState } from 'react'
import { adminAPI } from '@/config/api'
import PageHeader from '@/components/common/PageHeader'
import DataTable from '@/components/common/DataTable'
import Pagination from '@/components/common/Pagination'
import { FiRefreshCw, FiTrash2, FiEye, FiEyeOff } from 'react-icons/fi'

export default function TalentsPage() {
  const [data, setData]         = useState<any[]>([])
  const [loading, setLoading]   = useState(true)
  const [page, setPage]         = useState(1)
  const [total, setTotal]       = useState(0)
  const [pages, setPages]       = useState(1)
  const [search, setSearch]     = useState('')
  const [visibility, setVis]    = useState('')

  const load = async (p = 1) => {
    setLoading(true)
    try {
      const res = await adminAPI.talents(p, search || undefined, visibility || undefined)
      setData(res.data || [])
      setTotal(res.pagination?.total ?? res.total ?? 0)
      setPages(res.pagination?.pages ?? 1)
      setPage(p)
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [visibility])

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete talent profile for "${name}"?`)) return
    await adminAPI.deleteTalent(id)
    load(page)
  }

  const handleVisibility = async (id: string, current: string) => {
    const next = current === 'public' ? 'private' : 'public'
    await adminAPI.setTalentVisibility(id, next)
    load(page)
  }

  return (
    <div>
      <PageHeader title="Talents" subtitle={`${total} profiles`} actions={
        <div className="flex gap-2">
          <select value={visibility} onChange={e => setVis(e.target.value)}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-orange-400">
            <option value="">All visibility</option>
            <option value="public">Public</option>
            <option value="private">Private</option>
          </select>
          <input value={search} onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && load(1)}
            placeholder="Search name…" className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs w-40 focus:outline-none focus:border-orange-400" />
          <button onClick={() => load(1)} className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
            <FiRefreshCw className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      } />
      <div className="p-6">
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <DataTable loading={loading} data={data} keyField="profile_id" emptyMsg="No talent profiles"
            columns={[
              { key: 'photo', label: '', width: 'w-12', render: r => r.headshot_url
                ? <img src={r.headshot_url} alt="" className="w-8 h-8 rounded-full object-cover border border-gray-200" />
                : <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-500 text-xs font-black">{(r.full_name||'T')[0]}</div>
              },
              { key: 'full_name', label: 'Name', render: r => <span className="font-bold">{r.full_name || '—'}</span> },
              { key: 'gender', label: 'Gender', render: r => r.physical_attributes?.gender || '—' },
              { key: 'city', label: 'City', render: r => r.physical_attributes?.city || '—' },
              { key: 'skills', label: 'Skills', render: r => (r.skills || []).slice(0, 3).join(', ') || '—' },
              { key: 'languages', label: 'Languages', render: r => (r.languages || []).slice(0, 2).join(', ') || '—' },
              { key: 'cast_calls_applied', label: 'Applied', render: r => (
                <span className="font-semibold text-gray-700">{r.cast_calls_applied ?? r.auditions_count ?? 0}</span>
              )},
              { key: 'trust_score', label: 'Trust', render: r => r.trust_score != null ? (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  r.trust_score >= 80 ? 'bg-green-100 text-green-700'
                  : r.trust_score >= 50 ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-red-100 text-red-600'
                }`}>{r.trust_score}</span>
              ) : <span className="text-gray-300 text-[10px]">—</span> },
              { key: 'visibility', label: 'Visibility', render: r => (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${r.visibility === 'public' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {r.visibility || 'public'}
                </span>
              )},
              { key: 'actions', label: '', render: r => {
                const id = r.profile_id || r._id
                return (
                  <div className="flex gap-1.5">
                    <button onClick={() => handleVisibility(id, r.visibility || 'public')}
                      className={`p-1.5 rounded-lg transition ${r.visibility === 'public' ? 'text-amber-500 hover:bg-amber-50' : 'text-green-500 hover:bg-green-50'}`}
                      title={r.visibility === 'public' ? 'Set Private' : 'Set Public'}>
                      {r.visibility === 'public' ? <FiEyeOff className="w-3.5 h-3.5" /> : <FiEye className="w-3.5 h-3.5" />}
                    </button>
                    <button onClick={() => handleDelete(id, r.full_name || id)}
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
