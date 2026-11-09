import { useEffect, useState } from 'react'
import { llmGatewayAPI, ModelPricing } from '@/config/api'
import PageHeader from '@/components/common/PageHeader'
import {
  FiRefreshCw, FiEdit2, FiTrash2, FiPlus, FiCheck, FiX,
  FiCpu, FiZap, FiToggleLeft, FiToggleRight, FiInfo,
} from 'react-icons/fi'

// ── Helpers ───────────────────────────────────────────────────────────────────
function providerBadge(provider: string) {
  if (provider === 'google')
    return 'bg-blue-50 text-blue-700 border border-blue-200'
  if (provider === 'anthropic')
    return 'bg-amber-50 text-amber-700 border border-amber-200'
  return 'bg-emerald-50 text-emerald-700 border border-emerald-200'
}

function multiplierColor(m: number) {
  if (m <= 0.2) return 'text-emerald-600'
  if (m <= 0.5) return 'text-blue-600'
  if (m <= 1.0) return 'text-amber-600'
  return 'text-rose-600'
}

function creditPreview(multiplier: number) {
  return [1, 10, 100].map(k => ({
    tokens: `${k}k`,
    credits: (k * multiplier).toFixed(2),
  }))
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface EditState {
  multiplier: string
  description: string
  enabled: boolean
}

interface NewModel {
  model_name: string
  provider: string
  multiplier: string
  description: string
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function AiModelPricingPage() {
  const [pricing, setPricing]     = useState<ModelPricing[]>([])
  const [formula, setFormula]     = useState('')
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')
  const [editId, setEditId]       = useState<string | null>(null)
  const [editState, setEditState] = useState<EditState>({ multiplier: '', description: '', enabled: true })
  const [saving, setSaving]       = useState(false)
  const [showAdd, setShowAdd]     = useState(false)
  const [newModel, setNewModel]   = useState<NewModel>({ model_name: '', provider: 'local', multiplier: '1.0', description: '' })
  const [toast, setToast]         = useState('')

  const load = async () => {
    setLoading(true); setError('')
    try {
      const res = await llmGatewayAPI.getPricing()
      setPricing(res.pricing)
      setFormula(res.formula)
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const startEdit = (p: ModelPricing) => {
    setEditId(p._id)
    setEditState({ multiplier: String(p.multiplier), description: p.description, enabled: p.enabled })
  }

  const cancelEdit = () => setEditId(null)

  const saveEdit = async (modelName: string) => {
    setSaving(true)
    try {
      await llmGatewayAPI.updatePricing(modelName, {
        multiplier:  parseFloat(editState.multiplier),
        description: editState.description,
        enabled:     editState.enabled,
      })
      showToast(`✓ ${modelName} updated`)
      setEditId(null)
      await load()
    } catch (e: any) { showToast(`Error: ${e.message}`) }
    finally { setSaving(false) }
  }

  const toggleEnabled = async (p: ModelPricing) => {
    try {
      await llmGatewayAPI.updatePricing(p.model_name, { enabled: !p.enabled })
      showToast(`${p.model_name} ${!p.enabled ? 'enabled' : 'disabled'}`)
      await load()
    } catch (e: any) { showToast(`Error: ${e.message}`) }
  }

  const deletePricing = async (p: ModelPricing) => {
    if (!confirm(`Delete pricing for "${p.model_name}"? Requests will default to 1.0× multiplier.`)) return
    try {
      await llmGatewayAPI.deletePricing(p.model_name)
      showToast(`Deleted ${p.model_name}`)
      await load()
    } catch (e: any) { showToast(`Error: ${e.message}`) }
  }

  const addModel = async () => {
    if (!newModel.model_name.trim()) return
    setSaving(true)
    try {
      await llmGatewayAPI.addPricing({
        model:       newModel.model_name.trim(),
        provider:    newModel.provider,
        multiplier:  parseFloat(newModel.multiplier),
        description: newModel.description,
      })
      showToast(`✓ ${newModel.model_name} added`)
      setShowAdd(false)
      setNewModel({ model_name: '', provider: 'local', multiplier: '1.0', description: '' })
      await load()
    } catch (e: any) { showToast(`Error: ${e.message}`) }
    finally { setSaving(false) }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Model Pricing"
        subtitle="Set credit multipliers for each LLM model. Changes take effect immediately."
        actions={
          <div className="flex gap-2">
            <button onClick={() => setShowAdd(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-primary text-white text-sm font-medium hover:opacity-90">
              <FiPlus className="w-4 h-4" /> Add Model
            </button>
            <button onClick={load}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium hover:bg-gray-50">
              <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>
        }
      />

      {/* Formula info */}
      {formula && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-50 border border-blue-100 text-sm text-blue-700">
          <FiInfo className="w-4 h-4 flex-shrink-0" />
          <span className="font-mono">{formula}</span>
          <span className="ml-2 text-blue-500">— cache refreshes every 5 min after changes</span>
        </div>
      )}

      {error && (
        <div className="px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-700">{error}</div>
      )}

      {/* Add model form */}
      {showAdd && (
        <div className="rounded-xl border border-dashed border-brand-primary/40 bg-brand-primary/5 p-4 space-y-3">
          <h3 className="text-sm font-semibold text-gray-800">Add New Model</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Model name</label>
              <input value={newModel.model_name} onChange={e => setNewModel(p => ({ ...p, model_name: e.target.value }))}
                placeholder="e.g. llama3.1:8b"
                className="w-full text-sm px-2.5 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-primary/30" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Provider</label>
              <select value={newModel.provider} onChange={e => setNewModel(p => ({ ...p, provider: e.target.value }))}
                className="w-full text-sm px-2.5 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-primary/30">
                <option value="local">local</option>
                <option value="google">google</option>
                <option value="anthropic">anthropic</option>
                <option value="openai">openai</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Multiplier</label>
              <input type="number" step="0.1" min="0" max="100" value={newModel.multiplier}
                onChange={e => setNewModel(p => ({ ...p, multiplier: e.target.value }))}
                className="w-full text-sm px-2.5 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-primary/30" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Description</label>
              <input value={newModel.description} onChange={e => setNewModel(p => ({ ...p, description: e.target.value }))}
                placeholder="Short note"
                className="w-full text-sm px-2.5 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-primary/30" />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowAdd(false)}
              className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 hover:bg-gray-50">Cancel</button>
            <button onClick={addModel} disabled={saving || !newModel.model_name.trim()}
              className="px-3 py-1.5 text-sm rounded-lg bg-brand-primary text-white font-medium hover:opacity-90 disabled:opacity-50">
              {saving ? 'Adding…' : 'Add Model'}
            </button>
          </div>
        </div>
      )}

      {/* Pricing table */}
      <div className="rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Model</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Provider</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Multiplier</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Cost preview</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Description</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Loading…</td></tr>
            )}
            {!loading && pricing.map(p => (
              <tr key={p._id} className={`hover:bg-gray-50 transition-colors ${!p.enabled ? 'opacity-50' : ''}`}>
                {/* Model name */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <FiCpu className="w-4 h-4 text-gray-400" />
                    <span className="font-mono font-medium text-gray-900">{p.model_name}</span>
                  </div>
                </td>

                {/* Provider */}
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${providerBadge(p.provider)}`}>
                    {p.provider}
                  </span>
                </td>

                {/* Multiplier — editable inline */}
                <td className="px-4 py-3">
                  {editId === p._id ? (
                    <input type="number" step="0.1" min="0" max="100" value={editState.multiplier}
                      onChange={e => setEditState(s => ({ ...s, multiplier: e.target.value }))}
                      className="w-20 text-sm px-2 py-1 rounded-lg border border-brand-primary/40 font-mono focus:outline-none focus:ring-2 focus:ring-brand-primary/30" />
                  ) : (
                    <span className={`font-mono font-bold text-base ${multiplierColor(p.multiplier)}`}>
                      {p.multiplier}×
                    </span>
                  )}
                </td>

                {/* Cost preview */}
                <td className="px-4 py-3">
                  <div className="flex gap-3 text-xs text-gray-500">
                    {creditPreview(editId === p._id ? parseFloat(editState.multiplier) || p.multiplier : p.multiplier).map(c => (
                      <span key={c.tokens}>
                        <span className="text-gray-400">{c.tokens}:</span>{' '}
                        <span className="font-medium text-gray-700">{c.credits} cr</span>
                      </span>
                    ))}
                  </div>
                </td>

                {/* Description — editable inline */}
                <td className="px-4 py-3 text-gray-500 max-w-[200px]">
                  {editId === p._id ? (
                    <input value={editState.description}
                      onChange={e => setEditState(s => ({ ...s, description: e.target.value }))}
                      className="w-full text-sm px-2 py-1 rounded-lg border border-brand-primary/40 focus:outline-none focus:ring-2 focus:ring-brand-primary/30" />
                  ) : (
                    <span className="text-xs truncate block">{p.description}</span>
                  )}
                </td>

                {/* Status toggle */}
                <td className="px-4 py-3">
                  {editId === p._id ? (
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input type="checkbox" checked={editState.enabled}
                        onChange={e => setEditState(s => ({ ...s, enabled: e.target.checked }))}
                        className="w-4 h-4 accent-brand-primary" />
                      <span className="text-xs">{editState.enabled ? 'Enabled' : 'Disabled'}</span>
                    </label>
                  ) : (
                    <button onClick={() => toggleEnabled(p)} title={p.enabled ? 'Disable' : 'Enable'}
                      className="flex items-center gap-1 text-xs">
                      {p.enabled
                        ? <><FiToggleRight className="w-5 h-5 text-emerald-500" /><span className="text-emerald-600">Active</span></>
                        : <><FiToggleLeft className="w-5 h-5 text-gray-400" /><span className="text-gray-400">Off</span></>}
                    </button>
                  )}
                </td>

                {/* Actions */}
                <td className="px-4 py-3 text-right">
                  {editId === p._id ? (
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => saveEdit(p.model_name)} disabled={saving}
                        className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 disabled:opacity-50">
                        <FiCheck className="w-4 h-4" />
                      </button>
                      <button onClick={cancelEdit}
                        className="p-1.5 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200">
                        <FiX className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => startEdit(p)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700">
                        <FiEdit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => deletePricing(p)}
                        className="p-1.5 rounded-lg hover:bg-rose-50 text-gray-400 hover:text-rose-600">
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 px-4 py-2.5 rounded-xl bg-gray-900 text-white text-sm shadow-xl animate-in fade-in slide-in-from-bottom-2">
          {toast}
        </div>
      )}
    </div>
  )
}
