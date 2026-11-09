import { useEffect, useState } from 'react'
import { llmGatewayAPI, UserMonthly, UserUsageDetail, CreditBalance } from '@/config/api'
import PageHeader from '@/components/common/PageHeader'
import {
  FiRefreshCw, FiSearch, FiZap, FiCpu, FiUser,
  FiTrendingUp, FiDollarSign, FiGift, FiChevronDown,
  FiChevronRight, FiX, FiCheck,
} from 'react-icons/fi'

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(n: number) { return n.toLocaleString() }
function fmtC(n: number) { return n.toFixed(2) }

function creditBar(spent: number, total: number) {
  if (total <= 0) return 0
  return Math.min(100, (spent / total) * 100)
}

function modelBadge(model: string) {
  if (model.includes('gemini')) return 'bg-blue-50 text-blue-700 border-blue-200'
  if (model.includes('llama'))  return 'bg-purple-50 text-purple-700 border-purple-200'
  if (model.includes('bge'))    return 'bg-gray-50 text-gray-600 border-gray-200'
  return 'bg-emerald-50 text-emerald-700 border-emerald-200'
}

// ── Summary stat card ─────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color = 'text-gray-900' }: {
  icon: any; label: string; value: string; sub?: string; color?: string
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-center gap-2 text-gray-400 text-xs mb-2">
        <Icon className="w-3.5 h-3.5" /> {label}
      </div>
      <div className={`text-2xl font-black ${color}`}>{value}</div>
      {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
    </div>
  )
}

// ── User detail drawer ────────────────────────────────────────────────────────
function UserDetailDrawer({ partyId, onClose }: { partyId: string; onClose: () => void }) {
  const [detail, setDetail]     = useState<UserUsageDetail | null>(null)
  const [loading, setLoading]   = useState(true)
  const [grantAmt, setGrantAmt] = useState('')
  const [grantNote, setGrantNote] = useState('')
  const [granting, setGranting] = useState(false)
  const [toast, setToast]       = useState('')

  useEffect(() => {
    llmGatewayAPI.getUserUsage(partyId)
      .then(setDetail)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [partyId])

  const doGrant = async () => {
    const amt = parseFloat(grantAmt)
    if (!amt || amt <= 0) return
    setGranting(true)
    try {
      const r = await llmGatewayAPI.grantCredits(partyId, amt, grantNote || 'admin grant')
      setToast(`✓ Granted ${amt} credits. New balance: ${r.new_balance.toFixed(2)}`)
      setGrantAmt(''); setGrantNote('')
      const updated = await llmGatewayAPI.getUserUsage(partyId)
      setDetail(updated)
    } catch (e: any) { setToast(`Error: ${e.message}`) }
    finally { setGranting(false); setTimeout(() => setToast(''), 3000) }
  }

  const bal = detail?.credit_balance
  const latest = detail?.months?.[0]

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white shadow-2xl overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between">
          <div>
            <h2 className="font-black text-gray-900 text-sm">User AI Usage</h2>
            <p className="text-xs text-gray-400 font-mono mt-0.5">{partyId}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100">
            <FiX className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {loading && (
          <div className="px-5 py-10 text-center text-gray-400 text-sm">Loading…</div>
        )}

        {!loading && detail && (
          <div className="px-5 py-4 space-y-5">
            {/* Credit balance */}
            <div className="rounded-xl border border-gray-200 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Credit Balance</span>
                <FiZap className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-3xl font-black text-gray-900">{fmtC(bal?.balance ?? 0)} <span className="text-base font-normal text-gray-400">credits</span></div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg bg-gray-50 px-3 py-2">
                  <div className="text-xs text-gray-400">Lifetime earned</div>
                  <div className="font-bold text-gray-800">{fmtC(bal?.lifetime_earned ?? 0)}</div>
                </div>
                <div className="rounded-lg bg-gray-50 px-3 py-2">
                  <div className="text-xs text-gray-400">Lifetime spent</div>
                  <div className="font-bold text-gray-800">{fmtC(bal?.lifetime_spent ?? 0)}</div>
                </div>
              </div>
              {bal?.last_grant_month && (
                <div className="text-xs text-gray-400">Last monthly grant: {bal.last_grant_month}</div>
              )}
            </div>

            {/* Grant credits form */}
            <div className="rounded-xl border border-dashed border-emerald-300 bg-emerald-50/50 p-4 space-y-3">
              <div className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
                <FiGift className="w-3.5 h-3.5" /> Grant Credits
              </div>
              <div className="flex gap-2">
                <input type="number" min="1" placeholder="Amount" value={grantAmt}
                  onChange={e => setGrantAmt(e.target.value)}
                  className="w-28 text-sm px-2.5 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-300" />
                <input placeholder="Reason (optional)" value={grantNote}
                  onChange={e => setGrantNote(e.target.value)}
                  className="flex-1 text-sm px-2.5 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-300" />
                <button onClick={doGrant} disabled={granting || !grantAmt}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50">
                  {granting ? '…' : <FiCheck className="w-4 h-4" />}
                </button>
              </div>
              {toast && <div className="text-xs text-emerald-700">{toast}</div>}
            </div>

            {/* This month */}
            {latest && (
              <div className="space-y-2">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{latest.month} Usage</div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="rounded-lg bg-gray-50 px-3 py-2 text-center">
                    <div className="text-xs text-gray-400">Requests</div>
                    <div className="font-bold text-gray-800">{fmt(latest.total_requests)}</div>
                  </div>
                  <div className="rounded-lg bg-gray-50 px-3 py-2 text-center">
                    <div className="text-xs text-gray-400">Tokens</div>
                    <div className="font-bold text-gray-800">{fmt(latest.total_tokens)}</div>
                  </div>
                  <div className="rounded-lg bg-amber-50 px-3 py-2 text-center">
                    <div className="text-xs text-amber-500">Credits</div>
                    <div className="font-bold text-amber-700">{fmtC(latest.total_credits ?? 0)}</div>
                  </div>
                </div>

                {/* By model */}
                {Object.keys(latest.by_model).length > 0 && (
                  <div className="rounded-lg border border-gray-100 divide-y divide-gray-100 text-xs">
                    {Object.entries(latest.by_model).map(([model, tokens]) => (
                      <div key={model} className="flex items-center justify-between px-3 py-2">
                        <span className={`px-1.5 py-0.5 rounded border font-mono ${modelBadge(model)}`}>{model}</span>
                        <span className="text-gray-500">{fmt(tokens as number)} tokens</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* By service */}
                {Object.keys(latest.by_service).length > 0 && (
                  <div className="space-y-1">
                    <div className="text-xs text-gray-400 font-medium">By service</div>
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(latest.by_service).map(([svc, count]) => (
                        <span key={svc} className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs">
                          {svc}: {fmt(count as number)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* History table */}
            {detail.months.length > 1 && (
              <div className="space-y-2">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Monthly History</div>
                <table className="w-full text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-gray-500 font-medium">Month</th>
                      <th className="px-3 py-2 text-right text-gray-500 font-medium">Requests</th>
                      <th className="px-3 py-2 text-right text-gray-500 font-medium">Tokens</th>
                      <th className="px-3 py-2 text-right text-amber-500 font-medium">Credits</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {detail.months.map(m => (
                      <tr key={m.month} className="hover:bg-gray-50">
                        <td className="px-3 py-2 font-mono">{m.month}</td>
                        <td className="px-3 py-2 text-right">{fmt(m.total_requests)}</td>
                        <td className="px-3 py-2 text-right">{fmt(m.total_tokens)}</td>
                        <td className="px-3 py-2 text-right font-medium text-amber-600">{fmtC(m.total_credits ?? 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AiUsagePage() {
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })

  const [selectedMonth, setSelectedMonth] = useState(months[0])
  const [summary, setSummary]             = useState<any>(null)
  const [loading, setLoading]             = useState(true)
  const [search, setSearch]               = useState('')
  const [selectedUser, setSelectedUser]   = useState<string | null>(null)
  const [error, setError]                 = useState('')

  const load = async () => {
    setLoading(true); setError('')
    try {
      const res = await llmGatewayAPI.getAllUsage(selectedMonth, 100)
      setSummary(res)
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [selectedMonth])

  const filtered = (summary?.users ?? []).filter((u: UserMonthly) =>
    !search || u.party_id.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Usage"
        subtitle="Token consumption, credit spend, and per-user breakdown across all LLM services."
        actions={
          <div className="flex items-center gap-2">
            <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}
              className="text-sm px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-primary/30">
              {months.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <button onClick={load}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium hover:bg-gray-50">
              <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>
        }
      />

      {error && (
        <div className="px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-700">{error}</div>
      )}

      {/* Summary stats */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <StatCard icon={FiUser}       label="Active users"  value={fmt(summary.summary.total_users)}    />
          <StatCard icon={FiTrendingUp} label="Requests"      value={fmt(summary.summary.total_requests)} />
          <StatCard icon={FiCpu}        label="Total tokens"  value={fmt(summary.summary.total_tokens)}   />
          <StatCard icon={FiZap}        label="Credits spent" value={fmtC(summary.summary.total_credits ?? 0)}
            color="text-amber-600" sub="across all users" />
          <StatCard icon={FiDollarSign} label="Ext. AI cost"  value={`$${fmtC(summary.summary.total_cost_usd)}`}
            color="text-blue-600" sub="Gemini only" />
        </div>
      )}

      {/* Search + table */}
      <div className="rounded-xl border border-gray-200 overflow-hidden">
        {/* Search bar */}
        <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2 bg-gray-50/50">
          <FiSearch className="w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by party ID…"
            className="flex-1 text-sm bg-transparent focus:outline-none text-gray-700 placeholder-gray-400" />
          {search && (
            <button onClick={() => setSearch('')} className="text-gray-400 hover:text-gray-600">
              <FiX className="w-4 h-4" />
            </button>
          )}
        </div>

        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">User</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">Requests</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">Tokens</th>
              <th className="px-4 py-3 text-right font-medium text-amber-500">Credits</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Top model</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Services</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Loading…</td></tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No usage data for {selectedMonth}</td></tr>
            )}
            {!loading && filtered.map((u: UserMonthly) => {
              const topModel = Object.entries(u.by_model).sort((a, b) => (b[1] as number) - (a[1] as number))[0]
              const services = Object.keys(u.by_service)
              const credits = u.total_credits ?? 0

              return (
                <tr key={u.party_id} className="hover:bg-gray-50/70 cursor-pointer transition-colors"
                  onClick={() => setSelectedUser(u.party_id)}>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs text-gray-700">{u.party_id}</span>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-700">{fmt(u.total_requests)}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{fmt(u.total_tokens)}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`font-bold ${credits > 50 ? 'text-rose-600' : credits > 20 ? 'text-amber-600' : 'text-gray-700'}`}>
                      {fmtC(credits)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {topModel && (
                      <span className={`px-1.5 py-0.5 rounded border text-xs font-mono ${modelBadge(topModel[0])}`}>
                        {topModel[0]}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {services.slice(0, 3).map(s => (
                        <span key={s} className="px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 text-xs">{s}</span>
                      ))}
                      {services.length > 3 && (
                        <span className="text-xs text-gray-400">+{services.length - 3}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <FiChevronRight className="w-4 h-4 text-gray-300 inline" />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* User detail drawer */}
      {selectedUser && (
        <UserDetailDrawer
          partyId={selectedUser}
          onClose={() => setSelectedUser(null)}
        />
      )}
    </div>
  )
}
