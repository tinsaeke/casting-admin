import { useEffect, useState } from 'react'
import { adminAPI } from '@/config/api'
import PageHeader from '@/components/common/PageHeader'
import DataTable from '@/components/common/DataTable'
import Pagination from '@/components/common/Pagination'
import {
  FiRefreshCw, FiShield, FiUser, FiCheckCircle, FiXCircle,
  FiAlertCircle, FiEye, FiCheck, FiX, FiSlash, FiFileText,
  FiLock, FiCopy, FiExternalLink, FiVolume2, FiImage, FiKey, FiHash
} from 'react-icons/fi'

export interface DigitalReplicaItem {
  _id?: string
  replica_id: string
  talent_id?: string
  party_id?: string
  display_name: string
  bio?: string
  status: 'draft' | 'pending_kyc' | 'active' | 'suspended' | 'revoked' | string
  kyc_status: 'unverified' | 'pending' | 'verified' | 'rejected' | string
  kyc_method?: 'national_id' | 'passport' | 'driving_license' | 'liveness_capture' | string
  kyc_document_ref?: string
  consent_version?: string
  consent_text_hash?: string
  consent_hash?: string
  data_training_consent?: boolean
  requires_actor_approval?: boolean
  components?: {
    face?: boolean
    voice?: boolean
    body?: boolean
    motion?: boolean
    expressions?: boolean
  }
  products?: string[]
  pricing_model?: string
  per_project_etb?: number
  allowed_uses?: string[]
  forbidden_uses?: string[]
  forbidden_products?: string[]
  allowed_territories?: string[]
  available_tiers?: string[]
  gender?: string
  age?: number
  languages?: string[]
  voice_type?: string
  specialties?: string[]
  headshot_url?: string
  voice_sample_url?: string
  photo_urls?: string[]
  rejection_reason?: string
  revocation_reason?: string
  created_at?: string
  createdAt?: string
  updated_at?: string
  updatedAt?: string
}

const KYC_STATUS_BADGE: Record<string, string> = {
  verified:   'bg-green-100 text-green-700 border-green-200',
  pending:    'bg-yellow-100 text-yellow-800 border-yellow-200 animate-pulse',
  rejected:   'bg-red-100 text-red-700 border-red-200',
  unverified: 'bg-gray-100 text-gray-600 border-gray-200',
}

const REPLICA_STATUS_BADGE: Record<string, string> = {
  active:      'bg-green-100 text-green-700 border-green-200',
  pending_kyc: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  draft:       'bg-gray-100 text-gray-600 border-gray-200',
  suspended:   'bg-orange-100 text-orange-700 border-orange-200',
  revoked:     'bg-red-100 text-red-700 border-red-200',
}

const KYC_METHOD_LABELS: Record<string, string> = {
  national_id:      'National ID (Fayda)',
  passport:         'Passport',
  driving_license:  'Driving License',
  liveness_capture: 'Liveness Biometric',
}

const USE_LABELS: Record<string, string> = {
  action_scenes:         'Action Scenes',
  stunt_double:          'Stunt Double',
  background_appearance: 'Background Extra',
  crowd_scenes:          'Crowd Scenes',
  de_aging:              'De-Aging',
  digital_double:        'Digital Double',
  commercial:            'Commercial & Promo',
  dialogue:              'Spoken Dialogue',
  romantic_scenes:       'Romantic Scenes',
  voice_cloning:         'AI Voice Clone',
}

export default function ReplicaKycPage() {
  const [replicas, setReplicas] = useState<DigitalReplicaItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit] = useState(20)
  const [kycFilter, setKycFilter] = useState<string>('pending')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [selectedReplica, setSelectedReplica] = useState<DigitalReplicaItem | null>(null)
  const [copiedHash, setCopiedHash] = useState(false)

  // Modals for Reject & Revoke
  const [rejectingItem, setRejectingItem] = useState<DigitalReplicaItem | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [revokingItem, setRevokingItem] = useState<DigitalReplicaItem | null>(null)
  const [revokeReason, setRevokeReason] = useState('')

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const load = async () => {
    setLoading(true); setError('')
    try {
      const res = await adminAPI.replicas({
        kyc_status: kycFilter === 'all' ? undefined : kycFilter,
        page,
        limit,
      })
      const list = res?.replicas || res?.data || (Array.isArray(res) ? res : [])
      const totalCount = res?.total ?? (Array.isArray(res) ? res.length : list.length)
      setReplicas(list)
      setTotal(totalCount)
    } catch (e: any) {
      setError(e.message || 'Failed to load replica KYC queue')
      setReplicas([])
      setTotal(0)
    }
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [page, kycFilter])

  const filtered = replicas.filter(r => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      r.display_name?.toLowerCase().includes(q) ||
      r.replica_id?.toLowerCase().includes(q) ||
      r.party_id?.toLowerCase().includes(q) ||
      r.kyc_document_ref?.toLowerCase().includes(q) ||
      r.bio?.toLowerCase().includes(q)
    )
  })

  // Quick stats
  const pendingCount = replicas.filter(r => r.kyc_status === 'pending').length
  const verifiedCount = replicas.filter(r => r.kyc_status === 'verified').length
  const rejectedCount = replicas.filter(r => r.kyc_status === 'rejected').length
  const revokedCount = replicas.filter(r => r.status === 'revoked').length

  const handleApprove = async (replica: DigitalReplicaItem) => {
    setActionLoading(replica.replica_id)
    setError(''); setSuccess('')
    try {
      await adminAPI.approveReplicaKyc(replica.replica_id)
      setSuccess(`Replica "${replica.display_name}" KYC verified & activated successfully!`)
      if (selectedReplica?.replica_id === replica.replica_id) {
        setSelectedReplica(null)
      }
      await load()
    } catch (e: any) {
      setError(e.message || 'Failed to approve replica KYC')
    }
    setActionLoading(null)
  }

  const handleRejectConfirm = async () => {
    if (!rejectingItem) return
    if (!rejectReason.trim()) {
      setError('Please provide a reason for rejecting KYC verification')
      return
    }

    setActionLoading(rejectingItem.replica_id)
    setError(''); setSuccess('')
    try {
      await adminAPI.rejectReplicaKyc(rejectingItem.replica_id, rejectReason.trim())
      setSuccess(`Replica "${rejectingItem.display_name}" KYC rejected.`)
      setRejectingItem(null)
      setRejectReason('')
      if (selectedReplica?.replica_id === rejectingItem.replica_id) {
        setSelectedReplica(null)
      }
      await load()
    } catch (e: any) {
      setError(e.message || 'Failed to reject replica KYC')
    }
    setActionLoading(null)
  }

  const handleRevokeConfirm = async () => {
    if (!revokingItem) return
    if (!revokeReason.trim()) {
      setError('Please provide a reason for revoking the replica license')
      return
    }

    setActionLoading(revokingItem.replica_id)
    setError(''); setSuccess('')
    try {
      await adminAPI.revokeReplica(revokingItem.replica_id, revokeReason.trim())
      setSuccess(`Replica "${revokingItem.display_name}" has been revoked platform-wide.`)
      setRevokingItem(null)
      setRevokeReason('')
      if (selectedReplica?.replica_id === revokingItem.replica_id) {
        setSelectedReplica(null)
      }
      await load()
    } catch (e: any) {
      setError(e.message || 'Failed to revoke replica')
    }
    setActionLoading(null)
  }

  const copyHash = (hash: string) => {
    navigator.clipboard.writeText(hash)
    setCopiedHash(true)
    setTimeout(() => setCopiedHash(false), 2000)
  }

  const columns = [
    {
      key: 'display_name', label: 'Actor & Replica',
      render: (r: DigitalReplicaItem) => {
        const photo = r.headshot_url || r.photo_urls?.[0]
        return (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 font-black text-sm flex items-center justify-center overflow-hidden shrink-0 border border-purple-200">
              {photo ? (
                <img src={photo} alt="" className="w-full h-full object-cover" />
              ) : (
                <FiUser className="w-5 h-5" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-black text-gray-900 truncate">{r.display_name || 'Unnamed Replica'}</p>
              <p className="text-[10px] text-gray-400 font-mono truncate">ID: {r.replica_id}</p>
              {r.party_id && (
                <p className="text-[10px] text-purple-600 font-mono truncate">Party: {r.party_id}</p>
              )}
            </div>
          </div>
        )
      },
    },
    {
      key: 'kyc_status', label: 'KYC Status & Method',
      render: (r: DigitalReplicaItem) => (
        <div>
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${KYC_STATUS_BADGE[r.kyc_status] || 'bg-gray-100 text-gray-700'}`}>
            {r.kyc_status || 'unverified'}
          </span>
          <p className="text-[10px] text-gray-500 font-semibold mt-1">
            {r.kyc_method ? (KYC_METHOD_LABELS[r.kyc_method] || r.kyc_method) : 'No Document'}
          </p>
          {r.kyc_document_ref && (
            <p className="text-[10px] text-gray-400 font-mono truncate max-w-[140px]">
              Ref: {r.kyc_document_ref}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'consent_version', label: 'Consent & Version',
      render: (r: DigitalReplicaItem) => {
        const hash = r.consent_text_hash || r.consent_hash
        return (
          <div>
            <div className="flex items-center gap-1.5">
              <FiShield className="w-3.5 h-3.5 text-purple-600 shrink-0" />
              <span className="text-xs font-bold text-gray-900">{r.consent_version || 'v2025.1'}</span>
            </div>
            {hash ? (
              <p className="text-[10px] text-gray-400 font-mono mt-0.5 truncate max-w-[120px]" title={hash}>
                SHA: {hash.slice(0, 10)}...
              </p>
            ) : (
              <p className="text-[10px] text-gray-400 mt-0.5">Pending Signature</p>
            )}
            {r.data_training_consent !== undefined && (
              <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded mt-0.5 inline-block ${
                r.data_training_consent ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-500'
              }`}>
                {r.data_training_consent ? 'AI Training Allowed' : 'No AI Training'}
              </span>
            )}
          </div>
        )
      },
    },
    {
      key: 'products', label: 'Modality Products',
      render: (r: DigitalReplicaItem) => (
        <div className="flex flex-wrap gap-1 max-w-xs">
          {(r.products || ['full_actor']).map(p => (
            <span key={p} className="text-[10px] font-semibold bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded capitalize">
              {p.replace('_', ' ')}
            </span>
          ))}
          {r.voice_sample_url && (
            <span className="text-[10px] font-bold bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded flex items-center gap-0.5">
              <FiVolume2 className="w-2.5 h-2.5" /> Voice
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'per_project_etb', label: 'Base Rate',
      render: (r: DigitalReplicaItem) => (
        <div className="font-mono">
          <span className="text-xs font-black text-gray-900">
            {r.per_project_etb ? `${Number(r.per_project_etb).toLocaleString()} ETB` : 'Dynamic'}
          </span>
          <p className="text-[10px] text-gray-400 capitalize">{r.pricing_model || 'per project'}</p>
        </div>
      ),
    },
    {
      key: 'status', label: 'Replica Status',
      render: (r: DigitalReplicaItem) => (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${REPLICA_STATUS_BADGE[r.status] || 'bg-gray-100 text-gray-700'}`}>
          {r.status || 'draft'}
        </span>
      ),
    },
    {
      key: 'actions', label: 'Actions',
      render: (r: DigitalReplicaItem) => {
        const isPending = r.kyc_status === 'pending'
        const isRevoked = r.status === 'revoked'
        const isProcessing = actionLoading === r.replica_id

        return (
          <div className="flex items-center gap-1.5">
            {/* Inspect Button */}
            <button
              onClick={() => setSelectedReplica(r)}
              className="p-1.5 hover:bg-purple-50 text-gray-600 hover:text-purple-700 rounded-lg transition"
              title="Inspect KYC dossier and actor consent"
            >
              <FiEye className="w-4 h-4" />
            </button>

            {/* Quick Approve Button */}
            {isPending && (
              <button
                onClick={() => handleApprove(r)}
                disabled={isProcessing}
                className="p-1.5 bg-green-50 hover:bg-green-600 text-green-700 hover:text-white rounded-lg transition disabled:opacity-50"
                title="Approve KYC verification"
              >
                <FiCheck className="w-4 h-4" />
              </button>
            )}

            {/* Quick Reject Button */}
            {isPending && (
              <button
                onClick={() => { setRejectingItem(r); setRejectReason('') }}
                disabled={isProcessing}
                className="p-1.5 bg-red-50 hover:bg-red-600 text-red-700 hover:text-white rounded-lg transition disabled:opacity-50"
                title="Reject KYC verification"
              >
                <FiX className="w-4 h-4" />
              </button>
            )}

            {/* Platform Revoke Tool */}
            {!isRevoked && r.status === 'active' && (
              <button
                onClick={() => { setRevokingItem(r); setRevokeReason('') }}
                disabled={isProcessing}
                className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-700 rounded-lg transition"
                title="Revoke / take down replica platform-wide"
              >
                <FiSlash className="w-4 h-4" />
              </button>
            )}
          </div>
        )
      },
    },
  ]

  return (
    <div>
      <PageHeader
        title="Digital Replica KYC Review Queue"
        subtitle="Review actor consent, verify legal identity documents, approve marketplace listings, or issue platform revocations"
        actions={
          <button
            onClick={load}
            disabled={loading}
            className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition disabled:opacity-40"
            title="Refresh queue"
          >
            <FiRefreshCw className={`w-4 h-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
          </button>
        }
      />

      <div className="p-6 space-y-6">
        {/* Top Queue Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div
            onClick={() => { setKycFilter('pending'); setPage(1) }}
            className={`cursor-pointer border rounded-2xl p-4 flex items-center gap-3 transition ${
              kycFilter === 'pending'
                ? 'bg-yellow-50 border-yellow-300 ring-2 ring-yellow-400/20 shadow-xs'
                : 'bg-white border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-yellow-100 text-yellow-800 flex items-center justify-center font-bold text-lg">
              <FiShield className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Pending KYC</p>
              <p className="text-xl font-black text-gray-900">{pendingCount}</p>
            </div>
          </div>

          <div
            onClick={() => { setKycFilter('verified'); setPage(1) }}
            className={`cursor-pointer border rounded-2xl p-4 flex items-center gap-3 transition ${
              kycFilter === 'verified'
                ? 'bg-green-50 border-green-300 ring-2 ring-green-400/20 shadow-xs'
                : 'bg-white border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-green-100 text-green-700 flex items-center justify-center font-bold text-lg">
              <FiCheckCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Verified & Active</p>
              <p className="text-xl font-black text-gray-900">{verifiedCount}</p>
            </div>
          </div>

          <div
            onClick={() => { setKycFilter('rejected'); setPage(1) }}
            className={`cursor-pointer border rounded-2xl p-4 flex items-center gap-3 transition ${
              kycFilter === 'rejected'
                ? 'bg-red-50 border-red-300 ring-2 ring-red-400/20 shadow-xs'
                : 'bg-white border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-red-100 text-red-700 flex items-center justify-center font-bold text-lg">
              <FiXCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Rejected KYC</p>
              <p className="text-xl font-black text-gray-900">{rejectedCount}</p>
            </div>
          </div>

          <div
            onClick={() => { setKycFilter('all'); setPage(1) }}
            className={`cursor-pointer border rounded-2xl p-4 flex items-center gap-3 transition ${
              kycFilter === 'all'
                ? 'bg-purple-50 border-purple-300 ring-2 ring-purple-400/20 shadow-xs'
                : 'bg-white border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-lg">
              <FiFileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Total in Registry</p>
              <p className="text-xl font-black text-gray-900">{total}</p>
            </div>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            {[
              { id: 'pending',    label: 'Pending KYC' },
              { id: 'all',        label: 'All Replicas' },
              { id: 'verified',   label: 'Verified' },
              { id: 'rejected',   label: 'Rejected' },
              { id: 'unverified', label: 'Unverified' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => { setKycFilter(tab.id); setPage(1) }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  kycFilter === tab.id
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="w-full md:w-72">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search actor name, ID, doc ref..."
              className="w-full px-3.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-purple-500 transition"
            />
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
            <FiAlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl text-xs text-green-700 font-bold">
            <FiCheckCircle className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Data Table */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xs">
          <DataTable
            columns={columns}
            data={filtered}
            loading={loading}
            emptyMsg="No digital replicas found in this queue"
          />

          <div className="p-4 border-t border-gray-100">
            <Pagination
              page={page}
              pages={Math.ceil(total / limit) || 1}
              total={total}
              onChange={setPage}
            />
          </div>
        </div>
      </div>

      {/* ── Actor KYC & Consent Inspection Modal ─────────────────────────────── */}
      {selectedReplica && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-gray-200 overflow-hidden animate-scale-up max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <FiShield className="w-5 h-5 text-purple-600" />
                <div>
                  <h3 className="text-sm font-black text-gray-900">Actor KYC & Consent Dossier</h3>
                  <p className="text-[10px] text-gray-400">SAG-AFTRA 2025 Digital Replica Compliance Verification</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedReplica(null)}
                className="p-1 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 overflow-y-auto flex-1">
              {/* Actor Identity Card */}
              <div className="flex items-center gap-3.5 p-4 bg-purple-50/70 rounded-2xl border border-purple-100">
                <div className="w-14 h-14 rounded-2xl bg-purple-200 text-purple-800 font-bold flex items-center justify-center overflow-hidden shrink-0 border-2 border-white shadow-xs">
                  {selectedReplica.headshot_url || selectedReplica.photo_urls?.[0] ? (
                    <img src={selectedReplica.headshot_url || selectedReplica.photo_urls?.[0]} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <FiUser className="w-7 h-7" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-black text-gray-900 truncate">{selectedReplica.display_name}</h4>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${KYC_STATUS_BADGE[selectedReplica.kyc_status]}`}>
                      KYC: {selectedReplica.kyc_status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{selectedReplica.bio || 'Consented AI actor replica available for licensing'}</p>
                  <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-400 font-mono">
                    <span>Replica ID: {selectedReplica.replica_id}</span>
                    {selectedReplica.party_id && <span>· Party: {selectedReplica.party_id}</span>}
                  </div>
                </div>
              </div>

              {/* Identification & KYC Document Dossier */}
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-3">
                <div className="flex items-center gap-2">
                  <FiKey className="w-4 h-4 text-purple-600" />
                  <h5 className="text-xs font-black text-gray-900 uppercase tracking-wide">Government Identity Verification</h5>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase">KYC Verification Method</span>
                    <p className="font-bold text-gray-900 mt-0.5">
                      {selectedReplica.kyc_method ? (KYC_METHOD_LABELS[selectedReplica.kyc_method] || selectedReplica.kyc_method) : 'Not Provided'}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase">Document / Reference Number</span>
                    <p className="font-bold font-mono text-purple-700 mt-0.5 truncate">
                      {selectedReplica.kyc_document_ref || 'None'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Cryptographic Consent Hash & SAG-AFTRA Protections */}
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FiLock className="w-4 h-4 text-purple-600" />
                    <h5 className="text-xs font-black text-gray-900 uppercase tracking-wide">Cryptographic Consent Record</h5>
                  </div>
                  <span className="text-[10px] font-mono bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded">
                    Consent {selectedReplica.consent_version || 'v2025.1-ETH-SAG'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase">SHA-256 Consent Text Integrity Hash</span>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      readOnly
                      value={selectedReplica.consent_text_hash || selectedReplica.consent_hash || 'No cryptographic hash generated'}
                      className="w-full font-mono text-[11px] bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-gray-700 select-all"
                    />
                    {(selectedReplica.consent_text_hash || selectedReplica.consent_hash) && (
                      <button
                        onClick={() => copyHash(selectedReplica.consent_text_hash || selectedReplica.consent_hash || '')}
                        className="px-3 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1"
                        title="Copy SHA-256 hash"
                      >
                        <FiCopy className="w-3.5 h-3.5" />
                        <span>{copiedHash ? 'Copied' : 'Copy'}</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs pt-2 border-t border-gray-200">
                  <div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase">AI Model Training Consent</span>
                    <p className={`font-bold mt-0.5 ${selectedReplica.data_training_consent ? 'text-blue-700' : 'text-gray-700'}`}>
                      {selectedReplica.data_training_consent ? '✓ Explicitly Authorized' : '✕ Prohibited (Inference Only)'}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase">48-Hr Actor Approval Workflow</span>
                    <p className={`font-bold mt-0.5 ${selectedReplica.requires_actor_approval !== false ? 'text-green-700' : 'text-amber-700'}`}>
                      {selectedReplica.requires_actor_approval !== false ? '✓ Enforced (Actor Reviews Uses)' : 'Instant Auto-License'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Permitted Uses & Scope of Likeness */}
              <div className="space-y-2 text-xs">
                <span className="text-xs font-black text-gray-900 uppercase tracking-wide block">
                  Permitted Use Types
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {(selectedReplica.allowed_uses && selectedReplica.allowed_uses.length > 0) ? (
                    selectedReplica.allowed_uses.map(u => (
                      <span key={u} className="bg-green-50 text-green-700 border border-green-200 text-[11px] font-bold px-2.5 py-1 rounded-lg">
                        ✓ {USE_LABELS[u] || u}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-400 italic">No specific allowed uses specified</span>
                  )}
                </div>

                {selectedReplica.forbidden_uses && selectedReplica.forbidden_uses.length > 0 && (
                  <div className="mt-2">
                    <span className="text-xs font-black text-red-700 uppercase tracking-wide block mb-1">
                      Prohibited / Forbidden Uses
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedReplica.forbidden_uses.map(u => (
                        <span key={u} className="bg-red-50 text-red-700 border border-red-200 text-[11px] font-bold px-2.5 py-1 rounded-lg">
                          ✕ {USE_LABELS[u] || u}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Voice & Media Sample */}
              {selectedReplica.voice_sample_url && (
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-800">
                    <FiVolume2 className="w-4 h-4 text-purple-600" />
                    <span>Actor Voice Sample:</span>
                  </div>
                  <audio controls src={selectedReplica.voice_sample_url} className="h-8 max-w-xs" />
                </div>
              )}
            </div>

            {/* Modal Actions Footer */}
            <div className="px-6 py-3.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between shrink-0">
              {selectedReplica.status === 'active' ? (
                <button
                  onClick={() => { setRevokingItem(selectedReplica); setRevokeReason('') }}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-red-50 hover:bg-red-600 text-red-700 hover:text-white rounded-xl text-xs font-bold transition"
                >
                  <FiSlash className="w-3.5 h-3.5" />
                  <span>Revoke Platform-Wide</span>
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleApprove(selectedReplica)}
                    disabled={actionLoading === selectedReplica.replica_id}
                    className="flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold transition disabled:opacity-50 shadow-sm"
                  >
                    <FiCheck className="w-3.5 h-3.5" />
                    <span>Approve KYC & Activate</span>
                  </button>
                  <button
                    onClick={() => { setRejectingItem(selectedReplica); setRejectReason('') }}
                    disabled={actionLoading === selectedReplica.replica_id}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-red-50 hover:bg-red-600 text-red-700 hover:text-white rounded-xl text-xs font-bold transition"
                  >
                    <FiX className="w-3.5 h-3.5" />
                    <span>Reject KYC</span>
                  </button>
                </div>
              )}

              <button
                onClick={() => setSelectedReplica(null)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl text-xs font-bold transition"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Reject KYC Modal ─────────────────────────────────────────────────── */}
      {rejectingItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-gray-200 overflow-hidden animate-scale-up">
            <div className="px-5 py-4 bg-red-50 border-b border-red-100 flex items-center justify-between">
              <div className="flex items-center gap-2 text-red-700 font-black text-sm">
                <FiXCircle className="w-4 h-4" />
                <span>Reject KYC Verification</span>
              </div>
              <button onClick={() => setRejectingItem(null)} className="text-gray-400 hover:text-gray-600">
                <FiX className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3">
              <p className="text-xs text-gray-600">
                You are rejecting KYC verification for <strong className="text-gray-900">{rejectingItem.display_name}</strong>. The actor will receive this reason to correct their document.
              </p>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">
                  Rejection Reason *
                </label>
                <textarea
                  rows={3}
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  placeholder="e.g. Identity document photo is blurry or unreadable. Please provide a clear scan."
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-red-500 transition"
                />
              </div>
            </div>

            <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
              <button
                onClick={() => setRejectingItem(null)}
                className="px-3.5 py-1.5 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectConfirm}
                disabled={!rejectReason.trim() || actionLoading === rejectingItem.replica_id}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition disabled:opacity-50"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Revoke Replica Platform-Wide Modal ───────────────────────────────── */}
      {revokingItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-gray-200 overflow-hidden animate-scale-up">
            <div className="px-5 py-4 bg-red-50 border-b border-red-100 flex items-center justify-between">
              <div className="flex items-center gap-2 text-red-700 font-black text-sm">
                <FiSlash className="w-4 h-4" />
                <span>Revoke Replica Platform-Wide</span>
              </div>
              <button onClick={() => setRevokingItem(null)} className="text-gray-400 hover:text-gray-600">
                <FiX className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3">
              <p className="text-xs text-gray-600">
                Revoking <strong className="text-gray-900">{revokingItem.display_name}</strong> will immediately remove the replica from the marketplace and terminate active generation rights.
              </p>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">
                  Revocation Reason / Dispute Details *
                </label>
                <textarea
                  rows={3}
                  value={revokeReason}
                  onChange={e => setRevokeReason(e.target.value)}
                  placeholder="e.g. Actor requested rights withdrawal or contract dispute reported."
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-red-500 transition"
                />
              </div>
            </div>

            <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
              <button
                onClick={() => setRevokingItem(null)}
                className="px-3.5 py-1.5 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={handleRevokeConfirm}
                disabled={!revokeReason.trim() || actionLoading === revokingItem.replica_id}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition disabled:opacity-50"
              >
                Revoke Replica
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
