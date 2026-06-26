import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { MessageCircle, Send, Smartphone } from 'lucide-react'
import { crmApi, smsApi } from '../lib/api'
import { Button } from '../components/ui/Button'
import { DataTable, PageHeader, StatusBadge } from '../components/ui/PageLayout'
import { formatDate } from '../lib/utils'

interface ContactOption {
  id: string
  full_name: string
  phone: string
}

interface SmsMessage {
  id: string
  content: string
  direction: string
  status: string
  provider_message_id: string
  created_at: string
  conversation?: string
}

export function SmsPage() {
  const queryClient = useQueryClient()
  const [phone, setPhone] = useState('')
  const [contactId, setContactId] = useState('')
  const [content, setContent] = useState('')
  const [search, setSearch] = useState('')

  const { data: contactsData } = useQuery({
    queryKey: ['contacts', 'sms-picker'],
    queryFn: () => crmApi.contacts().then((r) => r.data.results ?? r.data.data ?? r.data),
  })
  const { data: messagesData, isLoading } = useQuery({
    queryKey: ['sms-messages'],
    queryFn: () => smsApi.messages().then((r) => r.data.results ?? r.data.data ?? r.data),
  })

  const contacts = (contactsData as ContactOption[]) ?? []
  const messages = useMemo(() => ((messagesData as SmsMessage[]) ?? []).filter((message) => {
    const haystack = `${message.content} ${message.status} ${message.provider_message_id}`.toLowerCase()
    return !search || haystack.includes(search.toLowerCase())
  }), [messagesData, search])

  const sendSms = useMutation({
    mutationFn: () => smsApi.send({
      phone: contactId ? undefined : phone,
      contact_id: contactId || undefined,
      content,
    }),
    onSuccess: () => {
      setContent('')
      setPhone('')
      setContactId('')
      queryClient.invalidateQueries({ queryKey: ['sms-messages'] })
      queryClient.invalidateQueries({ queryKey: ['message-log'] })
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
  })

  const selectedContact = contacts.find((contact) => contact.id === contactId)
  const remaining = 1600 - content.length
  const canSend = content.trim().length > 0 && (phone.trim().length > 0 || contactId)

  return (
    <div>
      <PageHeader
        title="Send Test SMS"
        subtitle="SMS CRM test sender. Configure DLT sender IDs, templates, and provider settings before production bulk sends."
        badge="SMS CRM"
      />

      <div className="mb-5 grid gap-4 xl:grid-cols-[420px_1fr]">
        <section className="surface-card p-4">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-white">
              <Smartphone className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>New SMS</h3>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Use a saved contact or type a phone number.</p>
            </div>
          </div>

          <label className="mb-1 block text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>Contact</label>
          <select
            value={contactId}
            onChange={(event) => setContactId(event.target.value)}
            className="mb-3 h-11 w-full rounded-lg border px-3 text-sm outline-none focus:border-[#1876f2]"
            style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
          >
            <option value="">Type a phone number</option>
            {contacts.map((contact) => (
              <option key={contact.id} value={contact.id}>
                {(contact.full_name || contact.phone)} - {contact.phone}
              </option>
            ))}
          </select>

          <label className="mb-1 block text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>Phone</label>
          <input
            value={selectedContact?.phone ?? phone}
            onChange={(event) => setPhone(event.target.value)}
            disabled={Boolean(contactId)}
            placeholder="919876543210"
            className="mb-3 h-11 w-full rounded-lg border px-3 text-sm outline-none focus:border-[#1876f2] disabled:opacity-60"
            style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
          />

          <label className="mb-1 block text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>Message</label>
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value.slice(0, 1600))}
            placeholder="Write your SMS..."
            rows={7}
            className="w-full resize-none rounded-lg border px-3 py-3 text-sm outline-none focus:border-[#1876f2]"
            style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
          />
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs" style={{ color: remaining < 0 ? 'var(--critical)' : 'var(--text-muted)' }}>
              {remaining} characters left
            </span>
            <Button onClick={() => sendSms.mutate()} loading={sendSms.isPending} disabled={!canSend}>
              <Send className="h-4 w-4" /> Send SMS
            </Button>
          </div>
          {sendSms.isError && (
            <p className="mt-3 text-sm text-red-500">SMS could not be queued. Check the phone number and try again.</p>
          )}
          {sendSms.isSuccess && (
            <p className="mt-3 text-sm text-green-600">SMS queued successfully.</p>
          )}
        </section>

        <section>
          <div className="mb-3 flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-brand-600" />
            <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Recent SMS activity</h3>
          </div>
          <DataTable
            columns={[
              { key: 'direction', label: 'Direction', render: (row) => <span className="capitalize">{row.direction}</span> },
              { key: 'content', label: 'Message', render: (row) => <span className="block max-w-lg truncate">{row.content || '-'}</span> },
              { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
              { key: 'provider_message_id', label: 'Provider ID', render: (row) => row.provider_message_id || '-' },
              { key: 'created_at', label: 'Date', render: (row) => formatDate(row.created_at) },
            ]}
            data={messages}
            search={search}
            onSearch={setSearch}
            loading={isLoading}
          />
        </section>
      </div>
    </div>
  )
}
