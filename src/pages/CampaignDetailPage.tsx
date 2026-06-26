import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Send, Eye, MousePointer, MessageSquare, CheckCheck } from 'lucide-react'
import { campaignApi } from '../lib/api'
import { PageHeader } from '../components/ui/PageLayout'
import { Button } from '../components/ui/Button'
import { formatNumber, cn } from '../lib/utils'

export function CampaignDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const { data: campaign } = useQuery({
    queryKey: ['campaign', id],
    queryFn: () => campaignApi.get(id!).then((r) => r.data.data ?? r.data),
    enabled: !!id,
  })

  const { data: dashboard } = useQuery({
    queryKey: ['campaign-dashboard', id],
    queryFn: () => campaignApi.dashboard(id!).then((r) => r.data.data ?? r.data),
    enabled: !!id,
  })

  const c = campaign as Record<string, unknown> | undefined
  const d = dashboard as Record<string, number> | undefined

  const stats = [
    { label: 'Sent', value: d?.sent ?? c?.sent_count ?? 0, icon: Send, color: 'text-blue-600' },
    { label: 'Delivered', value: d?.delivered ?? c?.delivered_count ?? 0, icon: CheckCheck, color: 'text-green-600' },
    { label: 'Read', value: d?.read ?? c?.read_count ?? 0, icon: Eye, color: 'text-purple-600' },
    { label: 'Replied', value: d?.replied ?? c?.reply_count ?? 0, icon: MessageSquare, color: 'text-orange-600' },
    { label: 'Clicked', value: d?.clicked ?? c?.click_count ?? 0, icon: MousePointer, color: 'text-pink-600' },
  ]

  return (
    <div>
      <div className="mb-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/whatsapp-crm/campaigns')}>
          <ArrowLeft className="h-4 w-4" /> Back to Campaigns
        </Button>
      </div>
      <PageHeader
        title={String(c?.name ?? 'Campaign Dashboard')}
        subtitle={`${String(c?.campaign_type ?? 'broadcast')} · ${String(c?.status ?? '')}`}
      />

      <div className="grid gap-4 sm:grid-cols-5 mb-8">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="surface-card p-5 text-center">
            <Icon className={cn('h-5 w-5 mx-auto mb-2', color)} />
            <p className="text-2xl font-bold text-[var(--text-primary)]">{formatNumber(Number(value))}</p>
            <p className="text-xs text-[var(--text-muted)]">{label}</p>
          </div>
        ))}
      </div>

      <div className="surface-card p-6">
        <h3 className="mb-4 font-bold text-[var(--text-primary)]">Campaign Details</h3>
        <div className="grid gap-3 sm:grid-cols-2 text-sm">
          <div><span className="text-[var(--text-muted)]">Recipients:</span> <strong>{formatNumber(Number(c?.total_recipients ?? 0))}</strong></div>
          <div><span className="text-[var(--text-muted)]">Type:</span> <strong className="capitalize">{String(c?.campaign_type ?? 'broadcast')}</strong></div>
          <div><span className="text-[var(--text-muted)]">Failed:</span> <strong>{formatNumber(Number(c?.failed_count ?? 0))}</strong></div>
          <div><span className="text-[var(--text-muted)]">Status:</span> <strong className="capitalize">{String(c?.status ?? '')}</strong></div>
        </div>
      </div>
    </div>
  )
}
