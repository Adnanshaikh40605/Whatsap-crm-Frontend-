import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import {
  Smartphone, Bot, Terminal, Building2, Users, Bell, Shield,
  Palette, Webhook, ChevronRight, ArrowLeft, MessageCircle, RotateCcw,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { orgApi } from '../lib/api'
import { SectionHeader } from '../components/ui/SectionHeader'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { useToast } from '../components/common'

const SETTINGS_CATEGORIES = [
  {
    id: 'general',
    title: 'Organization',
    description: 'Company name, timezone, and branding',
    icon: Building2,
    color: '#3b82f6',
    path: '/whatsapp-crm/settings',
  },
  {
    id: 'whatsapp',
    title: 'WhatsApp Connection',
    description: 'Connect Meta Cloud API and manage phone numbers',
    icon: Smartphone,
    color: '#16a34a',
    path: '/whatsapp-crm/settings/whatsapp',
  },
  {
    id: 'ai-bot',
    title: 'AI & Bot Settings',
    description: 'Configure AI agents, prompts, and fallback behavior',
    icon: Bot,
    color: '#8b5cf6',
    path: '/whatsapp-crm/settings/ai-bot',
  },
  {
    id: 'api',
    title: 'API & Webhooks',
    description: 'API keys, webhook URLs, and event subscriptions',
    icon: Terminal,
    color: '#f59e0b',
    path: '/whatsapp-crm/settings/api',
  },
  {
    id: 'team',
    title: 'Team & Access',
    description: 'Manage team members, roles, and permissions',
    icon: Users,
    color: '#06b6d4',
    path: '/whatsapp-crm/settings/team',
  },
  {
    id: 'notifications',
    title: 'Notifications',
    description: 'Email alerts, push notifications, and digests',
    icon: Bell,
    color: '#ef4444',
    path: '/whatsapp-crm/settings/notifications',
  },
  {
    id: 'security',
    title: 'Security',
    description: 'Two-factor auth, session management, and audit logs',
    icon: Shield,
    color: '#64748b',
    path: '/whatsapp-crm/settings/security',
  },
  {
    id: 'appearance',
    title: 'Appearance',
    description: 'Theme, language, and display preferences',
    icon: Palette,
    color: '#ec4899',
    path: '/whatsapp-crm/settings/appearance',
  },
]

const API_ORIGIN = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1').replace(/\/api\/v1\/?$/, '')

export function SettingsPage() {
  const { section } = useParams()
  const { organization, refreshUser } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const [generalForm, setGeneralForm] = useState({
    name: organization?.name || '',
    timezone: organization?.timezone || 'UTC',
    industry: organization?.industry || 'general',
  })
  const [appearanceForm, setAppearanceForm] = useState({
    brandName: 'WhatsFlow',
    logo: null as File | null,
    previewUrl: '',
    removeLogo: false,
  })

  useEffect(() => {
    setGeneralForm({
      name: organization?.name || '',
      timezone: organization?.timezone || 'UTC',
      industry: organization?.industry || 'general',
    })
  }, [organization?.id, organization?.name, organization?.timezone, organization?.industry])

  useEffect(() => {
    const customBrandName = typeof organization?.branding?.brand_name === 'string'
      ? organization.branding.brand_name
      : ''
    const currentLogo = organization?.logo
      ? organization.logo.startsWith('http')
        ? organization.logo
        : `${API_ORIGIN}${organization.logo}`
      : ''
    setAppearanceForm({
      brandName: customBrandName || 'WhatsFlow',
      logo: null,
      previewUrl: currentLogo,
      removeLogo: false,
    })
  }, [organization?.id, organization?.logo, organization?.branding])

  const updateGeneral = useMutation({
    mutationFn: () => {
      if (!organization?.id) throw new Error('No active organization')
      return orgApi.update(organization.id, {
        name: generalForm.name.trim(),
        timezone: generalForm.timezone.trim(),
        industry: generalForm.industry.trim(),
      })
    },
    onSuccess: async () => {
      await refreshUser()
      toast.success('Organization settings saved')
    },
    onError: () => toast.error('Could not save organization settings'),
  })

  const updateAppearance = useMutation({
    mutationFn: () => {
      if (!organization?.id) throw new Error('No active organization')
      const data = new FormData()
      data.append('branding', JSON.stringify({
        ...(organization.branding ?? {}),
        brand_name: appearanceForm.brandName.trim() || 'WhatsFlow',
      }))
      if (appearanceForm.logo) data.append('logo', appearanceForm.logo)
      if (appearanceForm.removeLogo) data.append('remove_logo', 'true')
      return orgApi.updateAppearance(organization.id, data)
    },
    onSuccess: async () => {
      await refreshUser()
      toast.success('Appearance saved')
    },
    onError: () => toast.error('Could not save appearance'),
  })

  const resetDefaultBrand = () => {
    if (appearanceForm.previewUrl?.startsWith('blob:')) URL.revokeObjectURL(appearanceForm.previewUrl)
    setAppearanceForm({
      brandName: 'WhatsFlow',
      logo: null,
      previewUrl: '',
      removeLogo: true,
    })
  }

  const handleLogoChange = (file?: File) => {
    if (!file) return
    if (appearanceForm.previewUrl?.startsWith('blob:')) URL.revokeObjectURL(appearanceForm.previewUrl)
    setAppearanceForm((form) => ({
      ...form,
      logo: file,
      previewUrl: URL.createObjectURL(file),
      removeLogo: false,
    }))
  }

  const activeCategory = SETTINGS_CATEGORIES.find((c) =>
    section ? c.id === section : c.id === 'general',
  ) ?? SETTINGS_CATEGORIES[0]

  if (!section) {
    return (
      <div className="mx-auto max-w-[1200px] space-y-5 animate-fade-in">
        <SectionHeader
          title="Settings"
          subtitle={`Manage ${organization?.name ?? 'your organization'} configuration`}
        />

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {SETTINGS_CATEGORIES.map((cat) => {
            const Icon = cat.icon
            return (
              <button key={cat.id} onClick={() => navigate(cat.path)}
                className="surface-card group p-4 text-left transition-all duration-200 hover:border-brand-500/30 hover:shadow-md">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl transition-transform group-hover:scale-105"
                  style={{ background: `${cat.color}15`, color: cat.color }}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-3 text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{cat.title}</h3>
                <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>{cat.description}</p>
                <div className="mt-3 flex items-center gap-1 text-xs font-medium text-brand-600 opacity-0 transition-opacity group-hover:opacity-100">
                  Configure <ChevronRight className="h-3 w-3" />
                </div>
              </button>
            )
          })}
        </div>

        {/* Quick general settings */}
        <div className="surface-card p-5">
          <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Quick Settings</h3>
          <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>Common configuration options</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Input
              label="Organization Name"
              value={generalForm.name}
              onChange={(event) => setGeneralForm((form) => ({ ...form, name: event.target.value }))}
            />
            <Input
              label="Timezone"
              value={generalForm.timezone}
              onChange={(event) => setGeneralForm((form) => ({ ...form, timezone: event.target.value }))}
            />
            <Input
              label="Industry"
              value={generalForm.industry}
              onChange={(event) => setGeneralForm((form) => ({ ...form, industry: event.target.value }))}
            />
          </div>
          <Button
            className="mt-4"
            size="sm"
            loading={updateGeneral.isPending}
            disabled={!organization?.id || !generalForm.name.trim()}
            onClick={() => updateGeneral.mutate()}
          >
            Save Changes
          </Button>
        </div>
      </div>
    )
  }

  const sectionTitles: Record<string, { title: string; description: string }> = {
    whatsapp: { title: 'WhatsApp Connection', description: 'Connect your Meta WhatsApp Business API' },
    'ai-bot': { title: 'AI & Bot Settings', description: 'Configure AI-powered responses and bot behavior' },
    api: { title: 'API & Webhooks', description: 'Manage API access and webhook integrations' },
    notifications: { title: 'Notifications', description: 'Configure alert preferences' },
    security: { title: 'Security', description: 'Protect your account and data' },
    appearance: { title: 'Appearance', description: 'Customize the look and feel' },
  }

  const current = sectionTitles[section] ?? { title: activeCategory.title, description: activeCategory.description }
  const Icon = activeCategory.icon

  return (
    <div className="mx-auto max-w-[800px] space-y-5 animate-fade-in">
      <button onClick={() => navigate('/whatsapp-crm/settings')}
        className="flex items-center gap-1.5 text-xs font-medium hover:underline" style={{ color: 'var(--text-muted)' }}>
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Settings
      </button>

      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
          style={{ background: `${activeCategory.color}15`, color: activeCategory.color }}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{current.title}</h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{current.description}</p>
        </div>
      </div>

      <div className="surface-card p-5">
        {section === 'whatsapp' && (
          <div className="space-y-4">
            <div className="rounded-xl p-4" style={{ background: 'var(--accent-subtle)' }}>
              <p className="text-sm font-semibold" style={{ color: 'var(--accent)' }}>Meta Cloud API</p>
              <p className="mt-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
                Connect your WhatsApp Business account via Meta Business Suite
              </p>
            </div>
            <Input label="Phone Number ID" placeholder="From Meta Business Suite" />
            <Input label="WhatsApp Business Account ID" placeholder="WABA ID" />
            <Input label="Permanent Access Token" type="password" placeholder="System user token" />
            <Input label="Webhook Verify Token" placeholder="Your verify token" />
            <Input label="Webhook URL" defaultValue="https://yourdomain.com/api/v1/webhooks/whatsapp/" readOnly />
            <Button><Smartphone className="h-4 w-4" /> Connect WhatsApp</Button>
          </div>
        )}

        {section === 'ai-bot' && (
          <div className="space-y-4">
            <div className="rounded-xl p-4" style={{ background: 'var(--accent-subtle)' }}>
              <h3 className="text-sm font-semibold" style={{ color: 'var(--accent)' }}>AI Assistant</h3>
              <p className="mt-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
                GPT-powered responses when bot flows don't match
              </p>
            </div>
            <Input label="OpenAI API Key" type="password" placeholder="sk-..." />
            <Input label="AI Model" defaultValue="gpt-4o-mini" />
            <Input label="System Prompt" placeholder="You are a helpful assistant for..." />
            <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-primary)' }}>
              <input type="checkbox" defaultChecked className="rounded accent-brand-600" />
              Enable AI fallback when no bot flow matches
            </label>
            <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-primary)' }}>
              <input type="checkbox" defaultChecked className="rounded accent-brand-600" />
              Human takeover after 3 AI responses
            </label>
            <Button>Save AI Settings</Button>
          </div>
        )}

        {section === 'api' && (
          <div className="space-y-4">
            <div className="rounded-xl p-4 font-mono text-xs" style={{ background: '#0f172a', color: '#22c55e' }}>
              <p>API Base: {import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'}</p>
              <p className="mt-1 text-slate-400">Authorization: Bearer {'<token>'}</p>
              <p className="text-slate-400">X-Organization-ID: {'<org_uuid>'}</p>
            </div>
            <Input label="Webhook URL (outbound)" placeholder="https://your-app.com/webhook" />
            <Input label="Webhook Secret" type="password" />
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Webhook Events</p>
              {['message.received', 'message.sent', 'message.delivered', 'message.read', 'campaign.completed', 'lead.created'].map((e) => (
                <label key={e} className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                  <input type="checkbox" defaultChecked className="rounded accent-brand-600" /> {e}
                </label>
              ))}
            </div>
            <Button><Webhook className="h-4 w-4" /> Save Webhook Settings</Button>
          </div>
        )}

        {section === 'appearance' && (
          <div className="space-y-5">
            <div className="rounded-xl border p-4" style={{ borderColor: 'var(--border)', background: 'var(--bg-subtle)' }}>
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Sidebar preview</p>
              <div className="mt-3 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-brand-600 text-white">
                  {appearanceForm.previewUrl ? (
                    <img src={appearanceForm.previewUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <MessageCircle className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <p className="text-lg font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>
                    {appearanceForm.brandName.trim() || 'WhatsFlow'}
                  </p>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>WhatsApp Business</p>
                </div>
              </div>
            </div>

            <Input
              label="Sidebar Organization Name"
              value={appearanceForm.brandName}
              onChange={(event) => setAppearanceForm((form) => ({ ...form, brandName: event.target.value }))}
              placeholder="WhatsFlow"
            />

            <div>
              <label className="mb-1.5 block text-sm font-bold tracking-[-0.14px]" style={{ color: 'var(--text-primary)' }}>
                Logo
              </label>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(event) => handleLogoChange(event.target.files?.[0])}
                  className="h-11 flex-1 rounded-lg border bg-white px-3 py-2 text-sm"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                />
                <Button type="button" variant="secondary" onClick={resetDefaultBrand}>
                  <RotateCcw className="h-4 w-4" /> Default
                </Button>
              </div>
              <p className="mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                Default uses the current WhatsFlow logo and name. Upload a logo to replace it in the sidebar.
              </p>
            </div>

            <Button
              loading={updateAppearance.isPending}
              disabled={!organization?.id || !appearanceForm.brandName.trim()}
              onClick={() => updateAppearance.mutate()}
            >
              Save Appearance
            </Button>
          </div>
        )}

        {(section === 'notifications' || section === 'security') && (
          <div className="py-8 text-center">
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {current.title} configuration coming soon.
            </p>
            <Link to="/whatsapp-crm/settings" className="mt-2 inline-block text-xs font-medium text-brand-600 hover:underline">
              Back to all settings
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
