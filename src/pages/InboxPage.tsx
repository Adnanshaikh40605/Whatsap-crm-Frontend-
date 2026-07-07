import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Search, Send, StickyNote, ArrowLeft, Mail, Smile, Paperclip, Image, BookOpen, Zap,
  Bold, Italic, Strikethrough,
} from 'lucide-react'
import { inboxApi } from '../lib/api'
import { cn, formatChatTime, formatMessageTime } from '../lib/utils'
import { WA, CHAT_WALLPAPER } from '../lib/whatsappTheme'
import { MessageDeliveryTicks } from '../components/inbox/MessageDeliveryTicks'
import { useInboxSocket, resolveConversationId, mergeDeliveryStatus, sortConversationsByRecent, type InboxSocketEvent, type InboxSocketMessage } from '../hooks/useInboxSocket'
import { useAuth } from '../context/AuthContext'
import type { Conversation } from '../types'

interface Message {
  id: string
  content: string
  direction: string
  is_internal_note: boolean
  created_at: string
  status?: string
  whatsapp_message_id?: string
  sent_at?: string | null
  delivered_at?: string | null
  read_at?: string | null
  failed_at?: string | null
  error_reason?: string | null
}

type InboxTab = 'all' | 'unread'

function Avatar({ name, className }: { name?: string; className?: string }) {
  return (
    <div
      className={cn(
        'flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-[#54656f]',
        className,
      )}
      style={{ background: '#dfe5e7' }}
    >
      {name?.[0]?.toUpperCase() || '?'}
    </div>
  )
}

function dayLabel(dateStr: string): string {
  const date = new Date(dateStr)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)
  if (date.toDateString() === today.toDateString()) return 'Today'
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return date.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })
}

export function InboxPage() {
  const queryClient = useQueryClient()
  const { organization } = useAuth()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [reply, setReply] = useState('')
  const [noteMode, setNoteMode] = useState(false)
  const [tab, setTab] = useState<InboxTab>('all')
  const messagesScrollRef = useRef<HTMLDivElement>(null)
  const replyRef = useRef<HTMLTextAreaElement>(null)

  const { data: conversations, isLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => inboxApi.conversations().then((r) => r.data.results ?? r.data.data ?? r.data),
  })
  const { data: messages } = useQuery({
    queryKey: ['messages', selectedId],
    queryFn: () => inboxApi.messages(selectedId!).then((r) => r.data.results ?? r.data.data ?? r.data),
    enabled: !!selectedId,
  })

  const upsertMessage = useCallback((raw: InboxSocketMessage) => {
    const conversationId = resolveConversationId(raw)
    if (!conversationId || !raw.id) return

    queryClient.setQueryData<Message[]>(['messages', conversationId], (old) => {
      const list = old ?? []
      const existing = list.find((item) => item.id === raw.id)
      if (existing) {
        return list.map((item) =>
          item.id === raw.id
            ? {
                ...item,
                ...raw,
                status: mergeDeliveryStatus(item.status, raw.status as string | undefined),
              } as Message
            : item,
        )
      }
      return [...list, raw as Message]
    })
  }, [queryClient])

  const patchConversationList = useCallback((patch: Partial<Conversation> & { id: string }) => {
    queryClient.setQueryData<Conversation[]>(['conversations'], (old) => {
      if (!old) return old
      const idx = old.findIndex((conv) => conv.id === patch.id)
      if (idx < 0) {
        queryClient.invalidateQueries({ queryKey: ['conversations'] })
        return old
      }
      const updated = { ...old[idx], ...patch }
      const rest = old.filter((conv) => conv.id !== patch.id)
      return sortConversationsByRecent([updated, ...rest])
    })
  }, [queryClient])

  const handleSocketEvent = useCallback((event: InboxSocketEvent) => {
    if (
      event.type === 'message_status_updated' ||
      event.type === 'message_delivered' ||
      event.type === 'message_read'
    ) {
      const msg = event.message
      upsertMessage(msg)
      patchConversationList({
        id: msg.conversation_id,
        last_outbound_status:
          ('conversation' in event && event.conversation?.last_outbound_status) || msg.status,
      })
      return
    }

    if (
      event.type === 'message_created' ||
      event.type === 'message_sent' ||
      event.type === 'new_message'
    ) {
      const msg = event.message
      upsertMessage(msg)
      const conversationId = resolveConversationId(msg)
      if (conversationId) {
        const isInbound = msg.direction === 'inbound'
        patchConversationList({
          id: conversationId,
          last_message_preview: (msg.content as string) || undefined,
          last_message_at: (msg.created_at as string) || undefined,
          metadata: {
            last_message_direction: isInbound ? 'inbound' : 'outbound',
          },
        })
      }
      return
    }

    if (event.type === 'conversation_updated') {
      const conversationId = event.conversation?.id ?? event.conversation_id
      if (!conversationId) return

      const nested = event.conversation
      patchConversationList({
        id: conversationId,
        last_message_preview: nested?.last_message_preview ?? event.last_message,
        last_message_at: nested?.last_message_at ?? event.last_message_at,
        unread_count: nested?.unread_count ?? event.unread_count,
        last_outbound_status: nested?.last_outbound_status,
        metadata: nested?.metadata,
        updated_at: nested?.updated_at ?? event.updated_at,
      })
    }
  }, [patchConversationList, upsertMessage])

  useInboxSocket(organization?.id, handleSocketEvent)

  useEffect(() => {
    if (!selectedId) return
    inboxApi.markRead(selectedId).then(() => {
      queryClient.setQueryData<Conversation[]>(['conversations'], (old) => {
        if (!old) return old
        return old.map((conv) => (conv.id === selectedId ? { ...conv, unread_count: 0 } : conv))
      })
    }).catch(() => {})
  }, [selectedId, queryClient])

  const sendMutation = useMutation({
    mutationFn: (content: string) => {
      if (!selectedId) throw new Error('No conversation')
      return inboxApi.sendMessage({ conversation: selectedId, content, is_internal_note: noteMode })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', selectedId] })
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
      setReply('')
      replyRef.current?.focus()
    },
  })

  const allConvs = sortConversationsByRecent((conversations as Conversation[]) ?? [])
  const unreadCount = allConvs.filter((c) => c.unread_count > 0).length

  const list = allConvs.filter((c) => {
    const matchSearch = !search || (c.contact?.full_name || c.contact?.phone || '').toLowerCase().includes(search.toLowerCase())
    const matchTab = tab === 'all' || (tab === 'unread' && c.unread_count > 0)
    return matchSearch && matchTab
  })

  const selected = allConvs.find((c) => c.id === selectedId)
  const thread = (messages as Message[]) ?? []
  const lastMessageId = thread[thread.length - 1]?.id

  const threadWithDividers = useMemo(() => {
    const items: Array<{ type: 'divider'; label: string } | { type: 'message'; message: Message }> = []
    let lastDay = ''
    for (const msg of thread) {
      const label = dayLabel(msg.created_at)
      if (label !== lastDay) {
        items.push({ type: 'divider', label })
        lastDay = label
      }
      items.push({ type: 'message', message: msg })
    }
    return items
  }, [thread])

  useEffect(() => {
    const container = messagesScrollRef.current
    if (!container || !selectedId || thread.length === 0) return

    const scrollToLatest = () => {
      container.scrollTop = container.scrollHeight
    }

    scrollToLatest()
    requestAnimationFrame(() => requestAnimationFrame(scrollToLatest))
    const timer = window.setTimeout(scrollToLatest, 100)
    return () => window.clearTimeout(timer)
  }, [selectedId, lastMessageId, thread.length])

  const showChatOnMobile = !!selectedId

  const handleSend = () => {
    if (reply.trim()) sendMutation.mutate(reply.trim())
  }

  const wrapSelection = (before: string, after: string) => {
    const el = replyRef.current
    if (!el) return
    const start = el.selectionStart
    const end = el.selectionEnd
    const selectedText = reply.slice(start, end)
    const next = reply.slice(0, start) + before + selectedText + after + reply.slice(end)
    setReply(next)
  }

  return (
    <div className="flex h-full min-h-0 overflow-hidden bg-white">
      {/* Conversation list */}
      <div
        className={cn(
          'flex w-full shrink-0 flex-col border-r border-[#e9edef] md:w-[340px] lg:w-[360px]',
          showChatOnMobile ? 'hidden md:flex' : 'flex',
        )}
      >
        <div className="border-b border-[#e9edef] bg-[#f0f2f5]">
          <div className="px-4 py-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8696a0]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search or start new chat"
                className="w-full rounded-lg border-0 bg-white py-2.5 pl-10 pr-3 text-sm text-[#111b21] outline-none placeholder:text-[#8696a0]"
              />
            </div>
          </div>
          <div className="flex gap-6 border-t border-[#e9edef] bg-white px-4">
            {([
              ['all', 'ALL', allConvs.length],
              ['unread', 'UNREAD', unreadCount],
            ] as const).map(([key, label, count]) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={cn(
                  'relative py-3 text-xs font-semibold tracking-wide transition-colors',
                  tab === key ? 'text-[#00a884]' : 'text-[#667781] hover:text-[#111b21]',
                )}
              >
                {label} ({count})
                {tab === key && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00a884]" />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <p className="p-6 text-center text-sm text-[#8696a0]">Loading conversations…</p>
          ) : list.length === 0 ? (
            <p className="p-6 text-center text-sm text-[#8696a0]">No conversations</p>
          ) : (
            list.map((conv) => {
              const isSelected = selectedId === conv.id
              const preview = conv.metadata?.last_message_direction === 'inbound'
                ? conv.last_message_preview || 'No messages'
                : `You: ${conv.last_message_preview || 'No messages'}`
              return (
                <button
                  key={conv.id}
                  type="button"
                  onClick={() => setSelectedId(conv.id)}
                  className={cn(
                    'flex w-full items-center gap-3 border-b border-[#f0f2f5] px-4 py-3.5 text-left transition-colors border-l-[3px]',
                    isSelected
                      ? 'border-l-[#00a884] bg-[#f0f2f5]'
                      : 'border-l-transparent hover:bg-[#f5f6f6]',
                  )}
                >
                  <Avatar name={conv.contact?.first_name || conv.contact?.phone} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="truncate text-[15px] font-medium text-[#111b21]">
                        {conv.contact?.full_name || conv.contact?.phone}
                      </p>
                      <span className="shrink-0 text-xs text-[#8696a0]">
                        {formatChatTime(conv.last_message_at)}
                      </span>
                    </div>
                    <div className="mt-0.5 flex items-center justify-between gap-2">
                      <p className="truncate text-sm text-[#667781]">{preview}</p>
                      {conv.unread_count > 0 ? (
                        <span
                          className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold text-white"
                          style={{ background: WA.primary }}
                        >
                          {conv.unread_count > 9 ? '9+' : conv.unread_count}
                        </span>
                      ) : conv.last_outbound_status ? (
                        <MessageDeliveryTicks status={conv.last_outbound_status} compact />
                      ) : null}
                    </div>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* Chat panel */}
      <div className={cn('flex min-w-0 flex-1 flex-col', showChatOnMobile ? 'flex' : 'hidden md:flex')}>
        {selected ? (
          <>
            {/* Chat header */}
            <div
              className="relative flex shrink-0 items-center justify-center gap-2 px-4 py-3.5 text-white"
              style={{ background: WA.panel }}
            >
              <button
                type="button"
                className="absolute left-3 md:hidden"
                onClick={() => setSelectedId(null)}
                aria-label="Back"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <p className="truncate text-sm font-semibold uppercase tracking-wide">
                {selected.contact?.full_name || 'Unknown'}
              </p>
              <span className="text-white/70">·</span>
              <p className="truncate text-sm text-white/90">{selected.contact?.phone}</p>
            </div>

            {/* Messages */}
            <div
              ref={messagesScrollRef}
              className="flex-1 overflow-y-auto px-4 py-3 md:px-8 md:py-4"
              style={{
                backgroundColor: WA.chatBg,
                backgroundImage: CHAT_WALLPAPER,
              }}
            >
              <div className="mx-auto max-w-3xl space-y-1">
                {threadWithDividers.map((item, index) => {
                  if (item.type === 'divider') {
                    return (
                      <div key={`d-${item.label}-${index}`} className="flex justify-center py-3">
                        <span className="rounded-lg bg-white/90 px-3 py-1 text-xs font-medium text-[#54656f] shadow-sm">
                          {item.label}
                        </span>
                      </div>
                    )
                  }

                  const msg = item.message
                  const isOutbound = msg.direction === 'outbound'
                  const isNote = msg.is_internal_note

                  if (isNote) {
                    return (
                      <div key={msg.id} className="flex justify-center py-1">
                        <div className="max-w-[85%] rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-center text-xs text-amber-900">
                          <StickyNote className="mx-auto mb-1 h-3.5 w-3.5" />
                          Internal note · {msg.content}
                        </div>
                      </div>
                    )
                  }

                  return (
                    <div
                      key={msg.id}
                      className={cn('flex py-0.5', isOutbound ? 'justify-end' : 'justify-start')}
                    >
                      <div
                        className={cn(
                          'relative max-w-[min(78%,520px)] rounded-lg px-3 py-2 text-[14.2px] leading-[19px] shadow-sm',
                          isOutbound
                            ? 'rounded-tr-none bg-[#d9fdd3] text-[#111b21]'
                            : 'rounded-tl-none bg-white text-[#111b21]',
                        )}
                      >
                        <span className="block whitespace-pre-wrap break-words pr-14">{msg.content}</span>
                        <div className="absolute bottom-1.5 right-2 flex items-center gap-1">
                          <span className="text-[11px] text-[#667781]">
                            {formatMessageTime(msg.created_at)}
                          </span>
                          {isOutbound && <MessageDeliveryTicks status={msg.status} compact />}
                        </div>
                        {isOutbound && msg.status === 'failed' && msg.error_reason && (
                          <p className="mt-1 text-right text-[11px] text-red-600">{msg.error_reason}</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Composer */}
            <div className="shrink-0 border-t border-[#e9edef] bg-[#f0f2f5] p-3 md:p-4">
              <div className="mx-auto flex max-w-3xl items-end gap-2">
                <div className="min-w-0 flex-1 rounded-xl border border-[#e9edef] bg-white shadow-sm">
                  <textarea
                    ref={replyRef}
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSend()
                      }
                    }}
                    rows={2}
                    placeholder={noteMode ? 'Add an internal note (not sent to customer)…' : 'Type a message'}
                    className="w-full resize-none border-0 bg-transparent px-4 pt-3 text-sm text-[#111b21] outline-none placeholder:text-[#8696a0]"
                  />
                  <div className="flex items-center gap-1 border-t border-[#f0f2f5] px-2 py-1.5">
                    <button type="button" onClick={() => wrapSelection('*', '*')} className="rounded p-1.5 text-[#54656f] hover:bg-[#f0f2f5]" title="Bold">
                      <Bold className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={() => wrapSelection('_', '_')} className="rounded p-1.5 text-[#54656f] hover:bg-[#f0f2f5]" title="Italic">
                      <Italic className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={() => wrapSelection('~', '~')} className="rounded p-1.5 text-[#54656f] hover:bg-[#f0f2f5]" title="Strikethrough">
                      <Strikethrough className="h-4 w-4" />
                    </button>
                    <span className="mx-1 h-4 w-px bg-[#e9edef]" />
                    <button type="button" className="rounded p-1.5 text-[#54656f] hover:bg-[#f0f2f5]" title="Emoji">
                      <Smile className="h-4 w-4" />
                    </button>
                    <button type="button" className="rounded p-1.5 text-[#54656f] hover:bg-[#f0f2f5]" title="Attach">
                      <Paperclip className="h-4 w-4" />
                    </button>
                    <button type="button" className="rounded p-1.5 text-[#54656f] hover:bg-[#f0f2f5]" title="Image">
                      <Image className="h-4 w-4" />
                    </button>
                    <button type="button" className="rounded p-1.5 text-[#54656f] hover:bg-[#f0f2f5]" title="Templates">
                      <BookOpen className="h-4 w-4" />
                    </button>
                    <button type="button" className="rounded p-1.5 text-[#54656f] hover:bg-[#f0f2f5]" title="Quick reply">
                      <Zap className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setNoteMode((v) => !v)}
                      className={cn(
                        'ml-auto rounded p-1.5',
                        noteMode ? 'bg-amber-100 text-amber-700' : 'text-[#54656f] hover:bg-[#f0f2f5]',
                      )}
                      title="Internal note"
                    >
                      <StickyNote className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!reply.trim() || sendMutation.isPending}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-white transition-opacity disabled:opacity-50"
                  style={{ background: WA.primary }}
                  aria-label="Send"
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center bg-[#f8f9fa]">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#dfe5e7]">
              <Mail className="h-9 w-9 text-[#8696a0]" />
            </div>
            <p className="mt-5 text-lg font-medium text-[#41525d]">WhatsFlow Inbox</p>
            <p className="mt-1 text-sm text-[#8696a0]">Select a conversation to start messaging</p>
          </div>
        )}
      </div>
    </div>
  )
}
