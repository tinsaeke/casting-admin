import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminAPI } from '@/config/api'
import PageHeader from '@/components/common/PageHeader'
import DataTable from '@/components/common/DataTable'
import Pagination from '@/components/common/Pagination'
import { FiRefreshCw, FiEdit2, FiCheck, FiX, FiTrash2, FiCreditCard, FiUserCheck } from 'react-icons/fi'
import PartyWallet from '@/components/common/PartyWallet'

const ROLES = ['cast_agency','talent','production_crew','content_creator',
               'aggregator_scout','production_studio','location_scout','academy','casting_admin']

const ROLE_BADGE: Record<string, string> = {
  cast_agency:       'bg-orange-100 text-orange-700 border-orange-200',
  talent:            'bg-blue-100 text-blue-700 border-blue-200',
  production_crew:   'bg-green-100 text-green-700 border-green-200',
  content_creator:   'bg-pink-100 text-pink-700 border-pink-200',
  aggregator_scout:  'bg-cyan-100 text-cyan-700 border-cyan-200',
  production_studio: 'bg-purple-100 text-purple-700 border-purple-200',
  location_scout:    'bg-teal-100 text-teal-700 border-teal-200',
  academy:           'bg-indigo-100 text-indigo-700 border-indigo-200',
  casting_admin:     'bg-red-100 text-red-700 border-red-200',
}

export default function UsersPage() {
  const navigate = useNavigate()
  const [allData, setAllData]       = useState<any[]>([])
  const [summary, setSummary]       = useState<Record<string, number>>({})
  const [loading, setLoading]       = useState(true)
  const [filterRole, setFilterRole] = useState('')
  const [search, setSearch]         = useState('')
  const [page, setPage]             = useState(1)
  const PAGE_SIZE = 20

  // edit role
  const [editRow, setEditRow]   = useState<any | null>(null)
  const [newRole, setNewRole]   = useState('')
  const [saving, setSaving]     = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await adminAPI.castingRoles()
      setAllData(res.data || [])
      setSummary(res.summary || {})
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  // client-side filter + paginate
  const filtered = allData.filter(u => {
    const matchRole = !filterRole || u.casting_role === filterRole
    const q = search.toLowerCase()
    const matchSearch = !q ||
      (u.name || '').toLowerCase().includes(q) ||
      (u.phone_number || '').includes(q) ||
      (u.party_id || '').toLowerCase().includes(q)
    return matchRole && matchSearch
  })
  const total  = filtered.length
  const pages  = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const paged  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const [deleteResult, setDeleteResult] = useState<any | null>(null)
  const [walletPartyId, setWalletPartyId] = useState<string | null>(null)

  const handleDeleteUser = async (partyId: string, name: string) => {
    if (!confirm(`⚠️ Delete ALL data for "${name}" (${partyId})?\n\nThis will permanently delete:\n• All talent profiles\n• Agency roster entries\n• Join requests\n• Invitations\n• Party profile\n\nThis CANNOT be undone.`)) return
    try {
      const result = await adminAPI.deleteUser(partyId)
      setDeleteResult(result.deleted || result)
      setAllData(prev => prev.filter(u => u.party_id !== partyId))
    } catch (e: any) { alert(e.message || 'Delete failed') }
  }

  const handleAssignRole = async () => {
    if (!editRow || !newRole) return
    setSaving(true)
    try {
      await adminAPI.assignCastingRole(editRow.party_id, newRole)
      setAllData(prev => prev.map(u => u.party_id === editRow.party_id ? { ...u, casting_role: newRole } : u))
      setEditRow(null); setNewRole('')
    } catch {}
    setSaving(false)
  }

  return (
    <div>
      <PageHeader title="Users" subtitle={`${total} accounts`} actions={
        <div className="flex gap-2 flex-wrap items-center">
          <button
            onClick={() => navigate('/role-requests')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-700 rounded-lg text-xs font-bold transition shadow-2xs"
            title="Review Role Change Requests"
          >
            <FiUserCheck className="w-3.5 h-3.5" />
            <span>Role Requests</span>
          </button>
          <select value={filterRole} onChange={e => { setFilterRole(e.target.value); setPage(1) }}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-orange-400">
            <option value="">All roles ({allData.length})</option>
            {ROLES.map(r => (
              <option key={r} value={r}>{r.replace(/_/g,' ')} ({summary[r] ?? 0})</option>
            ))}
          </select>
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search name / phone / ID…"
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs w-48 focus:outline-none focus:border-orange-400" />
          <button onClick={load} disabled={loading}
            className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition disabled:opacity-40">
            <FiRefreshCw className={`w-4 h-4 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      } />

      {/* Role summary chips */}
      <div className="px-6 py-3 flex flex-wrap gap-2 border-b border-gray-100 bg-white">
        {ROLES.filter(r => (summary[r] ?? 0) > 0).map(r => (
          <button key={r} onClick={() => { setFilterRole(filterRole === r ? '' : r); setPage(1) }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold transition ${
              filterRole === r ? ROLE_BADGE[r] : 'border-gray-200 text-gray-500 hover:border-gray-400'
            }`}>
            {r.replace(/_/g,' ')}
            <span className="font-black">{summary[r]}</span>
          </button>
        ))}
      </div>

      <div className="p-6 space-y-4">
        {/* Assign role panel */}
        {editRow && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 flex items-center gap-3 flex-wrap">
            <div className="text-xs font-bold text-orange-700 min-w-0">
              Change role for <span className="font-black">{editRow.name || editRow.party_id}</span>
              <span className="ml-2 font-mono text-[10px] text-orange-500">{editRow.party_id}</span>
            </div>
            <select value={newRole} onChange={e => setNewRole(e.target.value)}
              className="px-3 py-1.5 border border-orange-300 rounded-lg text-xs focus:outline-none bg-white">
              <option value="">Select role…</option>
              {ROLES.map(r => <option key={r} value={r}>{r.replace(/_/g,' ')}</option>)}
            </select>
            <button onClick={handleAssignRole} disabled={saving || !newRole}
              className="flex items-center gap-1 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition">
              <FiCheck className="w-3.5 h-3.5" /> Apply
            </button>
            <button onClick={() => { setEditRow(null); setNewRole('') }}
              className="p-1.5 text-gray-400 hover:text-gray-600 transition">
              <FiX className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <DataTable loading={loading} data={paged} keyField="party_id" emptyMsg="No users found"
            columns={[
              { key: 'name', label: 'Name', render: r => (
                <div>
                  <span className="font-bold">{[r.name, r.last_name].filter(Boolean).join(' ') || '—'}</span>
                  <p className="text-[10px] font-mono text-gray-400">{r.party_id}</p>
                </div>
              )},
              { key: 'phone_number', label: 'Phone', render: r => r.phone_number || '—' },
              { key: 'casting_role', label: 'Casting Role', render: r => r.casting_role ? (
                <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold capitalize ${ROLE_BADGE[r.casting_role] || 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                  {r.casting_role.replace(/_/g,' ')}
                </span>
              ) : <span className="text-[10px] text-gray-400">none</span>
              },
              { key: 'category', label: 'Category', render: r => (
                <span className="text-[10px] text-gray-500 capitalize">{r.category?.replace(/_/g,' ') || '—'}</span>
              )},
              { key: 'status', label: 'Status', render: r => (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${r.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {r.status || '—'}
                </span>
              )},
              { key: 'added_date', label: 'Joined', render: r => r.added_date ? new Date(r.added_date).toLocaleDateString() : '—' },
              { key: 'actions', label: '', render: r => (
                <div className="flex gap-1">
                  <button onClick={() => { setEditRow(r); setNewRole(r.casting_role || '') }}
                    className="p-1.5 text-orange-400 hover:bg-orange-50 rounded-lg transition" title="Change role">
                    <FiEdit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setWalletPartyId(r.party_id)}
                    className="p-1.5 text-green-500 hover:bg-green-50 rounded-lg transition" title="View wallet">
                    <FiCreditCard className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDeleteUser(r.party_id, [r.name, r.last_name].filter(Boolean).join(' ') || r.party_id)}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition" title="Delete all user data">
                    <FiTrash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )},
            ]}
          />
          <Pagination page={page} pages={pages} total={total} onChange={p => setPage(p)} />
        </div>
      </div>

      {/* Delete result summary modal */}
      {deleteResult && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                <FiCheck className="w-4 h-4 text-green-600" />
              </div>
              <h3 className="font-black text-gray-900">User Deleted</h3>
            </div>
            <div className="space-y-1.5 text-xs text-gray-600">
              <p className="font-mono text-[10px] text-gray-400">{deleteResult.party_id}</p>
              {[
                ['Talent profiles', deleteResult.talent_profiles_deleted],
                ['Roster entries', deleteResult.roster_entries_deleted],
                ['Join requests', deleteResult.join_requests_deleted],
                ['Invitations', deleteResult.invitations_deleted],
              ].map(([label, count]) => (
                <div key={label as string} className="flex justify-between">
                  <span>{label as string}</span>
                  <span className="font-bold">{count ?? 0} deleted</span>
                </div>
              ))}
              <div className="flex justify-between">
                <span>Party profile</span>
                <span className={`font-bold ${deleteResult.party_profile_deleted ? 'text-green-600' : 'text-gray-400'}`}>
                  {deleteResult.party_profile_deleted ? 'Deleted' : 'Not found'}
                </span>
              </div>
            </div>
            <button onClick={() => setDeleteResult(null)}
              className="w-full py-2 bg-gray-900 text-white rounded-xl text-xs font-black hover:bg-gray-700 transition">
              Close
            </button>
          </div>
        </div>
      )}
      {/* Wallet modal */}
      {walletPartyId && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-3xl my-6 shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h3 className="font-black text-gray-900">Wallet</h3>
                <p className="text-[10px] font-mono text-gray-400 mt-0.5">{walletPartyId}</p>
              </div>
              <button onClick={() => setWalletPartyId(null)} className="p-1.5 hover:bg-gray-100 rounded-lg transition">
                <FiX className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            <div className="p-6">
              <PartyWallet partyId={walletPartyId} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
