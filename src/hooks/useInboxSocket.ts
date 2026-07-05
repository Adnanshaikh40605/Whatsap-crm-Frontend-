import { useEffect, useRef } from 'react'
import { getApiOrigin } from '../lib/config'

export type InboxSocketMessage = Record<string, unknown> & {
  id?: string
  conversation?: string
  conversation_id?: string
  direction?: string
  content?: string
  created_at?: string
  is_internal_note?: boolean
  status?: string
  sent_at?: string | null
  delivered_at?: string | null
  read_at?: string | null
  failed_at?: string | null
  error_reason?: string | null
}

export type InboxSocketEvent =
  | {
      type: 'message_status_updated'
      message: {
        id: string
        conversation_id: string
        status: string
        sent_at?: string | null
        delivered_at?: string | null
        read_at?: string | null
        failed_at?: string | null
        error_reason?: string | null
      }
      conversation: {
        id: string
        last_outbound_status?: string
      }
    }
  | {
      type: 'message_created' | 'message_sent' | 'message_delivered' | 'message_read'
      message: InboxSocketMessage
    }
  | {
      type: 'conversation_updated'
      conversation_id?: string
      last_message?: string
      last_message_at?: string
      unread_count?: number
      updated_at?: string
      conversation: Record<string, unknown> & {
        id?: string
        last_message_preview?: string
        last_message_at?: string
        unread_count?: number
        metadata?: { last_message_direction?: string }
        last_outbound_status?: string
      }
    }
  | { type: 'connected'; org_id: string }
  | { type: 'pong' }

function wsBaseUrl(): string {
  const origin = getApiOrigin()
  const protocol = origin.startsWith('https') ? 'wss' : 'ws'
  const host = origin.replace(/^https?:\/\//, '')
  return `${protocol}://${host}`
}

export function useInboxSocket(
  orgId: string | null | undefined,
  onEvent: (event: InboxSocketEvent) => void,
) {
  const handlerRef = useRef(onEvent)
  handlerRef.current = onEvent

  useEffect(() => {
    if (!orgId) return

    const token = localStorage.getItem('access_token')
    if (!token) return

    let socket: WebSocket | null = null
    let reconnectTimer: number | undefined
    let closedByUser = false

    const connect = () => {
      const url = `${wsBaseUrl()}/ws/inbox/${orgId}/?token=${encodeURIComponent(token)}`
      socket = new WebSocket(url)

      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data) as InboxSocketEvent
          handlerRef.current(payload)
        } catch {
          // ignore malformed payloads
        }
      }

      socket.onclose = () => {
        if (!closedByUser) {
          reconnectTimer = window.setTimeout(connect, 2500)
        }
      }
    }

    connect()

    const ping = window.setInterval(() => {
      if (socket?.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'ping' }))
      }
    }, 30000)

    return () => {
      closedByUser = true
      window.clearInterval(ping)
      if (reconnectTimer) window.clearTimeout(reconnectTimer)
      socket?.close()
    }
  }, [orgId])
}

export function resolveConversationId(message: InboxSocketMessage): string | undefined {
  if (typeof message.conversation_id === 'string') return message.conversation_id
  if (typeof message.conversation === 'string') return message.conversation
  return undefined
}

const STATUS_RANK: Record<string, number> = {
  pending: 0,
  sending: 1,
  sent: 2,
  delivered: 3,
  read: 4,
  failed: 99,
}

export function mergeDeliveryStatus(current?: string, incoming?: string): string | undefined {
  if (!incoming) return current
  if (!current) return incoming
  if (incoming === 'failed') return 'failed'
  if (current === 'failed') return current
  return (STATUS_RANK[incoming] ?? 0) >= (STATUS_RANK[current] ?? 0) ? incoming : current
}
