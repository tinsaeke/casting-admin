import { useEffect, useState } from 'react'
import { adminAPI } from '@/config/api'
import PageHeader from '@/components/common/PageHeader'
import DataTable from '@/components/common/DataTable'
import Pagination from '@/components/common/Pagination'
import { FiRefreshCw, FiCheck, FiX } from 'react-icons/fi'

export default function TrustPage() {
  const [tab, setTab]           = useState<'reports' | 'subscriptions'>('reports')
  const [reports, setReports]   = useState<any[]>([])
  const [subs, setSubs]         = useState<any[]>([])
  const [loading, setLoading]   = useState(true)
  const [page, setPage]         = useState(1)
  const [total, setTotal]       = useState(0)
  const [pages, setPages]       = useState(1)

  const loadReports = async () => {
    setLoading(true)
    try {
      const res = await adminAPI.reports()
      const list = res.data || (Array.isArray(res) ? res : [])
      setReports(list)
      setTotal(res.pagination?.total ?? list.length)
      setPages(res.pagination?.pages ?? 1)
    } catch {}
    setLoading(false)
  }

  const loadSubs = async () => {
    setLoading(true)
    try {
      const res = await adminAPI.subscriptions()
      const list = res.data || (Array.isArray(res) ? res : [])
      setSubs(list)
      setTotal(res.pagination?.total ?? list.length)
      setPages(res.pagination?.pages ?? 1)
    } catch {}
    setLoading(false)
  }

  useEffect(() => { tab === 'reports' ? loadReports() : loadSubs() }, [tab])

  const handleReport = async (id: string, status: string) => {
    // account-service PATCH
    try {
      await fetch(`https://account.besewonline.com/account-report/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('admin_token') || ''}` },
        body: JSON.stringify({ status }),
      })
      loadReports()
    } catch {}
  }

  return (
    <div>
      <PageHeader title="Trust & Reports" subtitle="Platform moderation" actions={
        <button onClick={() => tab === 'reports' ? loadReports() : loadSubs()}
          className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
          <FiRefreshCw className="w-4 h-4 text-gray-400" />
        </button>
      } />

      <div className="px-6 pt-4 flex gap-1 border-b border-gray-200 bg-white">
        {(['reports', 'subscriptions'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-xs font-bold border-b-2 transition capitalize ${tab === t ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-400 hover:text-gray-700'}`}>
            {t}
          </button>
        ))}
      </div>

      <div className="p-6">
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          {tab === 'reports' ? (
            <DataTable loading={loading} data={reports} keyField="_id" emptyMsg="No reports"
              columns={[
                { key: 'reported_account_id', label: 'Reported', render: r => <span className="font-mono text-[10px]">{r.reported_account_id}</span> },
                { key: 'reported_by', label: 'By', render: r => <span className="font-mono text-[10px]">{r.reported_by}</span> },
                { key: 'reason', label: 'Reason', render: r => r.reason || '—' },
                { key: 'status', label: 'Status', render: r => (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${r.status === 'resolved' ? 'bg-green-100 text-green-700' : r.status === 'dismissed' ? 'bg-gray-100 text-gray-500' : 'bg-red-100 text-red-600'}`}>
                    {r.status || 'pending'}
                  </span>
                )},
                { key: 'created_at', label: 'Date', render: r => r.created_at ? new Date(r.created_at).toLocaleDateString() : '—' },
                { key: 'actions', label: '', render: r => (
                  <div className="flex gap-1.5">
                    <button onClick={() => handleReport(r._id, 'resolved')}
                      className="p-1.5 text-green-500 hover:bg-green-50 rounded-lg transition" title="Resolve">
                      <FiCheck className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleReport(r._id, 'dismissed')}
                      className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg transition" title="Dismiss">
                      <FiX className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )},
              ]}
            />
          ) : (
            <DataTable loading={loading} data={subs} keyField="_id" emptyMsg="No subscriptions"
              columns={[
                { key: 'user_id', label: 'User', render: r => <span className="font-mono text-[10px]">{r.user_id || r.party_id}</span> },
                { key: 'type', label: 'Plan', render: r => (
                  <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-[10px] font-bold uppercase">{r.type || r.plan}</span>
                )},
                { key: 'status', label: 'Status', render: r => (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${r.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {r.status}
                  </span>
                )},
                { key: 'expires_at', label: 'Expires', render: r => r.expires_at ? new Date(r.expires_at).toLocaleDateString() : '—' },
              ]}
            />
          )}
          <Pagination page={page} pages={pages} total={total} onChange={() => {}} />
        </div>
      </div>
    </div>
  )
}
