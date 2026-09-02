import { useEffect, useState } from 'react'
import { adminAPI } from '@/config/api'
import PageHeader from '@/components/common/PageHeader'
import DataTable from '@/components/common/DataTable'
import Pagination from '@/components/common/Pagination'
import {
  FiRefreshCw, FiSearch, FiX, FiCheck, FiTrash2,
  FiArrowUp, FiActivity, FiRotateCcw, FiUser, FiPhone,
} from 'react-icons/fi'

// ── Types ─────────────────────────────────────────────────────────────────────
interface Sub {
  _id?: string
  party_id?: string
  partyId?: string
  type: string
  period: string
  status: string
  features?: string[]
  expires_at?: number | string
  expiresAt?: number | string
  durationInDays?: number
  price?: number
  description?: string
  created_at?: string
  updated_at?: string
  createdAt?: string
  updatedAt?: string
  startDate?: string
  endDate?: string
  daysRemaining?: number
}

function formatSubDate(val?: string | number | null): string {
  if (!val) return '—'
  try {
    const num = typeof val === 'number' ? val : !isNaN(Number(val)) ? Number(val) : val
    const d = new Date(num)
    if (isNaN(d.getTime())) return '—'
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
  } catch {
    return '—'
  }
}

function calculateDaysLeft(val?: string | number | null): number | null {
  if (!val) return null
  try {
    const num = typeof val === 'number' ? val : !isNaN(Number(val)) ? Number(val) : val
    const time = new Date(num).getTime()
    if (isNaN(time)) return null
    return Math.max(0, Math.ceil((time - Date.now()) / (1000 * 60 * 60 * 24)))
  } catch {
    return null
  }
}

interface Usage {
  partyId: string
  subscriptionType: string
  castingCallsUsed: number
  castingCallsLimit: number
  auditionReviewsUsed: number
  auditionReviewsLimit: number
  aiScriptAnalysesUsed: number
  aiScriptAnalysesLimit: number
  talentSearchesUsed: number
  talentSearchesLimit: number
  bookingsUsed: number
  bookingsLimit: number
  locationScoutingUsed: number
  locationScoutingLimit: number
}

const TYPE_BADGE: Record<string, string> = {
  free:         'bg-gray-100 text-gray-600 border-gray-200',
  starter:      'bg-blue-100 text-blue-700 border-blue-200',
  growth:       'bg-green-100 text-green-700 border-green-200',
  professional: 'bg-purple-100 text-purple-700 border-purple-200',
  enterprise:   'bg-orange-100 text-orange-700 border-orange-200',
}
const STATUS_BADGE: Record<string, string> = {
  active:    'bg-green-100 text-green-700',
  inactive:  'bg-gray-100 text-gray-500',
  cancelled: 'bg-red-100 text-red-600',
  expired:   'bg-amber-100 text-amber-600',
}
const PLAN_TYPES = ['free','starter','growth','professional','enterprise']
const PERIODS    = ['monthly','annual']
const STATUSES   = ['active','inactive','cancelled','expired']

// ── Usage bar ────────────────────────────────────────────────────────────────
function UsageBar({ used, limit, label }: { used: number; limit: number; label: string }) {
  const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0
  const color = pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-400' : 'bg-green-500'
  return (
    <div>
      <div className="flex justify-between text-[9px] text-gray-500 mb-0.5">
        <span>{label}</span>
        <span className="font-bold">{used}/{limit}</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function SubUsersPage() {
  const [subs,     setSubs]    = useState<Sub[]>([])
  const [partyMap, setPartyMap] = useState<Record<string, any>>({})
  const [loading,  setLoading] = useState(true)
  const [page,     setPage]    = useState(1)
  const [pages,    setPages]   = useState(1)
  const [total,    setTotal]   = useState(0)
  const PAGE_SIZE = 20

  // filters
  const [filterType,   setFilterType]   = useState('')
  const [filterStatus, setFilterStatus] = useState('active')

  // search single user
  const [searchId,     setSearchId]     = useState('')
  const [searching,    setSearching]    = useState(false)
  const [singleSub,    setSingleSub]    = useState<any>(null)
  const [singleUsage,  setSingleUsage]  = useState<Usage | null>(null)

  // action modals
  const [modal, setModal] = useState<'assign' | 'upgrade' | 'cancel' | 'reset' | 'sync' | null>(null)
  const [targetId, setTargetId] = useState('')
  const [actionForm, setActionForm] = useState({ type: 'growth', period: 'annual', status: 'active', reason: '', newType: 'professional', newPeriod: 'annual', subscriptionType: 'growth' })
  const [actioning, setActioning] = useState(false)
  const [actionError, setActionError] = useState('')
  const [actionMsg, setActionMsg] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const [res, rolesRes] = await Promise.allSettled([
        adminAPI.castingSubscriptions({ type: filterType || undefined, status: filterStatus || undefined, page, limit: PAGE_SIZE }),
        adminAPI.castingRoles(),
      ])

      const pMap: Record<string, any> = { ...partyMap }
      if (rolesRes.status === 'fulfilled') {
        const rolesData = rolesRes.value?.data || (Array.isArray(rolesRes.value) ? rolesRes.value : [])
        rolesData.forEach((u: any) => {
          const pid = u.party_id || u.partyId || u.id || u._id
          if (pid) pMap[pid] = u
        })
        setPartyMap(pMap)
      }

      const rawList = res.status === 'fulfilled' ? (Array.isArray(res.value) ? res.value : res.value?.data || []) : []
      const data: Sub[] = rawList.map((item: any) => {
        const partyId = item.party_id || item.partyId || item._id || ''
        const expiry = item.expires_at ?? item.expiresAt ?? item.endDate
        const daysLeft = item.daysRemaining !== undefined ? item.daysRemaining : calculateDaysLeft(expiry)
        return {
          ...item,
          partyId,
          party_id: partyId,
          daysRemaining: daysLeft ?? undefined,
        }
      })
      setSubs(data)
      const pg = res.status === 'fulfilled' ? (res.value?.pagination || res.value?.meta || {}) : {}
      setTotal(pg.total || data.length)
      setPages(Math.max(1, pg.pages || pg.totalPages || Math.ceil((pg.total || data.length) / PAGE_SIZE)))
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [page, filterType, filterStatus])

  const handleSearch = async () => {
    if (!searchId.trim()) return
    setSearching(true); setSingleSub(null); setSingleUsage(null)
    try {
      const [sub, usage] = await Promise.allSettled([
        adminAPI.getUserSubscription(searchId.trim()),
        adminAPI.getUsage(searchId.trim()),
      ])
      if (sub.status === 'fulfilled') setSingleSub(sub.value)
      if (usage.status === 'fulfilled') setSingleUsage(usage.value)
    } catch {}
    setSearching(false)
  }

  const openModal = (type: typeof modal, partyId: string) => {
    setTargetId(partyId)
    setActionForm(f => ({ ...f, subscriptionType: singleSub?.type || 'growth' }))
    setActionError(''); setActionMsg(''); setModal(type)
  }

  const closeModal = () => { setModal(null); setTargetId('') }

  const handleAction = async () => {
    setActioning(true); setActionError(''); setActionMsg('')
    try {
      switch (modal) {
        case 'assign':
          await adminAPI.assignSubscription(targetId, { type: actionForm.type, period: actionForm.period, status: actionForm.status })
          setActionMsg('Subscription assigned ✓')
          break
        case 'upgrade':
          await adminAPI.upgradeSubscription(targetId, { newType: actionForm.newType, newPeriod: actionForm.newPeriod })
          setActionMsg('Upgraded ✓')
          break
        case 'cancel':
          await adminAPI.cancelSubscription(targetId, actionForm.reason)
          setActionMsg('Subscription cancelled ✓')
          break
        case 'reset':
          await adminAPI.resetUsage(targetId, actionForm.subscriptionType)
          setActionMsg('Usage counters reset ✓')
          break
        case 'sync':
          await adminAPI.syncLimits(targetId)
          setActionMsg('Limits synced ✓')
          break
      }
      // refresh single user panel
      if (searchId.trim() === targetId) {
        const [sub, usage] = await Promise.allSettled([
          adminAPI.getUserSubscription(targetId),
          adminAPI.getUsage(targetId),
        ])
        if (sub.status === 'fulfilled') setSingleSub(sub.value)
        if (usage.status === 'fulfilled') setSingleUsage(usage.value)
      }
      await load()
    } catch (e: any) { setActionError(e.message || 'Action failed') }
    setActioning(false)
  }

  const setAf = (k: string, v: string) => setActionForm(f => ({ ...f, [k]: v }))

  return (
    <div>
      <PageHeader title="User Subscriptions" subtitle="Manage casting subscription assignments" actions={
        <button onClick={load} disabled={loading}
          className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition disabled:opacity-40">
          <FiRefreshCw className={`w-4 h-4 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
        </button>
      } />

      {/* Single user lookup */}
      <div className="px-6 py-4 border-b border-gray-100 bg-white">
        <p className="text-[10px] font-bold text-gray-500 uppercase mb-2">Look Up User</p>
        <div className="flex gap-2">
          <input value={searchId} onChange={e => setSearchId(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="Party ID — e.g. ETH26-1-HI-006"
            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-orange-400" />
          <button onClick={handleSearch} disabled={searching}
            className="flex items-center gap-1.5 px-3 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition">
            {searching ? <FiRefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FiSearch className="w-3.5 h-3.5" />}
            Search
          </button>
        </div>

        {/* Single user result */}
        {singleSub && (() => {
          const pId = singleSub.party_id || singleSub.partyId || searchId
          const pInfo = partyMap[pId]
          const fullName = pInfo ? [pInfo.name, pInfo.last_name].filter(Boolean).join(' ') : null

          return (
            <div className="mt-4 bg-gray-50 border border-gray-200 rounded-xl p-4">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="w-8 h-8 rounded-lg bg-orange-500 text-white flex items-center justify-center font-black text-xs shrink-0">
                      {fullName ? fullName.charAt(0).toUpperCase() : <FiUser className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-black text-gray-900">{fullName || pId}</span>
                        {pInfo?.phone_number && (
                          <span className="flex items-center gap-1 text-xs text-gray-600 bg-white border border-gray-200 px-2 py-0.5 rounded-md font-mono">
                            <FiPhone className="w-3 h-3 text-orange-500" /> {pInfo.phone_number}
                          </span>
                        )}
                        {pInfo?.casting_role && (
                          <span className="px-2 py-0.5 rounded-full border text-[10px] font-black uppercase bg-blue-50 text-blue-700 border-blue-200">
                            {pInfo.casting_role.replace(/_/g, ' ')}
                          </span>
                        )}
                        {singleSub.type && (
                          <span className={`px-2 py-0.5 rounded-full border text-[10px] font-black uppercase ${TYPE_BADGE[singleSub.type] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>{singleSub.type}</span>
                        )}
                        {singleSub.status && (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black capitalize ${STATUS_BADGE[singleSub.status] || 'bg-gray-100 text-gray-500'}`}>{singleSub.status}</span>
                        )}
                      </div>
                      <p className="font-mono text-[10px] text-gray-400 mt-0.5">{pId}</p>
                    </div>
                  </div>
                  <div className="flex gap-3 text-[10px] text-gray-500 flex-wrap pl-10">
                    {singleSub.period && <span>Period: <b className="capitalize">{singleSub.period}</b></span>}
                    <span>Start: <b>{formatSubDate(singleSub.created_at || singleSub.createdAt || singleSub.startDate)}</b></span>
                    <span>Expires: <b>{formatSubDate(singleSub.expires_at || singleSub.expiresAt || singleSub.endDate)}</b></span>
                    {(() => {
                      const days = singleSub.daysRemaining ?? calculateDaysLeft(singleSub.expires_at || singleSub.expiresAt || singleSub.endDate)
                      return days !== null ? <span>Days left: <b className={days <= 7 ? 'text-red-500' : 'text-gray-800'}>{days}d</b></span> : null
                    })()}
                  </div>
                </div>
                {/* Action buttons */}
                <div className="flex gap-1.5 flex-wrap">
                  <button onClick={() => openModal('assign',  pId)}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-green-50 border border-green-200 text-green-700 rounded-lg text-[10px] font-bold hover:bg-green-100 transition">
                    <FiCheck className="w-3 h-3" /> Assign
                  </button>
                  <button onClick={() => openModal('upgrade', pId)}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-purple-50 border border-purple-200 text-purple-700 rounded-lg text-[10px] font-bold hover:bg-purple-100 transition">
                    <FiArrowUp className="w-3 h-3" /> Upgrade
                  </button>
                  <button onClick={() => openModal('reset',   pId)}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg text-[10px] font-bold hover:bg-blue-100 transition">
                    <FiRotateCcw className="w-3 h-3" /> Reset Usage
                  </button>
                  <button onClick={() => openModal('sync',    pId)}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg text-[10px] font-bold hover:bg-amber-100 transition">
                    <FiActivity className="w-3 h-3" /> Sync Limits
                  </button>
                  <button onClick={() => openModal('cancel',  pId)}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-red-50 border border-red-200 text-red-600 rounded-lg text-[10px] font-bold hover:bg-red-100 transition">
                    <FiTrash2 className="w-3 h-3" /> Cancel
                  </button>
                </div>
              </div>

              {/* Usage bars */}
              {singleUsage && (
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <UsageBar label="Casting Calls"     used={singleUsage.castingCallsUsed}      limit={singleUsage.castingCallsLimit} />
                  <UsageBar label="Audition Reviews"  used={singleUsage.auditionReviewsUsed}   limit={singleUsage.auditionReviewsLimit} />
                  <UsageBar label="AI Script Analyses"used={singleUsage.aiScriptAnalysesUsed}  limit={singleUsage.aiScriptAnalysesLimit} />
                  <UsageBar label="Talent Searches"   used={singleUsage.talentSearchesUsed}    limit={singleUsage.talentSearchesLimit} />
                  <UsageBar label="Bookings"          used={singleUsage.bookingsUsed}           limit={singleUsage.bookingsLimit} />
                  <UsageBar label="Location Scouting" used={singleUsage.locationScoutingUsed}  limit={singleUsage.locationScoutingLimit} />
                </div>
              )}
            </div>
          )
        })()}
      </div>

      {/* Filters */}
      <div className="px-6 py-3 bg-white border-b border-gray-100 flex gap-2 flex-wrap">
        <select value={filterType} onChange={e => { setFilterType(e.target.value); setPage(1) }}
          className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-orange-400">
          <option value="">All types</option>
          {PLAN_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1) }}
          className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-orange-400">
          <option value="">All statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="p-6">
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <DataTable loading={loading} data={subs} keyField="_id" emptyMsg="No subscriptions found"
            columns={[
              { key: 'subscriber', label: 'Subscriber', render: r => {
                const pId = r.party_id || r.partyId || ''
                const pInfo = partyMap[pId]
                const fullName = pInfo ? [pInfo.name, pInfo.last_name].filter(Boolean).join(' ') : null
                return (
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-200 text-orange-600 flex items-center justify-center shrink-0 font-black text-xs">
                      {fullName ? fullName.charAt(0).toUpperCase() : <FiUser className="w-3.5 h-3.5" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-gray-900 text-xs">
                          {fullName || '—'}
                        </span>
                        {pInfo?.casting_role && (
                          <span className="px-1.5 py-0.2 rounded text-[8px] font-black uppercase bg-gray-100 text-gray-600 border border-gray-200">
                            {pInfo.casting_role.replace(/_/g, ' ')}
                          </span>
                        )}
                      </div>
                      <p className="font-mono text-[10px] text-gray-400">{pId || '—'}</p>
                    </div>
                  </div>
                )
              }},
              { key: 'phone', label: 'Phone Number', render: r => {
                const pId = r.party_id || r.partyId || ''
                const pInfo = partyMap[pId]
                const phone = pInfo?.phone_number
                return (
                  <div className="flex items-center gap-1.5 text-xs text-gray-700 font-medium whitespace-nowrap">
                    {phone ? (
                      <>
                        <FiPhone className="w-3 h-3 text-orange-500 shrink-0" />
                        <span className="font-mono">{phone}</span>
                      </>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </div>
                )
              }},
              { key: 'type', label: 'Plan', render: r => (
                <span className={`px-2 py-0.5 rounded-full border text-[10px] font-black uppercase ${TYPE_BADGE[r.type] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>{r.type || '—'}</span>
              )},
              { key: 'period', label: 'Period', render: r => (
                <span className="text-[10px] text-gray-500 capitalize">{r.period || '—'}</span>
              )},
              { key: 'status', label: 'Status', render: r => (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black capitalize ${STATUS_BADGE[r.status] || 'bg-gray-100 text-gray-500'}`}>{r.status || '—'}</span>
              )},
              { key: 'endDate', label: 'Expires', render: r => (
                <span className="text-xs text-gray-600 font-medium whitespace-nowrap">
                  {formatSubDate(r.expires_at || r.expiresAt || r.endDate)}
                </span>
              )},
              { key: 'daysRemaining', label: 'Days Left', render: r => {
                const days = r.daysRemaining !== undefined ? r.daysRemaining : calculateDaysLeft(r.expires_at || r.expiresAt || r.endDate)
                return (
                  <span className={`text-[11px] font-bold ${days !== null && days <= 7 ? 'text-red-500' : 'text-gray-700'}`}>
                    {days !== null ? `${days}d` : '—'}
                  </span>
                )
              }},
              { key: 'actions', label: '', render: r => {
                const pId = r.party_id || r.partyId || r._id || ''
                return (
                  <div className="flex gap-1">
                    <button onClick={() => { setSearchId(pId); setSingleSub(r); setSingleUsage(null); adminAPI.getUsage(pId).then(setSingleUsage).catch(() => {}) }}
                      className="p-1.5 text-gray-400 hover:bg-gray-50 rounded-lg transition" title="View details">
                      <FiSearch className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => openModal('assign',  pId)}
                      className="p-1.5 text-green-500 hover:bg-green-50 rounded-lg transition" title="Assign">
                      <FiCheck className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => openModal('upgrade', pId)}
                      className="p-1.5 text-purple-500 hover:bg-purple-50 rounded-lg transition" title="Upgrade">
                      <FiArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => openModal('cancel',  pId)}
                      className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition" title="Cancel">
                      <FiTrash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )
              }},
            ]}
          />
          <Pagination page={page} pages={pages} total={total} onChange={p => setPage(p)} />
        </div>
      </div>

      {/* Action Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-gray-900 text-sm">
                {modal === 'assign'  && 'Assign Subscription'}
                {modal === 'upgrade' && 'Upgrade Subscription'}
                {modal === 'cancel'  && 'Cancel Subscription'}
                {modal === 'reset'   && 'Reset Usage Counters'}
                {modal === 'sync'    && 'Sync Plan Limits'}
              </h3>
              <button onClick={closeModal} className="p-1 hover:bg-gray-100 rounded-lg transition">
                <FiX className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            <p className="text-[10px] font-mono text-gray-400">{targetId}</p>

            {actionError && <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">{actionError}</div>}
            {actionMsg   && <div className="p-2.5 bg-green-50 border border-green-200 rounded-xl text-xs text-green-700 font-bold">{actionMsg}</div>}

            {modal === 'assign' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Plan Type</label>
                  <select value={actionForm.type} onChange={e => setAf('type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-orange-400">
                    {PLAN_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Period</label>
                  <select value={actionForm.period} onChange={e => setAf('period', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-orange-400">
                    {PERIODS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Status</label>
                  <select value={actionForm.status} onChange={e => setAf('status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-orange-400">
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            )}

            {modal === 'upgrade' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">New Plan Type</label>
                  <select value={actionForm.newType} onChange={e => setAf('newType', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-orange-400">
                    {PLAN_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">New Period</label>
                  <select value={actionForm.newPeriod} onChange={e => setAf('newPeriod', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-orange-400">
                    {PERIODS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
            )}

            {modal === 'cancel' && (
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Reason</label>
                <textarea rows={3} value={actionForm.reason} onChange={e => setAf('reason', e.target.value)}
                  placeholder="e.g. Policy violation"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-orange-400 resize-none" />
              </div>
            )}

            {modal === 'reset' && (
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Subscription Type</label>
                <select value={actionForm.subscriptionType} onChange={e => setAf('subscriptionType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-orange-400">
                  {PLAN_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <p className="text-[10px] text-amber-600 mt-1">⚠ This resets all usage counters and re-reads limits from the plan.</p>
              </div>
            )}

            {modal === 'sync' && (
              <p className="text-xs text-gray-500">
                This syncs the latest plan quota limits to this user's usage record without resetting their counters.
              </p>
            )}

            {!actionMsg && (
              <div className="flex gap-2 pt-1">
                <button onClick={closeModal}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 transition">
                  Cancel
                </button>
                <button onClick={handleAction} disabled={actioning}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-black text-white transition disabled:opacity-50 ${
                    modal === 'cancel' ? 'bg-red-500 hover:bg-red-600' : 'bg-orange-500 hover:bg-orange-600'
                  }`}>
                  {actioning ? <FiRefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FiCheck className="w-3.5 h-3.5" />}
                  Confirm
                </button>
              </div>
            )}
            {actionMsg && (
              <button onClick={closeModal}
                className="w-full px-4 py-2.5 bg-gray-900 text-white rounded-xl text-xs font-black hover:bg-gray-700 transition">
                Close
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
