import { useEffect, useState } from 'react'
import { commissionAPI } from '@/config/api'
import PageHeader from '@/components/common/PageHeader'
import { FiRefreshCw, FiCheck, FiAlertCircle, FiPercent, FiCpu, FiCalendar, FiDollarSign } from 'react-icons/fi'

interface BookingFees {
  direct_rate:             number
  agency_self_rate:        number
  agency_mediated_rate:    number
  agency_commission_rate:  number
}

interface AvatarFees {
  avatar_platform_rate:    number
  avatar_actor_rate:       number
}

const BOOKING_FIELDS: { key: keyof BookingFees; label: string; desc: string }[] = [
  { key: 'direct_rate',            label: 'Direct Booking Rate',        desc: 'Platform fee for direct client ↔ talent bookings' },
  { key: 'agency_self_rate',       label: 'Agency Self-Booking Rate',   desc: 'Platform fee when agency books their own talent' },
  { key: 'agency_mediated_rate',   label: 'Agency Mediated Rate',       desc: 'Platform fee for agency-mediated bookings' },
  { key: 'agency_commission_rate', label: 'Agency Commission Rate',     desc: 'Commission paid to agency from talent payout' },
]

const AVATAR_FIELDS: { key: keyof AvatarFees; label: string; desc: string }[] = [
  { key: 'avatar_platform_rate',   label: 'Platform Commission Rate',   desc: 'Platform fee retained upon AI Avatar likeness license purchase' },
  { key: 'avatar_actor_rate',      label: 'Actor / Talent Share',       desc: 'Net royalty percentage credited to the actor’s wallet' },
]

export default function PlatformFeesPage() {
  const [activeTab, setActiveTab] = useState<'booking' | 'avatar'>('booking')

  // Booking fees state
  const [bookingDisplay, setBookingDisplay] = useState<Record<keyof BookingFees, string>>({
    direct_rate: '', agency_self_rate: '', agency_mediated_rate: '', agency_commission_rate: ''
  })
  
  // Avatar fees state
  const [avatarDisplay, setAvatarDisplay] = useState<Record<keyof AvatarFees, string>>({
    avatar_platform_rate: '', avatar_actor_rate: ''
  })

  const [loading, setLoading] = useState(true)
  const [savingBooking, setSavingBooking] = useState(false)
  const [savingAvatar, setSavingAvatar] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const load = async () => {
    setLoading(true); setError('')
    try {
      const [bookingData, avatarData] = await Promise.allSettled([
        commissionAPI.getFees(),
        commissionAPI.getAvatarFees(),
      ])

      if (bookingData.status === 'fulfilled') {
        const b = bookingData.value
        setBookingDisplay({
          direct_rate:            String(+((b.direct_rate            ?? 0) * 100).toFixed(4)),
          agency_self_rate:       String(+((b.agency_self_rate       ?? 0) * 100).toFixed(4)),
          agency_mediated_rate:   String(+((b.agency_mediated_rate   ?? 0) * 100).toFixed(4)),
          agency_commission_rate: String(+((b.agency_commission_rate ?? 0) * 100).toFixed(4)),
        })
      }

      if (avatarData.status === 'fulfilled') {
        const a = avatarData.value
        setAvatarDisplay({
          avatar_platform_rate: String(+((a.avatar_platform_rate ?? 0.20) * 100).toFixed(4)),
          avatar_actor_rate:    String(+((a.avatar_actor_rate    ?? 0.80) * 100).toFixed(4)),
        })
      } else {
        // Fallback default avatar fee rates if not yet seeded
        setAvatarDisplay({
          avatar_platform_rate: '20',
          avatar_actor_rate:    '80',
        })
      }
    } catch (e: any) {
      setError(e.message || 'Failed to load fee configuration')
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleSaveBooking = async () => {
    for (const { key, label } of BOOKING_FIELDS) {
      const v = parseFloat(bookingDisplay[key])
      if (isNaN(v) || v < 0 || v > 100) {
        setError(`${label} must be between 0 and 100%`)
        return
      }
    }

    setSavingBooking(true); setError(''); setSuccess('')
    try {
      await commissionAPI.updateFees({
        direct_rate:            parseFloat(bookingDisplay.direct_rate)            / 100,
        agency_self_rate:       parseFloat(bookingDisplay.agency_self_rate)       / 100,
        agency_mediated_rate:   parseFloat(bookingDisplay.agency_mediated_rate)   / 100,
        agency_commission_rate: parseFloat(bookingDisplay.agency_commission_rate) / 100,
      })
      setSuccess('Booking fee rates updated successfully. Changes take effect within 5 minutes.')
      await load()
    } catch (e: any) {
      setError(e.message || 'Failed to save booking fees')
    }
    setSavingBooking(false)
  }

  const handleSaveAvatar = async () => {
    for (const { key, label } of AVATAR_FIELDS) {
      const v = parseFloat(avatarDisplay[key])
      if (isNaN(v) || v < 0 || v > 100) {
        setError(`${label} must be between 0 and 100%`)
        return
      }
    }

    const platform = parseFloat(avatarDisplay.avatar_platform_rate) || 0
    const actor = parseFloat(avatarDisplay.avatar_actor_rate) || 0
    if (Math.round(platform + actor) !== 100) {
      setError(`Platform commission (${platform}%) + Actor share (${actor}%) should sum to 100% (currently ${platform + actor}%)`)
      return
    }

    setSavingAvatar(true); setError(''); setSuccess('')
    try {
      await commissionAPI.updateAvatarFees({
        avatar_platform_rate: platform / 100,
        avatar_actor_rate:    actor / 100,
      })
      setSuccess('AI Avatar fee split updated successfully.')
      await load()
    } catch (e: any) {
      setError(e.message || 'Failed to save avatar fees')
    }
    setSavingAvatar(false)
  }

  const avatarPlatformVal = parseFloat(avatarDisplay.avatar_platform_rate) || 0
  const avatarActorVal = parseFloat(avatarDisplay.avatar_actor_rate) || 0

  return (
    <div>
      <PageHeader
        title="Platform Fee Configuration"
        subtitle="Manage commission and revenue split rates for bookings and AI avatar likeness licensing"
        actions={
          <button
            onClick={load}
            disabled={loading}
            className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition disabled:opacity-40"
            title="Refresh rates"
          >
            <FiRefreshCw className={`w-4 h-4 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
        }
      />

      <div className="p-6 max-w-2xl">
        {/* Navigation Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200 pb-3">
          <button
            onClick={() => { setActiveTab('booking'); setError(''); setSuccess('') }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'booking'
                ? 'bg-orange-500 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <FiCalendar className="w-3.5 h-3.5" />
            <span>Booking Commission Fees</span>
          </button>
          <button
            onClick={() => { setActiveTab('avatar'); setError(''); setSuccess('') }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'avatar'
                ? 'bg-orange-500 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <FiCpu className="w-3.5 h-3.5" />
            <span>AI Avatar Fee Split</span>
          </button>
        </div>

        {/* Alert Messages */}
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
        ) : activeTab === 'booking' ? (
          /* ── Tab 1: Booking Commission Rates ────────────────────────────── */
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xs">
            {/* Header */}
            <div className="px-5 py-3.5 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FiPercent className="w-4 h-4 text-orange-500" />
                <span className="text-xs font-black text-gray-700 uppercase tracking-wide">
                  Casting Booking Rates
                </span>
              </div>
              <span className="text-[11px] text-gray-400 font-medium">Standard casting escrow rates</span>
            </div>

            {/* Fields */}
            <div className="divide-y divide-gray-100">
              {BOOKING_FIELDS.map(({ key, label, desc }) => {
                const val = parseFloat(bookingDisplay[key])
                const hasError = bookingDisplay[key] !== '' && (isNaN(val) || val < 0 || val > 100)
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
                          value={bookingDisplay[key]}
                          onChange={e => {
                            setBookingDisplay(d => ({ ...d, [key]: e.target.value }))
                            setError(''); setSuccess('')
                          }}
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
                onClick={handleSaveBooking}
                disabled={savingBooking}
                className="flex items-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-xl text-xs font-black transition"
              >
                {savingBooking ? <FiRefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FiCheck className="w-3.5 h-3.5" />}
                Save Booking Rates
              </button>
            </div>
          </div>
        ) : (
          /* ── Tab 2: AI Avatar Fee Split ──────────────────────────────────── */
          <div className="space-y-4">
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xs">
              {/* Header */}
              <div className="px-5 py-3.5 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FiCpu className="w-4 h-4 text-purple-600" />
                  <span className="text-xs font-black text-gray-700 uppercase tracking-wide">
                    AI Avatar Likeness Revenue Split
                  </span>
                </div>
                <span className="text-[11px] text-purple-600 font-bold bg-purple-50 px-2 py-0.5 rounded-md">
                  Avatar Marketplace
                </span>
              </div>

              {/* Fields */}
              <div className="divide-y divide-gray-100">
                {AVATAR_FIELDS.map(({ key, label, desc }) => {
                  const val = parseFloat(avatarDisplay[key])
                  const hasError = avatarDisplay[key] !== '' && (isNaN(val) || val < 0 || val > 100)
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
                            step={0.5}
                            value={avatarDisplay[key]}
                            onChange={e => {
                              const valStr = e.target.value
                              setAvatarDisplay(d => {
                                const num = parseFloat(valStr)
                                if (!isNaN(num) && num >= 0 && num <= 100) {
                                  // Auto-balance the other field
                                  if (key === 'avatar_platform_rate') {
                                    return { avatar_platform_rate: valStr, avatar_actor_rate: String(+(100 - num).toFixed(2)) }
                                  } else {
                                    return { avatar_actor_rate: valStr, avatar_platform_rate: String(+(100 - num).toFixed(2)) }
                                  }
                                }
                                return { ...d, [key]: valStr }
                              })
                              setError(''); setSuccess('')
                            }}
                            className="w-20 px-3 py-2 border border-gray-200 rounded-lg text-sm font-black text-gray-900 text-right focus:outline-none focus:border-purple-400 pr-6"
                          />
                          <span className="absolute right-2 text-xs text-gray-400 font-bold pointer-events-none">%</span>
                        </div>
                        {hasError && <p className="text-[10px] text-red-500">0–100</p>}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Simulation Card */}
              <div className="px-5 py-3.5 bg-purple-50/50 border-t border-purple-100 flex items-center justify-between text-xs text-purple-900">
                <div className="flex items-center gap-2">
                  <FiDollarSign className="w-4 h-4 text-purple-600" />
                  <span className="font-semibold">Example on 1,000 ETB License:</span>
                </div>
                <div className="flex items-center gap-3 text-[11px] font-mono">
                  <span>Actor: <strong className="text-green-700">{Math.round(1000 * (avatarActorVal / 100))} ETB</strong> ({avatarActorVal}%)</span>
                  <span>·</span>
                  <span>Platform: <strong className="text-purple-700">{Math.round(1000 * (avatarPlatformVal / 100))} ETB</strong> ({avatarPlatformVal}%)</span>
                </div>
              </div>

              {/* Footer */}
              <div className="px-5 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-3">
                <p className="text-[10px] text-gray-400">Endpoint: /commission/admin/platform-config/avatar-fees</p>
                <button
                  onClick={handleSaveAvatar}
                  disabled={savingAvatar}
                  className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl text-xs font-black transition"
                >
                  {savingAvatar ? <FiRefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FiCheck className="w-3.5 h-3.5" />}
                  Save Avatar Fee Split
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
