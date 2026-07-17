import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Image, MessageSquare, MousePointerClick, Pencil, Plus, Trash2 } from 'lucide-react'
import { automationApi } from '../lib/api'
import { PageHeader, DataTable, StatusBadge } from '../components/ui/PageLayout'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { AppModal } from '../components/ui/AppModal'
import { useAuth } from '../context/AuthContext'
import { orgQueryKey } from '../lib/queryKeys'
import { useDeleteConfirm } from '../hooks/useDeleteConfirm'
import { useToast } from '../components/common'
import type { BotReply } from '../types/bot'

type ReplyType = BotReply['reply_type']

const typeLabels: Record<string, string> = {
  simple: 'Simple Bot Reply',
  media: 'Media Bot Reply',
  interactive: 'Advanced Interactive Bot Reply',
}

const emptyForm = {
  title: '',
  reply_type: 'simple' as ReplyType,
  content: '',
  media_url: '',
  media_type: 'image',
  options: ['', ''],
  is_active: true,
}

export function BotRepliesPage() {
  const { organization } = useAuth()
  const orgId = organization?.id
  const queryClient = useQueryClient()
  const toast = useToast()
  const { requestDelete, deleteDialog } = useDeleteConfirm()
  const [search, setSearch] = useState('')
  const [createMenuOpen, setCreateMenuOpen] = useState(false)
  const [editing, setEditing] = useState<BotReply | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [formError, setFormError] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: orgQueryKey(orgId, 'bot-replies'),
    queryFn: () => automationApi.botReplies().then((r) => r.data.results ?? r.data.data ?? r.data),
    enabled: Boolean(orgId),
  })

  const replies = ((data as BotReply[]) ?? []).filter(
    (r) => !search || r.title.toLowerCase().includes(search.toLowerCase()),
  )

  const closeForm = () => {
    setFormOpen(false)
    setEditing(null)
    setForm(emptyForm)
    setFormError('')
  }

  const openCreate = (replyType: ReplyType) => {
    setForm({ ...emptyForm, reply_type: replyType, options: ['', ''] })
    setEditing(null)
    setFormError('')
    setFormOpen(true)
    setCreateMenuOpen(false)
  }

  const openEdit = (reply: BotReply) => {
    setEditing(reply)
    setForm({
      title: reply.title,
      reply_type: reply.reply_type,
      content: reply.content || '',
      media_url: reply.media_url || '',
      media_type: reply.media_type || 'image',
      options: reply.options?.length ? reply.options : ['', ''],
      is_active: reply.is_active,
    })
    setFormError('')
    setFormOpen(true)
  }

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        title: form.title.trim(),
        reply_type: form.reply_type,
        content: form.content.trim(),
        media_url: form.reply_type === 'media' ? form.media_url.trim() : '',
        media_type: form.reply_type === 'media' ? form.media_type : '',
        options: form.reply_type === 'interactive'
          ? form.options.map((option) => option.trim()).filter(Boolean)
          : [],
        buttons: [],
        is_active: form.is_active,
      }
      return editing
        ? automationApi.updateBotReply(editing.id, payload)
        : automationApi.createBotReply(payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orgQueryKey(orgId, 'bot-replies') })
      toast.success(editing ? 'Bot reply updated' : 'Bot reply created')
      closeForm()
    },
    onError: (err: { response?: { data?: { message?: string; error?: Record<string, string[]> } } }) => {
      const response = err.response?.data
      const firstFieldError = response?.error
        ? Object.values(response.error).flat()[0]
        : undefined
      setFormError(firstFieldError || response?.message || 'Could not save bot reply')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => automationApi.deleteBotReply(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orgQueryKey(orgId, 'bot-replies') })
      toast.success('Bot reply deleted')
    },
    onError: () => toast.error('Could not delete bot reply'),
  })

  const toggleMutation = useMutation({
    mutationFn: (reply: BotReply) => automationApi.updateBotReply(reply.id, {
      is_active: !reply.is_active,
    }),
    onSuccess: () => queryClient.invalidateQueries({
      queryKey: orgQueryKey(orgId, 'bot-replies'),
    }),
    onError: () => toast.error('Could not update bot reply status'),
  })

  const validateAndSave = () => {
    if (!form.title.trim()) return setFormError('Reply title is required.')
    if (!form.content.trim()) return setFormError('Message content is required.')
    if (form.reply_type === 'media' && !form.media_url.trim()) {
      return setFormError('Media URL is required for a media reply.')
    }
    if (
      form.reply_type === 'interactive'
      && form.options.map((option) => option.trim()).filter(Boolean).length < 2
    ) {
      return setFormError('Add at least two interactive options.')
    }
    setFormError('')
    saveMutation.mutate()
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Bot Replies"
        subtitle="Manage simple, media, and interactive bot responses"
        actions={
          <div className="relative">
            <Button onClick={() => setCreateMenuOpen((open) => !open)}>
              <Plus className="h-4 w-4" /> Create New Bot
            </Button>
            {createMenuOpen && (
              <div
                className="absolute right-0 top-full z-30 mt-2 w-64 overflow-hidden rounded-xl border py-1 shadow-xl"
                style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
              >
                {[
                  { type: 'simple' as const, label: 'Simple Bot Reply', icon: MessageSquare },
                  { type: 'media' as const, label: 'Media Bot Reply', icon: Image },
                  { type: 'interactive' as const, label: 'Advanced Interactive Bot Reply', icon: MousePointerClick },
                ].map(({ type, label, icon: Icon }) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => openCreate(type)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm hover:bg-[var(--hover)]"
                  >
                    <Icon className="h-4 w-4 text-brand-600" />
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        }
      />

      <DataTable
        columns={[
          { key: 'title', label: 'Title', render: (r) => <span className="font-medium">{r.title}</span> },
          { key: 'reply_type', label: 'Type', render: (r) => typeLabels[r.reply_type] || r.reply_type },
          { key: 'content', label: 'Content', render: (r) => <span className="block max-w-xs truncate">{r.content || (r.options?.join(', ') ?? '—')}</span> },
          { key: 'is_active', label: 'Status', render: (r) => <StatusBadge status={r.is_active ? 'active' : 'inactive'} /> },
        ]}
        data={replies}
        search={search}
        onSearch={setSearch}
        loading={isLoading}
        actions={(reply) => (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => toggleMutation.mutate(reply)}
              className={`relative h-6 w-11 rounded-full transition-colors ${
                reply.is_active ? 'bg-emerald-500' : 'bg-slate-300'
              }`}
              aria-label={reply.is_active ? 'Disable reply' : 'Enable reply'}
            >
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                reply.is_active ? 'left-5' : 'left-0.5'
              }`} />
            </button>
            <Button size="sm" variant="secondary" onClick={() => openEdit(reply)}>
              <Pencil className="h-3.5 w-3.5" /> Edit
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={() => requestDelete({
                itemName: reply.title,
                itemType: 'bot reply',
                associatedDataMessage: 'Flows that reference this reply may need to be updated.',
                onConfirm: () => deleteMutation.mutateAsync(reply.id),
              })}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      />

      <AppModal
        open={formOpen}
        onClose={closeForm}
        title={editing ? 'Edit Bot Reply' : typeLabels[form.reply_type]}
        subtitle="Configure the reply that your WhatsApp bot will send."
        footer={
          <>
            <Button variant="secondary" onClick={closeForm}>Cancel</Button>
            <Button loading={saveMutation.isPending} onClick={validateAndSave}>
              {editing ? 'Save Changes' : 'Create Reply'}
            </Button>
          </>
        }
      >
        {formError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {formError}
          </div>
        )}
        <Input
          label="Reply title"
          value={form.title}
          onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
          placeholder="e.g. Location Selection"
        />
        <label className="block text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          Message
          <textarea
            value={form.content}
            onChange={(event) => setForm((current) => ({ ...current, content: event.target.value }))}
            placeholder="Enter the message customers will receive"
            rows={5}
            className="mt-2 w-full rounded-lg border bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500/30"
            style={{ borderColor: 'var(--border)' }}
          />
        </label>

        {form.reply_type === 'media' && (
          <div className="grid gap-4 sm:grid-cols-[140px_1fr]">
            <label className="block text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              Media type
              <select
                value={form.media_type}
                onChange={(event) => setForm((current) => ({ ...current, media_type: event.target.value }))}
                className="mt-2 h-10 w-full rounded-lg border bg-transparent px-3 text-sm"
                style={{ borderColor: 'var(--border)' }}
              >
                <option value="image">Image</option>
                <option value="video">Video</option>
                <option value="audio">Audio</option>
                <option value="document">Document</option>
              </select>
            </label>
            <Input
              label="Media URL"
              type="url"
              value={form.media_url}
              onChange={(event) => setForm((current) => ({ ...current, media_url: event.target.value }))}
              placeholder="https://example.com/media.jpg"
            />
          </div>
        )}

        {form.reply_type === 'interactive' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Reply options</p>
              <Button
                size="sm"
                variant="secondary"
                disabled={form.options.length >= 10}
                onClick={() => setForm((current) => ({ ...current, options: [...current.options, ''] }))}
              >
                <Plus className="h-3.5 w-3.5" /> Add Option
              </Button>
            </div>
            {form.options.map((option, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  aria-label={`Option ${index + 1}`}
                  value={option}
                  onChange={(event) => setForm((current) => ({
                    ...current,
                    options: current.options.map((item, itemIndex) => (
                      itemIndex === index ? event.target.value : item
                    )),
                  }))}
                  placeholder={`Option ${index + 1}`}
                />
                <Button
                  size="sm"
                  variant="danger"
                  disabled={form.options.length <= 2}
                  onClick={() => setForm((current) => ({
                    ...current,
                    options: current.options.filter((_, itemIndex) => itemIndex !== index),
                  }))}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(event) => setForm((current) => ({ ...current, is_active: event.target.checked }))}
          />
          Enable this reply
        </label>
      </AppModal>
      {deleteDialog}
    </div>
  )
}
