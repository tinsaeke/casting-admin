import { useEffect, useState } from 'react'
import { adminAPI } from '@/config/api'
import PageHeader from '@/components/common/PageHeader'
import DataTable from '@/components/common/DataTable'
import Pagination from '@/components/common/Pagination'
import {
  FiRefreshCw, FiCpu, FiUser, FiCheckCircle, FiClock,
  FiAlertCircle, FiEye, FiX, FiDollarSign, FiCalendar, FiTag, FiExternalLink
} from 'react-icons/fi'

export interface AvatarLicense {
  _id?: string
  license_id: string
  actor_party_id?: string
  talent_profile_id?: string
  talent_name?: string
  talent_avatar?: string
  buyer_party_id?: string
  production_id?: string
  production_title?: string
  customer_name?: string
  customer_email?: string
  customer_phone?: string
  purchased_uses: string[]
  uses_allowed?: number
  uses_remaining: number
  total_uses?: number
  amount_etb: number
  actor_payout_etb?: number
  platform_fee_etb?: number
  actor_rate_snapshot?: number
  platform_rate_snapshot?: number
  status: 'active' | 'pending' | 'pending_payment' | 'completed' | 'exhausted' | 'expired' | string
  checkout_url?: string
  created_at?: string
  createdAt?: string
  updated_at?: string
  updatedAt?: string
  expires_at?: string
}

const STATUS_BADGE: Record<string, string> = {
  active:          'bg-green-100 text-green-700 border-green-200',
  pending:         'bg-yellow-100 text-yellow-800 border-yellow-200',
  pending_payment: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  completed:       'bg-blue-100 text-blue-700 border-blue-200',
  exhausted:       'bg-purple-100 text-purple-700 border-purple-200',
  expired:         'bg-gray-100 text-gray-600 border-gray-200',
}

const USE_LABELS: Record<string, string> = {
  action_scenes:         'Action Scenes',
  stunt_double:          'Stunt Double',
  background_appearance: 'Background Extra',
  crowd_scenes:          'Crowd Scenes',
  de_aging:              'De-Aging',
  digital_double:        'Digital Double',
  commercial:            'Commercial',
  dialogue:              'Spoken Dialogue',
  romantic_scenes:       'Romantic Scenes',
  voice_cloning:         'AI Voice Clone',
}

export default function AvatarLicensesPage() {
  const [licenses, setLicenses] = useState<AvatarLicense[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit] = useState(20)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedLicense, setSelectedLicense] = useState<AvatarLicense | null>(null)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true); setError('')
    try {
      const res = await adminAPI.avatarLicenses({
        status: statusFilter,
        page,
        limit,
      })
      // Backend returns { licenses: [...], total: 7, page: 1, pages: 1 } or { data: [...], total }
      const list: AvatarLicense[] = res?.licenses || res?.data || (Array.isArray(res) ? res : [])
      const totalCount = res?.total ?? (Array.isArray(res) ? res.length : list.length)
      setLicenses(list)
      setTotal(totalCount)
    } catch (e: any) {
      setError(e.message || 'Failed to load avatar licenses')
      setLicenses([])
      setTotal(0)
    }
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [page, statusFilter])

  const filtered = licenses.filter(l => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      l.license_id?.toLowerCase().includes(q) ||
      l.actor_party_id?.toLowerCase().includes(q) ||
      l.buyer_party_id?.toLowerCase().includes(q) ||
      l.talent_name?.toLowerCase().includes(q) ||
      l.customer_name?.toLowerCase().includes(q) ||
      l.production_title?.toLowerCase().includes(q) ||
      l.customer_email?.toLowerCase().includes(q)
    )
  })

  // Quick stats
  const activeCount = licenses.filter(l => l.status === 'active').length
  const totalVolume = licenses.reduce((sum, l) => sum + (Number(l.amount_etb) || 0), 0)

  const columns = [
    {
      header: 'License ID',
      render: (l: AvatarLicense) => {
        const dateStr = l.created_at || l.createdAt
        return (
          <div>
            <span className="font-mono text-xs font-bold text-purple-700 bg-purple-50 border border-purple-200/60 px-2 py-0.5 rounded">
              {l.license_id || l._id || '—'}
            </span>
            <p className="text-[10px] text-gray-400 mt-1">
              {dateStr ? new Date(dateStr).toLocaleDateString() : '—'}
            </p>
          </div>
        )
      },
    },
    {
      header: 'Actor / Talent',
      render: (l: AvatarLicense) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 font-black text-xs flex items-center justify-center overflow-hidden shrink-0 border border-purple-200">
            {l.talent_avatar ? (
              <img src={l.talent_avatar} alt="" className="w-full h-full object-cover" />
            ) : (
              <FiUser className="w-4 h-4" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-gray-900 truncate">{l.talent_name || l.actor_party_id || 'Talent'}</p>
            <p className="text-[10px] text-gray-400 font-mono truncate">
              {l.talent_profile_id ? `${l.talent_profile_id.slice(0, 8)}...` : l.actor_party_id || '—'}
            </p>
          </div>
        </div>
      ),
    },
    {
      header: 'Buyer / Licensee',
      render: (l: AvatarLicense) => (
        <div>
          <p className="text-xs font-bold text-gray-900">{l.customer_name || l.buyer_party_id || 'Buyer'}</p>
          <p className="text-[10px] text-gray-400 truncate">{l.customer_email || l.customer_phone || l.production_title || 'Direct License'}</p>
        </div>
      ),
    },
    {
      header: 'Purchased Uses',
      render: (l: AvatarLicense) => (
        <div className="flex flex-wrap gap-1 max-w-xs">
          {(l.purchased_uses || []).slice(0, 2).map(u => (
            <span key={u} className="text-[10px] font-semibold bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded">
              {USE_LABELS[u] || u}
            </span>
          ))}
          {(l.purchased_uses || []).length > 2 && (
            <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">
              +{l.purchased_uses.length - 2} more
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Uses',
      render: (l: AvatarLicense) => {
        const allowed = l.uses_allowed ?? l.total_uses ?? 1
        return (
          <div className="text-center">
            <span className="text-xs font-black text-gray-900">{l.uses_remaining ?? allowed}</span>
            <span className="text-[10px] text-gray-400"> / {allowed}</span>
          </div>
        )
      },
    },
    {
      header: 'Amount / Split',
      render: (l: AvatarLicense) => {
        const actorAmount = l.actor_payout_etb ?? Math.round(Number(l.amount_etb || 0) * (l.actor_rate_snapshot || 0.7))
        const platformAmount = l.platform_fee_etb ?? Math.round(Number(l.amount_etb || 0) * (l.platform_rate_snapshot || 0.3))
        return (
          <div className="text-right font-mono">
            <span className="text-xs font-black text-gray-900">{Number(l.amount_etb || 0).toLocaleString()} ETB</span>
            <p className="text-[10px] text-gray-400">Actor: {actorAmount} | Fee: {platformAmount}</p>
          </div>
        )
      },
    },
    {
      header: 'Status',
      render: (l: AvatarLicense) => (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${STATUS_BADGE[l.status] || 'bg-gray-100 text-gray-700'}`}>
          {l.status?.replace('_', ' ')}
        </span>
      ),
    },
    {
      header: 'Action',
      render: (l: AvatarLicense) => (
        <button
          onClick={() => setSelectedLicense(l)}
          className="p-1.5 hover:bg-gray-100 text-gray-600 hover:text-purple-600 rounded-lg transition"
          title="Inspect license details"
        >
          <FiEye className="w-4 h-4" />
        </button>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="AI Avatar Likeness Licenses"
        subtitle="Manage talent AI avatar marketplace licensing, usage rights, and platform royalties"
        actions={
          <button
            onClick={load}
            disabled={loading}
            className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition disabled:opacity-40"
            title="Refresh licenses"
          >
            <FiRefreshCw className={`w-4 h-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
          </button>
        }
      />

      <div className="p-6 space-y-6">
        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-lg">
              <FiCpu className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Total Licenses</p>
              <p className="text-xl font-black text-gray-900">{total}</p>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center font-bold text-lg">
              <FiCheckCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Active in Page</p>
              <p className="text-xl font-black text-gray-900">{activeCount}</p>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold text-lg">
              <FiDollarSign className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Volume (Page)</p>
              <p className="text-xl font-black text-gray-900">{totalVolume.toLocaleString()} ETB</p>
            </div>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            {['all', 'pending', 'active', 'completed', 'exhausted', 'expired'].map(st => (
              <button
                key={st}
                onClick={() => { setStatusFilter(st); setPage(1) }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition capitalize whitespace-nowrap ${
                  statusFilter === st
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                {st.replace('_', ' ')}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="w-full md:w-64">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search talent, buyer, ID..."
              className="w-full px-3.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-purple-500 transition"
            />
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
            <FiAlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Data Table */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xs">
          <DataTable
            columns={columns}
            data={filtered}
            loading={loading}
            emptyMessage="No AI avatar licenses found"
          />

          <div className="p-4 border-t border-gray-100">
            <Pagination
              currentPage={page}
              totalPages={Math.ceil(total / limit) || 1}
              onPageChange={setPage}
            />
          </div>
        </div>
      </div>

      {/* Inspect Modal */}
      {selectedLicense && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-gray-200 overflow-hidden animate-scale-up">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FiCpu className="w-4 h-4 text-purple-600" />
                <h3 className="text-sm font-black text-gray-900">License Details</h3>
              </div>
              <button
                onClick={() => setSelectedLicense(null)}
                className="p-1 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-xl border border-purple-100">
                <div className="w-12 h-12 rounded-xl bg-purple-200 text-purple-800 font-bold flex items-center justify-center overflow-hidden shrink-0">
                  {selectedLicense.talent_avatar ? (
                    <img src={selectedLicense.talent_avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <FiUser className="w-6 h-6" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-purple-600 font-bold uppercase tracking-wider">Represented Talent / Actor</p>
                  <p className="text-sm font-black text-gray-900">{selectedLicense.talent_name || selectedLicense.actor_party_id || 'Talent'}</p>
                  <p className="text-[10px] text-gray-500 font-mono">Party: {selectedLicense.actor_party_id || '—'}</p>
                  {selectedLicense.talent_profile_id && (
                    <p className="text-[10px] text-gray-400 font-mono">Profile: {selectedLicense.talent_profile_id}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-[10px] text-gray-400 font-bold uppercase">Buyer / Licensee</span>
                  <p className="font-bold text-gray-900 mt-0.5">{selectedLicense.customer_name || selectedLicense.buyer_party_id || 'Direct Client'}</p>
                  <p className="text-[11px] text-gray-500">{selectedLicense.customer_email || `Party: ${selectedLicense.buyer_party_id || '—'}`}</p>
                  {selectedLicense.customer_phone && <p className="text-[11px] text-gray-500">{selectedLicense.customer_phone}</p>}
                </div>

                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-[10px] text-gray-400 font-bold uppercase">Production Project</span>
                  <p className="font-bold text-gray-900 mt-0.5">{selectedLicense.production_title || 'Direct Licensing'}</p>
                  <p className="text-[10px] text-gray-400 font-mono">{selectedLicense.production_id || '—'}</p>
                </div>
              </div>

              {/* Revenue Split Breakdown */}
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-2 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                  <span className="font-bold text-gray-700">Total License Fee</span>
                  <span className="font-black text-sm text-gray-900">{Number(selectedLicense.amount_etb || 0).toLocaleString()} ETB</span>
                </div>
                <div className="flex items-center justify-between text-gray-600 text-[11px]">
                  <span>
                    Actor Share ({Math.round((selectedLicense.actor_rate_snapshot || 0.7) * 100)}%)
                  </span>
                  <span className="font-bold text-green-700">
                    {Number(selectedLicense.actor_payout_etb ?? (Number(selectedLicense.amount_etb || 0) * (selectedLicense.actor_rate_snapshot || 0.7))).toLocaleString()} ETB
                  </span>
                </div>
                <div className="flex items-center justify-between text-gray-600 text-[11px]">
                  <span>
                    Platform Commission ({Math.round((selectedLicense.platform_rate_snapshot || 0.3) * 100)}%)
                  </span>
                  <span className="font-bold text-purple-700">
                    {Number(selectedLicense.platform_fee_etb ?? (Number(selectedLicense.amount_etb || 0) * (selectedLicense.platform_rate_snapshot || 0.3))).toLocaleString()} ETB
                  </span>
                </div>
              </div>

              {/* Allowed Use Rights */}
              <div>
                <span className="text-xs font-bold text-gray-700 block mb-1.5">Licensed Use Cases</span>
                <div className="flex flex-wrap gap-1.5">
                  {(selectedLicense.purchased_uses || []).map(u => (
                    <span key={u} className="text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-100 px-2.5 py-1 rounded-lg">
                      {USE_LABELS[u] || u}
                    </span>
                  ))}
                </div>
              </div>

              {/* Checkout Link if pending */}
              {selectedLicense.checkout_url && (
                <div className="p-3 bg-yellow-50 rounded-xl border border-yellow-200 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-yellow-800">AddisPay Checkout Link:</span>
                    <a
                      href={selectedLicense.checkout_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-purple-700 hover:underline font-bold"
                    >
                      <span>Open Checkout</span>
                      <FiExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              )}

              {/* Status & Validity */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs text-gray-500">
                <span>
                  Remaining Uses: <strong className="text-gray-900">{selectedLicense.uses_remaining}</strong> / {selectedLicense.uses_allowed || selectedLicense.total_uses || 1}
                </span>
                <span>
                  Status: <strong className="capitalize text-gray-900">{selectedLicense.status}</strong>
                </span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setSelectedLicense(null)}
                className="px-4 py-2 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-gray-800 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
