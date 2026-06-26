import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Plus, Send, CreditCard, Bell } from 'lucide-react'
import { invoicesApi } from '../lib/api'
import { PageHeader, DataTable, StatusBadge } from '../components/ui/PageLayout'
import { Button } from '../components/ui/Button'
import { formatDate, formatNumber } from '../lib/utils'

interface Invoice {
  id: string
  invoice_number: string
  title: string
  contact_name: string
  status: string
  total: string
  amount_paid: string
  balance_due: string
  due_date: string | null
  created_at: string
}

export function InvoicesPage() {
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => invoicesApi.list().then((r) => r.data.results ?? r.data),
  })

  const invoices = ((data as Invoice[]) ?? []).filter(
    (i) => !search || i.title.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div>
      <PageHeader
        title="Invoices"
        subtitle="Invoice builder, payment tracking, GST compliance, and automated reminders"
        actions={<Button><Plus className="h-4 w-4" /> New Invoice</Button>}
      />

      <DataTable
        columns={[
          { key: 'invoice_number', label: 'Invoice #', render: (r) => <span className="font-mono font-medium text-brand-700">{r.invoice_number}</span> },
          { key: 'title', label: 'Title' },
          { key: 'contact_name', label: 'Contact' },
          { key: 'total', label: 'Total', render: (r) => `₹${formatNumber(Number(r.total))}` },
          { key: 'amount_paid', label: 'Paid', render: (r) => `₹${formatNumber(Number(r.amount_paid))}` },
          { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
          { key: 'due_date', label: 'Due Date', render: (r) => formatDate(r.due_date) },
        ]}
        data={invoices}
        search={search}
        onSearch={setSearch}
        loading={isLoading}
        actions={() => (
          <div className="flex gap-1">
            <Button size="sm"><Send className="h-3 w-3" /> Send</Button>
            <Button size="sm" variant="dark"><CreditCard className="h-3 w-3" /> Mark Paid</Button>
            <Button size="sm" variant="secondary"><Bell className="h-3 w-3" /> Remind</Button>
          </div>
        )}
      />
    </div>
  )
}
