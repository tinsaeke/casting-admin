import { useEffect, useState } from 'react'
import { commissionAPI } from '@/config/api'
import PageHeader from '@/components/common/PageHeader'
import { FiRefreshCw, FiCheck, FiAlertCircle, FiPercent } from 'react-icons/fi'

interface Fees {
  direct_rate:             number
  agency_self_rate:        number
  agency_mediated_rate:    number
  agency_commission_rate:  number
}

const FIELDS: { key: keyof Fees; label: string; desc: string }[] = [
  { key: 'direct_rate',            label: 'Direct Booking Rate',        desc: 'Platform fee for direct client ↔ talent bookings' },
  { key: 'agency_self_rate',       label: 'Agency Self-Booking Rate',   desc: 'Platform fee when agency books their own talent' },
  { key: 'agency_mediated_rate',   label: 'Agency Mediated Rate',       desc: 'Platform fee for agency-mediated bookings' },
  { key: 'agency_commission_rate', label: 'Agency Commission Rate',     desc: 'Commission paid to agency from talent payout' },
]

export default function PlatformFeesPage() {
  const [fees,    setFees]    = useState<Fees>({ direct_rate: 0, agency_self_rate: 0, agency_mediated_rate: 0, agency_commission_rate: 0 })
  const [display, setDisplay] = useState<Record<keyof Fees, string>>({ direct_rate: '', agency_self_rate: '', agency_mediated_rate: '', agency_commission_rate: '' })
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState('')
  const [success, setSuccess] = useState('')

  const load = async () => {
    setLoading(true); setError('')
    try {
      const data = await commissionAPI.getFees()
      const f: Fees = {
        direct_rate:            data.direct_rate            ?? 0,
        agency_self_rate:       data.agency_self_rate       ?? 0,
        agency_mediated_rate:   data.agency_mediated_rate   ?? 0,
        agency_commission_rate: data.agency_commission_rate ?? 0,
      }
      setFees(f)
      // Display as percentage (decimal × 100)
      setDisplay({
        direct_rate:            String(+(f.direct_rate            * 100).toFixed(4)),
        agency_self_rate:       String(+(f.agency_self_rate       * 100).toFixed(4)),
        agency_mediated_rate:   String(+(f.agency_mediated_rate   * 100).toFixed(4)),
        agency_commission_rate: String(+(f.agency_commission_rate * 100).toFixed(4)),
      })
    } catch (e: any) { setError(e.message || 'Failed to load fee config') }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const validate = (): string => {
    for (const { key, label } of FIELDS) {
      const v = parseFloat(display[key])
      if (isNaN(v) || v < 0 || v > 100) return `${label} must be between 0 and 100`
    }
    return ''
  }

  const handleSave = async () => {
    const err = validate()
    if (err) { setError(err); return }
    setSaving(true); setError(''); setSuccess('')
    try {
      await commissionAPI.updateFees({
        direct_rate:            parseFloat(display.direct_rate)            / 100,
        agency_self_rate:       parseFloat(display.agency_self_rate)       / 100,
        agency_mediated_rate:   parseFloat(display.agency_mediated_rate)   / 100,
        agency_commission_rate: parseFloat(display.agency_commission_rate) / 100,
      })
      setSuccess('Fee rates updated. Changes take effect within 5 minutes.')
      await load()
    } catch (e: any) { setError(e.message || 'Save failed') }
    setSaving(false)
  }

  const setField = (key: keyof Fees, raw: string) => {
    // Allow empty or partial input while typing
    setDisplay(d => ({ ...d, [key]: raw }))
    setError(''); setSuccess('')
  }

  return (
    <div>
      <PageHeader
        title="Platform Fee Configuration"
        subtitle="Commission rates applied to casting bookings"
        actions={
          <button onClick={load} disabled={loading}
            className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition disabled:opacity-40">
            <FiRefreshCw className={`w-4 h-4 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
        }
      />

      <div className="p-6 max-w-xl">
        {/* Alert */}
        {error && (
          <div className="mb-4 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
            <FiAlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {error}
          </div>
        )}
        {success && (
          <div className="mb-4 flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-xl text-xs text-green-700 font-semibold">
            <FiCheck className="w-4 h-4 shrink-0 mt-0.5" /> {success}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <FiRefreshCw className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
              <FiPercent className="w-4 h-4 text-orange-500" />
              <span className="text-xs font-black text-gray-700 uppercase tracking-wide">Rate Configuration</span>
            </div>

            {/* Fields */}
            <div className="divide-y divide-gray-100">
              {FIELDS.map(({ key, label, desc }) => {
                const val = parseFloat(display[key])
                const hasError = display[key] !== '' && (isNaN(val) || val < 0 || val > 100)
                return (
                  <div key={key} className="px-5 py-4 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900">{label}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{desc}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <div className={`relative flex items-center ${hasError ? 'ring-1 ring-red-400 rounded-lg' : ''}`}>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          step={0.1}
                          value={display[key]}
                          onChange={e => setField(key, e.target.value)}
                          className="w-20 px-3 py-2 border border-gray-200 rounded-lg text-sm font-black text-gray-900 text-right focus:outline-none focus:border-orange-400 pr-6"
                        />
                        <span className="absolute right-2 text-xs text-gray-400 font-bold pointer-events-none">%</span>
                      </div>
                      {hasError && <p className="text-[10px] text-red-500">0–100</p>}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Footer */}
            <div className="px-5 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-3">
              <p className="text-[10px] text-gray-400">Values stored as decimals (e.g. 8% = 0.08)</p>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-xl text-xs font-black transition"
              >
                {saving ? <FiRefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FiCheck className="w-3.5 h-3.5" />}
                Save Changes
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
