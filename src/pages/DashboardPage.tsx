import { useEffect, useState } from 'react'
import { adminAPI } from '@/config/api'
import StatCard from '@/components/common/StatCard'
import PageHeader from '@/components/common/PageHeader'
import {
  FiFilm, FiUsers, FiUser, FiBriefcase, FiVideo,
  FiBookmark, FiFolder, FiMapPin, FiLoader, FiRefreshCw,
  FiSend, FiCheckCircle, FiAlertCircle, FiCreditCard,
} from 'react-icons/fi'

const ROLES = ['talent','cast_agency','production_crew','content_creator','aggregator_scout','production_studio','location_scout','academy','casting_admin']
const COMMISSION_URL = 'https://commission.besewonline.com/api'

async function fetchCommissionStats(period: string, token: string) {
  const res = await fetch(`${COMMISSION_URL}/commission/casting/stats?period=${period}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  if (!res.ok) return null
  const data = await res.json()
  return data.stats || null
}

export default function DashboardPage() {
  const [stats, setStats]           = useState<any>(null)
  const [roleStats, setRoleStats]   = useState<any>(null)
  const [commStats, setCommStats]   = useState<any>(null)
  const [commPeriod, setCommPeriod] = useState<'daily'|'weekly'|'monthly'>('monthly')
  const [loading, setLoading]       = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const [s, r] = await Promise.allSettled([adminAPI.stats(), adminAPI.castingRoles()])
      if (s.status === 'fulfilled') setStats(s.value)
      if (r.status === 'fulfilled') setRoleStats(r.value)
    } catch {}
    setLoading(false)
  }

  const loadCommission = async (period: string) => {
    const token = localStorage.getItem('admin_token') || ''
    if (!token) return
    const data = await fetchCommissionStats(period, token).catch(() => null)
    setCommStats(data)
  }

  useEffect(() => { load() }, [])
  useEffect(() => { loadCommission(commPeriod) }, [commPeriod])

  const s = stats || {}

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Platform overview" actions={
        <button onClick={load} disabled={loading}
          className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition disabled:opacity-40">
          <FiRefreshCw className={`w-4 h-4 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
        </button>
      } />

      <div className="p-6 space-y-6">
        {loading ? (
          <div className="flex justify-center py-16">
            <FiLoader className="w-8 h-8 animate-spin text-orange-500" />
          </div>
        ) : (
          <>
            {/* Primary stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
              <StatCard label="Cast Calls"     value={s.cast_calls     ?? 0} icon={<FiFilm className="w-5 h-5" />}      color="text-orange-500" />
              <StatCard label="Open Calls"     value={s.open_calls     ?? 0} icon={<FiCheckCircle className="w-5 h-5" />} color="text-green-500" />
              <StatCard label="Talents"        value={s.talent_profiles?? 0} icon={<FiUser className="w-5 h-5" />}      color="text-blue-500" />
              <StatCard label="Agencies"       value={s.agencies       ?? 0} icon={<FiBriefcase className="w-5 h-5" />} color="text-purple-500" />
              <StatCard label="Productions"    value={s.productions    ?? 0} icon={<FiFolder className="w-5 h-5" />}    color="text-indigo-500" />
              <StatCard label="Auditions"      value={s.auditions      ?? 0} icon={<FiVideo className="w-5 h-5" />}     color="text-teal-500" />
              <StatCard label="Bookings"       value={s.bookings       ?? 0} icon={<FiBookmark className="w-5 h-5" />}  color="text-amber-500" />
            </div>

            {/* Secondary stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              <StatCard label="Locations"       value={s.locations        ?? 0} icon={<FiMapPin className="w-5 h-5" />}       color="text-rose-500" />
              <StatCard label="Join Requests"   value={s.join_requests    ?? 0} icon={<FiSend className="w-5 h-5" />}         color="text-cyan-500" />
              <StatCard label="Pending Req."    value={s.pending_requests ?? 0} icon={<FiAlertCircle className="w-5 h-5" />}  color="text-yellow-500" />
              <StatCard label="Invitations"     value={s.invitations      ?? 0} icon={<FiUsers className="w-5 h-5" />}        color="text-violet-500" />
            </div>

            {/* Commission stats */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h2 className="text-xs font-black text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                  <FiCreditCard className="w-4 h-4 text-green-500" /> Commission Summary
                </h2>
                <div className="flex gap-1">
                  {(['daily','weekly','monthly'] as const).map(p => (
                    <button key={p} onClick={() => setCommPeriod(p)}
                      className={`px-2.5 py-1 text-[10px] font-bold rounded-lg capitalize transition ${commPeriod === p ? 'bg-orange-500 text-white' : 'border border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              {commStats ? (() => {
                const rows: any[] = commStats.stats || []
                const totalPlatformFee    = rows.reduce((s: number, r: any) => s + (r.totalPlatformFee || 0), 0)
                const totalBookingValue   = rows.reduce((s: number, r: any) => s + (r.totalBookingValue || 0), 0)
                const totalCount          = rows.reduce((s: number, r: any) => s + (r.count || 0), 0)
                const avgBookingValue     = totalCount > 0 ? totalBookingValue / totalCount : 0
                return (
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: 'Platform Revenue', value: `${totalPlatformFee.toLocaleString()} ETB`, color: 'text-green-600' },
                        { label: 'Total Bookings',   value: `${totalCount} this ${commPeriod}`, color: 'text-blue-600' },
                        { label: 'Avg Booking',      value: `${Math.round(avgBookingValue).toLocaleString()} ETB`, color: 'text-purple-600' },
                      ].map(c => (
                        <div key={c.label} className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                          <p className={`text-lg font-black ${c.color}`}>{c.value}</p>
                          <p className="text-[10px] font-bold text-gray-400 uppercase mt-0.5">{c.label}</p>
                        </div>
                      ))}
                    </div>
                    {rows.length > 0 && (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase text-[10px] font-bold">
                            <tr>
                              <th className="px-3 py-2 text-left">Type</th>
                              <th className="px-3 py-2 text-right">Count</th>
                              <th className="px-3 py-2 text-right">Total Value</th>
                              <th className="px-3 py-2 text-right">Platform Fee</th>
                              <th className="px-3 py-2 text-right">Avg Value</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {rows.map((r: any) => (
                              <tr key={r._id} className="hover:bg-gray-50">
                                <td className="px-3 py-2 font-semibold capitalize">{r._id?.replace(/casting-booking-/,'').replace(/-/g,' ')}</td>
                                <td className="px-3 py-2 text-right">{r.count}</td>
                                <td className="px-3 py-2 text-right font-bold">{(r.totalBookingValue||0).toLocaleString()} ETB</td>
                                <td className="px-3 py-2 text-right text-green-600 font-bold">{(r.totalPlatformFee||0).toLocaleString()} ETB</td>
                                <td className="px-3 py-2 text-right">{(r.avgBookingValue||0).toLocaleString()} ETB</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )
              })() : (
                <p className="text-xs text-gray-400 text-center py-4">No commission data for this period</p>
              )}
            </div>

            {/* Role breakdown */}
            {roleStats && (
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <h2 className="text-xs font-black text-gray-500 uppercase tracking-wider mb-4">Users by Casting Role</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  {ROLES.map(role => {
                    const count = roleStats?.summary?.[role] ?? 0
                    return (
                      <div key={role} className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-center">
                        <p className="text-xl font-black text-gray-900">{count}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase mt-0.5">{role.replace(/_/g,' ')}</p>
                      </div>
                    )
                  })}
                  <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 text-center">
                    <p className="text-xl font-black text-orange-600">{roleStats?.total ?? 0}</p>
                    <p className="text-[10px] font-bold text-orange-400 uppercase mt-0.5">Total</p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
