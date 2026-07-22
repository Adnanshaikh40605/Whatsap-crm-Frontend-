import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft, Copy, ExternalLink, RefreshCw, Send, Trash2,
} from 'lucide-react'
import { campaignApi } from '../lib/api'
import { Button } from '../components/ui/Button'
import { TemplatePreview } from '../components/templates/TemplatePreview'
import { TemplateTestSendDrawer } from '../components/templates/TemplateTestSendDrawer'
import { TemplateCategoryBadge, TemplateQualityBadge, TemplateStatusBadge } from '../components/templates/TemplateBadges'
import { templateToPreviewForm } from '../lib/templateBuilder'
import { getTemplateStatusGroup } from '../lib/templateList'
import { orgQueryKey } from '../lib/queryKeys'
import { useAuth } from '../context/AuthContext'
import { formatDate } from '../lib/utils'
import { useDeleteConfirm } from '../hooks/useDeleteConfirm'
import { useToast } from '../components/common'
import { explainMetaTemplateError } from '../lib/templateGuidance'
import type { WhatsAppTemplate } from '../types/bot'

const META_URL = 'https://business.facebook.com/wa/manage/message-templates/'

export function TemplateDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { organization } = useAuth()
  const orgId = organization?.id
  const queryClient = useQueryClient()
  const toast = useToast()
  const { requestDelete, deleteDialog } = useDeleteConfirm()
  const [testOpen, setTestOpen] = useState(false)

  const { data, isLoading, isError } = useQuery({
    queryKey: orgQueryKey(orgId, 'template', id),
    queryFn: () => campaignApi.getTemplate(id!).then((r) => r.data.data ?? r.data),
    enabled: Boolean(id && orgId),
  })

  const template = data as WhatsAppTemplate | undefined

  const refreshMutation = useMutation({
    mutationFn: () => campaignApi.refreshTemplate(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orgQueryKey(orgId, 'template', id) })
      queryClient.invalidateQueries({ queryKey: orgQueryKey(orgId, 'templates') })
      toast.success('Template status refreshed')
    },
    onError: () => toast.error('Failed to refresh template'),
  })

  const submitMutation = useMutation({
    mutationFn: () => campaignApi.submitTemplate(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orgQueryKey(orgId, 'template', id) })
      queryClient.invalidateQueries({ queryKey: orgQueryKey(orgId, 'templates') })
      toast.success('Template submitted to Meta for review')
    },
    onError: (err: { response?: { data?: { message?: string | Record<string, unknown>; error?: unknown } } }) => {
      const data = err.response?.data
      const nested = data?.error as { submit_to_meta?: string[]; error?: { message?: string; error_user_msg?: string }; message?: string } | undefined
      const text = (Array.isArray(nested?.submit_to_meta) && nested.submit_to_meta[0])
        || nested?.error?.error_user_msg
        || nested?.error?.message
        || (typeof data?.message === 'string' ? data.message : undefined)
        || nested?.message
        || 'Failed to submit template to Meta'
      const explained = explainMetaTemplateError(String(text))
      toast.error(`${explained.summary}${explained.fix ? ` — ${explained.fix}` : ''}`)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => campaignApi.deleteTemplate(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orgQueryKey(orgId, 'templates') })
      navigate('/whatsapp-crm/templates')
    },
  })

  if (isLoading) {
    return <p className="p-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>Loading template…</p>
  }

  if (isError || !template) {
    return (
      <div className="mx-auto max-w-lg p-8 text-center">
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Template not found.</p>
        <Link to="/whatsapp-crm/templates" className="mt-4 inline-block text-sm font-semibold text-brand-600">
          Back to templates
        </Link>
      </div>
    )
  }

  const previewForm = templateToPreviewForm(template)
  const variables = Array.isArray(template.variables) ? template.variables as string[] : []
  const statusGroup = getTemplateStatusGroup(template)
  const isApproved = template.status === 'approved'
    || String(template.meta_status || '').toUpperCase() === 'APPROVED'
  const rejectionHelp = template.rejected_reason
    ? explainMetaTemplateError(template.rejected_reason)
    : null

  return (
    <div className="w-full space-y-4 animate-fade-in">
      <button
        onClick={() => navigate('/whatsapp-crm/templates')}
        className="flex items-center gap-1.5 text-xs font-medium hover:underline"
        style={{ color: 'var(--text-muted)' }}
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Templates
      </button>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{template.name}</h1>
            <TemplateStatusBadge template={template} />
            <TemplateCategoryBadge category={template.category} />
          </div>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
            {template.language} · Meta ID {template.whatsapp_template_id || '—'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {statusGroup === 'draft' && (
            <Button loading={submitMutation.isPending} onClick={() => submitMutation.mutate()}>
              <Send className="h-4 w-4" /> Submit to Meta
            </Button>
          )}
          {isApproved && (
            <Button onClick={() => setTestOpen(true)}>
              <Send className="h-4 w-4" /> Test Send
            </Button>
          )}
          <Link to={`/whatsapp-crm/templates/new?duplicate=${template.id}`}>
            <Button variant="secondary"><Copy className="h-4 w-4" /> Duplicate</Button>
          </Link>
          <Button variant="secondary" loading={refreshMutation.isPending} onClick={() => refreshMutation.mutate()}>
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
          <Button variant="secondary" onClick={() => window.open(META_URL, '_blank')}>
            <ExternalLink className="h-4 w-4" /> Open in Meta
          </Button>
          <Button
            variant="danger"
            onClick={() => requestDelete({
              itemName: template.name,
              itemType: 'WhatsApp template',
              associatedDataMessage:
                'Deleting this template will permanently remove it from your workspace. Campaigns using this template may be affected.',
              onConfirm: () => deleteMutation.mutateAsync(),
            })}
          >
            <Trash2 className="h-4 w-4" /> Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto]">
        <div className="space-y-4">
          <div className="surface-card p-5 space-y-4">
            <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Template Content</h2>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Header</p>
              <p className="mt-1 text-sm whitespace-pre-wrap" style={{ color: 'var(--text-primary)' }}>
                {String((template.header as { text?: string })?.text || (template.header as { format?: string })?.format || '—')}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Body</p>
              <p className="mt-1 text-sm whitespace-pre-wrap" style={{ color: 'var(--text-primary)' }}>{template.body}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Footer</p>
              <p className="mt-1 text-sm" style={{ color: 'var(--text-primary)' }}>{template.footer || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Buttons</p>
              {Array.isArray(template.buttons) && template.buttons.length > 0 ? (
                <ul className="mt-2 space-y-1">
                  {(template.buttons as Record<string, string>[]).map((btn, idx) => (
                    <li key={idx} className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: 'var(--border)' }}>
                      <span className="font-semibold">{btn.text || 'Button'}</span>
                      <span className="ml-2 text-xs capitalize" style={{ color: 'var(--text-muted)' }}>{btn.type}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>—</p>
              )}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Variables</p>
              {variables.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {variables.map((val, idx) => (
                    <span key={idx} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-mono">
                      {`{{${idx + 1}}}`} = {val}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>No variables</p>
              )}
            </div>
          </div>

          <div className="surface-card p-5">
            <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Meta & Approval</h2>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2 text-sm">
              <div>
                <dt className="text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Meta Status</dt>
                <dd className="mt-1 capitalize">{template.meta_status || statusGroup}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Quality Rating</dt>
                <dd className="mt-1"><TemplateQualityBadge rating={template.quality_rating} /></dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Created</dt>
                <dd className="mt-1">{formatDate(template.created_at)}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Updated</dt>
                <dd className="mt-1">{formatDate(template.updated_at)}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Last Synced</dt>
                <dd className="mt-1">{template.last_synced_at ? formatDate(template.last_synced_at) : '—'}</dd>
              </div>
              {template.rejected_reason && (
                <div className="sm:col-span-2 rounded-lg border border-red-200 bg-red-50 p-3">
                  <dt className="text-xs font-semibold uppercase text-red-600">Rejection Reason</dt>
                  <dd className="mt-1 text-sm text-red-800">{rejectionHelp?.summary || template.rejected_reason}</dd>
                  {rejectionHelp?.fix && (
                    <p className="mt-2 text-sm text-red-900">
                      <span className="font-semibold">How to fix:</span> {rejectionHelp.fix}
                    </p>
                  )}
                </div>
              )}
            </dl>
          </div>
        </div>

        <div className="surface-card flex justify-center self-start p-4 lg:sticky lg:top-4">
          <TemplatePreview form={previewForm} businessName={organization?.name || 'Your Business'} />
        </div>
      </div>

      <TemplateTestSendDrawer
        open={testOpen}
        onClose={() => setTestOpen(false)}
        template={template}
      />
      {deleteDialog}
    </div>
  )
}
