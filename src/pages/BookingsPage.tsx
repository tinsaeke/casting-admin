import { useEffect, useState } from 'react'
import { adminAPI, request, API } from '@/config/api'
import PageHeader from '@/components/common/PageHeader'
import DataTable from '@/components/common/DataTable'
import Pagination from '@/components/common/Pagination'
import { FiRefreshCw, FiTrash2, FiX, FiLoader, FiCheck, FiCornerUpLeft, FiAlertTriangle, FiLock } from 'react-icons/fi'

const COMMISSION_URL = 'https://commission.besewonline.com/api'

const BADGE: Record<string, string> = {
  pending:              'bg-yellow-100 text-yellow-700',
  pending_confirmation: 'bg-yellow-100 text-yellow-700',
  offered:              'bg-blue-100 text-blue-700',
  offered_to_agency:    'bg-indigo-100 text-indigo-700',
  agency_accepted:      'bg-purple-100 text-purple-700',
  talent_accepted:      'bg-teal-100 text-teal-700',
  confirmed:            'bg-green-100 text-green-700',
  pending_talent_approval: 'bg-amber-100 text-amber-700',
  completed:            'bg-blue-100 text-blue-700',
  rejected:             'bg-red-100 text-red-600',
  cancelled:            'bg-gray-100 text-gray-500',
  disputed:             'bg-orange-100 text-orange-700',
}

function fmtDate(d?: string) {
  return d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'
}
function fmtMoney(amount: number, currency = 'ETB') {
  return `${Number(amount).toLocaleString()} ${currency}`
}
function calcBreakdown(amount: number, bType: string, currency = 'ETB') {
  const pRates: Record<string,number> = { direct: 0.08, agency_self: 0.10, agency_mediated: 0.10 }
  const pRate = pRates[bType] ?? 0.10
  const platformFee = amount * pRate
  const remaining = amount - platformFee
  const hasAgency = bType !== 'direct'
  const agencyAmount = hasAgency ? remaining * 0.15 : 0
  const talentAmount = remaining - agencyAmount
  return { platformFee, agencyAmount, talentAmount, currency }
}

async function fetchEscrow(bookingId: string): Promise<any> {
  const token = localStorage.getItem('admin_token') || ''
  const res = await fetch(`${COMMISSION_URL}/commission/casting/escrow/status/${bookingId}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  if (!res.ok) return null
  return res.json().catch(() => null)
}

async function resolveEscrow(bookingId: string, action: 'release' | 'refund', note: string): Promise<any> {
  const token = localStorage.getItem('admin_token') || ''
  const res = await fetch(`${COMMISSION_URL}/commission/casting/escrow/${bookingId}/resolve`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, resolution_note: note }),
  })
  const text = await res.text()
  const data = text ? JSON.parse(text) : {}
  if (!res.ok) throw new Error(data?.message || `HTTP ${res.status}`)
  return data
}

// ── Booking Detail Modal ──────────────────────────────────────────────────────
function BookingDetailModal({ bookingId, onClose, onResolved }: {
  bookingId: string
  onClose: () => void
  onResolved: () => void
}) {
  const [booking,   setBooking]   = useState<any>(null)
  const [escrow,    setEscrow]    = useState<any>(null)
  const [loading,   setLoading]   = useState(true)
  const [note,      setNote]      = useState('')
  const [resolving, setResolving] = useState(false)
  const [error,     setError]     = useState('')
  const [success,   setSuccess]   = useState('')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const b = await request<any>('GET', `${API.CASTING}/bookings/${bookingId}`)
        setBooking(b)
        const e = await fetchEscrow(bookingId)
        setEscrow(e)
      } catch (e: any) { setError(e.message || 'Failed to load booking') }
      setLoading(false)
    }
    load()
  }, [bookingId])

  const resolve = async (action: 'release' | 'refund') => {
    if (!note.trim()) { setError('Please add a resolution note'); return }
    setResolving(true); setError('')
    try {
      await resolveEscrow(bookingId, action, note)
      setSuccess(action === 'release' ? 'Payment released to talent & agency' : 'Refund issued to client')
      setTimeout(() => { onResolved(); onClose() }, 1500)
    } catch (e: any) { setError(e.message || 'Failed to resolve') }
    setResolving(false)
  }

  const rateAmt = booking ? (typeof booking.rate === 'object' ? booking.rate?.amount : booking.rate) || 0 : 0
  const rateCur = booking ? (typeof booking.rate === 'object' ? booking.rate?.currency : booking.currency) || 'ETB' : 'ETB'
  const bd = booking ? calcBreakdown(rateAmt, booking.booking_type || 'agency_self', rateCur) : null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl mt-4">
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white rounded-t-2xl">
          <div className="flex items-center gap-3">
            <button onClick={onClose}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 text-gray-600 rounded-lg text-xs font-bold hover:bg-gray-50 transition">
              ← Back
            </button>
            <h2 className="font-black text-gray-900 text-sm">Booking Detail</h2>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition" title="Close">
            <FiX className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><FiLoader className="w-7 h-7 animate-spin text-orange-500" /></div>
        ) : error && !booking ? (
          <div className="p-6 text-red-600 text-sm">{error}</div>
        ) : booking ? (
          <div className="p-6 space-y-5">
            {success && <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm font-bold">{success}</div>}
            {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>}

            {/* Status badge */}
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-xs font-black uppercase ${BADGE[booking.status] || BADGE.pending}`}>
                {booking.status?.replace(/_/g,' ')}
              </span>
              <span className="text-xs font-mono text-gray-400">{booking.booking_id || booking._id}</span>
            </div>

            {/* Booking fields grid */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              {[
                ['Cast Call',    booking.casting_call_title || booking.casting_call_id],
                ['Role',         booking.role || booking.role_id],
                ['Type',         booking.booking_type?.replace(/_/g,' ')],
                ['Talent',       booking.talent_name || booking.talent_id],
                ['Agency',       booking.agency_name || booking.agency_id || '—'],
                ['Client',       booking.client_name || booking.client_id || '—'],
                ['Rate',         rateAmt ? `${fmtMoney(rateAmt, rateCur)} (${typeof booking.rate === 'object' ? booking.rate?.type : booking.rate_type || 'flat'})` : '—'],
                ['Start Date',   fmtDate(booking.start_date)],
                ['End Date',     fmtDate(booking.end_date)],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-[10px] font-bold text-gray-400 uppercase">{label}</p>
                  <p className="font-semibold text-gray-900 mt-0.5 truncate">{value || '—'}</p>
                </div>
              ))}
            </div>

            {/* Dispute section */}
            {booking.status === 'disputed' && (
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl space-y-2">
                <p className="text-xs font-black text-orange-700 uppercase flex items-center gap-1.5">
                  <FiAlertTriangle className="w-3.5 h-3.5" /> Dispute Details
                </p>
                {booking.dispute_reason && (
                  <p className="text-sm text-gray-700 italic">"{booking.dispute_reason}"</p>
                )}
                {booking.disputed_at && (
                  <p className="text-xs text-gray-500">Raised: {new Date(booking.disputed_at).toLocaleString()}</p>
                )}
                <p className="text-xs text-gray-500">Raised by: Talent ({booking.talent_name})</p>
              </div>
            )}

            {/* Escrow section */}
            {escrow && (
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
                <p className="text-xs font-black text-gray-600 uppercase flex items-center gap-1.5">
                  <FiLock className="w-3.5 h-3.5 text-gray-500" /> Escrow
                </p>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-gray-400 uppercase text-[10px]">Escrow ID</p>
                    <p className="font-mono font-semibold text-gray-700">{escrow.escrow_id || '—'}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 uppercase text-[10px]">Escrow Status</p>
                    <p className="font-bold text-orange-700">{escrow.status || escrow.escrow_status || '—'} 🔒</p>
                  </div>
                  <div>
                    <p className="text-gray-400 uppercase text-[10px]">Amount Held</p>
                    <p className="font-bold text-gray-900">{fmtMoney(escrow.amount || rateAmt, rateCur)}</p>
                  </div>
                </div>
                {bd && (
                  <div className="pt-2 border-t border-gray-200 space-y-1 text-xs">
                    <p className="text-gray-400 uppercase text-[10px] font-bold">Breakdown if released:</p>
                    <p className="text-gray-700">• Talent would receive: <span className="font-bold text-green-700">{fmtMoney(bd.talentAmount, bd.currency)}</span></p>
                    {bd.agencyAmount > 0 && <p className="text-gray-700">• Agency would receive: <span className="font-bold text-purple-700">{fmtMoney(bd.agencyAmount, bd.currency)}</span></p>}
                    <p className="text-gray-700">• Platform fee: <span className="font-bold">{fmtMoney(bd.platformFee, bd.currency)}</span></p>
                  </div>
                )}
              </div>
            )}

            {/* Admin actions — only for disputed */}
            {booking.status === 'disputed' && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-3">
                <p className="text-xs font-black text-blue-700 uppercase">Admin Actions</p>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Resolution Note *</label>
                  <textarea rows={3} value={note} onChange={e => setNote(e.target.value)}
                    placeholder="e.g. Admin reviewed evidence. Work was partially done..."
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs resize-none outline-none focus:border-blue-400" />
                </div>
                <div className="flex gap-3">
                  <button onClick={() => resolve('release')} disabled={resolving || !note.trim()}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-xl text-xs font-black transition">
                    {resolving ? <FiLoader className="w-3.5 h-3.5 animate-spin" /> : <FiCheck className="w-3.5 h-3.5" />}
                    Release to Talent & Agency
                  </button>
                  <button onClick={() => resolve('refund')} disabled={resolving || !note.trim()}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl text-xs font-black transition">
                    {resolving ? <FiLoader className="w-3.5 h-3.5 animate-spin" /> : <FiCornerUpLeft className="w-3.5 h-3.5" />}
                    Refund to Client
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function BookingsPage() {
  const [data, setData]         = useState<any[]>([])
  const [loading, setLoading]   = useState(true)
  const [page, setPage]         = useState(1)
  const [total, setTotal]       = useState(0)
  const [pages, setPages]       = useState(1)
  const [status, setStatus]     = useState('')
  const [detailId, setDetailId] = useState<string | null>(null)

  const load = async (p = 1) => {
    setLoading(true)
    try {
      const res = await adminAPI.bookings(p, status || undefined)
      setData(res.data || [])
      setTotal(res.pagination?.total ?? res.total ?? 0)
      setPages(res.pagination?.pages ?? 1)
      setPage(p)
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [status])

  const handleDelete = async (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation()
    if (!confirm(`Delete booking for "${name}"?`)) return
    try { await adminAPI.deleteBooking(id); load(page) } catch (err: any) { alert(err.message) }
  }

  return (
    <div>
      {detailId && (
        <BookingDetailModal
          bookingId={detailId}
          onClose={() => setDetailId(null)}
          onResolved={() => load(page)}
        />
      )}

      <PageHeader title="Bookings" subtitle={`${total} bookings`} actions={
        <div className="flex gap-2">
          <select value={status} onChange={e => setStatus(e.target.value)}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-orange-400">
            <option value="">All status</option>
            {['offered','offered_to_agency','agency_accepted','talent_accepted','confirmed',
              'pending_talent_approval','completed','disputed','rejected','cancelled'].map(s => (
              <option key={s} value={s}>{s.replace(/_/g,' ')}</option>
            ))}
          </select>
          <button onClick={() => load(1)} className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
            <FiRefreshCw className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      } />

      <div className="p-6">
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <DataTable loading={loading} data={data} keyField="booking_id" emptyMsg="No bookings found"
            rowClassName={() => 'cursor-pointer hover:bg-gray-50 transition-colors'}
            onRowClick={(r) => setDetailId(r.booking_id || r._id)}
            columns={[
              { key: 'talent_name', label: 'Talent', render: r => (
                <span className="font-bold">{r.talent_name || r.talent_id || '—'}</span>
              )},
              { key: 'agency', label: 'Agency', render: r => (
                <span className="text-xs text-gray-600">{r.agency_name || r.agency_id || '—'}</span>
              )},
              { key: 'client', label: 'Client', render: r => (
                <span className="text-xs text-gray-600">{r.client_name || r.client_id || '—'}</span>
              )},
              { key: 'casting_call_title', label: 'Cast Call', render: r => (
                <span className="text-xs truncate max-w-[120px] block">{r.casting_call_title || r.casting_call_id || '—'}</span>
              )},
              { key: 'rate', label: 'Rate', render: r => (
                <span className="font-semibold text-xs">
                  {r.rate?.amount ? `${Number(r.rate.amount).toLocaleString()} ${r.rate.currency || 'ETB'}` :
                   r.fee ? `${Number(r.fee).toLocaleString()} ETB` : '—'}
                </span>
              )},
              { key: 'status', label: 'Status', render: r => {
                const isDisputed = r.status === 'disputed'
                return (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${BADGE[r.status] || BADGE.pending}`}
                    title={isDisputed && r.dispute_reason ? r.dispute_reason : undefined}
                  >
                    {isDisputed ? '⚠ ' : ''}{r.status?.replace(/_/g,' ')}
                  </span>
                )
              }},
              { key: 'start_date', label: 'Dates', render: r => (
                <span className="text-[10px] text-gray-500">
                  {r.start_date ? new Date(r.start_date).toLocaleDateString() : '—'}
                  {r.end_date ? ` → ${new Date(r.end_date).toLocaleDateString()}` : ''}
                </span>
              )},
              { key: 'actions', label: '', render: r => (
                <button
                  onClick={e => handleDelete(e, r.booking_id || r._id, r.talent_name || r.booking_id)}
                  className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition" title="Delete">
                  <FiTrash2 className="w-3.5 h-3.5" />
                </button>
              )},
            ]}
          />
          <Pagination page={page} pages={pages} total={total} onChange={p => load(p)} />
        </div>
      </div>
    </div>
  )
}
