import { useEffect, useState } from 'react'
import { menuConfigAPI, MenuConfigItem } from '@/config/api'
import PageHeader from '@/components/common/PageHeader'
import DataTable from '@/components/common/DataTable'
import Pagination from '@/components/common/Pagination'
import {
  FiRefreshCw, FiMenu, FiPlus, FiEdit2, FiTrash2, FiTag,
  FiCheckCircle, FiXCircle, FiLock, FiGlobe, FiEye, FiEyeOff,
  FiLayers, FiSliders, FiCopy, FiCheck, FiX, FiAlertCircle,
  FiStar, FiUsers, FiCpu, FiExternalLink, FiHelpCircle,
  FiCornerDownRight, FiFolder, FiLink, FiChevronDown
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

// ── Complete 59-Item Standard Casting Menu Catalogue ───────────────────────────
export const ALL_59_CASTING_MENUS: Array<{
  menuId: string
  path: string
  label: string
  icon?: string
  parentMenuId?: string | null
  allowedUserTypes: string[]
  order: number
  description: string
  isContainer?: boolean
}> = [
  // ── Public / Common (Everyone) ──
  { menuId: 'casting-calls',            path: '/casting',                       label: 'Casting Calls',           icon: '🎬', allowedUserTypes: [], order: 10,  description: 'Public open casting notices' },
  { menuId: 'casting-talent-browse',     path: '/casting/talent-search',          label: 'Browse Talents',          icon: '👥', allowedUserTypes: [], order: 20,  description: 'Public talent discovery' },
  { menuId: 'casting-studios',          path: '/casting/studios',                label: 'Studios',                 icon: '🎥', allowedUserTypes: [], order: 30,  description: 'Production studios directory' },
  { menuId: 'casting-academies',        path: '/casting/academies',              label: 'Academies',               icon: '🏫', allowedUserTypes: [], order: 40,  description: 'Acting & film academies' },
  { menuId: 'casting-agencies',         path: '/casting/agencies',               label: 'Agencies',                icon: '🏢', allowedUserTypes: [], order: 45,  description: 'Talent representation agencies' },
  { menuId: 'casting-locations',        path: '/casting/locations',              label: 'Locations',               icon: '📍', allowedUserTypes: [], order: 50,  description: 'Filming locations catalog' },
  { menuId: 'replicas-marketplace',     path: '/casting/avatars',                label: 'AI Replica Marketplace',  icon: '🤖', allowedUserTypes: [], order: 60,  description: 'Digital replica likeness licensing' },
  { menuId: 'career-coach-hub',         path: '/career-coach',                   label: 'Career Intelligence',     icon: '💡', allowedUserTypes: [], order: 70,  description: 'AI Career Coach Hub' },
  { menuId: 'career-coach-goals',       path: '/career-coach/goals',             label: 'Career Goals',            icon: '🎯', allowedUserTypes: [], order: 80,  description: 'Career goal tracking' },
  { menuId: 'casting-invitations',      path: '/casting/invitations',            label: 'Global Invitations',      icon: '📬', allowedUserTypes: ['talent', 'employer', 'agency', 'cast_agency', 'academy', 'studio_provider'], order: 90, description: 'Audition invitations gateway' },

  // ── Talent / Actor Role ──
  { menuId: 'talent-dashboard',         path: '/casting/talent-dashboard',       label: 'Talent Dashboard',        icon: '📊', allowedUserTypes: ['talent'], order: 100, description: 'Talent personal workspace' },
  
  // Talent: Services Group
  { menuId: 'talent-services',          path: '',                                label: 'Services',                icon: '⭐', allowedUserTypes: ['talent'], order: 105, description: 'Talent services dropdown container', isContainer: true },
  { menuId: 'talent-auditions',         path: '/casting/auditions',              label: 'My Auditions',            icon: '📹', parentMenuId: 'talent-services', allowedUserTypes: ['talent'], order: 110, description: 'Submitted auditions & callbacks' },
  { menuId: 'talent-bookings',          path: '/casting/bookings',               label: 'My Bookings',             icon: '📑', parentMenuId: 'talent-services', allowedUserTypes: ['talent'], order: 120, description: 'Contracted bookings & dates' },
  { menuId: 'talent-invitations',       path: '/casting/invitations',            label: 'Invitations',             icon: '✉️', parentMenuId: 'talent-services', allowedUserTypes: ['talent'], order: 130, description: 'Direct casting invitations' },
  { menuId: 'talent-call-sheets',       path: '/casting/call-sheets',            label: 'Call Sheets',             icon: '📋', parentMenuId: 'talent-services', allowedUserTypes: ['talent'], order: 140, description: 'Production shooting schedules' },
  { menuId: 'talent-wallet',            path: '/casting/wallet',                 label: 'Talent Wallet',           icon: '💳', parentMenuId: 'talent-services', allowedUserTypes: ['talent'], order: 150, description: 'Talent earnings & royalties' },
  { menuId: 'talent-practice-studio',   path: '/casting/talent-dashboard?tab=rehearsal', label: 'Practice Studio', icon: '🎭', parentMenuId: 'talent-services', allowedUserTypes: ['talent'], order: 160, description: 'AI teleprompter & rehearsal' },
  { menuId: 'talent-my-replica',        path: '/casting/talent-dashboard?tab=avatar',    label: 'My AI Replica & Likeness', icon: '✨', parentMenuId: 'talent-services', allowedUserTypes: ['talent'], order: 170, description: 'Digital likeness & avatar studio' },

  // Talent: Assessments Group
  { menuId: 'talent-assessments-group', path: '',                                label: 'Assessments',             icon: '🧠', allowedUserTypes: ['talent'], order: 175, description: 'Talent psychometric assessments container', isContainer: true },
  { menuId: 'talent-assessments',       path: '/talent/assessments',             label: 'Assessments Hub',         icon: '🧠', parentMenuId: 'talent-assessments-group', allowedUserTypes: ['talent'], order: 180, description: 'Assessments overview' },
  { menuId: 'talent-enneagram',         path: '/talent/assessments/enneagram/start', label: 'Enneagram Personality', icon: '🔢', parentMenuId: 'talent-assessments-group', allowedUserTypes: ['talent'], order: 185, description: 'Enneagram behavioral test' },
  { menuId: 'talent-archetypes',        path: '/talent/assessments/archetype/start', label: '12 Archetypes Energy', icon: '🎭', parentMenuId: 'talent-assessments-group', allowedUserTypes: ['talent'], order: 190, description: 'Character archetypes test' },
  { menuId: 'talent-assessment-results',path: '/talent/assessments/enneagram/results', label: 'Assessment Results', icon: '📈', parentMenuId: 'talent-assessments-group', allowedUserTypes: ['talent'], order: 195, description: 'Talent scorecard & insights' },

  // Talent: Career Coach Group
  { menuId: 'talent-career-coach',      path: '',                                label: 'Career Coach',            icon: '💡', allowedUserTypes: ['talent'], order: 196, description: 'Talent coach dropdown container', isContainer: true },
  { menuId: 'talent-coach-hub',         path: '/career-coach',                   label: 'Career Intelligence',     icon: '💡', parentMenuId: 'talent-career-coach', allowedUserTypes: ['talent'], order: 197, description: 'Career strategy AI' },
  { menuId: 'talent-coach-goals',       path: '/career-coach/goals',             label: 'Career Goals',            icon: '🎯', parentMenuId: 'talent-career-coach', allowedUserTypes: ['talent'], order: 198, description: 'Milestones & action steps' },

  // ── Employer / Producer / Director / Content Creator Role ──
  { menuId: 'employer-dashboard',       path: '/casting/employer',               label: 'Employer Dashboard',      icon: '🏢', allowedUserTypes: ['employer', 'studio_provider', 'content_creator'], order: 200, description: 'Employer management workspace' },

  // Employer: My Work Group
  { menuId: 'employer-my-work',         path: '',                                label: 'My Work',                 icon: '💼', allowedUserTypes: ['employer', 'studio_provider', 'content_creator'], order: 205, description: 'Employer work dropdown container', isContainer: true },
  { menuId: 'employer-auditions',       path: '/casting/auditions',              label: 'Review Auditions',        icon: '🎞️', parentMenuId: 'employer-my-work', allowedUserTypes: ['employer', 'studio_provider', 'content_creator'], order: 210, description: 'Review audition tape submissions' },
  { menuId: 'employer-bookings',        path: '/casting/bookings',               label: 'Manage Bookings',         icon: '🤝', parentMenuId: 'employer-my-work', allowedUserTypes: ['employer', 'studio_provider', 'content_creator'], order: 220, description: 'Cast booking contracts' },
  { menuId: 'employer-invitations',     path: '/casting/invitations',            label: 'Sent Invitations',        icon: '✉️', parentMenuId: 'employer-my-work', allowedUserTypes: ['employer', 'studio_provider', 'content_creator'], order: 225, description: 'Direct audition requests' },
  { menuId: 'employer-my-talents',      path: '/casting/my-talents',             label: 'Roster / My Talents',     icon: '⭐', parentMenuId: 'employer-my-work', allowedUserTypes: ['employer', 'agency', 'cast_agency', 'studio_provider'], order: 230, description: 'Saved talent rosters' },
  { menuId: 'employer-talent-search',   path: '/casting/talent-search',          label: 'Talent Scout Engine',     icon: '🔍', parentMenuId: 'employer-my-work', allowedUserTypes: ['employer', 'agency', 'cast_agency', 'studio_provider', 'content_creator'], order: 240, description: 'Advanced talent search' },
  { menuId: 'employer-call-sheets',     path: '/casting/call-sheets',            label: 'Create Call Sheets',      icon: '📝', parentMenuId: 'employer-my-work', allowedUserTypes: ['employer', 'agency', 'cast_agency', 'studio_provider'], order: 250, description: 'Daily production shooting schedules' },

  // Employer: Discover Group
  { menuId: 'employer-discover',        path: '',                                label: 'Discover',                icon: '🌐', allowedUserTypes: ['employer', 'studio_provider', 'content_creator'], order: 255, description: 'Discovery dropdown container', isContainer: true },
  { menuId: 'employer-digital-replicas',path: '/casting/avatars',                label: 'AI Digital Avatars',      icon: '🤖', parentMenuId: 'employer-discover', allowedUserTypes: ['employer', 'studio_provider', 'content_creator'], order: 256, description: 'AI avatar marketplace for producers' },
  { menuId: 'replicas-my-licenses',     path: '/casting/avatars',                label: 'Purchased Licenses',      icon: '📜', parentMenuId: 'employer-discover', allowedUserTypes: ['employer', 'agency', 'cast_agency', 'studio_provider', 'content_creator'], order: 257, description: 'Licensed replica assets' },
  { menuId: 'employer-locations',       path: '/casting/locations',              label: 'Film Locations',          icon: '📍', parentMenuId: 'employer-discover', allowedUserTypes: ['employer', 'studio_provider', 'content_creator'], order: 258, description: 'Scout filming venues' },
  { menuId: 'employer-studios',         path: '/casting/studios',                label: 'Production Studios',      icon: '🎥', parentMenuId: 'employer-discover', allowedUserTypes: ['employer', 'studio_provider', 'content_creator'], order: 259, description: 'Book soundstages & gear' },
  { menuId: 'employer-academies',       path: '/casting/academies',              label: 'Acting Academies',        icon: '🏫', parentMenuId: 'employer-discover', allowedUserTypes: ['employer', 'studio_provider', 'content_creator'], order: 260, description: 'Discover academy students' },

  // Employer: AI Tools Group
  { menuId: 'employer-ai-tools',        path: '',                                label: 'AI Tools',                icon: '⚡', allowedUserTypes: ['employer', 'agency', 'studio_provider', 'content_creator'], order: 265, description: 'AI tools dropdown container', isContainer: true },
  { menuId: 'employer-productions',     path: '/casting/productions',            label: 'Productions',             icon: '🎬', parentMenuId: 'employer-ai-tools', allowedUserTypes: ['employer', 'agency', 'studio_provider', 'content_creator'], order: 270, description: 'Film & project management' },
  { menuId: 'employer-crew-organizer',  path: '/casting/screenplays/crew-org',   label: 'Crew Organizer',          icon: '🎛️', parentMenuId: 'employer-ai-tools', allowedUserTypes: ['employer', 'agency', 'studio_provider'], order: 275, description: 'AI script breakdown & crew planner' },

  // Employer: Career Coach Group
  { menuId: 'employer-career-coach',    path: '',                                label: 'Career Coach',            icon: '💡', allowedUserTypes: ['employer', 'studio_provider', 'content_creator'], order: 280, description: 'Producer career coach dropdown container', isContainer: true },
  { menuId: 'employer-coach-hub',       path: '/career-coach',                   label: 'Career Intelligence',     icon: '💡', parentMenuId: 'employer-career-coach', allowedUserTypes: ['employer', 'studio_provider', 'content_creator'], order: 285, description: 'Executive career coaching' },
  { menuId: 'employer-coach-goals',     path: '/career-coach/goals',             label: 'Career Goals',            icon: '🎯', parentMenuId: 'employer-career-coach', allowedUserTypes: ['employer', 'studio_provider', 'content_creator'], order: 290, description: 'Strategic milestones' },

  // ── Agency / Cast Agency Role ──
  { menuId: 'agency-dashboard',         path: '/casting/agency/dashboard',       label: 'Agency Dashboard',        icon: '💼', allowedUserTypes: ['agency', 'cast_agency'], order: 300, description: 'Talent representation agency portal' },
  { menuId: 'agency-wallet',            path: '/casting/wallet',                 label: 'Agency Wallet',           icon: '💰', allowedUserTypes: ['agency', 'cast_agency'], order: 310, description: 'Agency revenue & commission wallet' },
  { menuId: 'agent-portal',             path: '/casting/agent/dashboard',        label: 'Agent Portal',            icon: '👔', allowedUserTypes: ['agency', 'cast_agency'], order: 320, description: 'Agent client management workspace' },
  { menuId: 'agent-connections',        path: '/casting/agent/connections',      label: 'Agent Connections',       icon: '🤝', allowedUserTypes: ['agency', 'cast_agency'], order: 330, description: 'Direct producer connections' },
  { menuId: 'agent-messages',           path: '/casting/agent/messages',         label: 'Agent Messages',          icon: '💬', allowedUserTypes: ['agency', 'cast_agency'], order: 340, description: 'Representation messages' },

  // ── Production Crew Role ──
  { menuId: 'crew-dashboard',           path: '/casting/crew-dashboard',         label: 'Crew Dashboard',          icon: '🛠️', allowedUserTypes: ['production_crew'], order: 400, description: 'Technical crew workspace' },
  { menuId: 'crew-profile-setup',       path: '/casting/crew-profile-setup',     label: 'Crew Profile Setup',      icon: '⚙️', allowedUserTypes: ['production_crew'], order: 410, description: 'Crew credits, gear & rates' },

  // ── Location Scout Role ──
  { menuId: 'scout-my-locations',       path: '/casting/my-locations',           label: 'My Locations',            icon: '🗺️', allowedUserTypes: ['location_scout'], order: 500, description: 'Scouted location listing management' },
  { menuId: 'scout-register-location',  path: '/casting/locations/register',     label: 'Register Location',       icon: '➕', allowedUserTypes: ['location_scout'], order: 510, description: 'Submit new location venue' },

  // ── Aggregator Scout Role ──
  { menuId: 'aggregator-dashboard',     path: '/casting/scout-dashboard',        label: 'Aggregator Scout Hub',    icon: '📡', allowedUserTypes: ['aggregator_scout'], order: 600, description: 'Casting aggregator portal' },
  { menuId: 'aggregator-post-call',     path: '/casting/scout-dashboard/post',   label: 'Aggregator Post Call',    icon: '📢', allowedUserTypes: ['aggregator_scout'], order: 610, description: 'Post aggregated casting call' },

  // ── Academy Role ──
  { menuId: 'academy-dashboard',        path: '/casting/academy-dashboard',      label: 'Academy Dashboard',       icon: '🎓', allowedUserTypes: ['academy'], order: 700, description: 'Acting academy courses & students' },
  { menuId: 'academy-setup',            path: '/casting/academy-setup',          label: 'Academy Setup',           icon: '🏛️', allowedUserTypes: ['academy'], order: 710, description: 'Curriculum & instructor setup' },

  // ── Studio Provider Role ──
  { menuId: 'studio-dashboard',         path: '/casting/studio-dashboard',       label: 'Studio Dashboard',        icon: '🎥', allowedUserTypes: ['studio_provider'], order: 800, description: 'Soundstage rental schedule' },
  { menuId: 'studio-setup',            path: '/casting/studio-setup',           label: 'Studio Setup',            icon: '🎙️', allowedUserTypes: ['studio_provider'], order: 810, description: 'Studio equipment & packages' },

  // ── Subscriptions & Billing ──
  { menuId: 'casting-subscriptions',    path: '/casting/subscriptions',          label: 'Subscription Plans',      icon: '💳', allowedUserTypes: ['talent', 'employer', 'agency', 'studio_provider'], order: 950, description: 'Casting membership plans' },
  { menuId: 'user-billing',             path: '/profile/billing',                label: 'Quota & Billing Usage',   icon: '⚡', allowedUserTypes: ['talent', 'employer', 'agency', 'studio_provider'], order: 960, description: 'Resource allocations & billing usage' },
]

export default function MenuConfigPage() {
  const [menus, setMenus] = useState<MenuConfigItem[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [hierarchyFilter, setHierarchyFilter] = useState<string>('all')
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
    parentMenuId: string
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
    parentMenuId: '',
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
      const rawList: MenuConfigItem[] = Array.isArray(res) ? res : (res?.data || res?.menus || [])
      // Strictly isolate Casting platform menus only
      const list = rawList.filter(m => m.platform === 'casting')
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
      setSuccess(`Menu "${menu.label}" is now ${newStatus ? 'Active' : 'Hidden'}.`)
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
      path: m.path || '',
      icon: m.icon || '🎬',
      parentMenuId: m.parentMenuId || '',
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
      parentMenuId: '',
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
        parentMenuId: formData.parentMenuId.trim() || null,
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
    if (!formData.menuId.trim() || !formData.label.trim()) {
      setError('Please provide Menu ID and Label')
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
        parentMenuId: formData.parentMenuId.trim() || null,
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
      setSuccess(`Menu item "${formData.label}" created successfully.`)
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

  // Seed / Sync All 59 Standard Menus
  const handleSeedStandardCatalogue = async () => {
    if (!window.confirm('Sync/Pre-populate missing casting menus from the full 59-item catalogue with corrected paths and dropdown hierarchies?')) {
      return
    }
    setActionLoading('seed')
    setError(''); setSuccess('')
    try {
      const existingMap = new Map(menus.map(m => [m.menuId, m]))
      let createdCount = 0
      let updatedCount = 0

      for (const item of ALL_59_CASTING_MENUS) {
        if (!existingMap.has(item.menuId)) {
          // Create missing
          await menuConfigAPI.createMenu({
            menuId: item.menuId,
            label: item.label,
            path: item.path,
            icon: item.icon,
            parentMenuId: item.parentMenuId || null,
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
        } else {
          // Fix path or parentMenuId if divergent
          const existing = existingMap.get(item.menuId)!
          const needsFix = existing.path !== item.path || (existing.parentMenuId || null) !== (item.parentMenuId || null)
          if (needsFix) {
            await menuConfigAPI.updateMenu(item.menuId, {
              path: item.path,
              parentMenuId: item.parentMenuId || null,
            })
            updatedCount++
          }
        }
      }

      setSuccess(`Sync Complete: Created ${createdCount} missing items and updated ${updatedCount} paths/hierarchies!`)
      await load()
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

  // Dropdown containers (parent groups) in current system
  const dropdownContainers = menus.filter(m => !m.path || m.path === '' || m.path === '#')

  // Filter logic
  const filtered = menus.filter(m => {
    // Search query
    if (search.trim()) {
      const q = search.toLowerCase()
      const matchesSearch =
        m.label?.toLowerCase().includes(q) ||
        m.menuId?.toLowerCase().includes(q) ||
        m.path?.toLowerCase().includes(q) ||
        m.parentMenuId?.toLowerCase().includes(q) ||
        m.translations?.am?.toLowerCase().includes(q) ||
        m.translations?.en?.toLowerCase().includes(q)
      if (!matchesSearch) return false
    }

    // Hierarchy filter
    const isContainer = !m.path || m.path === '' || m.path === '#'
    const hasParent = Boolean(m.parentMenuId)
    if (hierarchyFilter === 'containers' && !isContainer) return false
    if (hierarchyFilter === 'children' && !hasParent) return false
    if (hierarchyFilter === 'toplevel' && (isContainer || hasParent)) return false
    if (hierarchyFilter.startsWith('parent:')) {
      const pid = hierarchyFilter.replace('parent:', '')
      if (m.parentMenuId !== pid) return false
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

  // Quick Counters (Casting Platform)
  const totalCount = menus.length
  const activeCount = menus.filter(m => m.isActive !== false).length
  const inactiveCount = menus.filter(m => m.isActive === false).length
  const dropdownCount = menus.filter(m => !m.path || m.path === '' || m.path === '#').length
  const childCount = menus.filter(m => Boolean(m.parentMenuId)).length
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
      key: 'menu', label: 'Menu Item & Hierarchy',
      render: (m: MenuConfigItem) => {
        const isContainer = !m.path || m.path === '' || m.path === '#'
        const isChild = Boolean(m.parentMenuId)
        const parentItem = isChild ? menus.find(p => p.menuId === m.parentMenuId) : null
        const childItems = isContainer ? menus.filter(c => c.parentMenuId === m.menuId) : []

        return (
          <div className={`flex items-center gap-3 ${isChild ? 'pl-4' : ''}`}>
            {isChild && (
              <FiCornerDownRight className="w-4 h-4 text-purple-400 shrink-0" />
            )}
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0 border shadow-xs ${
              isContainer
                ? 'bg-purple-100 text-purple-800 border-purple-200 ring-2 ring-purple-300/30'
                : 'bg-orange-50 text-orange-600 border-orange-100'
            }`}>
              {m.icon || (isContainer ? '📁' : '🎬')}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black text-gray-900">{m.label}</span>
                {isContainer && (
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-purple-600 text-white uppercase tracking-wider flex items-center gap-1">
                    <FiFolder className="w-2.5 h-2.5" /> Dropdown ({childItems.length})
                  </span>
                )}
                {isChild && (
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                    in {parentItem?.label || m.parentMenuId}
                  </span>
                )}
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
        )
      },
    },

    {
      key: 'path', label: 'Target Route Path',
      render: (m: MenuConfigItem) => {
        const isContainer = !m.path || m.path === '' || m.path === '#'
        if (isContainer) {
          return (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-lg">
              <FiChevronDown className="w-3 h-3" /> Dropdown Toggle (No Link)
            </span>
          )
        }
        return (
          <span className="font-mono text-[11px] text-gray-700 bg-gray-50 border border-gray-200/60 px-2 py-1 rounded block max-w-fit truncate" title={m.path}>
            {m.path}
          </span>
        )
      },
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
            {roles.slice(0, 2).map(r => {
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
            {roles.length > 2 && (
              <span className="text-[10px] font-bold bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                +{roles.length - 2} more
              </span>
            )}
          </div>
        )
      },
    },
    {
      key: 'tiers', label: 'Plan Paywall',
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
      key: 'status', label: 'Status',
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
        subtitle="Manage 2-level dropdown hierarchies, corrected route paths, role visibility, badges, and subscription paywalls"
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCatalogModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 rounded-xl text-xs font-bold transition"
              title="View 59-item casting catalogue reference guide & sync missing items"
            >
              <FiLayers className="w-3.5 h-3.5" />
              <span>59-Menu Catalogue</span>
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
        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-6 gap-3">
          <div className="bg-white border border-gray-200 rounded-2xl p-3.5 flex items-center gap-3 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold text-lg">
              <FiMenu className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Total Menus</p>
              <p className="text-xl font-black text-gray-900">{totalCount}</p>
            </div>
          </div>

          <div
            onClick={() => setHierarchyFilter(hierarchyFilter === 'containers' ? 'all' : 'containers')}
            className={`cursor-pointer border rounded-2xl p-3.5 flex items-center gap-3 transition ${
              hierarchyFilter === 'containers' ? 'bg-purple-50 border-purple-300 ring-2 ring-purple-400/20 shadow-xs' : 'bg-white border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-lg">
              <FiFolder className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Dropdowns</p>
              <p className="text-xl font-black text-gray-900">{dropdownCount}</p>
            </div>
          </div>

          <div
            onClick={() => setHierarchyFilter(hierarchyFilter === 'children' ? 'all' : 'children')}
            className={`cursor-pointer border rounded-2xl p-3.5 flex items-center gap-3 transition ${
              hierarchyFilter === 'children' ? 'bg-indigo-50 border-indigo-300 ring-2 ring-indigo-400/20 shadow-xs' : 'bg-white border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-lg">
              <FiCornerDownRight className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Sub-Items</p>
              <p className="text-xl font-black text-gray-900">{childCount}</p>
            </div>
          </div>

          <div
            onClick={() => setStatusFilter(statusFilter === 'active' ? 'all' : 'active')}
            className={`cursor-pointer border rounded-2xl p-3.5 flex items-center gap-3 transition ${
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
            onClick={() => setStatusFilter(statusFilter === 'badged' ? 'all' : 'badged')}
            className={`cursor-pointer border rounded-2xl p-3.5 flex items-center gap-3 transition ${
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
            className={`cursor-pointer border rounded-2xl p-3.5 flex items-center gap-3 transition ${
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

        {/* Filters & Search Controls */}
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

          <div className="flex flex-col md:flex-row items-center justify-between gap-3 pt-2 border-t border-gray-100">
            {/* Hierarchy & Status Filters */}
            <div className="flex items-center gap-1.5 flex-wrap w-full md:w-auto">
              <span className="text-[10px] font-black text-gray-400 uppercase mr-1">Hierarchy:</span>
              {[
                { id: 'all',        label: 'All Hierarchy' },
                { id: 'containers', label: 'Dropdown Containers' },
                { id: 'children',   label: 'Sub-Items Only' },
                { id: 'toplevel',   label: 'Direct Links' },
              ].map(h => (
                <button
                  key={h.id}
                  onClick={() => setHierarchyFilter(h.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                    hierarchyFilter === h.id
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-600 bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  {h.label}
                </button>
              ))}

              {/* Status Filter */}
              <div className="ml-2 pl-2 border-l border-gray-200 flex items-center gap-1">
                {['all', 'active', 'inactive', 'badged', 'gated'].map(st => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold capitalize ${
                      statusFilter === st
                        ? 'bg-gray-900 text-white'
                        : 'text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Search Input */}
            <div className="w-full md:w-72">
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search label, menuId, path, parent..."
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
            emptyMsg="No casting menu items found matching your filter criteria"
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

              {/* Hierarchy & Parent Dropdown Group */}
              <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-100 space-y-2">
                <label className="text-[10px] font-bold text-purple-900 uppercase block">
                  Dropdown Hierarchy / Parent Container
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <select
                      value={formData.parentMenuId}
                      onChange={e => setFormData(d => ({ ...d, parentMenuId: e.target.value }))}
                      className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-900 focus:outline-none focus:border-purple-500"
                    >
                      <option value="">(None - Top Level Item)</option>
                      {dropdownContainers.filter(dc => dc.menuId !== formData.menuId).map(dc => (
                        <option key={dc.menuId} value={dc.menuId}>
                          Parent: {dc.label} ({dc.menuId})
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] text-gray-400 mt-1">Select parent to nest under a dropdown</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData(d => ({ ...d, path: '', parentMenuId: '' }))}
                      className="px-2.5 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-800 rounded-lg text-[11px] font-bold transition flex items-center gap-1"
                    >
                      <FiFolder className="w-3 h-3" /> Make Dropdown Container
                    </button>
                  </div>
                </div>
              </div>

              {/* Label & Route Path */}
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
                    Route Path (Leave empty if Dropdown Container)
                  </label>
                  <input
                    type="text"
                    value={formData.path}
                    onChange={e => setFormData(d => ({ ...d, path: e.target.value }))}
                    placeholder="e.g. /casting/talent-dashboard?tab=rehearsal"
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

      {/* ── Modal: 59 Standard Casting Menus Catalogue Reference ─────────────── */}
      {showCatalogModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-gray-200 overflow-hidden animate-scale-up max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 bg-purple-50 border-b border-purple-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <FiLayers className="w-5 h-5 text-purple-600" />
                <div>
                  <h3 className="text-sm font-black text-gray-900">Standard 59-Menu Casting Architecture Catalogue</h3>
                  <p className="text-[10px] text-purple-700 font-medium">Verified hierarchy with corrected frontend routes & dropdown containers</p>
                </div>
              </div>
              <button onClick={() => setShowCatalogModal(false)} className="text-gray-400 hover:text-gray-600">
                <FiX className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
              <div className="flex items-center justify-between p-3.5 bg-purple-50 rounded-xl border border-purple-100">
                <div>
                  <p className="font-bold text-purple-900">Sync Catalogue & Correct Broken Routes</p>
                  <p className="text-[11px] text-purple-700">Pre-populate all 59 standard menus and fix any divergent route paths or parent group relationships.</p>
                </div>
                <button
                  onClick={handleSeedStandardCatalogue}
                  disabled={Boolean(actionLoading)}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold shadow-xs transition shrink-0 flex items-center gap-1.5"
                >
                  <FiRefreshCw className={`w-3.5 h-3.5 ${actionLoading === 'seed' ? 'animate-spin' : ''}`} />
                  <span>Sync 59 Menus</span>
                </button>
              </div>

              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b border-gray-200 text-[10px] text-gray-500 uppercase font-black">
                    <tr>
                      <th className="p-2.5">menuId</th>
                      <th className="p-2.5">Label & Icon</th>
                      <th className="p-2.5">Type & Route Path</th>
                      <th className="p-2.5">Target Audience</th>
                      <th className="p-2.5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-mono text-[11px]">
                    {ALL_59_CASTING_MENUS.map(item => {
                      const installed = menus.find(m => m.menuId === item.menuId)
                      const isContainer = item.isContainer || !item.path
                      const isChild = Boolean(item.parentMenuId)

                      return (
                        <tr key={item.menuId} className={`hover:bg-gray-50/50 ${isContainer ? 'bg-purple-50/30' : ''}`}>
                          <td className="p-2.5 font-bold text-purple-700">
                            {isChild && <span className="text-gray-400 mr-1">↳</span>}
                            {item.menuId}
                          </td>
                          <td className="p-2.5 font-sans">
                            <span className="font-bold text-gray-900">{item.icon} {item.label}</span>
                            {item.parentMenuId && (
                              <span className="ml-1.5 text-[10px] text-purple-600 font-mono">[{item.parentMenuId}]</span>
                            )}
                          </td>
                          <td className="p-2.5">
                            {isContainer ? (
                              <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded font-sans">
                                📁 Dropdown Container
                              </span>
                            ) : (
                              <span className="text-[10px] text-gray-700 font-mono">{item.path}</span>
                            )}
                          </td>
                          <td className="p-2.5 font-sans">
                            <span className="text-[10px] text-gray-600 font-semibold">{item.description}</span>
                          </td>
                          <td className="p-2.5 text-center font-sans">
                            {installed ? (
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
