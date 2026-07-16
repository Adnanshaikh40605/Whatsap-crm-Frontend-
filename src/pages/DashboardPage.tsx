import { useQuery } from '@tanstack/react-query'
import { Link as RouterLink } from 'react-router-dom'
import {
  MessagesSquare, Megaphone, FileText, MessageCircle, Users, Image,
  BookOpen, User, Lock, Store, BadgeCheck, Inbox, FolderOpen, ArrowRight,
} from 'lucide-react'
import { campaignApi, crmApi, whatsappCrmApi, analyticsApi, inboxApi } from '../lib/api'
import { fetchAllCampaignTemplates } from '../lib/templateList'
import { orgQueryKey } from '../lib/queryKeys'
import { useAuth } from '../context/AuthContext'
import { formatDate, formatNumber } from '../lib/utils'
import { ICON, ICON_STROKE } from '../lib/icons'
import { Button } from '../components/ui/Button'
import { DashboardMetricCard, DashboardHeroCard } from '../components/dashboard/DashboardMetricCard'
import { WA } from '../lib/whatsappTheme'

export function DashboardPage() {
  const { organization } = useAuth()
  const apiStatus = organization?.whatsapp_api_status || (organization?.whatsapp_connected ? 'live' : 'not_connected')
  const isLive = apiStatus === 'live'
  const isPending = apiStatus === 'pending'
  const statusLabel = isLive ? 'LIVE' : isPending ? 'PENDING' : 'NOT CONNECTED'

  const { data: campaigns } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => campaignApi.list().then((r) => r.data.results ?? r.data.data ?? r.data),
  })
  const { data: templates } = useQuery({
    queryKey: orgQueryKey(organization?.id, 'templates', 'all'),
    queryFn: fetchAllCampaignTemplates,
    enabled: Boolean(organization?.id),
  })
  const { data: contacts } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => crmApi.contacts().then((r) => r.data.results ?? r.data.data ?? r.data),
  })
  const { data: groups } = useQuery({
    queryKey: ['groups'],
    queryFn: () => crmApi.groups().then((r) => r.data.results ?? r.data.data ?? r.data),
  })
  const { data: media } = useQuery({
    queryKey: ['media'],
    queryFn: () => campaignApi.media().then((r) => r.data.results ?? r.data.data ?? r.data),
  })
  const { data: analytics } = useQuery({
    queryKey: ['analytics-dashboard'],
    queryFn: () => analyticsApi.dashboard().then((r) => r.data.data ?? r.data),
  })
  const { data: conversations } = useQuery({
    queryKey: ['inbox-conversations-dashboard'],
    queryFn: () => inboxApi.conversations().then((r) => r.data.results ?? r.data.data ?? r.data),
  })
  const { data: businessProfileData } = useQuery({
    queryKey: ['business-profile'],
    queryFn: () => whatsappCrmApi.getBusinessProfile().then((r) => r.data.data ?? r.data),
    enabled: isLive,
    retry: false,
  })

  const campaignList = (campaigns as unknown[]) ?? []
  const templateList = (templates as unknown[]) ?? []
  const contactList = (contacts as unknown[]) ?? []
  const groupList = (groups as unknown[]) ?? []
  const mediaList = (media as unknown[]) ?? []
  const conversationList = (conversations as { unread_count?: number; status?: string }[]) ?? []

  const overview = analytics?.overview as {
    open_conversations?: number
    unread_conversations?: number
    messages_this_month?: number
    total_leads?: number
  } | undefined

  const campaignStats = analytics?.campaigns as {
    total?: number
    sent?: number
    delivered?: number
    read?: number
    replies?: number
  } | undefined

  const openConversations = overview?.open_conversations ?? conversationList.filter((c) => c.status === 'open').length
  const unreadTotal = overview?.unread_conversations ?? conversationList.reduce((sum, c) => sum + (c.unread_count || 0), 0)
  const approvedTemplates = templateList.filter((t) => (t as { status?: string }).status === 'approved').length

  const businessProfile = businessProfileData?.profile as {
    business_name?: string
    phone_number?: string
    vertical_label?: string
    quality_rating?: string
    profile_picture_url?: string
    code_verification_status?: string
    last_synced_at?: string
  } | undefined

  const qualityText = (() => {
    const q = String(businessProfile?.quality_rating || '').toUpperCase()
    if (q === 'GREEN' || q === 'HIGH') return 'High'
    if (q === 'YELLOW' || q === 'MEDIUM') return 'Medium'
    if (q === 'RED' || q === 'LOW') return 'Low'
    return 'Unknown'
  })()

  const quickActions = [
    { to: '/whatsapp-crm/setup-guide', icon: BookOpen, label: 'Connect WhatsApp API', help: 'Step-by-step Meta setup guide', iconClass: 'bg-sky-50 text-sky-600' },
    { to: '/whatsapp-crm/templates', icon: FileText, label: 'Create template', help: 'Build and manage WhatsApp templates', iconClass: 'bg-violet-50 text-violet-600' },
    { to: '/whatsapp-crm/contacts', icon: Users, label: 'Import contacts', help: 'Upload CSV or Excel and group contacts', iconClass: 'bg-emerald-50 text-emerald-600' },
    { to: '/whatsapp-crm/campaigns', icon: Megaphone, label: 'Create campaign', help: 'Send approved templates to contacts', iconClass: 'bg-orange-50 text-orange-600' },
    { to: '/whatsapp-crm/media', icon: Image, label: 'Upload media', help: 'Store images, videos, PDFs, and documents', iconClass: 'bg-cyan-50 text-cyan-600' },
    { to: '/whatsapp-crm/inbox', icon: MessagesSquare, label: 'Open inbox', help: 'Reply to customers on WhatsApp', iconClass: 'bg-rose-50 text-rose-600' },
  ] as const

  return (
    <>
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold leading-tight lg:text-3xl" style={{ color: 'var(--text-primary)' }}>
          {organization?.name ?? 'Dashboard'}
        </h1>
        {!isLive && (
          <RouterLink to="/whatsapp-crm/api-settings">
            <Button>{isPending ? 'Complete WhatsApp Setup' : 'Connect WhatsApp'}</Button>
          </RouterLink>
        )}
      </div>

      {/* API status strip */}
      <div
        className="flex flex-col gap-2 rounded-xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
        style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-card)' }}
      >
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>WhatsApp Business API Status</p>
          <p className="mt-0.5 text-sm" style={{ color: 'var(--text-muted)' }}>
            {organization?.whatsapp_setup_status || (isLive ? 'Cloud API credentials are configured.' : 'Connect your Meta Cloud API credentials.')}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span
            className="rounded-full px-3 py-1 text-xs font-bold tracking-wide text-white"
            style={{ background: isLive ? WA.primary : isPending ? '#f7b928' : '#94a3b8' }}
          >
            {statusLabel}
          </span>
          {organization?.whatsapp_phone_number_id && (
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Phone ID: {organization.whatsapp_phone_number_id}
            </span>
          )}
        </div>
      </div>

      {/* Metrics */}
      <section className="space-y-3">
        <div className="grid gap-3 lg:grid-cols-3 lg:items-stretch">
          <DashboardHeroCard
            className="lg:col-span-2 h-full"
            label="Total Contacts"
            value={formatNumber(contactList.length)}
            caption="Saved in your CRM workspace"
            icon={<Users size={48} strokeWidth={1.25} className="text-emerald-500" />}
          />
          <DashboardMetricCard
            className="h-full"
            title="WhatsApp API"
            value={statusLabel}
            sublabel="Business API status"
            tone={isLive ? 'emerald' : isPending ? 'amber' : 'slate'}
            icon={<MessageCircle size={ICON.md} strokeWidth={ICON_STROKE} />}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardMetricCard
          title="Open Conversations"
          value={`${formatNumber(unreadTotal)} / ${formatNumber(openConversations)}`}
          sublabel="Unread / Open"
          tone="sky"
          icon={<Inbox size={ICON.md} strokeWidth={ICON_STROKE} />}
        />
        <DashboardMetricCard
          title="Templates"
          value={`${formatNumber(approvedTemplates)} / ${formatNumber(templateList.length)}`}
          sublabel="Approved / Total"
          tone="amber"
          icon={<FileText size={ICON.md} strokeWidth={ICON_STROKE} />}
        />
        <DashboardMetricCard
          title="Campaigns"
          value={`${formatNumber(campaignList.length)} / ${formatNumber(campaignStats?.total ?? campaignList.length)}`}
          sublabel="Created / Total"
          tone="rose"
          icon={<Megaphone size={ICON.md} strokeWidth={ICON_STROKE} />}
        />
        <DashboardMetricCard
          title="Messages"
          value={formatNumber(overview?.messages_this_month ?? 0)}
          sublabel="Inbound this month"
          tone="emerald"
          icon={<MessagesSquare size={ICON.md} strokeWidth={ICON_STROKE} />}
        />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardMetricCard
          title="Campaign Delivered"
          value={`${formatNumber(campaignStats?.delivered ?? 0)} / ${formatNumber(campaignStats?.sent ?? 0)}`}
          sublabel="Delivered / Sent"
          tone="orange"
          icon={<Megaphone size={ICON.md} strokeWidth={ICON_STROKE} />}
        />
        <DashboardMetricCard
          title="Campaign Read"
          value={`${formatNumber(campaignStats?.read ?? 0)} / ${formatNumber(campaignStats?.replies ?? 0)}`}
          sublabel="Read / Replies"
          tone="violet"
          icon={<MessageCircle size={ICON.md} strokeWidth={ICON_STROKE} />}
        />
        <DashboardMetricCard
          title="Contact Groups"
          value={formatNumber(groupList.length)}
          sublabel="Audience segments"
          tone="cyan"
          icon={<FolderOpen size={ICON.md} strokeWidth={ICON_STROKE} />}
        />
        <DashboardMetricCard
          title="Media Library"
          value={formatNumber(mediaList.length)}
          sublabel="Uploaded files"
          tone="slate"
          icon={<Image size={ICON.md} strokeWidth={ICON_STROKE} />}
        />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardMetricCard
          variant="outline"
          title="Inbox Chats"
          value={`${formatNumber(unreadTotal)} / ${formatNumber(conversationList.length)}`}
          sublabel="Unread / Total"
          tone="sky"
          icon={<Inbox size={ICON.md} strokeWidth={ICON_STROKE} />}
        />
        <DashboardMetricCard
          variant="outline"
          title="CRM Leads"
          value={formatNumber(overview?.total_leads ?? 0)}
          sublabel="Active pipeline"
          tone="emerald"
          icon={<Users size={ICON.md} strokeWidth={ICON_STROKE} />}
        />
        <DashboardMetricCard
          variant="outline"
          title="Templates"
          value={formatNumber(templateList.length)}
          sublabel="Message templates"
          tone="violet"
          icon={<FileText size={ICON.md} strokeWidth={ICON_STROKE} />}
        />
        <DashboardMetricCard
          variant="outline"
          title="Campaigns"
          value={formatNumber(campaignList.length)}
          sublabel="All campaigns"
          tone="orange"
          icon={<Megaphone size={ICON.md} strokeWidth={ICON_STROKE} />}
        />
        </div>
      </section>

      {/* Business profile */}
      {isLive && businessProfile && (
        <div className="surface-card overflow-hidden">
          <div className="border-b px-5 py-3" style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-subtle)' }}>
            <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Business Profile</p>
            <p className="mt-0.5 text-xs" style={{ color: 'var(--text-muted)' }}>Your WhatsApp Business identity on Meta</p>
          </div>
          <div className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100">
                {businessProfile.profile_picture_url ? (
                  <img src={businessProfile.profile_picture_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <Store size={ICON.lg} strokeWidth={ICON_STROKE} className="text-slate-400" />
                )}
              </div>
              <div>
                <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                  {businessProfile.business_name || organization?.name}
                </p>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{businessProfile.phone_number || '—'}</p>
                <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-emerald-600">
                  <BadgeCheck size={ICON.sm} strokeWidth={ICON_STROKE} />
                  {businessProfile.code_verification_status === 'VERIFIED' ? 'Business Verified' : 'Profile Live'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                ['Category', businessProfile.vertical_label || '—'],
                ['Quality', qualityText],
                ['Status', 'Live'],
                ['Last Synced', businessProfile.last_synced_at ? formatDate(businessProfile.last_synced_at) : '—'],
              ].map(([label, val]) => (
                <div key={label}>
                  <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{label}</p>
                  <p className="mt-0.5 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{val}</p>
                </div>
              ))}
            </div>

            <RouterLink to="/whatsapp-crm/business-profile">
              <Button variant="secondary">Edit Profile</Button>
            </RouterLink>
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="surface-card overflow-hidden">
        <div className="border-b px-5 py-3" style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-subtle)' }}>
          <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Start here</p>
          <p className="mt-0.5 text-xs" style={{ color: 'var(--text-muted)' }}>Core actions to get the most from WhatsFlow</p>
        </div>
        <div className="grid gap-2.5 p-4 sm:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <RouterLink
                key={action.to}
                to={action.to}
                className="group flex items-start gap-3 rounded-xl border p-4 transition-all hover:shadow-md"
                style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-card)' }}
              >
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${action.iconClass}`}>
                  <Icon size={ICON.md} strokeWidth={ICON_STROKE} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold group-hover:underline" style={{ color: 'var(--text-primary)' }}>
                    {action.label}
                  </p>
                  <p className="mt-0.5 text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>{action.help}</p>
                </div>
                <ArrowRight size={16} className="mt-1 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" style={{ color: 'var(--text-muted)' }} />
              </RouterLink>
            )
          })}
        </div>
      </div>

      {/* Account */}
      <div className="surface-card overflow-hidden">
        <div className="border-b px-5 py-3" style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-subtle)' }}>
          <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Account Settings</p>
          <p className="mt-0.5 text-xs" style={{ color: 'var(--text-muted)' }}>Manage your profile and password securely</p>
        </div>
        <div className="grid gap-2.5 p-4 sm:grid-cols-2">
          {[
            { to: '/whatsapp-crm/settings/account', icon: User, label: 'Edit User Profile', help: 'Update your name, username, and phone' },
            { to: '/whatsapp-crm/settings/account', icon: Lock, label: 'Change Password', help: 'Update your login password' },
          ].map((item) => {
            const Icon = item.icon
            return (
              <RouterLink
                key={item.label}
                to={item.to}
                className="flex items-start gap-3 rounded-xl border p-4 transition-colors hover:bg-[var(--hover)]"
                style={{ borderColor: 'var(--border-subtle)' }}
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                  <Icon size={ICON.md} strokeWidth={ICON_STROKE} />
                </span>
                <div>
                  <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{item.label}</p>
                  <p className="mt-0.5 text-xs" style={{ color: 'var(--text-muted)' }}>{item.help}</p>
                </div>
              </RouterLink>
            )
          })}
        </div>
      </div>
    </>
  )
}
