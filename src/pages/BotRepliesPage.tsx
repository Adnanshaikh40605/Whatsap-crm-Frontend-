import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { automationApi } from '../lib/api'
import { PageHeader, DataTable, StatusBadge } from '../components/ui/PageLayout'
import { Button } from '../components/ui/Button'
import type { BotReply } from '../types/bot'

const typeLabels: Record<string, string> = {
  simple: 'Simple Bot Reply',
  media: 'Media Bot Reply',
  interactive: 'Advance Interactive Bot Reply',
}

export function BotRepliesPage() {
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['bot-replies'],
    queryFn: () => automationApi.botReplies().then((r) => r.data.results ?? r.data),
  })

  const replies = ((data as BotReply[]) ?? []).filter(
    (r) => !search || r.title.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div>
      <PageHeader
        title="Bot Replies"
        subtitle="Manage simple, media, and interactive bot responses"
        actions={<Button>+ Add Bot Reply</Button>}
      />

      <DataTable
        columns={[
          { key: 'title', label: 'Title', render: (r) => <span className="font-medium">{r.title}</span> },
          { key: 'reply_type', label: 'Type', render: (r) => typeLabels[r.reply_type] || r.reply_type },
          { key: 'content', label: 'Content', render: (r) => <span className="max-w-xs truncate block">{r.content || (r.options?.join(', ') ?? '—')}</span> },
          { key: 'is_active', label: 'Status', render: (r) => <StatusBadge status={r.is_active ? 'active' : 'inactive'} /> },
        ]}
        data={replies}
        search={search}
        onSearch={setSearch}
        loading={isLoading}
      />
    </div>
  )
}
