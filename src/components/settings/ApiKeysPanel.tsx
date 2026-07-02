import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  AlertTriangle, Copy, Download, Eye, KeyRound, MoreVertical,
  Plus, RefreshCw, Trash2, X,
} from 'lucide-react'
import { platformApi } from '../../lib/api'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { ConfirmDialog } from '../common/ConfirmDialog'
import { useToast } from '../common'
import { formatDate } from '../../lib/utils'
import { getApiOrigin } from '../../lib/config'

export interface ApiKeyRecord {
  id: string
  name: string
  key_prefix: string
  scopes: string[]
  is_active: boolean
  last_used_at: string | null
  last_used_ip: string | null
  expires_at: string | null
  created_at: string
  created_by_name: string
  organization_name: string
}

type ExpiryOption = 'never' | '30d' | '90d' | '1y'

const SCOPE_OPTIONS = [
  { id: 'embed', label: 'Embed', defaultOn: true, locked: false },
  { id: 'inbox', label: 'Inbox', defaultOn: true, locked: false },
  { id: 'read', label: 'Read', defaultOn: true, locked: false },
  { id: 'write', label: 'Write', defaultOn: true, locked: false },
  { id: 'customers', label: 'Customers', defaultOn: true, locked: false },
  { id: 'templates', label: 'Templates', defaultOn: false, locked: true },
  { id: 'campaigns', label: 'Campaigns', defaultOn: false, locked: true },
  { id: 'reports', label: 'Reports', defaultOn: false, locked: true },
  { id: 'automation', label: 'Automation', defaultOn: false, locked: true },
  { id: 'api_settings', label: 'API Settings', defaultOn: false, locked: true },
] as const

const EXPIRY_OPTIONS: { id: ExpiryOption; label: string }[] = [
  { id: 'never', label: 'Never' },
  { id: '30d', label: '30 Days' },
  { id: '90d', label: '90 Days' },
  { id: '1y', label: '1 Year' },
]

function defaultScopes() {
  return SCOPE_OPTIONS.filter((s) => s.defaultOn).map((s) => s.id)
}

function unwrapList<T>(payload: unknown): T[] {
  const data = payload as Record<string, unknown>
  if (Array.isArray(data)) return data as T[]
  if (Array.isArray(data.results)) return data.results as T[]
  if (Array.isArray(data.data)) return data.data as T[]
  if (data.data && typeof data.data === 'object' && Array.isArray((data.data as Record<string, unknown>).results)) {
    return (data.data as { results: T[] }).results
  }
  return []
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold capitalize"
      style={{
        background: active ? 'rgba(22,163,74,0.12)' : 'rgba(100,116,139,0.12)',
        color: active ? '#16a34a' : '#64748b',
      }}
    >
      {active ? 'Active' : 'Inactive'}
    </span>
  )
}

function RowMenu({
  keyRecord,
  onView,
  onRegenerate,
  onToggle,
  onDelete,
}: {
  keyRecord: ApiKeyRecord
  onView: () => void
  onRegenerate: () => void
  onToggle: () => void
  onDelete: () => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded-lg p-2 hover:bg-black/5"
        aria-label="Actions"
      >
        <MoreVertical className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />
      </button>
      {open && (
        <>
          <button type="button" className="fixed inset-0 z-10" onClick={() => setOpen(false)} aria-label="Close menu" />
          <div
            className="absolute right-0 z-20 mt-1 min-w-[180px] rounded-xl border py-1 shadow-lg"
            style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}
          >
            <button type="button" className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-black/5" onClick={() => { setOpen(false); onView() }}>
              <Eye className="h-4 w-4" /> View details
            </button>
            <button type="button" className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-black/5" onClick={() => { setOpen(false); onRegenerate() }}>
              <RefreshCw className="h-4 w-4" /> Regenerate
            </button>
            <button type="button" className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-black/5" onClick={() => { setOpen(false); onToggle() }}>
              <KeyRound className="h-4 w-4" /> {keyRecord.is_active ? 'Disable' : 'Enable'}
            </button>
            <button type="button" className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50" onClick={() => { setOpen(false); onDelete() }}>
              <Trash2 className="h-4 w-4" /> Delete
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export function ApiKeysPanel() {
  const toast = useToast()
  const queryClient = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)
  const [secretOpen, setSecretOpen] = useState(false)
  const [createdSecret, setCreatedSecret] = useState('')
  const [createdKeyName, setCreatedKeyName] = useState('')
  const [detailKey, setDetailKey] = useState<ApiKeyRecord | null>(null)
  const [confirmRegenerate, setConfirmRegenerate] = useState<ApiKeyRecord | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<ApiKeyRecord | null>(null)

  const [formName, setFormName] = useState('')
  const [formScopes, setFormScopes] = useState<string[]>(defaultScopes())
  const [formExpiry, setFormExpiry] = useState<ExpiryOption>('never')

  const { data: keys = [], isLoading, refetch } = useQuery({
    queryKey: ['platform', 'api-keys'],
    queryFn: () => platformApi.apiKeys().then((r) => unwrapList<ApiKeyRecord>(r.data)),
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['platform', 'api-keys'] })

  const createMutation = useMutation({
    mutationFn: () => platformApi.createApiKey({
      name: formName.trim(),
      scopes: formScopes,
      expiry: formExpiry,
    }),
    onSuccess: (response) => {
      const payload = response.data.data ?? response.data
      const secret = payload.secret as string
      const key = payload.key as ApiKeyRecord
      setCreatedSecret(secret)
      setCreatedKeyName(key?.name || formName.trim())
      setCreateOpen(false)
      setSecretOpen(true)
      setFormName('')
      setFormScopes(defaultScopes())
      setFormExpiry('never')
      invalidate()
      toast.success('API key created')
    },
    onError: () => toast.error('Could not create API key'),
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      platformApi.updateApiKey(id, { is_active }),
    onSuccess: () => { invalidate(); toast.success('API key updated') },
    onError: () => toast.error('Could not update API key'),
  })

  const regenerateMutation = useMutation({
    mutationFn: (id: string) => platformApi.regenerateApiKey(id),
    onSuccess: (response) => {
      const payload = response.data.data ?? response.data
      setCreatedSecret(payload.secret as string)
      setCreatedKeyName((payload.key as ApiKeyRecord)?.name || '')
      setSecretOpen(true)
      setConfirmRegenerate(null)
      invalidate()
      toast.success('API key regenerated')
    },
    onError: () => toast.error('Could not regenerate API key'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => platformApi.deleteApiKey(id),
    onSuccess: () => {
      setConfirmDelete(null)
      setDetailKey(null)
      invalidate()
      toast.success('API key deleted')
    },
    onError: () => toast.error('Could not delete API key'),
  })

  const sortedKeys = useMemo(
    () => [...keys].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [keys],
  )

  const copySecret = async () => {
    try {
      await navigator.clipboard.writeText(createdSecret)
      toast.success('Copied to clipboard')
    } catch {
      toast.error('Could not copy')
    }
  }

  const downloadSecret = () => {
    const blob = new Blob(
      [`WhatsFlow API Key — ${createdKeyName}\n\n${createdSecret}\n\nBase URL: ${getApiOrigin()}/api/\n`],
      { type: 'text/plain' },
    )
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `whatsflow-api-key-${createdKeyName.toLowerCase().replace(/\s+/g, '-')}.txt`
    link.click()
    URL.revokeObjectURL(url)
  }

  const toggleScope = (scopeId: string) => {
    const option = SCOPE_OPTIONS.find((s) => s.id === scopeId)
    if (!option || option.locked) return
    setFormScopes((current) =>
      current.includes(scopeId) ? current.filter((s) => s !== scopeId) : [...current, scopeId],
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Create and manage API keys for external CRM integrations (PestControl CRM, DriverOnHire, etc.).
          </p>
          <p className="mt-1 font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
            Embed API: {getApiOrigin()}/api/
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" /> Create API Key
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border" style={{ borderColor: 'var(--border)' }}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead style={{ background: 'var(--bg-subtle)' }}>
              <tr>
                {['Name', 'Prefix', 'Scopes', 'Created By', 'Created', 'Last Used', 'Status', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center" style={{ color: 'var(--text-muted)' }}>
                    Loading API keys…
                  </td>
                </tr>
              )}
              {!isLoading && sortedKeys.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center">
                    <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>No API keys yet</p>
                    <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
                      Create a key for PestControl CRM or another external integration.
                    </p>
                    <Button className="mt-4" size="sm" onClick={() => setCreateOpen(true)}>
                      <Plus className="h-4 w-4" /> Create API Key
                    </Button>
                  </td>
                </tr>
              )}
              {sortedKeys.map((key) => (
                <tr key={key.id} className="border-t" style={{ borderColor: 'var(--border)' }}>
                  <td className="px-4 py-3 font-semibold" style={{ color: 'var(--text-primary)' }}>{key.name}</td>
                  <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {key.key_prefix}…
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {(key.scopes || []).join(', ') || '—'}
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{key.created_by_name}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-secondary)' }}>{formatDate(key.created_at)}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {key.last_used_at ? formatDate(key.last_used_at) : 'Never'}
                  </td>
                  <td className="px-4 py-3"><StatusBadge active={key.is_active} /></td>
                  <td className="px-4 py-3">
                    <RowMenu
                      keyRecord={key}
                      onView={() => setDetailKey(key)}
                      onRegenerate={() => setConfirmRegenerate(key)}
                      onToggle={() => toggleMutation.mutate({ id: key.id, is_active: !key.is_active })}
                      onDelete={() => setConfirmDelete(key)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create modal */}
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl p-6 shadow-xl" style={{ background: 'var(--bg-card)' }}>
            <div className="mb-5 flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Create API Key</h2>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>For external CRM embed integrations</p>
              </div>
              <button type="button" onClick={() => setCreateOpen(false)} className="rounded-lg p-1 hover:bg-black/5">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <Input
                label="API Key Name"
                placeholder="PestControl CRM"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />

              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Scopes</p>
                <div className="grid grid-cols-2 gap-2">
                  {SCOPE_OPTIONS.map((scope) => (
                    <label
                      key={scope.id}
                      className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"
                      style={{
                        borderColor: 'var(--border)',
                        opacity: scope.locked ? 0.5 : 1,
                        color: 'var(--text-primary)',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={formScopes.includes(scope.id)}
                        disabled={scope.locked}
                        onChange={() => toggleScope(scope.id)}
                        className="rounded accent-brand-600"
                      />
                      {scope.label}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Expiry</p>
                <div className="flex flex-wrap gap-2">
                  {EXPIRY_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setFormExpiry(opt.id)}
                      className="rounded-full border px-3 py-1.5 text-xs font-bold"
                      style={{
                        borderColor: formExpiry === opt.id ? 'var(--text-primary)' : 'var(--border)',
                        background: formExpiry === opt.id ? 'var(--text-primary)' : 'transparent',
                        color: formExpiry === opt.id ? 'var(--bg-card)' : 'var(--text-primary)',
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button
                loading={createMutation.isPending}
                disabled={!formName.trim() || formScopes.length === 0}
                onClick={() => createMutation.mutate()}
              >
                Create
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Secret reveal modal */}
      {secretOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl p-6 shadow-xl" style={{ background: 'var(--bg-card)' }}>
            <div className="mb-4 flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
              <h2 className="text-lg font-bold">Save this key now</h2>
            </div>
            <p className="mb-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
              For security reasons this key will <strong>never be shown again</strong>.
              Copy it into your CRM environment variables now.
            </p>
            <div className="rounded-xl p-4 font-mono text-sm break-all" style={{ background: '#0f172a', color: '#22c55e' }}>
              {createdSecret}
            </div>
            <p className="mt-3 text-xs" style={{ color: 'var(--text-muted)' }}>
              VITE_WHATSAPP_API_KEY={createdSecret}
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Button variant="secondary" onClick={copySecret}>
                <Copy className="h-4 w-4" /> Copy
              </Button>
              <Button variant="secondary" onClick={downloadSecret}>
                <Download className="h-4 w-4" /> Download TXT
              </Button>
              <Button className="ml-auto" onClick={() => { setSecretOpen(false); setCreatedSecret('') }}>
                Done
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Detail / audit panel */}
      {detailKey && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
          <div className="h-full w-full max-w-md overflow-y-auto p-6 shadow-xl" style={{ background: 'var(--bg-card)' }}>
            <div className="mb-5 flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{detailKey.name}</h2>
                <p className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>{detailKey.key_prefix}…</p>
              </div>
              <button type="button" onClick={() => setDetailKey(null)} className="rounded-lg p-1 hover:bg-black/5">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div className="rounded-xl border p-4" style={{ borderColor: 'var(--border)' }}>
                <p className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Audit log</p>
                <dl className="mt-3 space-y-2">
                  {[
                    ['Created', formatDate(detailKey.created_at)],
                    ['Created by', detailKey.created_by_name],
                    ['Organization', detailKey.organization_name],
                    ['Last used', detailKey.last_used_at ? formatDate(detailKey.last_used_at) : 'Never'],
                    ['Last IP', detailKey.last_used_ip || '—'],
                    ['Expires', detailKey.expires_at ? formatDate(detailKey.expires_at) : 'Never'],
                    ['Scopes', (detailKey.scopes || []).join(', ') || '—'],
                    ['Status', detailKey.is_active ? 'Active' : 'Inactive'],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between gap-4">
                      <dt style={{ color: 'var(--text-muted)' }}>{label}</dt>
                      <dd className="text-right font-medium" style={{ color: 'var(--text-primary)' }}>{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" size="sm" onClick={() => setConfirmRegenerate(detailKey)}>
                  <RefreshCw className="h-4 w-4" /> Regenerate
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => toggleMutation.mutate({ id: detailKey.id, is_active: !detailKey.is_active })}
                >
                  {detailKey.is_active ? 'Disable' : 'Enable'}
                </Button>
                <Button variant="danger" size="sm" onClick={() => setConfirmDelete(detailKey)}>
                  <Trash2 className="h-4 w-4" /> Delete
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!confirmRegenerate}
        title="Regenerate API key?"
        message="The current key will stop working immediately. A new secret will be shown once."
        confirmLabel="Regenerate"
        loading={regenerateMutation.isPending}
        onConfirm={() => confirmRegenerate && regenerateMutation.mutate(confirmRegenerate.id)}
        onClose={() => setConfirmRegenerate(null)}
      />

      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete API key?"
        message="This action cannot be undone. Any integration using this key will stop working."
        confirmLabel="Delete"
        severity="error"
        loading={deleteMutation.isPending}
        onConfirm={() => confirmDelete && deleteMutation.mutate(confirmDelete.id)}
        onClose={() => setConfirmDelete(null)}
      />
    </div>
  )
}
