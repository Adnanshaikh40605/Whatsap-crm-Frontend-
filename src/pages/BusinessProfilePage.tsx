import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, RefreshCw, Save, Store, Upload } from 'lucide-react'
import { whatsappCrmApi } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { canEditBusinessProfile } from '../lib/rbac'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Badge } from '../components/ui/Badge'
import { BusinessProfilePreview } from '../components/templates/BusinessProfilePreview'
import { useToast } from '../components/common'
import { formatDate } from '../lib/utils'

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

interface ProfileData {
  business_name: string
  phone_number: string
  description: string
  address: string
  email: string
  websites: string[]
  vertical: string
  vertical_label: string
  profile_picture_url: string
  quality_rating: string
  phone_status: string
  code_verification_status: string
  business_hours: Record<string, string>
  last_synced_at?: string
  can_edit_name?: boolean
}

interface CategoryOption {
  code: string
  label: string
}

function qualityLabel(rating?: string) {
  const value = String(rating || '').toUpperCase()
  if (value === 'GREEN' || value === 'HIGH') return 'High'
  if (value === 'YELLOW' || value === 'MEDIUM') return 'Medium'
  if (value === 'RED' || value === 'LOW') return 'Low'
  return 'Unknown'
}

function qualityVariant(rating?: string): 'success' | 'warning' | 'danger' | 'default' {
  const label = qualityLabel(rating)
  if (label === 'High') return 'success'
  if (label === 'Medium') return 'warning'
  if (label === 'Low') return 'danger'
  return 'default'
}

function FormSection({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <section className="surface-card overflow-hidden">
      <div className="border-b px-6 py-4" style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-subtle)' }}>
        <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{title}</h2>
        {description && (
          <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>{description}</p>
        )}
      </div>
      <div className="space-y-5 p-6">{children}</div>
    </section>
  )
}

function SidebarCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="surface-card overflow-hidden">
      <div className="border-b px-5 py-3.5" style={{ borderColor: 'var(--border-subtle)' }}>
        <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

function HealthRow({
  label,
  value,
  variant,
}: {
  label: string
  value: string
  variant?: 'success' | 'warning' | 'danger' | 'default' | 'info'
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-3">
      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{label}</span>
      {variant ? (
        <Badge variant={variant} className="shrink-0 capitalize">{value}</Badge>
      ) : (
        <span className="text-sm font-semibold capitalize" style={{ color: 'var(--text-primary)' }}>{value}</span>
      )}
    </div>
  )
}

export function BusinessProfilePage() {
  const { user } = useAuth()
  const toast = useToast()
  const queryClient = useQueryClient()
  const canEdit = canEditBusinessProfile(user)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState('')
  const [removeLogo, setRemoveLogo] = useState(false)
  const [categoryQuery, setCategoryQuery] = useState('')
  const [form, setForm] = useState({
    description: '',
    address: '',
    email: '',
    websites: ['', ''] as string[],
    vertical: '',
    business_hours: {} as Record<string, string>,
  })

  const { data, isLoading, isError } = useQuery({
    queryKey: ['business-profile'],
    queryFn: () => whatsappCrmApi.getBusinessProfile().then((r) => r.data.data ?? r.data),
  })

  const profile = data?.profile as ProfileData | undefined
  const categories = (data?.categories as CategoryOption[]) ?? []
  const health = data?.health as Record<string, string> | undefined
  const auditLog = (data?.audit_log as { at: string; user: string; action: string }[]) ?? []

  useEffect(() => {
    if (!profile) return
    setForm({
      description: profile.description || '',
      address: profile.address || '',
      email: profile.email || '',
      websites: [profile.websites?.[0] || '', profile.websites?.[1] || ''],
      vertical: profile.vertical || '',
      business_hours: profile.business_hours || {},
    })
    setCategoryQuery(profile.vertical_label || '')
  }, [profile])

  const filteredCategories = useMemo(() => {
    const q = categoryQuery.trim().toLowerCase()
    if (!q) return categories
    return categories.filter((c) => c.label.toLowerCase().includes(q) || c.code.toLowerCase().includes(q))
  }, [categories, categoryQuery])

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = new FormData()
      payload.append('description', form.description)
      payload.append('address', form.address)
      payload.append('email', form.email)
      payload.append('websites', JSON.stringify(form.websites.filter(Boolean)))
      payload.append('vertical', form.vertical)
      payload.append('business_hours', JSON.stringify(form.business_hours))
      if (logoFile) payload.append('logo', logoFile)
      if (removeLogo) payload.append('remove_logo', 'true')
      return whatsappCrmApi.updateBusinessProfile(payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-profile'] })
      setLogoFile(null)
      setRemoveLogo(false)
      toast.success('Profile updated successfully')
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message || 'Failed to update profile')
    },
  })

  const syncMutation = useMutation({
    mutationFn: () => whatsappCrmApi.syncBusinessProfile(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-profile'] })
      toast.success('Profile synced from Meta')
    },
    onError: () => toast.error('Sync failed'),
  })

  const validationErrors = useMemo(() => {
    const errors: string[] = []
    if (form.description.length > 256) errors.push('Description exceeds 256 characters')
    if (form.address.length > 256) errors.push('Address exceeds 256 characters')
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.push('Invalid email')
    form.websites.forEach((site) => {
      if (site && !/^https?:\/\/.+/i.test(site)) errors.push(`Invalid website: ${site}`)
    })
    if (!form.vertical) errors.push('Select a category')
    if (logoFile && logoFile.size > 5 * 1024 * 1024) errors.push('Logo must be under 5 MB')
    return errors
  }, [form, logoFile])

  const canSave = canEdit && validationErrors.length === 0 && !saveMutation.isPending

  const handleLogoChange = (file?: File) => {
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
      toast.error('Logo must be JPG or PNG')
      return
    }
    setLogoFile(file)
    setRemoveLogo(false)
    setLogoPreview(URL.createObjectURL(file))
  }

  const apiConnected = health?.api_status === 'connected'
  const webhookStatus = health?.webhook_status || 'not_configured'
  const webhookLabel =
    webhookStatus === 'connected'
      ? 'Connected'
      : webhookStatus === 'configured'
        ? 'Configured'
        : webhookStatus === 'failed'
          ? 'Failed'
          : 'Not configured'
  const webhookVariant =
    webhookStatus === 'connected'
      ? 'success'
      : webhookStatus === 'configured'
        ? 'info'
        : webhookStatus === 'failed'
          ? 'danger'
          : 'warning'

  if (isLoading) {
    return <p className="p-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>Loading business profile…</p>
  }

  if (isError || !profile) {
    return (
      <div className="mx-auto max-w-lg p-8 text-center">
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Connect WhatsApp API first to manage your business profile.
        </p>
        <Link to="/whatsapp-crm/api-settings" className="mt-4 inline-block text-sm font-semibold text-brand-600">
          Go to API Settings
        </Link>
      </div>
    )
  }

  return (
    <div className="w-full space-y-4">
      {/* Page header */}
      <div>
        <button
          type="button"
          onClick={() => window.history.back()}
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium transition-colors hover:opacity-80"
          style={{ color: 'var(--text-muted)' }}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-[28px] font-medium leading-tight lg:text-4xl" style={{ color: 'var(--text-primary)' }}>
              Business Profile
            </h1>
            <p className="mt-2 max-w-2xl text-base" style={{ color: 'var(--text-secondary)' }}>
              Manage your WhatsApp Business profile without leaving the CRM
            </p>
          </div>

          {canEdit && (
            <div className="flex shrink-0 flex-wrap gap-2">
              <Button variant="secondary" loading={syncMutation.isPending} onClick={() => syncMutation.mutate()}>
                <RefreshCw className="h-4 w-4" />
                Sync from Meta
              </Button>
              <Button disabled={!canSave} loading={saveMutation.isPending} onClick={() => saveMutation.mutate()}>
                <Save className="h-4 w-4" />
                Save changes
              </Button>
            </div>
          )}
        </div>
      </div>

      {!canEdit && (
        <div className="rounded-[var(--radius-md)] border border-amber-200 bg-amber-50 px-4 py-3 text-[var(--font-size-2xl)] text-amber-900">
          View only — only organization owners and admins can edit the business profile.
        </div>
      )}

      {validationErrors.length > 0 && canEdit && (
        <div className="rounded-[var(--radius-md)] border border-red-200 bg-red-50 px-4 py-3 text-[var(--font-size-2xl)] text-red-700" role="alert">
          {validationErrors[0]}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        {/* Main form */}
        <div className="space-y-4">
          <FormSection title="Identity" description="Logo and verified business name shown to customers on WhatsApp.">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <div
                className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border"
                style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-subtle)' }}
              >
                {(logoPreview || profile.profile_picture_url) && !removeLogo ? (
                  <img
                    src={logoPreview || profile.profile_picture_url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Store className="h-9 w-9" style={{ color: 'var(--text-muted)' }} />
                )}
              </div>

              <div className="min-w-0 flex-1 space-y-4">
                {canEdit && (
                  <div className="flex flex-wrap gap-2">
                    <label
                      className="inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-semibold transition-colors hover:bg-[var(--hover)]"
                      style={{ borderColor: 'var(--border)' }}
                    >
                      <Upload className="h-4 w-4" />
                      Upload logo
                      <input
                        type="file"
                        accept="image/png,image/jpeg"
                        className="hidden"
                        onChange={(e) => handleLogoChange(e.target.files?.[0])}
                      />
                    </label>
                    <Button
                      variant="secondary"
                      type="button"
                      onClick={() => {
                        setRemoveLogo(true)
                        setLogoFile(null)
                        setLogoPreview('')
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                )}
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  JPG or PNG, max 5 MB. Square images work best.
                </p>
              </div>
            </div>

            <div className="border-t pt-5" style={{ borderColor: 'var(--border-subtle)' }}>
              <Input label="Business name" value={profile.business_name} readOnly disabled />
              <p className="mt-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                {profile.can_edit_name === false
                  ? 'Verified name is managed by Meta'
                  : 'Managed via Meta verified name'}
              </p>
            </div>
          </FormSection>

          <FormSection title="About" description="Tell customers what your business does.">
            <div>
              <label className="mb-1.5 block text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                Business description
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                maxLength={256}
                rows={4}
                disabled={!canEdit}
                placeholder="Brief description of your business…"
                className="w-full resize-y rounded-lg border px-3 py-2.5 text-sm outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10"
                style={{ borderColor: 'var(--border)', background: 'var(--bg)', minHeight: '100px' }}
              />
              <p className="mt-1.5 text-right text-xs tabular-nums" style={{ color: 'var(--text-muted)' }}>
                {form.description.length} / 256
              </p>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                Category
              </label>
              <input
                value={categoryQuery}
                onChange={(e) => {
                  setCategoryQuery(e.target.value)
                  const match = categories.find((c) => c.label.toLowerCase() === e.target.value.toLowerCase())
                  if (match) setForm((f) => ({ ...f, vertical: match.code }))
                }}
                disabled={!canEdit}
                list="business-categories"
                placeholder="Search category…"
                className="h-11 w-full rounded-lg border px-3 text-sm outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10"
                style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}
              />
              <datalist id="business-categories">
                {filteredCategories.map((c) => <option key={c.code} value={c.label} />)}
              </datalist>
            </div>
          </FormSection>

          <FormSection title="Contact details" description="How customers can reach and find your business.">
            <div className="grid gap-5 sm:grid-cols-2">
              <Input
                label="Email"
                type="email"
                value={form.email}
                disabled={!canEdit}
                placeholder="hello@business.com"
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
              <Input label="Phone" value={profile.phone_number} readOnly disabled />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              {form.websites.map((site, idx) => (
                <Input
                  key={idx}
                  label={`Website ${idx + 1}`}
                  value={site}
                  disabled={!canEdit}
                  placeholder="https://example.com"
                  onChange={(e) => {
                    const websites = [...form.websites] as string[]
                    websites[idx] = e.target.value
                    setForm((f) => ({ ...f, websites }))
                  }}
                />
              ))}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                Address
              </label>
              <textarea
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                maxLength={256}
                rows={2}
                disabled={!canEdit}
                placeholder="Street, city, state…"
                className="w-full resize-y rounded-lg border px-3 py-2.5 text-sm outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10"
                style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}
              />
            </div>
          </FormSection>

          <FormSection
            title="Business hours"
            description="Saved in CRM. Meta API sync for hours is not available yet."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              {WEEKDAYS.map((day) => (
                <Input
                  key={day}
                  label={day}
                  disabled={!canEdit}
                  placeholder="9 AM – 6 PM"
                  value={form.business_hours[day] || ''}
                  onChange={(e) => setForm((f) => ({
                    ...f,
                    business_hours: { ...f.business_hours, [day]: e.target.value },
                  }))}
                />
              ))}
            </div>
          </FormSection>
        </div>

        {/* Sidebar */}
        <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
          <SidebarCard title="Live preview">
            <BusinessProfilePreview
              profile={{
                business_name: profile.business_name,
                phone_number: profile.phone_number,
                description: form.description,
                vertical_label: categoryQuery || profile.vertical_label,
                email: form.email,
                websites: form.websites,
                address: form.address,
                profile_picture_url: profile.profile_picture_url,
                logoPreview: removeLogo ? '' : logoPreview,
              }}
            />
          </SidebarCard>

          <SidebarCard title="Business health">
            <div className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
              <HealthRow
                label="API status"
                value={apiConnected ? 'Connected' : 'Not connected'}
                variant={apiConnected ? 'success' : 'warning'}
              />
              <HealthRow
                label="Webhook status"
                value={webhookLabel}
                variant={webhookVariant}
              />
              <HealthRow
                label="Quality rating"
                value={qualityLabel(health?.quality_rating || profile.quality_rating)}
                variant={qualityVariant(health?.quality_rating || profile.quality_rating)}
              />
              <HealthRow
                label="Phone status"
                value={profile.phone_status || health?.phone_status || profile.code_verification_status || '—'}
                variant={profile.code_verification_status?.toLowerCase() === 'verified' ? 'success' : 'default'}
              />
              <HealthRow
                label="Last sync"
                value={profile.last_synced_at ? formatDate(profile.last_synced_at) : '—'}
              />
            </div>
          </SidebarCard>

          <SidebarCard title="Profile history">
            {auditLog.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No changes recorded yet.</p>
            ) : (
              <ul className="space-y-3">
                {auditLog.slice(0, 8).map((entry, idx) => (
                  <li
                    key={idx}
                    className="rounded-lg border px-3 py-2.5"
                    style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-subtle)' }}
                  >
                    <p className="text-sm font-semibold capitalize" style={{ color: 'var(--text-primary)' }}>
                      {entry.action}
                    </p>
                    <p className="mt-0.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                      {formatDate(entry.at)} · {entry.user}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </SidebarCard>
        </aside>
      </div>
    </div>
  )
}
