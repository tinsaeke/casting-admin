import { useEffect, useState } from 'react'
import { commissionAPI } from '@/config/api'
import { FiRefreshCw, FiTrendingUp, FiArrowDown, FiCreditCard } from 'react-icons/fi'

interface Props { partyId: string }

export default function PartyWallet({ partyId }: Props) {
  const [wallet, setWallet]   = useState<any>(null)
  const [txs,    setTxs]      = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [txPage,  setTxPage]  = useState(1)
  const [txPages, setTxPages] = useState(1)
  const [error,   setError]   = useState('')

  const load = async (pg = 1) => {
    setLoading(true); setError('')
    try {
      const [w, t] = await Promise.allSettled([
        commissionAPI.getWallet(partyId),
        commissionAPI.getTransactions(partyId, pg, 20),
      ])
      if (w.status === 'fulfilled') setWallet(w.value)
      if (t.status === 'fulfilled') {
        const data = Array.isArray(t.value) ? t.value : t.value?.data || []
        setTxs(data)
        const pg2 = t.value?.pagination || t.value?.meta || {}
        setTxPages(Math.max(1, pg2.pages || pg2.totalPages || 1))
      }
    } catch (e: any) { setError(e.message || 'Failed to load wallet') }
    setLoading(false)
  }

  useEffect(() => { if (partyId) load() }, [partyId])

  const handlePage = (p: number) => { setTxPage(p); load(p) }

  const fmtAmt = (v: number, currency = 'ETB') =>
    `${Math.abs(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`

  if (loading && !wallet) return (
    <div className="flex justify-center py-8">
      <FiRefreshCw className="w-5 h-5 animate-spin text-gray-400" />
    </div>
  )

  if (error) return (
    <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">{error}</div>
  )

  return (
    <div className="space-y-4">
      {/* Balance summary */}
      {wallet && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: FiCreditCard,  label: 'Available Balance', value: wallet.available_balance ?? wallet.balance ?? 0,  color: 'text-gray-900' },
            { icon: FiTrendingUp,  label: 'Total Earned',      value: wallet.total_earned      ?? wallet.totalEarned ?? 0, color: 'text-green-700' },
            { icon: FiArrowDown,   label: 'Total Withdrawn',   value: wallet.total_withdrawn   ?? wallet.totalWithdrawn ?? 0, color: 'text-red-600' },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-gray-400" />
              </div>
              <div>
                <p className={`text-base font-black ${color}`}>{fmtAmt(value)}</p>
                <p className="text-[10px] text-gray-500">{label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Transaction history */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h4 className="text-xs font-black text-gray-700 uppercase tracking-wide">Transaction History</h4>
          <button onClick={() => load(txPage)} disabled={loading}
            className="p-1 hover:bg-gray-100 rounded transition">
            <FiRefreshCw className={`w-3.5 h-3.5 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {txs.length === 0 ? (
          <div className="py-10 text-center text-xs text-gray-400">No transactions found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  {['Date', 'Type', 'Amount', 'Balance After', 'Reference'].map(h => (
                    <th key={h} className="text-left py-2.5 px-4 text-[10px] font-bold text-gray-500 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {txs.map((tx, i) => {
                  const amount = tx.amount ?? tx.credit ?? tx.debit ?? 0
                  const isCredit = (tx.type || '').toLowerCase().startsWith('credit') || amount > 0
                  const date = tx.created_at || tx.createdAt || tx.date
                  return (
                    <tr key={tx._id || tx.transaction_id || i} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-2.5 px-4 text-[11px] text-gray-500">
                        {date ? new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' }) : '—'}
                      </td>
                      <td className="py-2.5 px-4">
                        <span className="text-[10px] font-mono text-gray-600">{tx.type || tx.transaction_type || '—'}</span>
                      </td>
                      <td className="py-2.5 px-4">
                        <span className={`text-[11px] font-black ${isCredit ? 'text-green-600' : 'text-red-500'}`}>
                          {isCredit ? '+' : '-'}{fmtAmt(Math.abs(amount), tx.currency || 'ETB')}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-[11px] text-gray-700 font-semibold tabular-nums">
                        {tx.balance_after !== undefined ? fmtAmt(tx.balance_after, tx.currency || 'ETB') : '—'}
                      </td>
                      <td className="py-2.5 px-4">
                        <span className="text-[10px] font-mono text-gray-400 truncate max-w-[120px] block">
                          {tx.reference || tx.transaction_reference || '—'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {txPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center gap-2 justify-end">
            <button onClick={() => handlePage(Math.max(1, txPage - 1))} disabled={txPage === 1 || loading}
              className="px-2 py-1 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition">← Prev</button>
            <span className="text-xs text-gray-500">{txPage} / {txPages}</span>
            <button onClick={() => handlePage(Math.min(txPages, txPage + 1))} disabled={txPage === txPages || loading}
              className="px-2 py-1 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition">Next →</button>
          </div>
        )}
      </div>
    </div>
  )
}
