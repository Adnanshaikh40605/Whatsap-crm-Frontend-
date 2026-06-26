import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { CheckCircle2, ExternalLink, FileText, Image, Megaphone, Plus, RefreshCw, Send, Shield, Trash2, X } from 'lucide-react'
import { campaignApi } from '../lib/api'
import { PageHeader, DataTable, StatusBadge, Tabs } from '../components/ui/PageLayout'
import { Button } from '../components/ui/Button'
import { formatDate } from '../lib/utils'
import type { WhatsAppTemplate } from '../types/bot'

const templateTabs = [
  { id: 'all', label: 'All Templates' },
  { id: 'marketing', label: 'Marketing' },
  { id: 'utility', label: 'Utility' },
  { id: 'authentication', label: 'OTP / Auth' },
  { id: 'media', label: 'Media / Carousel' },
]

interface MediaAsset {
  id: string
  name: string
  asset_type: string
}

interface TemplateForm {
  name: string
  category: 'marketing' | 'utility' | 'authentication'
  template_type: string
  language: string
  header_type: 'none' | 'text' | 'image' | 'video' | 'document'
  header_text: string
  body: string
  footer: string
  variables: string
  button_type: 'none' | 'quick_reply' | 'url' | 'phone_number'
  button_text: string
  button_value: string
  media_asset: string
  submit_to_meta: boolean
}

const initialForm: TemplateForm = {
  name: '',
  category: 'utility',
  template_type: 'standard',
  language: 'en_US',
  header_type: 'none',
  header_text: '',
  body: '',
  footer: '',
  variables: '',
  button_type: 'none',
  button_text: '',
  button_value: '',
  media_asset: '',
  submit_to_meta: false,
}

function isMediaTemplate(t: WhatsAppTemplate) {
  const header = t.header as { type?: string; format?: string } | undefined
  const format = String(header?.format || header?.type || '').toUpperCase()
  return ['IMAGE', 'VIDEO', 'DOCUMENT', 'CAROUSEL'].includes(format) || t.template_type === 'carousel' || Boolean(t.media_asset)
}

function renderTemplateStatus(template: WhatsAppTemplate) {
  if (template.status === 'approved' && !template.quality_rating) {
    return (
      <span className="inline-flex items-center rounded-[100px] bg-[#eaf7ee] px-2.5 py-1 text-xs font-bold text-[#31a24c]">
        Approved · quality pending
      </span>
    )
  }
  return <StatusBadge status={template.status} />
}

function normalizeTemplateName(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9_]+/g, '_').replace(/^_+|_+$/g, '')
}

function buildTemplatePayload(form: TemplateForm) {
  const variables = form.variables.split(',').map((item) => item.trim()).filter(Boolean)
  const headerFormat = form.header_type.toUpperCase()
  const header = form.header_type === 'none'
    ? {}
    : form.header_type === 'text'
      ? { type: 'HEADER', format: 'TEXT', text: form.header_text }
      : { type: 'HEADER', format: headerFormat }

  const buttons = form.button_type === 'none' || !form.button_text ? [] : [{
    type: form.button_type.toUpperCase(),
    text: form.button_text,
    ...(form.button_type === 'url' ? { url: form.button_value } : {}),
    ...(form.button_type === 'phone_number' ? { phone_number: form.button_value } : {}),
  }]

  const components: Record<string, unknown>[] = []
  if (Object.keys(header).length) components.push(header)

  const body: Record<string, unknown> = { type: 'BODY', text: form.body }
  if (variables.length) {
    body.example = { body_text: [variables] }
  }
  components.push(body)

  if (form.footer) components.push({ type: 'FOOTER', text: form.footer })
  if (buttons.length) components.push({ type: 'BUTTONS', buttons })

  return {
    name: normalizeTemplateName(form.name),
    category: form.category,
    template_type: form.template_type,
    language: form.language,
    header,
    body: form.body,
    footer: form.footer,
    buttons,
    variables,
    components,
    media_asset: form.media_asset || null,
    submit_to_meta: form.submit_to_meta,
  }
}

function TemplateModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<TemplateForm>(initialForm)

  const { data: mediaData } = useQuery({
    queryKey: ['media-assets'],
    queryFn: () => campaignApi.media().then((r) => r.data.results ?? r.data.data ?? r.data),
    enabled: open,
  })

  const media = (mediaData as MediaAsset[]) ?? []

  const createTemplate = useMutation({
    mutationFn: () => campaignApi.createTemplate(buildTemplatePayload(form)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
      setForm(initialForm)
      onClose()
    },
  })

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[24px] border shadow-2xl" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}>
        <div className="flex items-center justify-between border-b px-6 py-4" style={{ borderColor: 'var(--border)' }}>
          <div>
            <h2 className="font-bold" style={{ color: 'var(--text-primary)' }}>Create WhatsApp Template</h2>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Use lowercase names with underscores for Meta approval.</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-[var(--hover)]"><X className="h-5 w-5" /></button>
        </div>

        <div className="grid gap-4 px-6 py-5">
          <div className="grid gap-3 md:grid-cols-3">
            <label className="space-y-1.5 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              Template name
              <input
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                placeholder="order_update_001"
                className="h-11 w-full rounded-lg border px-3 py-2 text-sm focus:border-[#1876f2] focus:outline-none"
                style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}
              />
            </label>
            <label className="space-y-1.5 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              Category
              <select
                value={form.category}
                onChange={(event) => setForm({ ...form, category: event.target.value as TemplateForm['category'] })}
                className="h-11 w-full rounded-lg border px-3 py-2 text-sm focus:border-[#1876f2] focus:outline-none"
                style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}
              >
                <option value="utility">Utility</option>
                <option value="marketing">Marketing</option>
                <option value="authentication">Authentication / OTP</option>
              </select>
            </label>
            <label className="space-y-1.5 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              Language
              <input
                value={form.language}
                onChange={(event) => setForm({ ...form, language: event.target.value })}
                className="h-11 w-full rounded-lg border px-3 py-2 text-sm focus:border-[#1876f2] focus:outline-none"
                style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}
              />
            </label>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <label className="space-y-1.5 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              Template type
              <select
                value={form.template_type}
                onChange={(event) => setForm({ ...form, template_type: event.target.value })}
                className="h-11 w-full rounded-lg border px-3 py-2 text-sm focus:border-[#1876f2] focus:outline-none"
                style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}
              >
                <option value="standard">Standard</option>
                <option value="authentication_otp">Authentication OTP</option>
                <option value="image">Image header</option>
                <option value="video">Video header</option>
                <option value="document">Document header</option>
                <option value="carousel">Carousel</option>
              </select>
            </label>
            <label className="space-y-1.5 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              Header
              <select
                value={form.header_type}
                onChange={(event) => setForm({ ...form, header_type: event.target.value as TemplateForm['header_type'] })}
                className="h-11 w-full rounded-lg border px-3 py-2 text-sm focus:border-[#1876f2] focus:outline-none"
                style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}
              >
                <option value="none">No header</option>
                <option value="text">Text</option>
                <option value="image">Image</option>
                <option value="video">Video</option>
                <option value="document">Document</option>
              </select>
            </label>
            <label className="space-y-1.5 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              Media
              <select
                value={form.media_asset}
                onChange={(event) => setForm({ ...form, media_asset: event.target.value })}
                className="h-11 w-full rounded-lg border px-3 py-2 text-sm focus:border-[#1876f2] focus:outline-none"
                style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}
              >
                <option value="">No media asset</option>
                {media.map((asset) => (
                  <option key={asset.id} value={asset.id}>{asset.name} ({asset.asset_type})</option>
                ))}
              </select>
            </label>
          </div>

          {form.header_type === 'text' && (
            <label className="space-y-1.5 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              Header text
              <input
                value={form.header_text}
                onChange={(event) => setForm({ ...form, header_text: event.target.value })}
                placeholder="Order update"
                className="h-11 w-full rounded-lg border px-3 py-2 text-sm focus:border-[#1876f2] focus:outline-none"
                style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}
              />
            </label>
          )}

          <label className="space-y-1.5 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            Body
            <textarea
              value={form.body}
              onChange={(event) => setForm({ ...form, body: event.target.value })}
              placeholder="Hi {{1}}, your order {{2}} is confirmed."
              rows={5}
              className="w-full rounded-lg border px-3 py-2 text-sm focus:border-[#1876f2] focus:outline-none"
              style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}
            />
          </label>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-1.5 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              Variable examples
              <input
                value={form.variables}
                onChange={(event) => setForm({ ...form, variables: event.target.value })}
                placeholder="Adnan, ORD123"
                className="h-11 w-full rounded-lg border px-3 py-2 text-sm focus:border-[#1876f2] focus:outline-none"
                style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}
              />
            </label>
            <label className="space-y-1.5 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              Footer
              <input
                value={form.footer}
                onChange={(event) => setForm({ ...form, footer: event.target.value })}
                placeholder="Reply STOP to opt out"
                className="h-11 w-full rounded-lg border px-3 py-2 text-sm focus:border-[#1876f2] focus:outline-none"
                style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}
              />
            </label>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <label className="space-y-1.5 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              Button type
              <select
                value={form.button_type}
                onChange={(event) => setForm({ ...form, button_type: event.target.value as TemplateForm['button_type'] })}
                className="h-11 w-full rounded-lg border px-3 py-2 text-sm focus:border-[#1876f2] focus:outline-none"
                style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}
              >
                <option value="none">No button</option>
                <option value="quick_reply">Quick reply</option>
                <option value="url">Website URL</option>
                <option value="phone_number">Phone number</option>
              </select>
            </label>
            <label className="space-y-1.5 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              Button text
              <input
                value={form.button_text}
                onChange={(event) => setForm({ ...form, button_text: event.target.value })}
                placeholder="View details"
                className="h-11 w-full rounded-lg border px-3 py-2 text-sm focus:border-[#1876f2] focus:outline-none"
                style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}
              />
            </label>
            <label className="space-y-1.5 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              Button value
              <input
                value={form.button_value}
                onChange={(event) => setForm({ ...form, button_value: event.target.value })}
                placeholder="https://example.com or +919..."
                disabled={form.button_type === 'none' || form.button_type === 'quick_reply'}
                className="h-11 w-full rounded-lg border px-3 py-2 text-sm disabled:opacity-50 focus:border-[#1876f2] focus:outline-none"
                style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}
              />
            </label>
          </div>

          <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-primary)' }}>
            <input
              type="checkbox"
              checked={form.submit_to_meta}
              onChange={(event) => setForm({ ...form, submit_to_meta: event.target.checked })}
            />
            Submit to Meta immediately
          </label>
        </div>

        <div className="flex justify-end gap-2 border-t px-6 py-4" style={{ borderColor: 'var(--border)' }}>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            loading={createTemplate.isPending}
            disabled={!form.name || !form.body}
            onClick={() => createTemplate.mutate()}
          >
            {form.submit_to_meta ? 'Create and submit' : 'Create template'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export function TemplatesPage() {
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState(searchParams.get('type') || 'all')
  const [createOpen, setCreateOpen] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['templates'],
    queryFn: () => campaignApi.templates().then((r) => r.data.results ?? r.data.data ?? r.data),
  })

  const syncMutation = useMutation({
    mutationFn: () => campaignApi.syncTemplates(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['templates'] }),
  })
  const submitMutation = useMutation({
    mutationFn: (id: string) => campaignApi.submitTemplate(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['templates'] }),
  })
  const refreshMutation = useMutation({
    mutationFn: (id: string) => campaignApi.refreshTemplate(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['templates'] }),
  })
  const deleteMutation = useMutation({
    mutationFn: (id: string) => campaignApi.deleteTemplate(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['templates'] }),
  })

  const allTemplates = (data as WhatsAppTemplate[]) ?? []

  const templates = useMemo(() => allTemplates.filter((template) => {
    const matchesSearch = !search || `${template.name} ${template.body}`.toLowerCase().includes(search.toLowerCase())
    if (!matchesSearch) return false
    if (tab === 'all') return true
    if (tab === 'media') return isMediaTemplate(template)
    return template.category === tab
  }), [allTemplates, search, tab])

  const counts = {
    all: allTemplates.length,
    marketing: allTemplates.filter((t) => t.category === 'marketing').length,
    utility: allTemplates.filter((t) => t.category === 'utility').length,
    authentication: allTemplates.filter((t) => t.category === 'authentication').length,
    media: allTemplates.filter(isMediaTemplate).length,
  }

  return (
    <div>
      <PageHeader
        title="WhatsApp Templates"
        subtitle="Create Meta templates for OTP, Utility, Marketing, Carousel, Image, Video, and Document messages"
        actions={
          <>
            <Button onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4" /> Create Template</Button>
            <Button variant="dark" loading={syncMutation.isPending} onClick={() => syncMutation.mutate()}>
              <RefreshCw className="h-4 w-4" /> Sync from Meta
            </Button>
          </>
        }
      />
      <TemplateModal open={createOpen} onClose={() => setCreateOpen(false)} />

      <div className="mb-4 grid gap-3 sm:grid-cols-4">
        {[
          { icon: Megaphone, label: 'Marketing', count: counts.marketing, color: 'text-[#0064e0] bg-[rgba(0,145,255,.15)]' },
          { icon: FileText, label: 'Utility', count: counts.utility, color: 'text-[#0a1317] bg-[#f1f4f7]' },
          { icon: Shield, label: 'OTP / Auth', count: counts.authentication, color: 'text-[#a121ce] bg-purple-50' },
          { icon: Image, label: 'Media / Carousel', count: counts.media, color: 'text-[#1876f2] bg-blue-50' },
        ].map(({ icon: Icon, label, count, color }) => (
          <div key={label} className="surface-card flex items-center gap-3 p-4">
            <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${color}`}>
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-lg font-bold text-[var(--text-primary)]">{count}</p>
              <p className="text-xs text-[var(--text-muted)]">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <Tabs
        tabs={templateTabs.map((item) => ({ ...item, label: `${item.label} (${counts[item.id as keyof typeof counts] ?? 0})` }))}
        active={tab}
        onChange={setTab}
      />

      <DataTable
        columns={[
          { key: 'name', label: 'Name', render: (row) => <span className="font-medium">{row.name}</span> },
          { key: 'category', label: 'Category', render: (row) => (
            <span className="capitalize rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
              {row.category === 'authentication' ? 'OTP / Auth' : row.category}
            </span>
          ) },
          { key: 'template_type', label: 'Type', render: (row) => row.template_type || 'standard' },
          { key: 'language', label: 'Language' },
          { key: 'media_asset_display', label: 'Media', render: (row) => row.media_asset_display || '-' },
          { key: 'status', label: 'Status', render: (row) => renderTemplateStatus(row) },
          { key: 'updated_at', label: 'Updated', render: (row) => formatDate(row.updated_at) },
        ]}
        data={templates}
        search={search}
        onSearch={setSearch}
        loading={isLoading}
        actions={(row) => (
          <div className="flex flex-wrap gap-1">
            {row.status === 'draft' && (
              <Button size="sm" onClick={() => submitMutation.mutate(row.id)} loading={submitMutation.isPending}>
                <Send className="h-3 w-3" /> Submit
              </Button>
            )}
            <Button size="sm" variant="secondary" onClick={() => refreshMutation.mutate(row.id)} loading={refreshMutation.isPending}>
              <CheckCircle2 className="h-3 w-3" /> Refresh
            </Button>
            <Button size="sm" variant="secondary" onClick={() => window.open('https://business.facebook.com/wa/manage/message-templates/', '_blank')}>
              <ExternalLink className="h-3 w-3" /> Meta
            </Button>
            <Button size="sm" variant="danger" onClick={() => deleteMutation.mutate(row.id)} loading={deleteMutation.isPending}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        )}
      />
    </div>
  )
}
