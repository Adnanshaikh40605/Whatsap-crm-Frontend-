import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Search, Bot, UserCheck, Send, Tag, StickyNote, Phone, ArrowLeft,
  Sparkles, Mail, Building2, Lightbulb, Target, Check, CheckCheck,
} from 'lucide-react'
import { inboxApi, crmApi, aiApi } from '../lib/api'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { cn, formatChatTime, formatMessageTime } from '../lib/utils'
import type { Conversation, Lead } from '../types'

interface Message {
  id: string
  content: string
  direction: string
  is_internal_note: boolean
  created_at: string
  status?: string
  whatsapp_message_id?: string
}


function Avatar({ name, size = 'md', className }: { name?: string; size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const sizes = { sm: 'h-8 w-8 text-xs', md: 'h-9 w-9 text-sm', lg: 'h-14 w-14 text-lg' }
  return (
    <div className={cn('flex shrink-0 items-center justify-center rounded-full font-semibold', sizes[size], className)}
      style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}>
      {name?.[0]?.toUpperCase() || '?'}
    </div>
  )
}

function DeliveryState({ status }: { status?: string }) {
  const normalized = status || 'sent'
  if (normalized === 'read') {
    return (
      <span className="inline-flex items-center gap-0.5 text-[#34b7f1]">
        <CheckCheck className="h-3 w-3" /> Read
      </span>
    )
  }
  if (normalized === 'delivered') {
    return (
      <span className="inline-flex items-center gap-0.5">
        <CheckCheck className="h-3 w-3" /> Delivered
      </span>
    )
  }
  if (normalized === 'failed') {
    return <span className="font-semibold text-red-600">Failed</span>
  }
  return (
    <span className="inline-flex items-center gap-0.5">
      <Check className="h-3 w-3" /> Sent to Meta
    </span>
  )
}

export function InboxPage() {
  const queryClient = useQueryClient()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [reply, setReply] = useState('')
  const [noteMode, setNoteMode] = useState(false)
  const [tagInput, setTagInput] = useState('')
  const [noteText, setNoteText] = useState('')
  const [filter, setFilter] = useState<'all' | 'unread' | 'bot'>('all')

  const { data: conversations, isLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => inboxApi.conversations().then((r) => r.data.results ?? r.data.data ?? r.data),
  })
  const { data: messages } = useQuery({
    queryKey: ['messages', selectedId],
    queryFn: () => inboxApi.messages(selectedId!).then((r) => r.data.results ?? r.data.data ?? r.data),
    enabled: !!selectedId,
  })
  const { data: leads } = useQuery({
    queryKey: ['leads'],
    queryFn: () => crmApi.leads().then((r) => r.data.results ?? r.data.data ?? r.data),
  })
  const { data: stages } = useQuery({
    queryKey: ['stages'],
    queryFn: () => crmApi.stages().then((r) => r.data.results ?? r.data.data ?? r.data),
  })

  const sendMutation = useMutation({
    mutationFn: (content: string) => {
      if (!selectedId) throw new Error('No conversation')
      return inboxApi.sendMessage({ conversation: selectedId, content, is_internal_note: noteMode })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', selectedId] })
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
      setReply('')
    },
  })

  const takeoverMutation = useMutation({
    mutationFn: () => inboxApi.takeover(selectedId!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['conversations'] }),
  })

  const addTagMutation = useMutation({
    mutationFn: (tag: string) => inboxApi.addTag(selectedId!, tag),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['conversations'] }); setTagInput('') },
  })

  const moveStageMutation = useMutation({
    mutationFn: ({ leadId, stageId }: { leadId: string; stageId: string }) =>
      crmApi.moveStage(leadId, stageId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['leads'] }),
  })

  const allConvs = (conversations as (Conversation & { tags?: string[] })[]) ?? []
  const list = allConvs.filter((c) => {
    const matchSearch = !search || (c.contact?.full_name || c.contact?.phone || '').toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || (filter === 'unread' && c.unread_count > 0) || (filter === 'bot' && c.is_bot_active)
    return matchSearch && matchFilter
  })
  const selected = allConvs.find((c) => c.id === selectedId)
  const thread = (messages as Message[]) ?? []
  const hasOutboundWaitingForWebhook = thread.some(
    (msg) => msg.direction === 'outbound' && !msg.is_internal_note && msg.status === 'sent',
  )
  
  const { data: aiSummary, isLoading: summaryLoading } = useQuery({
    queryKey: ['ai-summary', selectedId],
    queryFn: () => aiApi.summarize(thread.map((m: Message) => ({ content: m.content, direction: m.direction }))).then(r => r.data.data ?? r.data),
    enabled: !!selectedId && thread.length > 0,
  })

  const leadList = (leads as Lead[]) ?? []
  const matchedLead = selected ? leadList.find((l) => l.contact_name === selected.contact?.full_name || l.contact === selected.contact?.id) : null
  const stageList = (stages as { id: string; name: string, color?: string }[]) ?? []

  const showChatOnMobile = !!selectedId
  const tags = selected?.tags ?? selected?.contact?.tags ?? []

  const applySuggestion = (text: string) => {
    setReply(text)
    setNoteMode(false)
  }

  const aiSuggestions = aiSummary ? [aiSummary.recommended_action, ...(aiSummary.key_points || [])].filter(Boolean) : []

  return (
    <div className="flex h-full overflow-hidden" style={{ background: 'var(--bg)' }}>
      {/* Left — Conversation list */}
      <div className={cn(
        'flex w-full shrink-0 flex-col border-r md:w-[300px] lg:w-[320px]',
        showChatOnMobile ? 'hidden md:flex' : 'flex',
      )} style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
        <div className="border-b px-4 py-3" style={{ borderColor: 'var(--border-subtle)' }}>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Inbox</h2>
            <Badge variant="info">{allConvs.length}</Badge>
          </div>
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search conversations..."
              className="w-full rounded-xl border py-2 pl-9 pr-3 text-xs outline-none focus:border-brand-500 transition-colors"
              style={{ background: 'var(--bg-subtle)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} />
          </div>
          <div className="mt-2 flex gap-1">
            {(['all', 'unread', 'bot'] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={cn('rounded-lg px-2 py-1 text-[10px] font-semibold uppercase tracking-wide transition-colors',
                  filter === f ? 'bg-brand-600 text-white' : 'hover:bg-[var(--hover)]')}
                style={{ color: filter === f ? undefined : 'var(--text-muted)' }}>
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <p className="p-4 text-center text-xs" style={{ color: 'var(--text-muted)' }}>Loading...</p>
          ) : list.length === 0 ? (
            <p className="p-4 text-center text-xs" style={{ color: 'var(--text-muted)' }}>No conversations</p>
          ) : (
            list.map((conv) => {
              const isSelected = selectedId === conv.id
              return (
              <button key={conv.id} onClick={() => setSelectedId(conv.id)}
                className={cn('flex w-full items-center gap-3 border-b px-3.5 py-3 text-left transition-colors',
                  isSelected ? 'bg-[#e9f7ef]' : 'hover:bg-[var(--hover)]')}
                style={{ borderColor: 'var(--border-subtle)' }}>
                <Avatar name={conv.contact?.first_name || conv.contact?.phone} size="md" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <p className="truncate text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {conv.contact?.full_name || conv.contact?.phone}
                    </p>
                    <span className="shrink-0 text-[10px]" style={{ color: 'var(--text-muted)' }}>
                      {formatChatTime(conv.last_message_at)}
                    </span>
                  </div>
                  <p className="truncate text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    Customer · {conv.contact?.phone}
                  </p>
                  <div className="flex items-center justify-between gap-1">
                    <p className="truncate text-[11px]" style={{ color: 'var(--text-muted)' }}>
                      <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>You: </span>
                      {conv.last_message_preview || 'No messages'}
                    </p>
                    {conv.unread_count > 0 && (
                      <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-600 px-1 text-[9px] font-bold text-white">
                        {conv.unread_count}
                      </span>
                    )}
                  </div>
                  {conv.is_bot_active && (
                    <span className="mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-semibold"
                      style={{ background: '#e6f4ea', color: '#1f7a3b' }}>
                      <Bot className="h-2.5 w-2.5" /> Auto bot on
                    </span>
                  )}
                </div>
              </button>
              )
            })
          )}
        </div>
      </div>

      {/* Center — Chat */}
      <div className={cn('flex min-w-0 flex-1 flex-col', showChatOnMobile ? 'flex' : 'hidden md:flex')}>
        {selected ? (
          <>
            <div className="flex h-16 shrink-0 items-center gap-3 border-b px-3 md:px-4"
              style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-card)' }}>
              <button className="rounded-lg p-1.5 md:hidden" onClick={() => setSelectedId(null)}
                style={{ color: 'var(--text-muted)' }}>
                <ArrowLeft className="h-4 w-4" />
              </button>
              <Avatar name={selected.contact?.first_name || selected.contact?.phone} size="md" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {selected.contact?.full_name || selected.contact?.phone}
                </p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Customer · {selected.contact?.phone} · {selected.is_bot_active ? 'Auto bot active' : 'Human takeover'}
                </p>
              </div>
              {selected.is_bot_active && (
                <Button size="sm" variant="secondary" onClick={() => takeoverMutation.mutate()}>
                  <UserCheck className="h-3 w-3" /> Take over
                </Button>
              )}
            </div>

            <div
              className="flex-1 overflow-y-auto px-4 py-4"
              style={{
                backgroundColor: '#efeae2',
                backgroundImage:
                  'radial-gradient(rgba(17, 25, 40, 0.045) 1px, transparent 1px)',
                backgroundSize: '18px 18px',
              }}
            >
              <div className="mx-auto max-w-3xl space-y-3">
                {hasOutboundWaitingForWebhook && (
                  <div className="mx-auto max-w-lg rounded-xl bg-white/85 px-3 py-2 text-center text-xs shadow-sm"
                    style={{ color: '#667781' }}>
                    Delivery and blue ticks update after Meta webhook events reach this CRM.
                  </div>
                )}
                {thread.map((msg) => {
                  const isOutbound = msg.direction === 'outbound'
                  const isNote = msg.is_internal_note
                  const label = isNote ? 'Internal note' : isOutbound ? 'You · Business' : 'Customer'
                  return (
                    <div key={msg.id} className={cn('flex', isOutbound || isNote ? 'justify-end' : 'justify-start')}>
                      <div
                        className={cn(
                          'group relative max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm shadow-sm',
                          isNote
                            ? 'border border-amber-300 bg-amber-50 text-amber-950'
                            : isOutbound
                              ? 'rounded-br-md bg-[#d9fdd3] text-[#111b21]'
                              : 'rounded-bl-md bg-white text-[#111b21]',
                        )}
                      >
                        <div className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase">
                          {isNote ? (
                            <StickyNote className="h-3 w-3 text-amber-600" />
                          ) : isOutbound ? (
                            <UserCheck className="h-3 w-3 text-[#128c7e]" />
                          ) : (
                            <Phone className="h-3 w-3 text-[#667781]" />
                          )}
                          <span style={{ color: isOutbound ? '#128c7e' : isNote ? '#b45309' : '#667781' }}>
                            {label}
                          </span>
                        </div>
                        <span className="block whitespace-pre-wrap break-words leading-relaxed">{msg.content}</span>
                        <div className="mt-1 flex items-center justify-end gap-1.5 text-[10px]" style={{ color: '#667781' }}>
                          <span>{formatMessageTime(msg.created_at)}</span>
                          {isOutbound && !isNote && <DeliveryState status={msg.status} />}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="shrink-0 border-t p-3" style={{ borderColor: 'var(--border-subtle)', background: '#f0f2f5' }}>
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="flex rounded-xl bg-white p-1 shadow-sm">
                <button onClick={() => setNoteMode(false)}
                  className={cn('rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
                    !noteMode ? 'bg-[#128c7e] text-white shadow-sm' : 'text-[#667781] hover:bg-[#f0f2f5]')}>
                  Reply to customer
                </button>
                <button onClick={() => setNoteMode(true)}
                  className={cn('rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
                    noteMode ? 'bg-amber-500 text-white shadow-sm' : 'text-[#667781] hover:bg-[#f0f2f5]')}>
                  Internal note
                </button>
                </div>
                <span className="hidden text-xs md:inline" style={{ color: '#667781' }}>
                  Sending as Done Org
                </span>
              </div>
              <div className="flex gap-2">
                <input value={reply} onChange={(e) => setReply(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && reply.trim() && sendMutation.mutate(reply)}
                  placeholder={noteMode ? 'Add a private team note...' : 'Message customer on WhatsApp...'}
                  className="flex-1 rounded-2xl border-0 bg-white px-4 py-3 text-sm shadow-sm outline-none focus:ring-2 focus:ring-[#128c7e]/30"
                  style={{ color: 'var(--text-primary)' }} />
                <Button
                  onClick={() => reply.trim() && sendMutation.mutate(reply)}
                  loading={sendMutation.isPending}
                  size="sm"
                  className="h-12 w-12 rounded-full bg-[#128c7e] p-0 hover:bg-[#0b7a6d]"
                >
                  <Send className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl" style={{ background: 'var(--accent-subtle)' }}>
              <Mail className="h-8 w-8" style={{ color: 'var(--accent)' }} />
            </div>
            <p className="mt-4 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Select a conversation</p>
            <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>Choose from the list to start messaging</p>
          </div>
        )}
      </div>

      {/* Right — CRM Profile Sidebar */}
      <div className={cn(
        'hidden w-[280px] shrink-0 flex-col border-l xl:flex',
      )} style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
        {selected ? (
          <div className="flex flex-1 flex-col overflow-y-auto">
            {/* Profile header */}
            <div className="border-b p-4 text-center" style={{ borderColor: 'var(--border-subtle)' }}>
              <Avatar name={selected.contact?.first_name || selected.contact?.phone} size="lg" className="mx-auto" />
              <h3 className="mt-3 text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                {selected.contact?.full_name || 'Unknown'}
              </h3>
              <p className="mt-0.5 flex items-center justify-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                <Phone className="h-3 w-3" />{selected.contact?.phone}
              </p>
              {selected.contact?.company && (
                <p className="mt-1 flex items-center justify-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                  <Building2 className="h-3 w-3" />{selected.contact.company}
                </p>
              )}
            </div>

            {/* Lead Stage */}
            <div className="border-b p-4" style={{ borderColor: 'var(--border-subtle)' }}>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Lead Stage
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {stageList.map((stage) => {
                  const isActive = matchedLead?.stage_name === stage.name || selected.status === stage.id
                  return (
                    <button key={stage.id}
                      onClick={() => {
                        if (matchedLead) {
                          moveStageMutation.mutate({ leadId: matchedLead.id, stageId: stage.id })
                        }
                      }}
                      className={cn('rounded-lg px-2 py-1.5 text-[10px] font-semibold transition-all',
                        isActive ? 'text-white shadow-sm' : 'hover:bg-[var(--hover)]')}
                      style={{
                        background: isActive ? (stage.color || '#3b82f6') : 'var(--bg-subtle)',
                        color: isActive ? '#fff' : 'var(--text-secondary)',
                      }}>
                      {stage.name}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Status */}
            <div className="border-b p-4" style={{ borderColor: 'var(--border-subtle)' }}>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Agent</p>
              <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-primary)' }}>
                {selected.is_bot_active
                  ? <><Bot className="h-3.5 w-3.5 text-brand-600" /> Bot handling</>
                  : <><UserCheck className="h-3.5 w-3.5 text-blue-500" /> Human agent</>}
              </div>
              {matchedLead && (
                <div className="mt-2 flex items-center gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                  <Target className="h-3.5 w-3.5" /> Score: <strong>{matchedLead.score}</strong>
                </div>
              )}
            </div>

            {/* Tags */}
            <div className="border-b p-4" style={{ borderColor: 'var(--border-subtle)' }}>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Tags</p>
              <div className="flex flex-wrap gap-1 mb-2">
                {tags.length ? tags.map((t: string) => (
                  <span key={t} className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                    style={{ background: 'var(--bg-subtle)', color: 'var(--text-secondary)' }}>{t}</span>
                )) : <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>No tags</span>}
              </div>
              <div className="flex gap-1">
                <input value={tagInput} onChange={(e) => setTagInput(e.target.value)} placeholder="Add tag"
                  className="flex-1 rounded-lg border px-2 py-1 text-[10px] outline-none"
                  style={{ borderColor: 'var(--border)', background: 'var(--bg-subtle)', color: 'var(--text-primary)' }}
                  onKeyDown={(e) => e.key === 'Enter' && tagInput && addTagMutation.mutate(tagInput)} />
                <button onClick={() => tagInput && addTagMutation.mutate(tagInput)}
                  className="rounded-lg p-1.5 hover:bg-[var(--hover)]" style={{ color: 'var(--accent)' }}>
                  <Tag className="h-3 w-3" />
                </button>
              </div>
            </div>

            {/* Notes */}
            <div className="border-b p-4" style={{ borderColor: 'var(--border-subtle)' }}>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Notes</p>
              <textarea value={noteText} onChange={(e) => setNoteText(e.target.value)}
                placeholder="Add a note about this contact..."
                rows={3}
                className="w-full rounded-xl border px-2.5 py-2 text-xs outline-none resize-none focus:border-brand-500"
                style={{ borderColor: 'var(--border)', background: 'var(--bg-subtle)', color: 'var(--text-primary)' }} />
            </div>

            {/* AI Suggestions */}
            <div className="p-4">
              <div className="flex items-center gap-1.5 mb-2">
                <Sparkles className="h-3.5 w-3.5 text-brand-600" />
                <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  AI Suggestions
                </p>
              </div>
              <div className="space-y-1.5">
                {summaryLoading ? (
                  <p className="text-[10px] text-[var(--text-muted)]">Generating insights...</p>
                ) : aiSuggestions.length > 0 ? (
                  aiSuggestions.map((s, i) => (
                    <button key={i} onClick={() => applySuggestion(s)}
                      className="flex w-full items-start gap-2 rounded-xl p-2.5 text-left text-[10px] transition-colors hover:bg-[var(--hover)]"
                      style={{ background: 'var(--bg-subtle)', color: 'var(--text-secondary)' }}>
                      <Lightbulb className="mt-0.5 h-3 w-3 shrink-0 text-amber-500" />
                      <span>{s}</span>
                    </button>
                  ))
                ) : (
                  <p className="text-[10px] text-[var(--text-muted)]">No suggestions available</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center p-4">
            <p className="text-center text-xs" style={{ color: 'var(--text-muted)' }}>
              Select a conversation to view CRM profile
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
