import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Plus, Send, Check, FileText } from 'lucide-react'
import { quotesApi } from '../lib/api'
import { PageHeader, DataTable, StatusBadge } from '../components/ui/PageLayout'
import { Button } from '../components/ui/Button'
import { formatDate, formatNumber } from '../lib/utils'

interface Quotation {
  id: string
  quote_number: string
  title: string
  contact_name: string
  status: string
  total: string
  currency: string
  valid_until: string | null
  created_at: string
}

export function QuotationsPage() {
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['quotations'],
    queryFn: () => quotesApi.list().then((r) => r.data.results ?? r.data),
  })

  const quotes = ((data as Quotation[]) ?? []).filter(
    (q) => !search || q.title.toLowerCase().includes(search.toLowerCase()) || q.quote_number.includes(search),
  )

  return (
    <div className="space-y-4">
      <PageHeader
        title="Quotations"
        subtitle="Create, send, and track quotations with GST support"
        actions={<Button><Plus className="h-4 w-4" /> New Quotation</Button>}
      />

      <DataTable
        columns={[
          { key: 'quote_number', label: 'Quote #', render: (r) => <span className="font-mono font-medium text-brand-700">{r.quote_number}</span> },
          { key: 'title', label: 'Title' },
          { key: 'contact_name', label: 'Contact' },
          { key: 'total', label: 'Amount', render: (r) => `₹${formatNumber(Number(r.total))}` },
          { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
          { key: 'valid_until', label: 'Valid Until', render: (r) => formatDate(r.valid_until) },
          { key: 'created_at', label: 'Created', render: (r) => formatDate(r.created_at) },
        ]}
        data={quotes}
        search={search}
        onSearch={setSearch}
        loading={isLoading}
        actions={() => (
          <div className="flex gap-1">
            <Button size="sm" variant="secondary"><FileText className="h-3 w-3" /> PDF</Button>
            <Button size="sm"><Send className="h-3 w-3" /> Send</Button>
            <Button size="sm" variant="dark"><Check className="h-3 w-3" /> Approve</Button>
          </div>
        )}
      />
    </div>
  )
}
