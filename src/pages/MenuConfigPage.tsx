import { useEffect, useState } from 'react'
import { menuConfigAPI, MenuConfigItem } from '@/config/api'
import PageHeader from '@/components/common/PageHeader'
import DataTable from '@/components/common/DataTable'
import Pagination from '@/components/common/Pagination'
import {
  FiRefreshCw, FiMenu, FiPlus, FiEdit2, FiTrash2, FiTag,
  FiCheckCircle, FiXCircle, FiLock, FiGlobe, FiEye, FiEyeOff,
  FiLayers, FiSliders, FiCopy, FiCheck, FiX, FiAlertCircle,
  FiStar, FiUsers, FiCpu, FiExternalLink, FiHelpCircle
} from 'react-icons/fi'

// Pre-defined role options for casting
const ROLE_OPTIONS = [
  { id: 'talent',             label: 'Talent / Actor',       color: 'bg-purple-100 text-purple-800 border-purple-200' },
  { id: 'employer',           label: 'Employer / Producer',  color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { id: 'agency',             label: 'Agency',               color: 'bg-amber-100 text-amber-800 border-amber-200' },
  { id: 'cast_agency',        label: 'Cast Agency',          color: 'bg-orange-100 text-orange-800 border-orange-200' },
  { id: 'studio_provider',    label: 'Studio Provider',      color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  { id: 'content_creator',    label: 'Content Creator',      color: 'bg-cyan-100 text-cyan-800 border-cyan-200' },
  { id: 'production_crew',    label: 'Production Crew',      color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  { id: 'location_scout',     label: 'Location Scout',       color: 'bg-teal-100 text-teal-800 border-teal-200' },
  { id: 'aggregator_scout',   label: 'Aggregator Scout',     color: 'bg-rose-100 text-rose-800 border-rose-200' },
  { id: 'academy',            label: 'Academy',              color: 'bg-violet-100 text-violet-800 border-violet-200' },
]

const SUBSCRIPTION_TIERS = [
  { id: 'free',         label: 'Free / Basic' },
  { id: 'standard',     label: 'Standard' },
  { id: 'professional', label: 'Professional' },
  { id: 'enterprise',   label: 'Enterprise' },
  { id: 'vip',          label: 'VIP' },
]

export const ALL_36_CASTING_MENUS = [
  { menuId: 'casting-calls',            path: '/casting',                       label: 'Casting Calls',           icon: '🎬', allowedUserTypes: [],                                                                 order: 10,  description: 'Everyone' },
  { menuId: 'casting-talent-browse',     path: '/casting/talent-search',          label: 'Browse Talents',          icon: '👥', allowedUserTypes: [],                                                                 order: 20,  description: 'Everyone' },
  { menuId: 'casting-studios',          path: '/casting/studios',                label: 'Studios',                 icon: '🎥', allowedUserTypes: [],                                                                 order: 30,  description: 'Everyone' },
  { menuId: 'casting-academies',        path: '/casting/academies',              label: 'Academies',               icon: '🏫', allowedUserTypes: [],                                                                 order: 40,  description: 'Everyone' },
  { menuId: 'casting-locations',        path: '/casting/locations',              label: 'Locations',               icon: '📍', allowedUserTypes: [],                                                                 order: 50,  description: 'Everyone' },
  { menuId: 'replicas-marketplace',     path: '/casting/replicas/marketplace',   label: 'AI Replica Marketplace',  icon: '🤖', allowedUserTypes: [],                                                                 order: 60,  description: 'Everyone' },
  { menuId: 'talent-dashboard',         path: '/casting/talent-dashboard',       label: 'Talent Dashboard',        icon: '📊', allowedUserTypes: ['talent'],                                                         order: 100, description: 'talent' },
  { menuId: 'talent-auditions',         path: '/casting/auditions',              label: 'My Auditions',            icon: '📹', allowedUserTypes: ['talent'],                                                         order: 110, description: 'talent' },
  { menuId: 'talent-bookings',          path: '/casting/bookings',               label: 'My Bookings',             icon: '📑', allowedUserTypes: ['talent'],                                                         order: 120, description: 'talent' },
  { menuId: 'talent-invitations',       path: '/casting/invitations',            label: 'Invitations',             icon: '✉️', allowedUserTypes: ['talent'],                                                         order: 130, description: 'talent' },
  { menuId: 'talent-call-sheets',       path: '/casting/call-sheets',            label: 'Call Sheets',             icon: '📋', allowedUserTypes: ['talent'],                                                         order: 140, description: 'talent' },
  { menuId: 'talent-wallet',            path: '/casting/wallet',                 label: 'Talent Wallet',           icon: '💳', allowedUserTypes: ['talent'],                                                         order: 150, description: 'talent' },
  { menuId: 'talent-practice-studio',   path: '/casting/rehearsal',              label: 'Practice Studio',         icon: '🎭', allowedUserTypes: ['talent'],                                                         order: 160, description: 'talent' },
  { menuId: 'talent-my-replica',        path: '/casting/replicas/my-replica',    label: 'My AI Replica',           icon: '✨', allowedUserTypes: ['talent'],                                                         order: 170, description: 'talent' },
  { menuId: 'employer-dashboard',       path: '/casting/employer',               label: 'Employer Dashboard',      icon: '🏢', allowedUserTypes: ['employer', 'studio_provider', 'content_creator'],                  order: 200, description: 'employer, studio_provider, content_creator' },
  { menuId: 'employer-auditions',       path: '/casting/auditions',              label: 'Review Auditions',        icon: '🎞️', allowedUserTypes: ['employer', 'studio_provider', 'content_creator'],                  order: 210, description: 'employer, studio_provider, content_creator' },
  { menuId: 'employer-bookings',        path: '/casting/bookings',               label: 'Manage Bookings',         icon: '🤝', allowedUserTypes: ['employer', 'studio_provider', 'content_creator'],                  order: 220, description: 'employer, studio_provider, content_creator' },
  { menuId: 'employer-my-talents',      path: '/casting/my-talents',             label: 'Roster / My Talents',     icon: '⭐', allowedUserTypes: ['employer', 'agency', 'cast_agency', 'studio_provider'],          order: 230, description: 'employer, agency, cast_agency, studio_provider' },
  { menuId: 'employer-talent-search',   path: '/casting/talent-search',          label: 'Talent Scout Engine',     icon: '🔍', allowedUserTypes: ['employer', 'agency', 'cast_agency', 'studio_provider', 'content_creator'], order: 240, description: 'employer, agency, cast_agency, studio_provider, content_creator' },
  { menuId: 'employer-call-sheets',     path: '/casting/call-sheets',            label: 'Create Call Sheets',      icon: '📝', allowedUserTypes: ['employer', 'agency', 'cast_agency', 'studio_provider'],          order: 250, description: 'employer, agency, cast_agency, studio_provider' },
  { menuId: 'employer-productions',     path: '/casting/productions',            label: 'Productions',             icon: '🎬', allowedUserTypes: ['employer', 'agency', 'studio_provider', 'content_creator'],          order: 260, description: 'employer, agency, studio_provider, content_creator' },
  { menuId: 'employer-crew-organizer',  path: '/casting/screenplays/crew-org',   label: 'Crew Organizer',          icon: '🎛️', allowedUserTypes: ['employer', 'agency', 'studio_provider'],                          order: 270, description: 'employer, agency, studio_provider' },
  { menuId: 'replicas-my-licenses',     path: '/casting/replicas/licenses',      label: 'Purchased Replica Licenses', icon: '📜', allowedUserTypes: ['employer', 'agency', 'cast_agency', 'studio_provider', 'content_creator'], order: 280, description: 'employer, agency, cast_agency, studio_provider, content_creator' },
  { menuId: 'agency-dashboard',         path: '/casting/agency/dashboard',       label: 'Agency Dashboard',        icon: '💼', allowedUserTypes: ['agency', 'cast_agency'],                                         order: 300, description: 'agency, cast_agency' },
  { menuId: 'agency-wallet',            path: '/casting/wallet',                 label: 'Agency Wallet',           icon: '💰', allowedUserTypes: ['agency', 'cast_agency'],                                         order: 310, description: 'agency, cast_agency' },
  { menuId: 'crew-dashboard',           path: '/casting/crew-dashboard',         label: 'Crew Dashboard',          icon: '🛠️', allowedUserTypes: ['production_crew'],                                                order: 400, description: 'production_crew' },
  { menuId: 'crew-profile-setup',       path: '/casting/crew-profile-setup',     label: 'Crew Profile Setup',      icon: '⚙️', allowedUserTypes: ['production_crew'],                                                order: 410, description: 'production_crew' },
  { menuId: 'scout-my-locations',       path: '/casting/my-locations',           label: 'My Locations',            icon: '🗺️', allowedUserTypes: ['location_scout'],                                                 order: 500, description: 'location_scout' },
  { menuId: 'scout-register-location',  path: '/casting/locations/register',     label: 'Register Location',       icon: '➕', allowedUserTypes: ['location_scout'],                                                 order: 510, description: 'location_scout' },
  { menuId: 'aggregator-dashboard',     path: '/casting/scout-dashboard',        label: 'Aggregator Scout Hub',    icon: '📡', allowedUserTypes: ['aggregator_scout'],                                               order: 600, description: 'aggregator_scout' },
  { menuId: 'aggregator-post-call',     path: '/casting/scout-dashboard/post',   label: 'Aggregator Post Call',    icon: '📢', allowedUserTypes: ['aggregator_scout'],                                               order: 610, description: 'aggregator_scout' },
  { menuId: 'academy-dashboard',        path: '/casting/academy-dashboard',      label: 'Academy Dashboard',       icon: '🎓', allowedUserTypes: ['academy'],                                                        order: 700, description: 'academy' },
  { menuId: 'academy-setup',            path: '/casting/academy-setup',          label: 'Academy Setup',           icon: '🏛️', allowedUserTypes: ['academy'],                                                        order: 710, description: 'academy' },
  { menuId: 'studio-dashboard',         path: '/casting/studio-dashboard',       label: 'Studio Dashboard',        icon: '🎥', allowedUserTypes: ['studio_provider'],                                                order: 800, description: 'studio_provider' },
  { menuId: 'studio-setup',            path: '/casting/studio-setup',           label: 'Studio Setup',            icon: '🎙️', allowedUserTypes: ['studio_provider'],                                                order: 810, description: 'studio_provider' },
  { menuId: 'casting-invitations',      path: '/casting/invitations',            label: 'Global Invitations',      icon: '📬', allowedUserTypes: ['talent', 'employer', 'agency', 'cast_agency', 'academy', 'studio_provider'], order: 900, description: 'talent, employer, agency, cast_agency, academy, studio_provider' },
]

export default function MenuConfigPage() {
  const [menus, setMenus] = useState<MenuConfigItem[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Modals
  const [editingItem, setEditingItem] = useState<MenuConfigItem | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [badgeModalItem, setBadgeModalItem] = useState<MenuConfigItem | null>(null)
  const [badgeValue, setBadgeValue] = useState('')
  const [showCatalogModal, setShowCatalogModal] = useState(false)

  // Form State for Create / Edit
  const [formData, setFormData] = useState<{
    menuId: string
    label: string
    path: string
    icon: string
    isActive: boolean
    order: number
    allowedUserTypes: string[]
    allowedSubscriptionTiers: string[]
    minTrustScore: number
    translations: { am: string; en: string }
  }>({
    menuId: '',
    label: '',
    path: '',
    icon: '🎬',
    isActive: true,
    order: 100,
    allowedUserTypes: [],
    allowedSubscriptionTiers: [],
    minTrustScore: 0,
    translations: { am: '', en: '' },
  })

  const load = async () => {
    setLoading(true); setError('')
    try {
      const res = await menuConfigAPI.getCastingMenus('casting')
      const list: MenuConfigItem[] = Array.isArray(res) ? res : (res?.data || res?.menus || [])
      // Sort by order ascending
      list.sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
      setMenus(list)
    } catch (e: any) {
      setError(e.message || 'Failed to load casting menu configuration')
      setMenus([])
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  // Quick 1-click active/inactive toggle
  const handleToggleActive = async (menu: MenuConfigItem) => {
    const newStatus = !menu.isActive
    setActionLoading(menu.menuId)
    setError(''); setSuccess('')
    try {
      await menuConfigAPI.toggleActive(menu.menuId, newStatus)
      setMenus(prev => prev.map(m => m.menuId === menu.menuId ? { ...m, isActive: newStatus } : m))
      setSuccess(`Menu "${menu.label}" is now ${newStatus ? 'Active' : 'Inactive / Hidden'}.`)
    } catch (e: any) {
      setError(e.message || 'Failed to toggle menu status')
    }
    setActionLoading(null)
  }

  // Quick badge save / clear
  const handleSaveBadge = async () => {
    if (!badgeModalItem) return
    setActionLoading(badgeModalItem.menuId)
    setError(''); setSuccess('')
    try {
      const val = badgeValue.trim() ? badgeValue.trim() : null
      await menuConfigAPI.setBadge(badgeModalItem.menuId, val)
      setMenus(prev => prev.map(m => m.menuId === badgeModalItem.menuId ? { ...m, badge: val } : m))
      setSuccess(val ? `Badge "${val}" set on ${badgeModalItem.label}.` : `Badge cleared on ${badgeModalItem.label}.`)
      setBadgeModalItem(null)
    } catch (e: any) {
      setError(e.message || 'Failed to update menu badge')
    }
    setActionLoading(null)
  }

  // Open Edit Modal
  const handleOpenEdit = (m: MenuConfigItem) => {
    setEditingItem(m)
    setFormData({
      menuId: m.menuId,
      label: m.label,
      path: m.path,
      icon: m.icon || '🎬',
      isActive: m.isActive !== false,
      order: m.order ?? 100,
      allowedUserTypes: m.allowedUserTypes || [],
      allowedSubscriptionTiers: m.allowedSubscriptionTiers || [],
      minTrustScore: m.minTrustScore || 0,
      translations: {
        am: m.translations?.am || '',
        en: m.translations?.en || m.label || '',
      },
    })
  }

  // Open Create Modal
  const handleOpenCreate = () => {
    setIsCreating(true)
    setFormData({
      menuId: '',
      label: '',
      path: '/casting/',
      icon: '✨',
      isActive: true,
      order: (menus.length + 1) * 10,
      allowedUserTypes: [],
      allowedSubscriptionTiers: [],
      minTrustScore: 0,
      translations: { am: '', en: '' },
    })
  }

  // Save Edit
  const handleSaveEdit = async () => {
    if (!editingItem) return
    setActionLoading(editingItem.menuId)
    setError(''); setSuccess('')
    try {
      const updates = {
        label: formData.label.trim(),
        path: formData.path.trim(),
        icon: formData.icon.trim(),
        isActive: formData.isActive,
        order: Number(formData.order),
        allowedUserTypes: formData.allowedUserTypes,
        allowedSubscriptionTiers: formData.allowedSubscriptionTiers,
        minTrustScore: Number(formData.minTrustScore),
        translations: {
          am: formData.translations.am.trim() || undefined,
          en: formData.translations.en.trim() || formData.label.trim(),
        },
      }
      await menuConfigAPI.updateMenu(editingItem.menuId, updates)
      setSuccess(`Menu "${formData.label}" updated successfully.`)
      setEditingItem(null)
      await load()
    } catch (e: any) {
      setError(e.message || 'Failed to save menu changes')
    }
    setActionLoading(null)
  }

  // Save Create
  const handleSaveCreate = async () => {
    if (!formData.menuId.trim() || !formData.label.trim() || !formData.path.trim()) {
      setError('Please provide Menu ID, Label, and Path')
      return
    }
    setActionLoading('new')
    setError(''); setSuccess('')
    try {
      await menuConfigAPI.createMenu({
        menuId: formData.menuId.trim(),
        label: formData.label.trim(),
        path: formData.path.trim(),
        icon: formData.icon.trim(),
        isActive: formData.isActive,
        order: Number(formData.order),
        platform: 'casting',
        allowedUserTypes: formData.allowedUserTypes,
        allowedSubscriptionTiers: formData.allowedSubscriptionTiers,
        minTrustScore: Number(formData.minTrustScore),
        translations: {
          am: formData.translations.am.trim() || undefined,
          en: formData.translations.en.trim() || formData.label.trim(),
        },
      })
      setSuccess(`Menu item "${formData.label}" created successfully for casting platform.`)
      setIsCreating(false)
      await load()
    } catch (e: any) {
      setError(e.message || 'Failed to create menu item')
    }
    setActionLoading(null)
  }

  // Delete Menu Item
  const handleDelete = async (m: MenuConfigItem) => {
    if (!window.confirm(`Are you sure you want to delete menu "${m.label}" (${m.menuId})?`)) {
      return
    }
    setActionLoading(m.menuId)
    setError(''); setSuccess('')
    try {
      await menuConfigAPI.deleteMenu(m.menuId)
      setSuccess(`Menu "${m.label}" deleted.`)
      setMenus(prev => prev.filter(item => item.menuId !== m.menuId))
    } catch (e: any) {
      setError(e.message || 'Failed to delete menu item')
    }
    setActionLoading(null)
  }

  // Quick Seed All 36 Standard Menus
  const handleSeedStandardCatalogue = async () => {
    if (!window.confirm('Sync/Pre-populate missing standard casting menus from the 36-item catalog?')) {
      return
    }
    setActionLoading('seed')
    setError(''); setSuccess('')
    try {
      const existingIds = new Set(menus.map(m => m.menuId))
      const missing = ALL_36_CASTING_MENUS.filter(item => !existingIds.has(item.menuId))
      
      if (missing.length === 0) {
        setSuccess('All 36 standard casting menus are already registered in the system!')
      } else {
        let createdCount = 0
        for (const item of missing) {
          await menuConfigAPI.createMenu({
            menuId: item.menuId,
            label: item.label,
            path: item.path,
            icon: item.icon,
            order: item.order,
            isActive: true,
            platform: 'casting',
            allowedUserTypes: item.allowedUserTypes,
            allowedSubscriptionTiers: [],
            minTrustScore: 0,
            translations: {
              en: item.label,
            },
          })
          createdCount++
        }
        setSuccess(`Successfully seeded ${createdCount} standard casting menu items!`)
        await load()
      }
    } catch (e: any) {
      setError(e.message || 'Failed to seed standard menus')
    }
    setActionLoading(null)
    setShowCatalogModal(false)
  }

  // Quick Copy ID
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setSuccess(`Copied "${text}" to clipboard!`)
    setTimeout(() => setSuccess(''), 2500)
  }

  // Filter logic
  const filtered = menus.filter(m => {
    // Search query
    if (search.trim()) {
      const q = search.toLowerCase()
      const matchesSearch =
        m.label?.toLowerCase().includes(q) ||
        m.menuId?.toLowerCase().includes(q) ||
        m.path?.toLowerCase().includes(q) ||
        m.translations?.am?.toLowerCase().includes(q) ||
        m.translations?.en?.toLowerCase().includes(q)
      if (!matchesSearch) return false
    }

    // Role filter
    if (roleFilter !== 'all') {
      if (roleFilter === 'everyone') {
        if (m.allowedUserTypes && m.allowedUserTypes.length > 0) return false
      } else {
        if (!m.allowedUserTypes || !m.allowedUserTypes.includes(roleFilter)) return false
      }
    }

    // Status filter
    if (statusFilter === 'active' && !m.isActive) return false
    if (statusFilter === 'inactive' && m.isActive) return false
    if (statusFilter === 'badged' && !m.badge) return false
    if (statusFilter === 'gated' && (!m.allowedSubscriptionTiers || m.allowedSubscriptionTiers.length === 0)) return false

    return true
  })

  // Quick Counters
  const totalCount = menus.length
  const activeCount = menus.filter(m => m.isActive !== false).length
  const inactiveCount = menus.filter(m => m.isActive === false).length
  const badgedCount = menus.filter(m => Boolean(m.badge)).length
  const gatedCount = menus.filter(m => (m.allowedSubscriptionTiers || []).length > 0).length

  const columns = [
    {
      key: 'order', label: 'Order',
      render: (m: MenuConfigItem) => (
        <span className="font-mono text-xs font-black text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
          {m.order ?? 100}
        </span>
      ),
    },
    {
      key: 'menu', label: 'Menu Item & ID',
      render: (m: MenuConfigItem) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center text-lg shrink-0 border border-orange-100 shadow-xs">
            {m.icon || '🎬'}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-gray-900 truncate">{m.label}</span>
              {m.badge && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-rose-500 text-white uppercase tracking-wider animate-pulse">
                  {m.badge}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10px] font-mono text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded truncate max-w-[140px]" title={m.menuId}>
                {m.menuId}
              </span>
              <button
                onClick={() => copyToClipboard(m.menuId)}
                className="text-gray-400 hover:text-purple-700 transition p-0.5"
                title="Copy menuId"
              >
                <FiCopy className="w-2.5 h-2.5" />
              </button>
            </div>
            {m.translations?.am && (
              <p className="text-[10px] text-gray-500 mt-0.5">
                🇪🇹 <span className="font-medium text-gray-700">{m.translations.am}</span>
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'path', label: 'Target Path',
      render: (m: MenuConfigItem) => (
        <span className="font-mono text-[11px] text-gray-700 bg-gray-50 border border-gray-200/60 px-2 py-1 rounded block max-w-fit truncate">
          {m.path}
        </span>
      ),
    },
    {
      key: 'allowedUserTypes', label: 'Audience / Who Sees It',
      render: (m: MenuConfigItem) => {
        const roles = m.allowedUserTypes || []
        if (roles.length === 0) {
          return (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full">
              <FiGlobe className="w-3 h-3" /> Everyone
            </span>
          )
        }
        return (
          <div className="flex flex-wrap gap-1 max-w-xs">
            {roles.slice(0, 3).map(r => {
              const opt = ROLE_OPTIONS.find(o => o.id === r)
              return (
                <span
                  key={r}
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded border capitalize ${
                    opt?.color || 'bg-gray-100 text-gray-700 border-gray-200'
                  }`}
                >
                  {r.replace(/_/g, ' ')}
                </span>
              )
            })}
            {roles.length > 3 && (
              <span className="text-[10px] font-bold bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                +{roles.length - 3} more
              </span>
            )}
          </div>
        )
      },
    },
    {
      key: 'tiers', label: 'Plan Gating',
      render: (m: MenuConfigItem) => {
        const tiers = m.allowedSubscriptionTiers || []
        if (tiers.length === 0) {
          return <span className="text-[11px] text-gray-400 font-medium">Free Access</span>
        }
        return (
          <div className="flex flex-wrap gap-1">
            {tiers.map(t => (
              <span key={t} className="text-[10px] font-black bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded capitalize flex items-center gap-1">
                <FiLock className="w-2.5 h-2.5 text-amber-600" /> {t}
              </span>
            ))}
          </div>
        )
      },
    },
    {
      key: 'status', label: 'Status & Visibility',
      render: (m: MenuConfigItem) => {
        const active = m.isActive !== false
        const isBusy = actionLoading === m.menuId
        return (
          <button
            onClick={() => handleToggleActive(m)}
            disabled={isBusy}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition ${
              active
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
            }`}
            title="Click to toggle menu visibility"
          >
            {active ? <FiEye className="w-3.5 h-3.5 text-emerald-600" /> : <FiEyeOff className="w-3.5 h-3.5 text-gray-400" />}
            <span>{active ? 'Active' : 'Hidden'}</span>
            {isBusy && <FiRefreshCw className="w-3 h-3 animate-spin ml-1" />}
          </button>
        )
      },
    },
    {
      key: 'actions', label: 'Actions',
      render: (m: MenuConfigItem) => (
        <div className="flex items-center gap-1">
          {/* Badge Editor */}
          <button
            onClick={() => {
              setBadgeModalItem(m)
              setBadgeValue(m.badge || '')
            }}
            className="p-1.5 hover:bg-rose-50 text-gray-500 hover:text-rose-600 rounded-lg transition"
            title="Set notification badge"
          >
            <FiTag className="w-4 h-4" />
          </button>

          {/* Edit Full Configuration */}
          <button
            onClick={() => handleOpenEdit(m)}
            className="p-1.5 hover:bg-purple-50 text-gray-500 hover:text-purple-600 rounded-lg transition"
            title="Edit menu configuration"
          >
            <FiEdit2 className="w-4 h-4" />
          </button>

          {/* Delete */}
          <button
            onClick={() => handleDelete(m)}
            className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-lg transition"
            title="Delete menu item"
          >
            <FiTrash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Casting Dynamic Menu Configuration"
        subtitle="Manage all 36 casting portal navigation menus, role-based visibility, notification badges, and subscription paywalls in real-time"
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCatalogModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 rounded-xl text-xs font-bold transition"
              title="View standard 36 casting menu reference guide and sync missing items"
            >
              <FiLayers className="w-3.5 h-3.5" />
              <span>36-Menu Catalogue</span>
            </button>
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-black transition shadow-sm"
            >
              <FiPlus className="w-3.5 h-3.5" />
              <span>Add Menu Item</span>
            </button>
            <button
              onClick={load}
              disabled={loading}
              className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition disabled:opacity-40"
              title="Refresh menus"
            >
              <FiRefreshCw className={`w-4 h-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        }
      />

      <div className="p-6 space-y-6">
        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center gap-3 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold text-lg">
              <FiMenu className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Total Menus</p>
              <p className="text-xl font-black text-gray-900">{totalCount}</p>
            </div>
          </div>

          <div
            onClick={() => setStatusFilter(statusFilter === 'active' ? 'all' : 'active')}
            className={`cursor-pointer border rounded-2xl p-4 flex items-center gap-3 transition ${
              statusFilter === 'active' ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-400/20 shadow-xs' : 'bg-white border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg">
              <FiCheckCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Active</p>
              <p className="text-xl font-black text-gray-900">{activeCount}</p>
            </div>
          </div>

          <div
            onClick={() => setStatusFilter(statusFilter === 'inactive' ? 'all' : 'inactive')}
            className={`cursor-pointer border rounded-2xl p-4 flex items-center gap-3 transition ${
              statusFilter === 'inactive' ? 'bg-gray-100 border-gray-400 ring-2 ring-gray-400/20 shadow-xs' : 'bg-white border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-gray-100 text-gray-600 flex items-center justify-center font-bold text-lg">
              <FiEyeOff className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Hidden</p>
              <p className="text-xl font-black text-gray-900">{inactiveCount}</p>
            </div>
          </div>

          <div
            onClick={() => setStatusFilter(statusFilter === 'badged' ? 'all' : 'badged')}
            className={`cursor-pointer border rounded-2xl p-4 flex items-center gap-3 transition ${
              statusFilter === 'badged' ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-400/20 shadow-xs' : 'bg-white border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-lg">
              <FiTag className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Badged</p>
              <p className="text-xl font-black text-gray-900">{badgedCount}</p>
            </div>
          </div>

          <div
            onClick={() => setStatusFilter(statusFilter === 'gated' ? 'all' : 'gated')}
            className={`cursor-pointer border rounded-2xl p-4 flex items-center gap-3 transition ${
              statusFilter === 'gated' ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-400/20 shadow-xs' : 'bg-white border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-lg">
              <FiLock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Tier Gated</p>
              <p className="text-xl font-black text-gray-900">{gatedCount}</p>
            </div>
          </div>
        </div>

        {/* Filters & Search Bar */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3 shadow-xs">
          {/* Role Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <span className="text-[10px] font-black text-gray-400 uppercase mr-1 shrink-0">Audience:</span>
            {[
              { id: 'all',          label: 'All Roles' },
              { id: 'everyone',     label: 'Everyone (Public)' },
              { id: 'talent',       label: 'Talent' },
              { id: 'employer',     label: 'Employer / Producer' },
              { id: 'agency',       label: 'Agency' },
              { id: 'production_crew', label: 'Crew' },
              { id: 'location_scout',  label: 'Location Scout' },
              { id: 'academy',      label: 'Academy' },
              { id: 'studio_provider', label: 'Studio' },
            ].map(r => (
              <button
                key={r.id}
                onClick={() => setRoleFilter(r.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  roleFilter === r.id
                    ? 'bg-orange-500 text-white shadow-xs'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-gray-100">
            {/* Status Tabs */}
            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              {[
                { id: 'all',      label: 'All Items' },
                { id: 'active',   label: 'Active Only' },
                { id: 'inactive', label: 'Hidden Only' },
                { id: 'badged',   label: 'Has Badge' },
                { id: 'gated',    label: 'Subscription Gated' },
              ].map(st => (
                <button
                  key={st.id}
                  onClick={() => setStatusFilter(st.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                    statusFilter === st.id
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="w-full sm:w-72">
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search label, menuId, path, translation..."
                className="w-full px-3.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-orange-500 transition"
              />
            </div>
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
            emptyMsg="No casting menu configuration items found matching your filters"
          />
        </div>
      </div>

      {/* ── Modal: Create / Edit Menu Configuration ─────────────────────────── */}
      {(isCreating || editingItem) && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-gray-200 overflow-hidden animate-scale-up max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <FiSliders className="w-5 h-5 text-orange-500" />
                <div>
                  <h3 className="text-sm font-black text-gray-900">
                    {isCreating ? 'Add New Casting Menu Item' : `Edit Menu: ${editingItem?.label}`}
                  </h3>
                  <p className="text-[10px] text-gray-400 font-mono">
                    {isCreating ? 'Platform: casting (always enforced)' : `menuId: ${editingItem?.menuId}`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => { setIsCreating(false); setEditingItem(null) }}
                className="p-1 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form Body */}
            <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              {/* Menu ID & Icon */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">
                    Menu ID (Unique Identifier) *
                  </label>
                  <input
                    type="text"
                    disabled={!isCreating}
                    value={formData.menuId}
                    onChange={e => setFormData(d => ({ ...d, menuId: e.target.value.toLowerCase().replace(/\s+/g, '-') }))}
                    placeholder="e.g. talent-practice-studio"
                    className={`w-full px-3.5 py-2 border border-gray-200 rounded-xl font-mono text-xs text-gray-900 focus:outline-none focus:border-orange-500 transition ${
                      !isCreating ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-gray-50'
                    }`}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">
                    Icon (Emoji / Key)
                  </label>
                  <input
                    type="text"
                    value={formData.icon}
                    onChange={e => setFormData(d => ({ ...d, icon: e.target.value }))}
                    placeholder="e.g. 🎭"
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-center text-sm focus:outline-none focus:border-orange-500 transition"
                  />
                </div>
              </div>

              {/* Label & Path */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">
                    Display Label (English) *
                  </label>
                  <input
                    type="text"
                    value={formData.label}
                    onChange={e => setFormData(d => ({
                      ...d,
                      label: e.target.value,
                      translations: { ...d.translations, en: e.target.value }
                    }))}
                    placeholder="e.g. Practice Studio"
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:outline-none focus:border-orange-500 transition"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">
                    Route Path *
                  </label>
                  <input
                    type="text"
                    value={formData.path}
                    onChange={e => setFormData(d => ({ ...d, path: e.target.value }))}
                    placeholder="e.g. /casting/rehearsal"
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl font-mono text-xs text-gray-900 focus:outline-none focus:border-orange-500 transition"
                  />
                </div>
              </div>

              {/* Amharic Translation */}
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">
                  Amharic Translation (🇪🇹 አማርኛ)
                </label>
                <input
                  type="text"
                  value={formData.translations.am}
                  onChange={e => setFormData(d => ({
                    ...d,
                    translations: { ...d.translations, am: e.target.value }
                  }))}
                  placeholder="e.g. የልምምድ ስቱዲዮ"
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-orange-500 transition"
                />
              </div>

              {/* Order & Status */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">
                    Display Order Index
                  </label>
                  <input
                    type="number"
                    value={formData.order}
                    onChange={e => setFormData(d => ({ ...d, order: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">
                    Active Visibility
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={e => setFormData(d => ({ ...d, isActive: e.target.checked }))}
                        className="w-4 h-4 text-orange-600 rounded border-gray-300 focus:ring-orange-500"
                      />
                      <span className="text-xs font-bold text-gray-800">
                        {formData.isActive ? 'Active (Visible in UI)' : 'Hidden (Disabled)'}
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Allowed User Types (Role Visibility) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase block">
                    Allowed User Types (Leave empty for Everyone)
                  </label>
                  <button
                    type="button"
                    onClick={() => setFormData(d => ({ ...d, allowedUserTypes: [] }))}
                    className="text-[10px] font-bold text-orange-600 hover:underline"
                  >
                    Set to Everyone
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-1.5 p-3 bg-gray-50 rounded-xl border border-gray-100 max-h-36 overflow-y-auto">
                  {ROLE_OPTIONS.map(role => {
                    const isChecked = formData.allowedUserTypes.includes(role.id)
                    return (
                      <label key={role.id} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white transition cursor-pointer text-xs">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={e => {
                            if (e.target.checked) {
                              setFormData(d => ({ ...d, allowedUserTypes: [...d.allowedUserTypes, role.id] }))
                            } else {
                              setFormData(d => ({ ...d, allowedUserTypes: d.allowedUserTypes.filter(x => x !== role.id) }))
                            }
                          }}
                          className="w-3.5 h-3.5 text-orange-600 rounded border-gray-300 focus:ring-orange-500"
                        />
                        <span className="font-semibold text-gray-800">{role.label}</span>
                      </label>
                    )
                  })}
                </div>
              </div>

              {/* Allowed Subscription Tiers (Paywall Gating) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase block">
                    Subscription Tier Paywall (Leave empty for Free)
                  </label>
                  <button
                    type="button"
                    onClick={() => setFormData(d => ({ ...d, allowedSubscriptionTiers: [] }))}
                    className="text-[10px] font-bold text-orange-600 hover:underline"
                  >
                    Make Free
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100">
                  {SUBSCRIPTION_TIERS.map(tier => {
                    const isChecked = formData.allowedSubscriptionTiers.includes(tier.id)
                    return (
                      <label key={tier.id} className="flex items-center gap-1.5 px-2.5 py-1 bg-white rounded-lg border border-gray-200 transition cursor-pointer text-xs">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={e => {
                            if (e.target.checked) {
                              setFormData(d => ({ ...d, allowedSubscriptionTiers: [...d.allowedSubscriptionTiers, tier.id] }))
                            } else {
                              setFormData(d => ({ ...d, allowedSubscriptionTiers: d.allowedSubscriptionTiers.filter(x => x !== tier.id) }))
                            }
                          }}
                          className="w-3.5 h-3.5 text-orange-600 rounded border-gray-300 focus:ring-orange-500"
                        />
                        <span className="font-bold text-gray-800">{tier.label}</span>
                      </label>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between shrink-0">
              <button
                onClick={() => { setIsCreating(false); setEditingItem(null) }}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl text-xs font-bold transition"
              >
                Cancel
              </button>
              <button
                onClick={isCreating ? handleSaveCreate : handleSaveEdit}
                disabled={Boolean(actionLoading)}
                className="flex items-center gap-1.5 px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-black transition disabled:opacity-50 shadow-sm"
              >
                {actionLoading && <FiRefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>{isCreating ? 'Create Menu Item' : 'Save Changes'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Quick Notification Badge Editor ───────────────────────────── */}
      {badgeModalItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full border border-gray-200 overflow-hidden animate-scale-up">
            <div className="px-5 py-4 bg-rose-50 border-b border-rose-100 flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-700 font-black text-sm">
                <FiTag className="w-4 h-4" />
                <span>Menu Badge: {badgeModalItem.label}</span>
              </div>
              <button onClick={() => setBadgeModalItem(null)} className="text-gray-400 hover:text-gray-600">
                <FiX className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <p className="text-gray-600">
                Set a notification or status badge on this menu item (e.g. count of new applications, <code>new</code>, <code>hot</code>, or clear).
              </p>

              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">
                  Badge Value (Leave blank to clear)
                </label>
                <input
                  type="text"
                  value={badgeValue}
                  onChange={e => setBadgeValue(e.target.value)}
                  placeholder="e.g. 3, new, hot, beta"
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:outline-none focus:border-rose-500 transition"
                />
              </div>

              {/* Quick Presets */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] text-gray-400 font-bold uppercase mr-1">Presets:</span>
                {['1', '2', '3', '5', 'new', 'hot', 'beta'].map(p => (
                  <button
                    key={p}
                    onClick={() => setBadgeValue(p)}
                    className="px-2 py-0.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-[11px] font-bold transition"
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setBadgeValue('')}
                  className="px-2 py-0.5 bg-red-50 hover:bg-red-100 text-red-600 rounded text-[11px] font-bold transition"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
              <button
                onClick={() => setBadgeModalItem(null)}
                className="px-3.5 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl text-xs font-bold transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveBadge}
                disabled={Boolean(actionLoading)}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition"
              >
                {actionLoading && <FiRefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Save Badge</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: 36 Standard Casting Menus Catalogue Reference ─────────────── */}
      {showCatalogModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full border border-gray-200 overflow-hidden animate-scale-up max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 bg-purple-50 border-b border-purple-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <FiLayers className="w-5 h-5 text-purple-600" />
                <div>
                  <h3 className="text-sm font-black text-gray-900">Standard 36-Menu Casting Catalogue</h3>
                  <p className="text-[10px] text-purple-700 font-medium">Official architecture reference for casting portal navigation</p>
                </div>
              </div>
              <button onClick={() => setShowCatalogModal(false)} className="text-gray-400 hover:text-gray-600">
                <FiX className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-xl border border-purple-100">
                <div>
                  <p className="font-bold text-purple-900">Missing Standard Menus?</p>
                  <p className="text-[11px] text-purple-700">Pre-populate all standard menus that are not yet created on the account service.</p>
                </div>
                <button
                  onClick={handleSeedStandardCatalogue}
                  disabled={Boolean(actionLoading)}
                  className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold shadow-xs transition shrink-0"
                >
                  Sync / Seed Missing Menus
                </button>
              </div>

              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b border-gray-200 text-[10px] text-gray-500 uppercase font-black">
                    <tr>
                      <th className="p-2.5">menuId</th>
                      <th className="p-2.5">Label & Path</th>
                      <th className="p-2.5">Target Audience</th>
                      <th className="p-2.5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-mono text-[11px]">
                    {ALL_36_CASTING_MENUS.map(item => {
                      const isInstalled = menus.some(m => m.menuId === item.menuId)
                      return (
                        <tr key={item.menuId} className="hover:bg-gray-50/50">
                          <td className="p-2.5 font-bold text-purple-700">{item.menuId}</td>
                          <td className="p-2.5 font-sans">
                            <span className="font-bold text-gray-900">{item.icon} {item.label}</span>
                            <p className="text-[10px] text-gray-400 font-mono">{item.path}</p>
                          </td>
                          <td className="p-2.5 font-sans">
                            <span className="text-[11px] text-gray-700 font-semibold">{item.description}</span>
                          </td>
                          <td className="p-2.5 text-center font-sans">
                            {isInstalled ? (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                Installed
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                Missing
                              </span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex justify-end shrink-0">
              <button
                onClick={() => setShowCatalogModal(false)}
                className="px-4 py-2 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-gray-800 transition"
              >
                Close Catalogue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
