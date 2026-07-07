import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Copy, ExternalLink, Eye, FileText, Image, Megaphone, MoreVertical,
  Plus, RefreshCw, Search, Send, Shield, Trash2,
} from 'lucide-react'
import { campaignApi } from '../lib/api'
import { PageHeader } from '../components/ui/PageLayout'
import { Button } from '../components/ui/Button'
import { formatDate, formatMessageTime } from '../lib/utils'
import { useDeleteConfirm } from '../hooks/useDeleteConfirm'
import { useToast } from '../components/common'
import {
  TemplateCategoryBadge, TemplateQualityBadge, TemplateStatusBadge,
} from '../components/templates/TemplateBadges'
import {
  type CategoryFilter,
  type StatusFilter,
  computeTemplateStats,
  exportTemplatesJson,
  getLatestSyncTime,
  groupTemplatesByStatus,
  matchesFilters,
  matchesSearch,
  sortTemplates,
} from '../lib/templateList'
import type { WhatsAppTemplate } from '../types/bot'

const META_URL = 'https://business.facebook.com/wa/manage/message-templates/'
const STATUS_FILTERS: { id: StatusFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'approved', label: 'Approved' },
  { id: 'pending', label: 'Pending' },
  { id: 'rejected', label: 'Rejected' },
  { id: 'disabled', label: 'Disabled' },
]
const CATEGORY_FILTERS: { id: CategoryFilter; label: string }[] = [
  { id: 'authentication', label: 'Authentication' },
  { id: 'utility', label: 'Utility' },
  { id: 'marketing', label: 'Marketing' },
  { id: 'media', label: 'Media' },
]
const PAGE_SIZES = [25, 50, 100] as const

function FilterChip({
  label, active, onClick,
}: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full border px-3 py-1.5 text-xs font-bold transition-colors"
      style={{
        borderColor: active ? 'var(--text-primary)' : 'var(--border)',
        background: active ? 'var(--text-primary)' : 'var(--bg-card)',
        color: active ? 'var(--bg-card)' : 'var(--text-primary)',
      }}
    >
      {label}
    </button>
  )
}

function RowActionsMenu({
  template,
  onView,
  onDuplicate,
  onRefresh,
  onDelete,
  refreshing,
}: {
  template: WhatsAppTemplate
  onView: () => void
  onDuplicate: () => void
  onRefresh: () => void
  onDelete: () => void
  refreshing: boolean
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  return (
    <div ref={ref} className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        className="flex h-8 w-8 items-center justify-center rounded-lg border hover:bg-[var(--hover)]"
        style={{ borderColor: 'var(--border)' }}
        onClick={() => setOpen((v) => !v)}
        aria-label="Actions"
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {open && (
        <div
          className="absolute right-0 z-20 mt-1 min-w-[180px] rounded-xl border py-1 shadow-lg"
          style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}
        >
          {[
            { icon: Eye, label: 'View', action: onView },
            ...(template.status === 'draft' ? [{ icon: Send, label: 'Submit', action: () => {} }] : []),
            { icon: Copy, label: 'Duplicate', action: onDuplicate },
            { icon: RefreshCw, label: refreshing ? 'Refreshing…' : 'Refresh', action: onRefresh },
            { icon: ExternalLink, label: 'Open in Meta', action: () => window.open(META_URL, '_blank') },
            { icon: Trash2, label: 'Delete', action: onDelete, danger: true },
          ].map(({ icon: Icon, label, action, danger }) => (
            <button
              key={label}
              type="button"
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-[var(--hover)]"
              style={{ color: danger ? 'var(--critical)' : 'var(--text-primary)' }}
              onClick={() => { setOpen(false); action() }}
            >
              <Icon className="h-3.5 w-3.5" /> {label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function TemplateRow({
  template, selected, onSelect, onOpen, onRefresh, onDelete, refreshing,
}: {
  template: WhatsAppTemplate
  selected: boolean
  onSelect: (checked: boolean) => void
  onOpen: () => void
  onRefresh: () => void
  onDelete: () => void
  refreshing: boolean
}) {
  const navigate = useNavigate()
  return (
    <tr
      className="cursor-pointer border-b transition-colors hover:bg-[var(--hover)]"
      style={{ borderColor: 'var(--border-subtle)' }}
      onClick={onOpen}
    >
      <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
        <input type="checkbox" checked={selected} onChange={(e) => onSelect(e.target.checked)} />
      </td>
      <td className="px-3 py-3"><TemplateStatusBadge template={template} /></td>
      <td className="px-3 py-3 font-semibold" style={{ color: 'var(--text-primary)' }}>{template.name}</td>
      <td className="px-3 py-3"><TemplateCategoryBadge category={template.category} /></td>
      <td className="px-3 py-3 text-xs font-mono">{template.language}</td>
      <td className="px-3 py-3"><TemplateQualityBadge rating={template.quality_rating} /></td>
      <td className="px-3 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>{formatDate(template.created_at)}</td>
      <td className="px-3 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>{formatDate(template.updated_at)}</td>
      <td className="px-3 py-3 font-mono text-[11px]" style={{ color: 'var(--text-muted)' }}>
        {template.whatsapp_template_id || '—'}
      </td>
      <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
        <RowActionsMenu
          template={template}
          onView={onOpen}
          onDuplicate={() => navigate(`/whatsapp-crm/templates/new?duplicate=${template.id}`)}
          onRefresh={onRefresh}
          onDelete={onDelete}
          refreshing={refreshing}
        />
      </td>
    </tr>
  )
}

function TemplateMobileCard({
  template, selected, onSelect, onOpen, onDelete,
}: {
  template: WhatsAppTemplate
  selected: boolean
  onSelect: (checked: boolean) => void
  onOpen: () => void
  onDelete: () => void
}) {
  return (
    <div
      className="surface-card cursor-pointer p-4"
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onOpen()}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <input type="checkbox" checked={selected} onChange={(e) => onSelect(e.target.checked)} />
          <TemplateStatusBadge template={template} />
        </div>
        <TemplateQualityBadge rating={template.quality_rating} />
      </div>
      <h3 className="mt-2 font-bold" style={{ color: 'var(--text-primary)' }}>{template.name}</h3>
      <div className="mt-1 flex flex-wrap gap-2">
        <TemplateCategoryBadge category={template.category} />
        <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{template.language}</span>
      </div>
      <p className="mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
        Updated {formatDate(template.updated_at)}
      </p>
      <div className="mt-3 flex gap-2" onClick={(e) => e.stopPropagation()}>
        <Button size="sm" variant="secondary" onClick={onOpen}>View</Button>
        <Button size="sm" variant="danger" onClick={onDelete}><Trash2 className="h-3 w-3" /></Button>
      </div>
    </div>
  )
}

export function TemplatesPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const toast = useToast()
  const [search, setSearch] = useState('')
  const [statusFilters, setStatusFilters] = useState<Set<StatusFilter>>(new Set(['all']))
  const [categoryFilters, setCategoryFilters] = useState<Set<CategoryFilter>>(new Set())
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZES)[number]>(25)
  const [lastSyncLabel, setLastSyncLabel] = useState<string | null>(null)
  const { requestDelete, deleteDialog } = useDeleteConfirm()

  const { data, isLoading } = useQuery({
    queryKey: ['templates'],
    queryFn: () => campaignApi.templates().then((r) => r.data.results ?? r.data.data ?? r.data),
    refetchInterval: (query) => {
      const templates = (query.state.data as WhatsAppTemplate[] | undefined) ?? []
      const hasPending = templates.some((t) => t.status === 'pending')
      return hasPending ? 45000 : false
    },
  })

  const allTemplates = (data as WhatsAppTemplate[]) ?? []
  const stats = useMemo(() => computeTemplateStats(allTemplates), [allTemplates])

  const filtered = useMemo(() => {
    const searched = allTemplates.filter((t) => matchesSearch(t, search))
    const matched = searched.filter((t) => matchesFilters(t, statusFilters, categoryFilters))
    return sortTemplates(matched)
  }, [allTemplates, search, statusFilters, categoryFilters])

  const grouped = useMemo(() => groupTemplatesByStatus(filtered), [filtered])
  const flatForPagination = useMemo(() => grouped.flatMap((g) => g.items), [grouped])

  const totalPages = Math.max(1, Math.ceil(flatForPagination.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pageItems = flatForPagination.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const pageItemIdSet = useMemo(() => new Set(pageItems.map((t) => t.id)), [pageItems])
  const pageGroups = useMemo(() => {
    return grouped
      .map((group) => ({ ...group, items: group.items.filter((t) => pageItemIdSet.has(t.id)) }))
      .filter((g) => g.items.length > 0)
  }, [grouped, pageItemIdSet])

  useEffect(() => {
    const latest = getLatestSyncTime(allTemplates)
    if (latest) setLastSyncLabel(formatMessageTime(latest))
  }, [allTemplates])

  const syncMutation = useMutation({
    mutationFn: () => campaignApi.syncTemplates(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
      setLastSyncLabel(formatMessageTime(new Date().toISOString()))
      toast.success('Templates synced from Meta')
    },
    onError: () => toast.error('Sync failed'),
  })

  const refreshMutation = useMutation({
    mutationFn: (id: string) => campaignApi.refreshTemplate(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['templates'] }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => campaignApi.deleteTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
      setSelectedIds(new Set())
    },
  })

  const toggleStatusFilter = (id: StatusFilter) => {
    setPage(1)
    setStatusFilters((prev) => {
      if (id === 'all') return new Set(['all'])
      const next = new Set(prev)
      next.delete('all')
      if (next.has(id)) next.delete(id)
      else next.add(id)
      if (next.size === 0) next.add('all')
      return next
    })
  }

  const toggleCategoryFilter = (id: CategoryFilter) => {
    setPage(1)
    setCategoryFilters((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelect = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  const toggleSelectAll = (checked: boolean) => {
    if (checked) setSelectedIds(new Set(pageItems.map((t) => t.id)))
    else setSelectedIds(new Set())
  }

  const handleBulkRefresh = async () => {
    for (const id of selectedIds) {
      await refreshMutation.mutateAsync(id)
    }
    toast.success(`Refreshed ${selectedIds.size} template(s)`)
  }

  const handleBulkDelete = () => {
    const names = allTemplates.filter((t) => selectedIds.has(t.id)).map((t) => t.name).join(', ')
    requestDelete({
      itemName: names.slice(0, 80) + (names.length > 80 ? '…' : ''),
      itemType: 'WhatsApp templates',
      associatedDataMessage: `This will permanently delete ${selectedIds.size} selected template(s).`,
      onConfirm: async () => {
        for (const id of selectedIds) {
          await deleteMutation.mutateAsync(id)
        }
      },
    })
  }

  const openTemplate = (id: string) => navigate(`/whatsapp-crm/templates/${id}`)

  const statCards = [
    { label: 'Total', value: stats.total, icon: FileText, color: 'text-slate-700 bg-slate-100' },
    { label: 'Marketing', value: stats.marketing, icon: Megaphone, color: 'text-[#0064e0] bg-blue-50' },
    { label: 'Utility', value: stats.utility, icon: FileText, color: 'text-slate-700 bg-slate-100' },
    { label: 'Authentication', value: stats.authentication, icon: Shield, color: 'text-purple-700 bg-purple-50' },
    { label: 'Media', value: stats.media, icon: Image, color: 'text-[#1876f2] bg-blue-50' },
    { label: 'Approved', value: stats.approved, icon: FileText, color: 'text-green-700 bg-green-50' },
    { label: 'Pending', value: stats.pending, icon: FileText, color: 'text-amber-700 bg-amber-50' },
    { label: 'Rejected', value: stats.rejected, icon: FileText, color: 'text-red-700 bg-red-50' },
  ]

  return (
    <div className="space-y-4">
      <PageHeader
        title="WhatsApp Templates"
        subtitle="Manage Meta-approved message templates — organized by status, category, and quality"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {lastSyncLabel && (
              <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                Last synced {lastSyncLabel}
              </span>
            )}
            <Link to="/whatsapp-crm/templates/new">
              <Button><Plus className="h-4 w-4" /> Create Template</Button>
            </Link>
            <Button variant="dark" loading={syncMutation.isPending} onClick={() => syncMutation.mutate()}>
              <RefreshCw className="h-4 w-4" /> Sync from Meta
            </Button>
          </div>
        }
      />

      <div className="mb-5 grid gap-3 grid-cols-2 sm:grid-cols-4 xl:grid-cols-8">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="surface-card flex items-center gap-2.5 p-3">
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${color}`}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>{value}</p>
              <p className="truncate text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mb-4 space-y-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search name, Meta ID, category, language…"
              className="h-10 w-full rounded-full border py-2 pl-10 pr-4 text-sm outline-none focus:border-brand-500"
              style={{ borderColor: 'var(--border)', background: 'var(--bg-subtle)', color: 'var(--text-primary)' }}
            />
          </div>
          <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
            <span>{filtered.length} templates</span>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value) as typeof pageSize); setPage(1) }}
              className="h-9 rounded-lg border px-2 text-xs"
              style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}
            >
              {PAGE_SIZES.map((size) => (
                <option key={size} value={size}>{size} per page</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((f) => (
            <FilterChip
              key={f.id}
              label={f.label}
              active={statusFilters.has(f.id)}
              onClick={() => toggleStatusFilter(f.id)}
            />
          ))}
          <span className="mx-1 self-center text-xs" style={{ color: 'var(--border)' }}>|</span>
          {CATEGORY_FILTERS.map((f) => (
            <FilterChip
              key={f.id}
              label={f.label}
              active={categoryFilters.has(f.id)}
              onClick={() => toggleCategoryFilter(f.id)}
            />
          ))}
        </div>
      </div>

      {selectedIds.size > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border px-4 py-3" style={{ borderColor: 'var(--border)', background: 'var(--bg-subtle)' }}>
          <span className="text-sm font-semibold">{selectedIds.size} selected</span>
          <Button size="sm" variant="secondary" onClick={handleBulkRefresh} loading={refreshMutation.isPending}>
            <RefreshCw className="h-3 w-3" /> Refresh
          </Button>
          <Button size="sm" variant="secondary" onClick={() => syncMutation.mutate()} loading={syncMutation.isPending}>
            Sync
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => exportTemplatesJson(allTemplates.filter((t) => selectedIds.has(t.id)))}
          >
            Export
          </Button>
          <Button size="sm" variant="danger" onClick={handleBulkDelete}>
            <Trash2 className="h-3 w-3" /> Delete
          </Button>
        </div>
      )}

      {isLoading ? (
        <p className="py-12 text-center text-sm" style={{ color: 'var(--text-muted)' }}>Loading templates…</p>
      ) : filtered.length === 0 ? (
        <div className="surface-card py-16 text-center">
          <p className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>No templates found.</p>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>Create your first WhatsApp template.</p>
          <Link to="/whatsapp-crm/templates/new" className="mt-4 inline-block">
            <Button><Plus className="h-4 w-4" /> Create Template</Button>
          </Link>
        </div>
      ) : (
        <>
          <div className="hidden md:block surface-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs font-bold" style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-subtle)', color: 'var(--text-muted)' }}>
                    <th className="px-3 py-3 w-10">
                      <input
                        type="checkbox"
                        checked={pageItems.length > 0 && pageItems.every((t) => selectedIds.has(t.id))}
                        onChange={(e) => toggleSelectAll(e.target.checked)}
                      />
                    </th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-3 py-3">Template Name</th>
                    <th className="px-3 py-3">Category</th>
                    <th className="px-3 py-3">Language</th>
                    <th className="px-3 py-3">Quality</th>
                    <th className="px-3 py-3">Created</th>
                    <th className="px-3 py-3">Updated</th>
                    <th className="px-3 py-3">Meta ID</th>
                    <th className="px-3 py-3 w-12" />
                  </tr>
                </thead>
                <tbody>
                  {pageGroups.map((group) => (
                    <Fragment key={group.key}>
                      <tr style={{ background: 'var(--bg-subtle)' }}>
                        <td colSpan={10} className="px-4 py-2 text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                          {group.label} ({group.items.length})
                        </td>
                      </tr>
                      {group.items.map((template) => (
                        <TemplateRow
                          key={template.id}
                          template={template}
                          selected={selectedIds.has(template.id)}
                          onSelect={(checked) => toggleSelect(template.id, checked)}
                          onOpen={() => openTemplate(template.id)}
                          onRefresh={() => refreshMutation.mutate(template.id)}
                          onDelete={() => requestDelete({
                            itemName: template.name,
                            itemType: 'WhatsApp template',
                            associatedDataMessage:
                              'Deleting this template will permanently remove it from your workspace. Campaigns using this template may be affected.',
                            onConfirm: () => deleteMutation.mutateAsync(template.id),
                          })}
                          refreshing={refreshMutation.isPending}
                        />
                      ))}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="md:hidden space-y-4">
            {pageGroups.map((group) => (
              <div key={group.key}>
                <p className="mb-2 text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                  {group.label}
                </p>
                <div className="space-y-3">
                  {group.items.map((template) => (
                    <TemplateMobileCard
                      key={template.id}
                      template={template}
                      selected={selectedIds.has(template.id)}
                      onSelect={(checked) => toggleSelect(template.id, checked)}
                      onOpen={() => openTemplate(template.id)}
                      onDelete={() => requestDelete({
                        itemName: template.name,
                        itemType: 'WhatsApp template',
                        associatedDataMessage:
                          'Deleting this template will permanently remove it from your workspace.',
                        onConfirm: () => deleteMutation.mutateAsync(template.id),
                      })}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between text-sm" style={{ color: 'var(--text-muted)' }}>
            <span>Page {currentPage} of {totalPages}</span>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" disabled={currentPage <= 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <Button size="sm" variant="secondary" disabled={currentPage >= totalPages} onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
            </div>
          </div>
        </>
      )}
      {deleteDialog}
    </div>
  )
}
