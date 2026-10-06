import { useEffect, useState } from 'react'
import { adminAPI } from '@/config/api'
import PageHeader from '@/components/common/PageHeader'
import {
  FiRefreshCw, FiPlus, FiEdit2, FiTrash2, FiToggleLeft, FiToggleRight,
  FiCheck, FiX, FiBarChart2, FiUsers, FiPackage,
  FiChevronRight, FiChevronDown,
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
  isPopular?: boolean
  isRecommended?: boolean
  sortOrder: number
  /** API returns string[] — legacy plans may still send a plain string */
  audience: string | string[]
  maxCastingCalls: number
  maxAuditionReviews: number
  maxAiScriptAnalyses: number
  maxTalentSearches: number
  maxBookings: number
  maxLocationScouting: number
  maxVideoGenerations?: number
  extraQuotas?: Record<string, number>
  createdAt?: string
  updatedAt?: string
}

/** Normalise whatever the API sends to a string[] */
function toAudienceArray(raw: string | string[] | undefined | null): string[] {
  if (!raw) return ['all']
  if (Array.isArray(raw)) return raw.length > 0 ? raw : ['all']
  return [raw]
}

/** Display label for a single audience value */
function audienceLabel(a: string): string {
  return AUDIENCE_CONFIG[a]?.label ?? a.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
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

/** All valid audience values — 9 roles + "all" */
const ALL_AUDIENCES = [
  'all',
  'talent',
  'cast_agency',
  'production_studio',
  'content_creator',
  'academy',
  'location_scout',
  'aggregator_scout',
  'organization',
]

const AUDIENCE_CONFIG: Record<string, { label: string; color: string; badge: string }> = {
  all:               { label: 'All Users',          color: 'text-purple-600',  badge: 'bg-purple-50  text-purple-700  border-purple-200'  },
  talent:            { label: 'Talent / Actors',    color: 'text-blue-600',    badge: 'bg-blue-50    text-blue-700    border-blue-200'    },
  cast_agency:       { label: 'Casting Agencies',   color: 'text-emerald-600', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  production_studio: { label: 'Production Studios', color: 'text-amber-600',   badge: 'bg-amber-50   text-amber-700   border-amber-200'   },
  content_creator:   { label: 'Content Creators',   color: 'text-rose-600',    badge: 'bg-rose-50    text-rose-700    border-rose-200'    },
  academy:           { label: 'Academies',           color: 'text-indigo-600',  badge: 'bg-indigo-50  text-indigo-700  border-indigo-200'  },
  location_scout:    { label: 'Location Scouts',    color: 'text-teal-600',    badge: 'bg-teal-50    text-teal-700    border-teal-200'    },
  aggregator_scout:  { label: 'Aggregator Scouts',  color: 'text-cyan-600',    badge: 'bg-cyan-50    text-cyan-700    border-cyan-200'    },
  organization:      { label: 'Organizations',      color: 'text-orange-600',  badge: 'bg-orange-50  text-orange-700  border-orange-200'  },
}

// ── Form state shape ───────────────────────────────────────────────────────────
interface FormState {
  type: string
  period: string
  durationInDays: number
  price: number
  description: string
  features: string       // newline-separated textarea
  isActive: boolean
  isPopular: boolean
  isRecommended: boolean
  sortOrder: number
  audience: string[]     // always an array now
  maxCastingCalls: number
  maxAuditionReviews: number
  maxAiScriptAnalyses: number
  maxTalentSearches: number
  maxBookings: number
  maxLocationScouting: number
  maxVideoGenerations: number
  extraQuotas: string    // JSON textarea
}

const EMPTY_FORM: FormState = {
  type: 'growth', period: 'annual', durationInDays: 365, price: 0,
  description: '', features: '', isActive: true, isPopular: false, isRecommended: false,
  sortOrder: 1, audience: ['all'],
  maxCastingCalls: 10, maxAuditionReviews: 100, maxAiScriptAnalyses: 10,
  maxTalentSearches: 200, maxBookings: 20, maxLocationScouting: 30,
  maxVideoGenerations: 30,
  extraQuotas: '',
}

// ── Small reusable components ─────────────────────────────────────────────────
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

/** Pretty labels for quota fields */
function formatQuotaKey(key: string): string {
  let clean = key.startsWith('max') ? key.slice(3) : key
  clean = clean.replace(/^Ai([A-Z])/, 'AI $1')
  return clean
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .trim()
    .replace(/^Ai\b/i, 'AI')
}

/** Automatically extracts all standard and dynamic quotas fetched from the backend */
function extractAllQuotas(plan: Record<string, any>): { key: string; label: string; value: number }[] {
  const quotas: { key: string; label: string; value: number }[] = []
  const seen = new Set<string>()

  // Standard ordered primary quota keys
  const primaryKeys = [
    'maxCastingCalls',
    'maxAuditionReviews',
    'maxAiScriptAnalyses',
    'maxTalentSearches',
    'maxBookings',
    'maxLocationScouting',
    'maxVideoGenerations',
  ]

  primaryKeys.forEach(k => {
    if (k in plan && typeof plan[k] === 'number') {
      quotas.push({ key: k, label: formatQuotaKey(k), value: plan[k] })
      seen.add(k)
    }
  })

  // Automatically find any OTHER numeric quota fields returned by the backend (starting with max)
  Object.keys(plan).forEach(k => {
    if (!seen.has(k) && k.startsWith('max') && typeof plan[k] === 'number') {
      quotas.push({ key: k, label: formatQuotaKey(k), value: plan[k] })
      seen.add(k)
    }
  })

  // Also include any extraQuotas dictionary entries
  if (plan.extraQuotas && typeof plan.extraQuotas === 'object') {
    Object.entries(plan.extraQuotas).forEach(([k, v]) => {
      if (!seen.has(k) && typeof v === 'number') {
        quotas.push({ key: k, label: formatQuotaKey(k), value: v })
        seen.add(k)
      }
    })
  }

  return quotas
}

// ── Audience multi-select checkboxes ─────────────────────────────────────────
function AudienceCheckboxes({
  selected,
  onChange,
}: {
  selected: string[]
  onChange: (next: string[]) => void
}) {
  const toggle = (val: string) => {
    if (val === 'all') {
      // Selecting "all" clears everything else; deselecting leaves at least ['all']
      onChange(selected.includes('all') && selected.length === 1 ? ['all'] : ['all'])
      return
    }
    // Selecting a specific role removes 'all' if it was the only selection
    const withoutAll = selected.filter(s => s !== 'all')
    const next = withoutAll.includes(val)
      ? withoutAll.filter(s => s !== val)
      : [...withoutAll, val]
    onChange(next.length > 0 ? next : ['all'])
  }

  return (
    <div className="flex flex-wrap gap-2">
      {ALL_AUDIENCES.map(a => {
        const checked = selected.includes(a)
        const conf = AUDIENCE_CONFIG[a]
        return (
          <label
            key={a}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-bold cursor-pointer transition select-none ${
              checked
                ? 'bg-orange-500 border-orange-500 text-white'
                : 'border-gray-200 text-gray-600 hover:border-orange-400 bg-white'
            }`}
          >
            <input
              type="checkbox"
              className="sr-only"
              checked={checked}
              onChange={() => toggle(a)}
            />
            {checked && <FiCheck className="w-3 h-3 shrink-0" />}
            {conf?.label ?? a}
          </label>
        )
      })}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function SubPlansPage() {
  const [plans,    setPlans]    = useState<Plan[]>([])
  const [stats,    setStats]    = useState<any>(null)
  const [loading,  setLoading]  = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editPlan, setEditPlan] = useState<Plan | null>(null)
  const [form,     setForm]     = useState<FormState>({ ...EMPTY_FORM })
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

  const handlePeriodChange = (p: string) => {
    setForm(f => ({
      ...f,
      period: p,
      durationInDays: PERIOD_DEFAULTS[p] ?? f.durationInDays,
    }))
  }

  // ── Audience filter (view panel) ─────────────────────────────────────────
  const [audienceFilter,    setAudienceFilter]    = useState('all')
  const [expandedAudiences, setExpandedAudiences] = useState<Record<string, boolean>>({})

  /**
   * Build the grouped display.
   * A plan whose audience is ['cast_agency', 'production_studio'] appears
   * under a combined key so it's shown once, not duplicated.
   */
  const plansByKey = (planList: Plan[], filter: string): Record<string, Plan[]> => {
    const filtered = filter === 'all'
      ? planList
      : planList.filter(p => {
          const aud = toAudienceArray(p.audience)
          return aud.includes(filter) || aud.includes('all')
        })

    return filtered.reduce((acc, p) => {
      // Use the joined audiences as the grouping key so multi-audience plans
      // appear in one bucket rather than being duplicated across rows.
      const key = toAudienceArray(p.audience).sort().join(',')
      ;(acc[key] ??= []).push(p)
      return acc
    }, {} as Record<string, Plan[]>)
  }

  const initExpanded = (plansList: Plan[]) => {
    const keys = new Set(plansList.map(p => toAudienceArray(p.audience).sort().join(',')))
    setExpandedAudiences(prev => {
      const next = { ...prev }
      keys.forEach(k => { if (next[k] === undefined) next[k] = true })
      return next
    })
  }

  const load = async () => {
    setLoading(true)
    try {
      const [pl, st] = await Promise.all([adminAPI.subPlans(), adminAPI.subPlanStats()])
      const planArray = Array.isArray(pl) ? pl : pl?.data || []
      setPlans(planArray)
      initExpanded(planArray)
      setStats(st)
    } catch {}
    setLoading(false)
  }

  const toggleGroup = (key: string) =>
    setExpandedAudiences(prev => ({ ...prev, [key]: !prev[key] }))

  const expandAll = (expand: boolean) =>
    setExpandedAudiences(prev =>
      Object.fromEntries(Object.keys(prev).map(k => [k, expand]))
    )

  useEffect(() => { load() }, [])

  const openCreate = () => {
    setForm({ ...EMPTY_FORM })
    setEditPlan(null); setShowForm(true); setError('')
  }

  const openEdit = (p: Plan) => {
    setForm({
      type: p.type, period: p.period, durationInDays: p.durationInDays, price: p.price,
      description: p.description || '',
      features: (p.features || []).join('\n'),
      isActive: p.isActive,
      isPopular: p.isPopular ?? false,
      isRecommended: p.isRecommended ?? false,
      sortOrder: p.sortOrder ?? 1,
      audience: toAudienceArray(p.audience),   // always normalise to string[]
      maxCastingCalls:     p.maxCastingCalls ?? 0,
      maxAuditionReviews:  p.maxAuditionReviews ?? 0,
      maxAiScriptAnalyses: p.maxAiScriptAnalyses ?? 0,
      maxTalentSearches:   p.maxTalentSearches ?? 0,
      maxBookings:         p.maxBookings ?? 0,
      maxLocationScouting: p.maxLocationScouting ?? 0,
      maxVideoGenerations: p.maxVideoGenerations ?? 0,
      extraQuotas: p.extraQuotas ? JSON.stringify(p.extraQuotas, null, 2) : '',
    })
    if (!typeList.includes(p.type))     setTypeList(prev => [...prev, p.type])
    if (!periodList.includes(p.period)) setPeriodList(prev => [...prev, p.period])
    setEditPlan(p); setShowForm(true); setError('')
  }

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.type.trim())       { setError('Type is required'); return }
    if (!form.period.trim())     { setError('Period is required'); return }
    if (form.durationInDays < 1) { setError('Duration must be at least 1 day'); return }
    if (form.price < 0)          { setError('Price cannot be negative'); return }
    if (form.audience.length === 0) { setError('At least one audience must be selected'); return }

    setSaving(true); setError('')
    try {
      const body: any = {
        type: form.type, period: form.period, durationInDays: form.durationInDays,
        price: form.price, description: form.description,
        features: form.features.split('\n').map(s => s.trim()).filter(Boolean),
        isActive: form.isActive,
        isPopular: form.isPopular,
        isRecommended: form.isRecommended,
        sortOrder: form.sortOrder,
        audience: form.audience,    // ← always sent as string[]
        maxCastingCalls:     form.maxCastingCalls,
        maxAuditionReviews:  form.maxAuditionReviews,
        maxAiScriptAnalyses: form.maxAiScriptAnalyses,
        maxTalentSearches:   form.maxTalentSearches,
        maxBookings:         form.maxBookings,
        maxLocationScouting: form.maxLocationScouting,
        maxVideoGenerations: form.maxVideoGenerations,
      }
      if (form.extraQuotas.trim()) {
        try { body.extraQuotas = JSON.parse(form.extraQuotas) }
        catch { setError('extraQuotas must be valid JSON'); setSaving(false); return }
      }
      editPlan
        ? await adminAPI.updateSubPlan(editPlan._id, body)
        : await adminAPI.createSubPlan(body)
      setShowForm(false); await load()
    } catch (e: any) { setError(e.message || 'Save failed') }
    setSaving(false)
  }

  const handleToggle  = async (p: Plan) => { try { await adminAPI.toggleSubPlan(p._id); await load() } catch (e: any) { alert(e.message) } }
  const handleDelete  = async (p: Plan) => {
    if (!confirm(`Delete "${p.type} / ${p.period}"?`)) return
    try { await adminAPI.deleteSubPlan(p._id); await load() } catch (e: any) { alert(e.message) }
  }
  const handleSyncAll = async (id: string) => {
    setSyncMsg('Syncing…')
    try { await adminAPI.syncAllLimits(id); setSyncMsg('Synced ✓') }
    catch (e: any) { setSyncMsg('Failed: ' + e.message) }
    setTimeout(() => setSyncMsg(''), 3000)
  }

  // ── Grouped plan display ──────────────────────────────────────────────────
  const grouped = plansByKey(plans, audienceFilter)

  const filterUI = (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 bg-white p-3.5 border border-gray-200 rounded-xl shadow-sm">
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">Filter:</span>
        <select
          value={audienceFilter}
          onChange={e => setAudienceFilter(e.target.value)}
          className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold text-gray-800 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
        >
          <option value="all">🌟 All Audiences ({plans.length})</option>
          {ALL_AUDIENCES.filter(a => a !== 'all').map(a => {
            const count = plans.filter(p => {
              const aud = toAudienceArray(p.audience)
              return aud.includes(a) || aud.includes('all')
            }).length
            return (
              <option key={a} value={a}>
                {audienceLabel(a)} ({count})
              </option>
            )
          })}
        </select>
        {/* Quick pill selectors on wide screens */}
        <div className="hidden lg:flex items-center gap-1.5 pl-2 border-l border-gray-200">
          <button
            onClick={() => setAudienceFilter('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
              audienceFilter === 'all' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All ({plans.length})
          </button>
          {ALL_AUDIENCES.filter(a => a !== 'all').map(a => {
            const count = plans.filter(p => {
              const aud = toAudienceArray(p.audience)
              return aud.includes(a) || aud.includes('all')
            }).length
            return (
              <button
                key={a}
                onClick={() => setAudienceFilter(a)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                  audienceFilter === a ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {audienceLabel(a)} ({count})
              </button>
            )
          })}
        </div>
      </div>
      <div className="flex items-center gap-2 self-end sm:self-auto">
        <button type="button" onClick={() => expandAll(true)}
          className="text-[11px] font-semibold text-gray-500 hover:text-orange-600 px-2 py-1 hover:bg-orange-50 rounded transition">
          Expand All
        </button>
        <span className="text-gray-300 text-xs">•</span>
        <button type="button" onClick={() => expandAll(false)}
          className="text-[11px] font-semibold text-gray-500 hover:text-orange-600 px-2 py-1 hover:bg-orange-50 rounded transition">
          Collapse All
        </button>
      </div>
    </div>
  )

  const plansGrid = (
    <div className="space-y-6">
      {Object.entries(grouped).map(([key, group]) => {
        const isExpanded = expandedAudiences[key] !== false
        // Build the header label from the comma-separated key
        const audiences = key.split(',')
        const headerLabel = audiences.map(a => audienceLabel(a)).join(' + ')
        const headerBadge = audiences.length === 1
          ? (AUDIENCE_CONFIG[audiences[0]] || { badge: 'bg-gray-50 text-gray-700 border-gray-200' }).badge
          : 'bg-purple-50 text-purple-700 border-purple-200'
        const activeCount = group.filter(p => p.isActive).length

        return (
          <div key={key} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <div
              className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-gray-50 to-white hover:bg-gray-100/70 transition cursor-pointer select-none border-b border-gray-100"
              onClick={() => toggleGroup(key)}
            >
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-lg bg-white border border-gray-200 flex items-center justify-center shadow-2xs">
                  {isExpanded
                    ? <FiChevronDown className="w-4 h-4 text-orange-500" />
                    : <FiChevronRight className="w-4 h-4 text-gray-400" />}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-black text-gray-900">{headerLabel}</h3>
                    {audiences.map(a => (
                      <span key={a} className={`px-2 py-0.5 rounded-full border text-[10px] font-black uppercase ${headerBadge}`}>
                        {a}
                      </span>
                    ))}
                  </div>
                  <p className="text-[11px] text-gray-500 font-medium mt-0.5">
                    {group.length} {group.length === 1 ? 'plan' : 'plans'} · {activeCount} active
                  </p>
                </div>
              </div>
            </div>

            {isExpanded && (
              <div className="p-5 bg-gray-50/50">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {group.map(p => (
                    <div key={p._id} className={`bg-white border rounded-xl overflow-hidden transition-all ${!p.isActive ? 'opacity-60' : ''} ${p.isPopular ? 'border-orange-300 ring-1 ring-orange-200 shadow-sm' : 'border-gray-200'}`}>
                      <div className="px-4 py-3 border-b border-gray-100 flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2 py-0.5 rounded-full border text-[10px] font-black uppercase bg-gray-100 text-gray-600 border-gray-200">{p.type}</span>
                            <span className="text-[10px] text-gray-400 font-semibold capitalize">{p.period.replace(/_/g, ' ')}</span>
                            {p.isPopular && <span className="px-1.5 py-0.5 bg-orange-100 text-orange-600 rounded text-[9px] font-black">POPULAR</span>}
                            {p.isRecommended && <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded text-[9px] font-black">RECOMMENDED</span>}
                            {!p.isActive && <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded text-[9px] font-black">INACTIVE</span>}
                          </div>
                          {/* Audience badges on the card */}
                          <div className="flex flex-wrap gap-1 mt-1">
                            {toAudienceArray(p.audience).map(a => (
                              <span key={a} className={`px-1.5 py-0.5 rounded border text-[8px] font-black uppercase ${(AUDIENCE_CONFIG[a] || AUDIENCE_CONFIG.all).badge}`}>
                                {a}
                              </span>
                            ))}
                          </div>
                          <p className="text-xs text-gray-500 mt-1 line-clamp-1">{p.description}</p>
                        </div>
                        <p className="text-lg font-black text-gray-900 shrink-0">
                          {p.price.toLocaleString()} <span className="text-xs text-gray-400 font-normal">ETB</span>
                        </p>
                      </div>
                      <div className="px-4 py-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-[10px]">
                        {extractAllQuotas(p).map(({ key, label, value }) => (
                          <div key={key} className="flex justify-between items-center py-0.5 border-b border-gray-50 last:border-0">
                            <span className="text-gray-500 font-medium truncate pr-1" title={label}>{label}</span>
                            <span className="font-bold text-gray-800 bg-gray-50 px-1.5 py-0.5 rounded shrink-0">{value.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                      <div className="px-4 py-1.5 bg-gray-50/60 border-t border-b border-gray-100 flex items-center justify-between text-[9px] text-gray-400">
                        <span>Duration: <strong className="text-gray-600">{p.durationInDays || 365}d</strong></span>
                        <span>Sort Order: <strong className="text-gray-600">{p.sortOrder ?? 1}</strong></span>
                      </div>
                      {p.features.length > 0 && (
                        <div className="px-4 py-2.5 space-y-0.5">
                          {p.features.slice(0, 3).map((f, i) => (
                            <p key={i} className="text-[10px] text-gray-500 flex items-center gap-1">
                              <FiCheck className="w-2.5 h-2.5 text-green-500 shrink-0" /> {f}
                            </p>
                          ))}
                          {p.features.length > 3 && <p className="text-[10px] text-gray-400">+{p.features.length - 3} more</p>}
                        </div>
                      )}
                      <div className="px-4 py-3 border-t border-gray-100 flex gap-2 flex-wrap">
                        <button onClick={() => openEdit(p)} className="flex items-center gap-1 px-2.5 py-1 border border-gray-200 rounded-lg text-[10px] font-bold text-gray-600 hover:bg-gray-50 transition">
                          <FiEdit2 className="w-3 h-3" /> Edit
                        </button>
                        <button onClick={() => handleToggle(p)} className={`flex items-center gap-1 px-2.5 py-1 border rounded-lg text-[10px] font-bold transition ${p.isActive ? 'border-amber-200 text-amber-600 hover:bg-amber-50' : 'border-green-200 text-green-600 hover:bg-green-50'}`}>
                          {p.isActive ? <><FiToggleRight className="w-3 h-3" /> Deactivate</> : <><FiToggleLeft className="w-3 h-3" /> Activate</>}
                        </button>
                        <button onClick={() => handleSyncAll(p._id)} className="flex items-center gap-1 px-2.5 py-1 border border-blue-200 text-blue-600 rounded-lg text-[10px] font-bold hover:bg-blue-50 transition">
                          <FiRefreshCw className="w-3 h-3" /> Sync
                        </button>
                        <button onClick={() => handleDelete(p)} className="flex items-center gap-1 px-2.5 py-1 border border-red-200 text-red-500 rounded-lg text-[10px] font-bold hover:bg-red-50 transition ml-auto">
                          <FiTrash2 className="w-3 h-3" /> Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )

  return (
    <div>
      <PageHeader
        title="Subscription Plans"
        subtitle="Manage casting subscription catalog"
        actions={
          <div className="flex gap-2">
            <button onClick={load} disabled={loading} className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition disabled:opacity-40">
              <FiRefreshCw className={`w-4 h-4 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={openCreate} className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-bold transition">
              <FiPlus className="w-3.5 h-3.5" /> New Plan
            </button>
          </div>
        }
      />

      {stats && (
        <div className="px-6 py-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard icon={FiPackage}   label="Total Plans"        value={stats.catalog?.total ?? 0} />
          <StatCard icon={FiCheck}     label="Active Plans"       value={stats.catalog?.active ?? 0} />
          <StatCard icon={FiUsers}     label="Total Subscribers"  value={stats.subscribers?.totalSubscribers ?? 0} />
          <StatCard icon={FiBarChart2} label="Active Subscribers" value={stats.subscribers?.activeSubscribers ?? 0} />
        </div>
      )}

      {syncMsg && (
        <div className="mx-6 mb-3 px-4 py-2 bg-green-50 border border-green-200 rounded-xl text-xs font-bold text-green-700">
          {syncMsg}
        </div>
      )}

      <div className="px-6 pb-8">
        {filterUI}

        {loading ? (
          <div className="flex justify-center py-20">
            <FiRefreshCw className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : Object.keys(grouped).length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl py-20 text-center">
            <FiPackage className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">
              No subscription plans found{audienceFilter !== 'all' ? ` for "${audienceFilter}"` : ''}
            </p>
            <button onClick={openCreate} className="mt-3 px-4 py-2 bg-orange-500 text-white rounded-xl text-xs font-bold">
              Create First Plan
            </button>
          </div>
        ) : plansGrid}
      </div>

      {/* ── Create / Edit Modal ── */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl my-6 shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-black text-gray-900">{editPlan ? 'Edit Plan' : 'Create Plan'}</h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 hover:bg-gray-100 rounded-lg transition">
                <FiX className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-semibold">{error}</div>
              )}

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
                  <input value={newTypeInput}
                    onChange={e => setNewTypeInput(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                    onKeyDown={e => e.key === 'Enter' && addType()}
                    placeholder="e.g. premium"
                    className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-orange-400" />
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
                      {p.replace(/_/g, ' ')}
                      <span
                        onClick={e => { e.stopPropagation(); removePeriod(p) }}
                        className={`ml-0.5 w-4 h-4 flex items-center justify-center rounded hover:bg-black/10 text-[10px] ${form.period === p ? 'text-white/70' : 'text-gray-400'}`}>
                        ✕
                      </span>
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input value={newPeriodInput}
                    onChange={e => setNewPeriodInput(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                    onKeyDown={e => e.key === 'Enter' && addPeriod()}
                    placeholder="e.g. biennial"
                    className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-orange-400" />
                  <button type="button" onClick={addPeriod}
                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-bold text-gray-700 transition whitespace-nowrap">
                    + Add Period
                  </button>
                </div>
              </div>

              {/* ── Price / Duration / Sort ── */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Price (ETB)</label>
                  <input type="number" min={0}
                    value={form.price === 0 ? '' : form.price}
                    placeholder="0"
                    onChange={e => set('price', e.target.value === '' ? 0 : Math.max(0, Number(e.target.value)))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-orange-400" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Duration (days)</label>
                  <input type="number" min={1}
                    value={form.durationInDays || ''}
                    placeholder="365"
                    onChange={e => set('durationInDays', e.target.value === '' ? 0 : Math.max(1, parseInt(e.target.value)))}
                    className="w-full px-3 py-2 border border-orange-200 bg-orange-50 rounded-lg text-xs focus:outline-none focus:border-orange-400" />
                  <p className="text-[9px] text-orange-400 mt-0.5">Auto-filled · override if needed</p>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Sort Order</label>
                  <input type="number" min={0}
                    value={form.sortOrder === 0 ? '' : form.sortOrder}
                    placeholder="1"
                    onChange={e => set('sortOrder', e.target.value === '' ? 0 : Math.max(0, parseInt(e.target.value)))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-orange-400" />
                </div>
              </div>

              {/* ── Audience — multi-select checkboxes ── */}
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2">
                  Audience
                  <span className="ml-2 normal-case font-normal text-gray-400">
                    — select one or more roles (or "All Users" for universal)
                  </span>
                </label>
                <AudienceCheckboxes
                  selected={form.audience}
                  onChange={next => set('audience', next)}
                />
                {/* Selected summary */}
                {form.audience.length > 0 && !form.audience.includes('all') && (
                  <p className="mt-1.5 text-[10px] text-gray-500">
                    Selected: <span className="font-bold text-gray-700">{form.audience.map(audienceLabel).join(', ')}</span>
                  </p>
                )}
              </div>

              {/* ── Description ── */}
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Description</label>
                <input value={form.description}
                  onChange={e => set('description', e.target.value)}
                  placeholder="Growth — for active production studios"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-orange-400" />
              </div>

              {/* ── Features ── */}
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Features (one per line)</label>
                <textarea rows={3} value={form.features}
                  onChange={e => set('features', e.target.value)}
                  placeholder={'Up to 15 casting calls/year\nAI audition scoring'}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-orange-400 resize-none" />
              </div>

              {/* ── Quotas ── */}
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2">Quotas</label>
                <div className="grid grid-cols-2 gap-2">
                  <QRow label="Casting Calls"         field="maxCastingCalls"     val={form.maxCastingCalls}     onChange={set} />
                  <QRow label="Audition Reviews"      field="maxAuditionReviews"  val={form.maxAuditionReviews}  onChange={set} />
                  <QRow label="AI Script Analyses"    field="maxAiScriptAnalyses" val={form.maxAiScriptAnalyses} onChange={set} />
                  <QRow label="Talent Searches"       field="maxTalentSearches"   val={form.maxTalentSearches}   onChange={set} />
                  <QRow label="Bookings"              field="maxBookings"         val={form.maxBookings}         onChange={set} />
                  <QRow label="Location Scouting"     field="maxLocationScouting" val={form.maxLocationScouting} onChange={set} />
                  <QRow label="AI Video Generations"  field="maxVideoGenerations" val={form.maxVideoGenerations} onChange={set} />
                </div>
              </div>

              {/* ── Extra quotas ── */}
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Extra Quotas (JSON, optional)</label>
                <textarea rows={2} value={form.extraQuotas}
                  onChange={e => set('extraQuotas', e.target.value)}
                  placeholder='{"featured_call_boosts": 3}'
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-mono focus:outline-none focus:border-orange-400 resize-none" />
              </div>

              {/* ── Flags ── */}
              <div className="flex gap-4 flex-wrap">
                {([
                  { field: 'isActive',      label: 'Active' },
                  { field: 'isPopular',     label: 'Popular (badge)' },
                  { field: 'isRecommended', label: 'Recommended (badge)' },
                ]).map(({ field, label }) => (
                  <label key={field} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox"
                      checked={(form as any)[field]}
                      onChange={e => set(field, e.target.checked)}
                      className="w-4 h-4 rounded accent-orange-500" />
                    <span className="text-xs font-semibold text-gray-700">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-3 px-6 pb-5">
              <button onClick={() => setShowForm(false)}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 transition">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-xl text-xs font-black transition">
                {saving ? <FiRefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FiCheck className="w-3.5 h-3.5" />}
                {editPlan ? 'Save Changes' : 'Create Plan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
