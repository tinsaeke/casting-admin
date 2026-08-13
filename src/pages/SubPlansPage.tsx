import { useEffect, useState } from 'react'
import { adminAPI } from '@/config/api'
import PageHeader from '@/components/common/PageHeader'
import {
  FiRefreshCw, FiPlus, FiEdit2, FiTrash2, FiToggleLeft, FiToggleRight,
  FiCheck, FiX, FiBarChart2, FiUsers, FiPackage,
} from 'react-icons/fi'

// ── Types ─────────────────────────────────────────────────────────────────────
interface Plan {
  _id: string
  type: string
  period: string
  durationInDays: number
  price: number
  description: string
  features: string[]
  isActive: boolean
  isPopular: boolean
  sortOrder: number
  audience: string
  maxCastingCalls: number
  maxAuditionReviews: number
  maxAiScriptAnalyses: number
  maxTalentSearches: number
  maxBookings: number
  maxLocationScouting: number
  extraQuotas?: Record<string, number>
}

// Period → default days (auto-fill when period selected)
const PERIOD_DEFAULTS: Record<string, number> = {
  monthly:     30,
  quarterly:   90,
  half_annual: 180,
  annual:      365,
}

const DEFAULT_TYPES   = ['free', 'standard', 'growth', 'professional', 'enterprise']
const DEFAULT_PERIODS = ['monthly', 'quarterly', 'half_annual', 'annual']
const AUDIENCES       = ['all', 'talent', 'agency', 'studio', 'crew']

const EMPTY_FORM = {
  type: 'growth', period: 'annual', durationInDays: 365, price: 0,
  description: '', features: '', isActive: true, isPopular: false,
  sortOrder: 1, audience: 'all',
  maxCastingCalls: 10, maxAuditionReviews: 100, maxAiScriptAnalyses: 10,
  maxTalentSearches: 200, maxBookings: 20, maxLocationScouting: 30,
  extraQuotas: '',
}

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: string | number }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3">
      <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-orange-500" />
      </div>
      <div>
        <p className="text-xl font-black text-gray-900">{value}</p>
        <p className="text-[10px] text-gray-500 font-semibold">{label}</p>
      </div>
    </div>
  )
}

function QRow({ label, field, val, onChange }: { label: string; field: string; val: number; onChange: (f: string, v: number) => void }) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-[10px] text-gray-500 w-36 shrink-0">{label}</label>
      <input
        type="number"
        min={0}
        value={val === 0 ? '' : val}
        placeholder="0"
        onChange={e => onChange(field, e.target.value === '' ? 0 : Math.max(0, parseInt(e.target.value)))}
        className="w-20 px-2 py-1 border border-gray-200 rounded-lg text-xs text-right focus:outline-none focus:border-orange-400"
      />
    </div>
  )
}

export default function SubPlansPage() {
  const [plans,    setPlans]    = useState<Plan[]>([])
  const [stats,    setStats]    = useState<any>(null)
  const [loading,  setLoading]  = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editPlan, setEditPlan] = useState<Plan | null>(null)
  const [form,     setForm]     = useState({ ...EMPTY_FORM })
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState('')
  const [syncMsg,  setSyncMsg]  = useState('')

  // ── Dynamic type list ────────────────────────────────────────────────────
  const [typeList,     setTypeList]     = useState<string[]>(DEFAULT_TYPES)
  const [newTypeInput, setNewTypeInput] = useState('')

  const addType = () => {
    const t = newTypeInput.trim().toLowerCase().replace(/\s+/g, '_')
    if (t && !typeList.includes(t)) { setTypeList(prev => [...prev, t]); set('type', t) }
    setNewTypeInput('')
  }
  const removeType = (t: string) => {
    setTypeList(prev => prev.filter(x => x !== t))
    if (form.type === t) set('type', typeList.find(x => x !== t) || '')
  }

  // ── Dynamic period list ──────────────────────────────────────────────────
  const [periodList,     setPeriodList]     = useState<string[]>(DEFAULT_PERIODS)
  const [newPeriodInput, setNewPeriodInput] = useState('')

  const addPeriod = () => {
    const p = newPeriodInput.trim().toLowerCase().replace(/\s+/g, '_')
    if (p && !periodList.includes(p)) { setPeriodList(prev => [...prev, p]) }
    setNewPeriodInput('')
  }
  const removePeriod = (p: string) => {
    setPeriodList(prev => prev.filter(x => x !== p))
    if (form.period === p) handlePeriodChange(periodList.find(x => x !== p) || 'monthly')
  }

  // Period change → auto-fill durationInDays from defaults, but keep editable
  const handlePeriodChange = (p: string) => {
    setForm(f => ({
      ...f,
      period: p,
      durationInDays: PERIOD_DEFAULTS[p] ?? f.durationInDays,
    }))
  }

  const load = async () => {
    setLoading(true)
    try {
      const [pl, st] = await Promise.all([adminAPI.subPlans(), adminAPI.subPlanStats()])
      setPlans(Array.isArray(pl) ? pl : pl?.data || [])
      setStats(st)
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const openCreate = () => {
    setForm({ ...EMPTY_FORM })
    setEditPlan(null); setShowForm(true); setError('')
  }

  const openEdit = (p: Plan) => {
    setForm({
      type: p.type, period: p.period, durationInDays: p.durationInDays, price: p.price,
      description: p.description, features: p.features.join('\n'), isActive: p.isActive,
      isPopular: p.isPopular, sortOrder: p.sortOrder, audience: p.audience,
      maxCastingCalls: p.maxCastingCalls, maxAuditionReviews: p.maxAuditionReviews,
      maxAiScriptAnalyses: p.maxAiScriptAnalyses, maxTalentSearches: p.maxTalentSearches,
      maxBookings: p.maxBookings, maxLocationScouting: p.maxLocationScouting,
      extraQuotas: p.extraQuotas ? JSON.stringify(p.extraQuotas, null, 2) : '',
    })
    // Ensure existing plan's type/period appear in the lists
    if (!typeList.includes(p.type))   setTypeList(prev => [...prev, p.type])
    if (!periodList.includes(p.period)) setPeriodList(prev => [...prev, p.period])
    setEditPlan(p); setShowForm(true); setError('')
  }

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    // Validation
    if (!form.type.trim()) { setError('Type is required'); return }
    if (!form.period.trim()) { setError('Period is required'); return }
    if (form.durationInDays < 1) { setError('Duration must be at least 1 day'); return }
    if (form.price < 0) { setError('Price cannot be negative'); return }
    setSaving(true); setError('')
    try {
      const body: any = {
        type: form.type, period: form.period, durationInDays: form.durationInDays,
        price: form.price, description: form.description,
        features: form.features.split('\n').map(s => s.trim()).filter(Boolean),
        isActive: form.isActive, isPopular: form.isPopular, sortOrder: form.sortOrder,
        audience: form.audience, maxCastingCalls: form.maxCastingCalls,
        maxAuditionReviews: form.maxAuditionReviews, maxAiScriptAnalyses: form.maxAiScriptAnalyses,
        maxTalentSearches: form.maxTalentSearches, maxBookings: form.maxBookings,
        maxLocationScouting: form.maxLocationScouting,
      }
      if (form.extraQuotas.trim()) {
        try { body.extraQuotas = JSON.parse(form.extraQuotas) }
        catch { setError('extraQuotas must be valid JSON'); setSaving(false); return }
      }
      editPlan ? await adminAPI.updateSubPlan(editPlan._id, body) : await adminAPI.createSubPlan(body)
      setShowForm(false); await load()
    } catch (e: any) { setError(e.message || 'Save failed') }
    setSaving(false)
  }

  const handleToggle  = async (p: Plan) => { try { await adminAPI.toggleSubPlan(p._id); await load() } catch (e: any) { alert(e.message) } }
  const handleDelete  = async (p: Plan) => { if (!confirm(`Deactivate "${p.type} / ${p.period}"?`)) return; try { await adminAPI.deleteSubPlan(p._id); await load() } catch (e: any) { alert(e.message) } }
  const handleSyncAll = async (id: string) => {
    setSyncMsg('Syncing…')
    try { await adminAPI.syncAllLimits(id); setSyncMsg('Synced ✓') } catch (e: any) { setSyncMsg('Failed: ' + e.message) }
    setTimeout(() => setSyncMsg(''), 3000)
  }

  return (
    <div>
      <PageHeader title="Subscription Plans" subtitle="Manage casting subscription catalog" actions={
        <div className="flex gap-2">
          <button onClick={load} disabled={loading} className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition disabled:opacity-40">
            <FiRefreshCw className={`w-4 h-4 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={openCreate} className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-bold transition">
            <FiPlus className="w-3.5 h-3.5" /> New Plan
          </button>
        </div>
      } />

      {stats && (
        <div className="px-6 py-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard icon={FiPackage}   label="Total Plans"        value={stats.catalog?.total ?? 0} />
          <StatCard icon={FiCheck}     label="Active Plans"       value={stats.catalog?.active ?? 0} />
          <StatCard icon={FiUsers}     label="Total Subscribers"  value={stats.subscribers?.totalSubscribers ?? 0} />
          <StatCard icon={FiBarChart2} label="Active Subscribers" value={stats.subscribers?.activeSubscribers ?? 0} />
        </div>
      )}

      {syncMsg && <div className="mx-6 mb-3 px-4 py-2 bg-green-50 border border-green-200 rounded-xl text-xs font-bold text-green-700">{syncMsg}</div>}

      <div className="px-6 pb-8">
        {loading ? (
          <div className="flex justify-center py-20"><FiRefreshCw className="w-6 h-6 animate-spin text-gray-400" /></div>
        ) : plans.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl py-20 text-center">
            <FiPackage className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">No subscription plans yet</p>
            <button onClick={openCreate} className="mt-3 px-4 py-2 bg-orange-500 text-white rounded-xl text-xs font-bold">Create First Plan</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {plans.map(p => (
              <div key={p._id} className={`bg-white border rounded-xl overflow-hidden ${!p.isActive ? 'opacity-60' : ''} ${p.isPopular ? 'border-orange-300 ring-1 ring-orange-200' : 'border-gray-200'}`}>
                <div className="px-4 py-3 border-b border-gray-100 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded-full border text-[10px] font-black uppercase bg-gray-100 text-gray-600 border-gray-200">{p.type}</span>
                      <span className="text-[10px] text-gray-400 font-semibold capitalize">{p.period.replace(/_/g, ' ')}</span>
                      {p.isPopular && <span className="px-1.5 py-0.5 bg-orange-100 text-orange-600 rounded text-[9px] font-black">POPULAR</span>}
                      {!p.isActive && <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded text-[9px] font-black">INACTIVE</span>}
                    </div>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-1">{p.description}</p>
                  </div>
                  <p className="text-lg font-black text-gray-900 shrink-0">{p.price.toLocaleString()} <span className="text-xs text-gray-400 font-normal">ETB</span></p>
                </div>
                <div className="px-4 py-3 grid grid-cols-2 gap-x-3 gap-y-1 text-[10px]">
                  {[['Casting Calls',p.maxCastingCalls],['Audition Reviews',p.maxAuditionReviews],['AI Analyses',p.maxAiScriptAnalyses],['Talent Searches',p.maxTalentSearches],['Bookings',p.maxBookings],['Location Scouting',p.maxLocationScouting]].map(([l,v])=>(
                    <div key={l as string} className="flex justify-between"><span className="text-gray-400">{l as string}</span><span className="font-bold text-gray-700">{(v as number).toLocaleString()}</span></div>
                  ))}
                </div>
                {p.features.length > 0 && (
                  <div className="px-4 pb-3 space-y-0.5">
                    {p.features.slice(0,3).map((f,i)=><p key={i} className="text-[10px] text-gray-500 flex items-center gap-1"><FiCheck className="w-2.5 h-2.5 text-green-500 shrink-0"/>{f}</p>)}
                    {p.features.length>3 && <p className="text-[10px] text-gray-400">+{p.features.length-3} more</p>}
                  </div>
                )}
                <div className="px-4 py-3 border-t border-gray-100 flex gap-2 flex-wrap">
                  <button onClick={()=>openEdit(p)} className="flex items-center gap-1 px-2.5 py-1 border border-gray-200 rounded-lg text-[10px] font-bold text-gray-600 hover:bg-gray-50 transition"><FiEdit2 className="w-3 h-3"/>Edit</button>
                  <button onClick={()=>handleToggle(p)} className={`flex items-center gap-1 px-2.5 py-1 border rounded-lg text-[10px] font-bold transition ${p.isActive?'border-amber-200 text-amber-600 hover:bg-amber-50':'border-green-200 text-green-600 hover:bg-green-50'}`}>
                    {p.isActive?<><FiToggleRight className="w-3 h-3"/>Deactivate</>:<><FiToggleLeft className="w-3 h-3"/>Activate</>}
                  </button>
                  <button onClick={()=>handleSyncAll(p._id)} className="flex items-center gap-1 px-2.5 py-1 border border-blue-200 text-blue-600 rounded-lg text-[10px] font-bold hover:bg-blue-50 transition"><FiRefreshCw className="w-3 h-3"/>Sync</button>
                  <button onClick={()=>handleDelete(p)} className="flex items-center gap-1 px-2.5 py-1 border border-red-200 text-red-500 rounded-lg text-[10px] font-bold hover:bg-red-50 transition ml-auto"><FiTrash2 className="w-3 h-3"/>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Create / Edit Modal ── */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl my-6 shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-black text-gray-900">{editPlan ? 'Edit Plan' : 'Create Plan'}</h2>
              <button onClick={()=>setShowForm(false)} className="p-1.5 hover:bg-gray-100 rounded-lg transition"><FiX className="w-4 h-4 text-gray-400"/></button>
            </div>

            <div className="px-6 py-5 space-y-5">
              {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-semibold">{error}</div>}

              {/* ── Type: dynamic chip list + add/remove ── */}
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">Type *</label>
                <div className="flex flex-wrap gap-1.5 mb-2 min-h-[28px]">
                  {typeList.map(t => (
                    <button key={t} type="button" onClick={() => set('type', t)}
                      className={`flex items-center gap-1 pl-2.5 pr-1 py-1 rounded-lg border text-[11px] font-bold transition ${
                        form.type === t ? 'bg-orange-500 border-orange-500 text-white' : 'border-gray-200 text-gray-600 hover:border-orange-400'
                      }`}>
                      {t}
                      <span
                        onClick={e => { e.stopPropagation(); removeType(t) }}
                        className={`ml-0.5 w-4 h-4 flex items-center justify-center rounded hover:bg-black/10 text-[10px] ${form.type === t ? 'text-white/70' : 'text-gray-400'}`}>
                        ✕
                      </span>
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input value={newTypeInput} onChange={e => setNewTypeInput(e.target.value.toLowerCase().replace(/\s+/g,'_'))}
                    onKeyDown={e => e.key==='Enter' && addType()}
                    placeholder="e.g. premium"
                    className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-orange-400"/>
                  <button type="button" onClick={addType}
                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-bold text-gray-700 transition whitespace-nowrap">
                    + Add Type
                  </button>
                </div>
              </div>

              {/* ── Period: dynamic chip list + auto-fill duration ── */}
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">Period *</label>
                <div className="flex flex-wrap gap-1.5 mb-2 min-h-[28px]">
                  {periodList.map(p => (
                    <button key={p} type="button" onClick={() => handlePeriodChange(p)}
                      className={`flex items-center gap-1 pl-2.5 pr-1 py-1 rounded-lg border text-[11px] font-bold transition capitalize ${
                        form.period === p ? 'bg-orange-500 border-orange-500 text-white' : 'border-gray-200 text-gray-600 hover:border-orange-400'
                      }`}>
                      {p.replace(/_/g,' ')}
                      <span
                        onClick={e => { e.stopPropagation(); removePeriod(p) }}
                        className={`ml-0.5 w-4 h-4 flex items-center justify-center rounded hover:bg-black/10 text-[10px] ${form.period === p ? 'text-white/70' : 'text-gray-400'}`}>
                        ✕
                      </span>
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input value={newPeriodInput} onChange={e => setNewPeriodInput(e.target.value.toLowerCase().replace(/\s+/g,'_'))}
                    onKeyDown={e => e.key==='Enter' && addPeriod()}
                    placeholder="e.g. biennial"
                    className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-orange-400"/>
                  <button type="button" onClick={addPeriod}
                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-bold text-gray-700 transition whitespace-nowrap">
                    + Add Period
                  </button>
                </div>
              </div>

              {/* ── Price / Duration (auto-filled) / Sort ── */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Price (ETB)</label>
                  <input
                    type="number"
                    min={0}
                    value={form.price === 0 ? '' : form.price}
                    placeholder="0"
                    onChange={e => set('price', e.target.value === '' ? 0 : Math.max(0, Number(e.target.value)))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-orange-400"/>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Duration (days)</label>
                  <input
                    type="number"
                    min={1}
                    value={form.durationInDays || ''}
                    placeholder="365"
                    onChange={e => set('durationInDays', e.target.value === '' ? 0 : Math.max(1, parseInt(e.target.value)))}
                    className="w-full px-3 py-2 border border-orange-200 bg-orange-50 rounded-lg text-xs focus:outline-none focus:border-orange-400"/>
                  <p className="text-[9px] text-orange-400 mt-0.5">Auto-filled · override if needed</p>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Sort Order</label>
                  <input
                    type="number"
                    min={0}
                    value={form.sortOrder === 0 ? '' : form.sortOrder}
                    placeholder="1"
                    onChange={e => set('sortOrder', e.target.value === '' ? 0 : Math.max(0, parseInt(e.target.value)))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-orange-400"/>
                </div>
              </div>

              {/* ── Audience ── */}
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Audience</label>
                <select value={form.audience} onChange={e => set('audience', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-orange-400">
                  {AUDIENCES.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>

              {/* ── Description ── */}
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Description</label>
                <input value={form.description} onChange={e => set('description', e.target.value)}
                  placeholder="Growth — for active production studios"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-orange-400"/>
              </div>

              {/* ── Features ── */}
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Features (one per line)</label>
                <textarea rows={3} value={form.features} onChange={e => set('features', e.target.value)}
                  placeholder={'Up to 15 casting calls/year\nAI audition scoring'}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-orange-400 resize-none"/>
              </div>

              {/* ── Quotas ── */}
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2">Quotas</label>
                <div className="grid grid-cols-2 gap-2">
                  <QRow label="Casting Calls"      field="maxCastingCalls"     val={form.maxCastingCalls}     onChange={set}/>
                  <QRow label="Audition Reviews"   field="maxAuditionReviews"  val={form.maxAuditionReviews}  onChange={set}/>
                  <QRow label="AI Script Analyses" field="maxAiScriptAnalyses" val={form.maxAiScriptAnalyses} onChange={set}/>
                  <QRow label="Talent Searches"    field="maxTalentSearches"   val={form.maxTalentSearches}   onChange={set}/>
                  <QRow label="Bookings"           field="maxBookings"         val={form.maxBookings}         onChange={set}/>
                  <QRow label="Location Scouting"  field="maxLocationScouting" val={form.maxLocationScouting} onChange={set}/>
                </div>
              </div>

              {/* ── Extra quotas ── */}
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Extra Quotas (JSON, optional)</label>
                <textarea rows={2} value={form.extraQuotas} onChange={e => set('extraQuotas', e.target.value)}
                  placeholder='{"featured_call_boosts": 3}'
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-mono focus:outline-none focus:border-orange-400 resize-none"/>
              </div>

              {/* ── Flags ── */}
              <div className="flex gap-4">
                {[{field:'isActive',label:'Active'},{field:'isPopular',label:'Popular (highlighted)'}].map(({field,label})=>(
                  <label key={field} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={(form as any)[field]} onChange={e => set(field, e.target.checked)} className="w-4 h-4 rounded accent-orange-500"/>
                    <span className="text-xs font-semibold text-gray-700">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-3 px-6 pb-5">
              <button onClick={()=>setShowForm(false)}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 transition">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-xl text-xs font-black transition">
                {saving ? <FiRefreshCw className="w-3.5 h-3.5 animate-spin"/> : <FiCheck className="w-3.5 h-3.5"/>}
                {editPlan ? 'Save Changes' : 'Create Plan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
