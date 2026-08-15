import { useEffect, useState } from 'react'
import { commissionAPI } from '@/config/api'
import PageHeader from '@/components/common/PageHeader'
import DataTable from '@/components/common/DataTable'
import Pagination from '@/components/common/Pagination'
import { FiRefreshCw, FiCheck, FiX, FiAlertCircle, FiCheckCircle } from 'react-icons/fi'

const STATUSES = ['all', 'pending', 'approved', 'completed', 'rejected']

const STATUS_BADGE: Record<string, string> = {
  pending:   'bg-amber-100 text-amber-700 border-amber-200',
  approved:  'bg-blue-100 text-blue-700 border-blue-200',
  completed: 'bg-green-100 text-green-700 border-green-200',
  rejected:  'bg-red-100 text-red-700 border-red-200',
}

type ModalType = 'approve' | 'complete' | 'reject' | null

export default function WithdrawalsPage() {
  const [rows,    setRows]    = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter,  setFilter]  = useState('all')
  const [page,    setPage]    = useState(1)
  const [pages,   setPages]   = useState(1)
  const [total,   setTotal]   = useState(0)
  const PAGE_SIZE = 20

  // pending badge count
  const [pendingCount, setPendingCount] = useState(0)

  // action modal
  const [modal,    setModal]    = useState<ModalType>(null)
  const [targetId, setTargetId] = useState('')
  const [txRef,    setTxRef]    = useState('')
  const [reason,   setReason]   = useState('')
  const [acting,   setActing]   = useState(false)
  const [actError, setActError] = useState('')
  const [actOk,    setActOk]    = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const status = filter === 'all' ? undefined : filter
      const res = await commissionAPI.withdrawals(status, page, PAGE_SIZE)
      const data = Array.isArray(res) ? res : res?.data || []
      setRows(data)
      const pg = res?.pagination || res?.meta || {}
      setTotal(pg.total || data.length)
      setPages(Math.max(1, pg.pages || pg.totalPages || Math.ceil((pg.total || data.length) / PAGE_SIZE)))
    } catch {}
    setLoading(false)
  }

  const loadPending = async () => {
    try {
      const res = await commissionAPI.pendingWithdrawals()
      const data = Array.isArray(res) ? res : res?.data || []
      setPendingCount(data.length)
    } catch {}
  }

  useEffect(() => { load(); loadPending() }, [filter, page])

  const openModal = (type: ModalType, id: string) => {
    setTargetId(id); setTxRef(''); setReason(''); setActError(''); setActOk(''); setModal(type)
  }
  const closeModal = () => { setModal(null); setTargetId('') }

  const handleAction = async () => {
    setActing(true); setActError(''); setActOk('')
    try {
      if (modal === 'approve')   await commissionAPI.approveWithdrawal(targetId, txRef || undefined)
      if (modal === 'complete') {
        if (!txRef.trim()) { setActError('Transaction reference is required'); setActing(false); return }
        await commissionAPI.completeWithdrawal(targetId, txRef)
      }
      if (modal === 'reject') {
        if (!reason.trim()) { setActError('Reason is required'); setActing(false); return }
        await commissionAPI.rejectWithdrawal(targetId, reason)
      }
      const labels: Record<string, string> = { approve: 'Approved', complete: 'Marked as completed', reject: 'Rejected' }
      setActOk(labels[modal!] || 'Done')
      await load(); await loadPending()
    } catch (e: any) { setActError(e.message || 'Action failed') }
    setActing(false)
  }

  return (
    <div>
      <PageHeader
        title="Withdrawal Requests"
        subtitle="Review and process user withdrawal requests"
        actions={
          <button onClick={() => { load(); loadPending() }} disabled={loading}
            className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition disabled:opacity-40">
            <FiRefreshCw className={`w-4 h-4 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
        }
      />

      {/* Status filter tabs */}
      <div className="px-6 py-2 border-b border-gray-100 bg-white flex gap-1 overflow-x-auto">
        {STATUSES.map(s => (
          <button key={s} onClick={() => { setFilter(s); setPage(1) }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize whitespace-nowrap transition ${
              filter === s ? 'bg-orange-500 text-white' : 'text-gray-500 hover:bg-gray-100'
            }`}>
            {s === 'all' ? 'All' : s}
            {s === 'pending' && pendingCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 bg-red-500 text-white rounded-full text-[9px] font-black">{pendingCount}</span>
            )}
          </button>
        ))}
      </div>

      <div className="p-6">
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <DataTable
            loading={loading}
            data={rows}
            keyField="_id"
            emptyMsg="No withdrawal requests found"
            columns={[
              { key: 'party_id', label: 'Party ID', render: r => (
                <span className="font-mono text-[10px] text-gray-600">{r.party_id || r.partyId || '—'}</span>
              )},
              { key: 'user_type', label: 'Type', render: r => (
                <span className="text-[10px] capitalize text-gray-500">{r.user_type || r.userType || '—'}</span>
              )},
              { key: 'amount', label: 'Amount', render: r => (
                <span className="text-xs font-bold text-gray-900">{(r.amount || 0).toLocaleString()} ETB</span>
              )},
              { key: 'fee', label: 'Fee', render: r => (
                <span className="text-xs text-gray-500">{(r.fee || r.withdrawal_fee || 0).toLocaleString()}</span>
              )},
              { key: 'net', label: 'Net', render: r => {
                const net = (r.net_amount ?? r.net ?? ((r.amount || 0) - (r.fee || r.withdrawal_fee || 0)))
                return <span className="text-xs font-bold text-green-700">{net.toLocaleString()} ETB</span>
              }},
              { key: 'method', label: 'Method', render: r => (
                <span className="text-[10px] text-gray-500 capitalize">{r.method || r.payment_method || '—'}</span>
              )},
              { key: 'status', label: 'Status', render: r => (
                <span className={`px-2 py-0.5 rounded-full border text-[10px] font-black capitalize ${STATUS_BADGE[r.status] || 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                  {r.status}
                </span>
              )},
              { key: 'actions', label: '', render: r => {
                const id = r._id || r.withdrawal_id
                return (
                  <div className="flex gap-1">
                    {r.status === 'pending' && (
                      <>
                        <button onClick={() => openModal('approve', id)}
                          className="flex items-center gap-0.5 px-2 py-1 bg-blue-50 text-blue-600 border border-blue-200 rounded text-[10px] font-bold hover:bg-blue-100 transition">
                          <FiCheck className="w-3 h-3" /> Approve
                        </button>
                        <button onClick={() => openModal('reject', id)}
                          className="flex items-center gap-0.5 px-2 py-1 bg-red-50 text-red-500 border border-red-200 rounded text-[10px] font-bold hover:bg-red-100 transition">
                          <FiX className="w-3 h-3" /> Reject
                        </button>
                      </>
                    )}
                    {r.status === 'approved' && (
                      <>
                        <button onClick={() => openModal('complete', id)}
                          className="flex items-center gap-0.5 px-2 py-1 bg-green-50 text-green-600 border border-green-200 rounded text-[10px] font-bold hover:bg-green-100 transition">
                          <FiCheckCircle className="w-3 h-3" /> Complete
                        </button>
                        <button onClick={() => openModal('reject', id)}
                          className="flex items-center gap-0.5 px-2 py-1 bg-red-50 text-red-500 border border-red-200 rounded text-[10px] font-bold hover:bg-red-100 transition">
                          <FiX className="w-3 h-3" /> Reject
                        </button>
                      </>
                    )}
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
                {modal === 'approve'  && 'Approve Withdrawal'}
                {modal === 'complete' && 'Mark as Completed'}
                {modal === 'reject'   && 'Reject Withdrawal'}
              </h3>
              <button onClick={closeModal} className="p-1 hover:bg-gray-100 rounded-lg transition">
                <FiX className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            <p className="text-[10px] font-mono text-gray-400">{targetId}</p>

            {actError && <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">{actError}</div>}
            {actOk    && <div className="p-2.5 bg-green-50 border border-green-200 rounded-xl text-xs text-green-700 font-bold">{actOk}</div>}

            {modal === 'approve' && !actOk && (
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                  Transaction Reference <span className="text-gray-400 font-normal">(optional — can add later)</span>
                </label>
                <input value={txRef} onChange={e => setTxRef(e.target.value)}
                  placeholder="e.g. TELE-TXN-12345"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-orange-400" />
              </div>
            )}

            {modal === 'complete' && !actOk && (
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Transaction Reference *</label>
                <input value={txRef} onChange={e => setTxRef(e.target.value)}
                  placeholder="e.g. TELE-TXN-12345"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-orange-400" />
              </div>
            )}

            {modal === 'reject' && !actOk && (
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Rejection Reason *</label>
                <textarea rows={3} value={reason} onChange={e => setReason(e.target.value)}
                  placeholder="e.g. Invalid account number"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-orange-400 resize-none" />
                <p className="text-[10px] text-amber-600 mt-1">Funds will be automatically returned to the user's wallet.</p>
              </div>
            )}

            {!actOk ? (
              <div className="flex gap-2 pt-1">
                <button onClick={closeModal}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 transition">
                  Cancel
                </button>
                <button onClick={handleAction} disabled={acting}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-black text-white transition disabled:opacity-50 ${
                    modal === 'reject' ? 'bg-red-500 hover:bg-red-600' :
                    modal === 'complete' ? 'bg-green-600 hover:bg-green-700' :
                    'bg-orange-500 hover:bg-orange-600'
                  }`}>
                  {acting ? <FiRefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FiCheck className="w-3.5 h-3.5" />}
                  {modal === 'approve' ? 'Approve' : modal === 'complete' ? 'Confirm Complete' : 'Confirm Rejection'}
                </button>
              </div>
            ) : (
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
