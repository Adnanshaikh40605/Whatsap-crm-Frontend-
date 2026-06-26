import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { messageLogApi } from '../lib/api'
import { PageHeader, DataTable, StatusBadge } from '../components/ui/PageLayout'
import { formatDate } from '../lib/utils'
import type { MessageLog } from '../types/bot'

interface MessageLogPageProps {
  channel?: 'whatsapp' | 'sms'
  title?: string
  subtitle?: string
}

export function MessageLogPage({
  channel,
  title = 'Message Log',
  subtitle = 'Complete history of sent and received WhatsApp and SMS messages',
}: MessageLogPageProps) {
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['message-log', channel],
    queryFn: () => messageLogApi.list(channel ? { channel } : undefined).then((r) => r.data.results ?? r.data),
  })

  const messages = ((data as MessageLog[]) ?? []).filter(
    (m) => !search || m.content?.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div>
      <PageHeader title={title} subtitle={subtitle} />

      <DataTable
        columns={[
          { key: 'channel', label: 'Channel', render: (r) => <span className="uppercase">{r.channel}</span> },
          { key: 'direction', label: 'Direction', render: (r) => <span className="capitalize">{r.direction}</span> },
          { key: 'message_type', label: 'Type', render: (r) => <span className="capitalize">{r.message_type}</span> },
          { key: 'content', label: 'Message', render: (r) => <span className="max-w-md truncate block">{r.content || '—'}</span> },
          { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
          { key: 'created_at', label: 'Date', render: (r) => formatDate(r.created_at) },
        ]}
        data={messages}
        search={search}
        onSearch={setSearch}
        loading={isLoading}
      />
    </div>
  )
}
