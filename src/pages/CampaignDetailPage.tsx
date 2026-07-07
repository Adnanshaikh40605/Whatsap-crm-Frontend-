import { useMemo, useState } from 'react'
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft, Send, Eye, MousePointer, CheckCheck, XCircle, Users,
} from 'lucide-react'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { campaignApi } from '../lib/api'
import { PageHeader, Tabs, DataTable, StatusBadge } from '../components/ui/PageLayout'
import { Button } from '../components/ui/Button'
import { useToast } from '../components/common'
import { formatDate, formatNumber } from '../lib/utils'
import {
  CAMPAIGN_TABS, type CampaignTab, formatDuration, formatPercent, downloadBlob, statNumber,
} from '../lib/campaignAnalytics'
import { FilterBar, ReportActions, StatCard } from '../components/campaigns/analytics/shared'

type RecipientRow = { id: string } & Record<string, string | number | boolean | null | undefined>

export function CampaignDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = (searchParams.get('tab') as CampaignTab) || 'overview'
  const [search, setSearch] = useState('')
  const [preset, setPreset] = useState('')
  const [readFilter, setReadFilter] = useState('')

  const setTab = (next: string) => {
    setSearchParams({ tab: next })
    setSearch('')
    setPreset('')
    setReadFilter('')
  }

  const { data: campaign, isLoading: campaignLoading } = useQuery({
    queryKey: ['campaign', id],
    queryFn: () => campaignApi.get(id!).then((r) => r.data.data ?? r.data),
    enabled: !!id,
  })

  const { data: overview, isLoading: overviewLoading, refetch: refetchOverview } = useQuery({
    queryKey: ['campaign-overview', id],
    queryFn: () => campaignApi.analyticsOverview(id!).then((r) => r.data.data ?? r.data),
    enabled: !!id && tab === 'overview',
  })

  const { data: tabData, isLoading: tabLoading, refetch: refetchTab } = useQuery({
    queryKey: ['campaign-recipients', id, tab, search, preset, readFilter],
    queryFn: () => campaignApi.analyticsRecipients(id!, {
      tab,
      search,
      preset,
      read_filter: readFilter,
      page: 1,
      page_size: 50,
    }).then((r) => r.data.data ?? r.data),
    enabled: !!id && tab !== 'overview',
  })

  const c = campaign as Record<string, unknown> | undefined
  const summary = overview?.summary as Record<string, number> | undefined
  const meta = overview?.campaign as Record<string, string> | undefined
  const timelines = overview?.timelines as Record<string, { label: string; value: number }[]> | undefined
  const stats = tabData?.stats as Record<string, unknown> | undefined
  const rows = (tabData?.results as RecipientRow[]) ?? []

  const retryMutation = useMutation({
    mutationFn: (recipientId: string) => campaignApi.retryRecipient(id!, recipientId),
    onSuccess: () => {
      toast.success('Message resent')
      queryClient.invalidateQueries({ queryKey: ['campaign-recipients', id] })
      queryClient.invalidateQueries({ queryKey: ['campaign-overview', id] })
    },
    onError: () => toast.error('Retry failed'),
  })

  const handleExport = async (format: 'csv' | 'xlsx') => {
    try {
      const response = await campaignApi.exportReport(id!, { tab, format })
      const ext = format === 'xlsx' ? 'xlsx' : 'csv'
      downloadBlob(response.data, `Campaign_${tab}.${ext}`)
    } catch {
      toast.error('Export failed')
    }
  }

  const handleEmail = async () => {
    const email = window.prompt('Send report to email:')
    if (!email) return
    try {
      await campaignApi.emailReport(id!, { tab, email, format: 'xlsx' })
      toast.success(`Report prepared for ${email}`)
    } catch {
      toast.error('Could not prepare email report')
    }
  }

  const handleRefresh = () => {
    if (tab === 'overview') refetchOverview()
    else refetchTab()
    queryClient.invalidateQueries({ queryKey: ['campaign', id] })
  }

  const tabCounts = useMemo(() => ({
    overview: undefined,
    sent: Number(c?.sent_count ?? 0),
    delivered: Number(c?.delivered_count ?? 0),
    read: Number(c?.read_count ?? 0),
    clicked: Number(c?.click_count ?? 0),
    failed: Number(c?.failed_count ?? 0),
  }), [c])

  if (!id) return null

  return (
    <div className="space-y-4">
      <div>
        <Button variant="ghost" size="sm" onClick={() => navigate('/whatsapp-crm/campaigns')}>
          <ArrowLeft className="h-4 w-4" /> Back to Campaigns
        </Button>
      </div>

      <PageHeader
        title={String(c?.name ?? 'Campaign Analytics')}
        subtitle={`${String(c?.template_name || meta?.template_name || 'Template')} · ${String(c?.status ?? '')}`}
        badge={String(c?.status ?? '')}
        actions={
          <ReportActions
            tab={tab}
            onExport={handleExport}
            onEmail={handleEmail}
            onRefresh={handleRefresh}
            loading={campaignLoading || overviewLoading || tabLoading}
          />
        }
      />

      <Tabs
        tabs={CAMPAIGN_TABS.map((t) => ({ ...t, count: tabCounts[t.id] }))}
        active={tab}
        onChange={setTab}
      />

      {tab === 'overview' && (
        <OverviewPanel
          loading={overviewLoading}
          meta={meta}
          summary={summary}
          timelines={timelines}
          campaign={c}
        />
      )}

      {tab === 'sent' && (
        <MetricPanel
          stats={[
            { label: 'Total Sent', value: formatNumber(statNumber(stats?.total)) },
            { label: 'Sent %', value: formatPercent(statNumber(stats?.percent)) },
          ]}
          filters={<FilterBar search={search} onSearch={setSearch} preset={preset} onPreset={setPreset} />}
          table={
            <RecipientTable
              loading={tabLoading}
              columns={[
                { key: 'name', label: 'Name' },
                { key: 'phone', label: 'Mobile Number' },
                { key: 'sent_at', label: 'Sent Time', render: (r) => formatDate(String(r.sent_at || '')) },
                { key: 'status', label: 'Status', render: (r) => <StatusBadge status={String(r.status)} /> },
                { key: 'channel', label: 'Channel' },
                { key: 'conversation_id', label: 'Conversation', render: (r) => r.conversation_id
                  ? <Link to={`/whatsapp-crm/inbox?conversation=${r.conversation_id}`} className="text-brand-600 hover:underline">Open</Link>
                  : '—' },
              ]}
              rows={rows}
            />
          }
        />
      )}

      {tab === 'delivered' && (
        <MetricPanel
          stats={[
            { label: 'Delivered', value: formatNumber(statNumber(stats?.total)) },
            { label: 'Delivery Success', value: formatPercent(statNumber(stats?.delivery_success_percent)) },
            { label: 'Avg Delivery Time', value: formatDuration(statNumber(stats?.average_delivery_seconds)) },
            { label: 'Fastest', value: formatDuration(statNumber(stats?.fastest_delivery_seconds)) },
            { label: 'Slowest', value: formatDuration(statNumber(stats?.slowest_delivery_seconds)) },
          ]}
          filters={<FilterBar search={search} onSearch={setSearch} preset={preset} onPreset={setPreset} />}
          table={
            <RecipientTable
              loading={tabLoading}
              columns={[
                { key: 'name', label: 'Name' },
                { key: 'phone', label: 'Mobile' },
                { key: 'sent_at', label: 'Sent Time', render: (r) => formatDate(String(r.sent_at || '')) },
                { key: 'delivered_at', label: 'Delivered Time', render: (r) => formatDate(String(r.delivered_at || '')) },
                { key: 'delivery_delay_seconds', label: 'Delivery Delay', render: (r) => formatDuration(Number(r.delivery_delay_seconds)) },
                { key: 'conversation_id', label: 'Conversation ID', render: (r) => String(r.conversation_id || '—') },
              ]}
              rows={rows}
            />
          }
        />
      )}

      {tab === 'read' && (
        <MetricPanel
          stats={[
            { label: 'Read %', value: formatPercent(statNumber(stats?.read_percent)) },
            { label: 'Average Read Time', value: formatDuration(statNumber(stats?.average_read_seconds)) },
            { label: 'Fastest Read', value: formatDuration(statNumber(stats?.fastest_read_seconds)) },
            { label: 'Slowest Read', value: formatDuration(statNumber(stats?.slowest_read_seconds)) },
          ]}
          filters={(
            <FilterBar
              search={search}
              onSearch={setSearch}
              preset={preset}
              onPreset={setPreset}
              extra={(
                <select
                  value={readFilter}
                  onChange={(e) => setReadFilter(e.target.value)}
                  className="h-10 rounded-lg border px-3 text-sm"
                  style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}
                >
                  <option value="">Read</option>
                  <option value="not_read">Not Read</option>
                </select>
              )}
            />
          )}
          table={
            <RecipientTable
              loading={tabLoading}
              columns={[
                { key: 'name', label: 'Name' },
                { key: 'phone', label: 'Phone' },
                { key: 'sent_at', label: 'Sent Time', render: (r) => formatDate(String(r.sent_at || '')) },
                { key: 'delivered_at', label: 'Delivered Time', render: (r) => formatDate(String(r.delivered_at || '')) },
                { key: 'read_at', label: 'Read Time', render: (r) => formatDate(String(r.read_at || '')) },
                { key: 'time_to_read_seconds', label: 'Time Taken to Read', render: (r) => formatDuration(Number(r.time_to_read_seconds)) },
              ]}
              rows={rows}
            />
          }
        />
      )}

      {tab === 'clicked' && (
        <MetricPanel
          stats={[
            { label: 'Total Clicks', value: formatNumber(statNumber(stats?.total_clicks)) },
            { label: 'CTR %', value: formatPercent(statNumber(stats?.ctr_percent)) },
            { label: 'Unique Clicks', value: formatNumber(statNumber(stats?.unique_clicks)) },
            { label: 'Button Clicks', value: formatNumber(statNumber(stats?.button_clicks)) },
          ]}
          charts={(
            <div className="mb-4 grid gap-4 lg:grid-cols-2">
              <MiniChart title="Clicks by Hour" data={(stats?.clicks_by_hour as { label: string; value: number }[] | undefined) || []} />
              <MiniChart title="Clicks by Button" data={(stats?.clicks_by_button as { label: string; value: number }[] | undefined) || []} bar />
            </div>
          )}
          filters={<FilterBar search={search} onSearch={setSearch} preset={preset} onPreset={setPreset} />}
          table={
            <RecipientTable
              loading={tabLoading}
              columns={[
                { key: 'name', label: 'Name' },
                { key: 'phone', label: 'Phone' },
                { key: 'button_name', label: 'Button Name' },
                { key: 'button_url', label: 'Website URL', render: (r) => r.button_url
                  ? <a href={String(r.button_url)} target="_blank" rel="noreferrer" className="text-brand-600 hover:underline">{String(r.button_url)}</a>
                  : '—' },
                { key: 'clicked_at', label: 'Click Time', render: (r) => formatDate(String(r.clicked_at || '')) },
                { key: 'click_count', label: 'Click Count' },
              ]}
              rows={rows}
            />
          }
        />
      )}

      {tab === 'failed' && (
        <MetricPanel
          stats={[
            { label: 'Failed %', value: formatPercent(statNumber(stats?.failed_percent)) },
            { label: 'Total Failed', value: formatNumber(statNumber(stats?.total_failed)) },
            { label: 'Retry Available', value: formatNumber(statNumber(stats?.retry_available)) },
            { label: 'Permanent Failure', value: formatNumber(statNumber(stats?.permanent_failure)) },
          ]}
          filters={<FilterBar search={search} onSearch={setSearch} preset={preset} onPreset={setPreset} />}
          table={
            <RecipientTable
              loading={tabLoading}
              columns={[
                { key: 'name', label: 'Customer' },
                { key: 'phone', label: 'Phone' },
                { key: 'failed_at', label: 'Failure Time', render: (r) => formatDate(String(r.failed_at || '')) },
                { key: 'failure_code', label: 'Failure Code' },
                { key: 'failure_reason', label: 'Failure Reason' },
              ]}
              rows={rows}
              actions={(row) => row.can_retry ? (
                <Button
                  size="sm"
                  loading={retryMutation.isPending}
                  onClick={() => retryMutation.mutate(String(row.id))}
                >
                  Retry
                </Button>
              ) : (
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Cannot retry</span>
              )}
            />
          }
        />
      )}
    </div>
  )
}

function OverviewPanel({
  loading,
  meta,
  summary,
  timelines,
  campaign,
}: {
  loading: boolean
  meta?: Record<string, string>
  summary?: Record<string, number>
  timelines?: Record<string, { label: string; value: number }[]>
  campaign?: Record<string, unknown>
}) {
  if (loading) {
    return <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading campaign overview…</p>
  }

  const cards = [
    { label: 'Audience', value: summary?.audience ?? 0, icon: Users },
    { label: 'Sent', value: summary?.sent ?? 0, icon: Send },
    { label: 'Delivered', value: summary?.delivered ?? 0, icon: CheckCheck },
    { label: 'Read', value: summary?.read ?? 0, icon: Eye },
    { label: 'Clicked', value: summary?.clicked ?? 0, icon: MousePointer },
    { label: 'Failed', value: summary?.failed ?? 0, icon: XCircle },
  ]

  return (
    <div className="space-y-4">
      <div className="surface-card p-6">
        <h3 className="mb-4 font-bold" style={{ color: 'var(--text-primary)' }}>Campaign Summary</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
          <div><span style={{ color: 'var(--text-muted)' }}>Campaign Name</span><p className="font-semibold">{meta?.name || campaign?.name as string}</p></div>
          <div><span style={{ color: 'var(--text-muted)' }}>Template</span><p className="font-semibold">{meta?.template_name || '—'}</p></div>
          <div><span style={{ color: 'var(--text-muted)' }}>Campaign Type</span><p className="font-semibold capitalize">{meta?.campaign_type || String(campaign?.campaign_type)}</p></div>
          <div><span style={{ color: 'var(--text-muted)' }}>Template Category</span><p className="font-semibold capitalize">{meta?.template_category || '—'}</p></div>
          <div><span style={{ color: 'var(--text-muted)' }}>Created By</span><p className="font-semibold">{meta?.created_by || '—'}</p></div>
          <div><span style={{ color: 'var(--text-muted)' }}>Created Time</span><p className="font-semibold">{formatDate(meta?.created_at || String(campaign?.created_at || ''))}</p></div>
          <div><span style={{ color: 'var(--text-muted)' }}>Completed Time</span><p className="font-semibold">{meta?.completed_at ? formatDate(meta.completed_at) : '—'}</p></div>
          <div><span style={{ color: 'var(--text-muted)' }}>Duration</span><p className="font-semibold">{meta?.duration || '—'}</p></div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {cards.map(({ label, value, icon: Icon }) => (
          <div key={label} className="surface-card p-4 text-center">
            <Icon className="mx-auto mb-2 h-5 w-5 text-brand-600" />
            <p className="text-xl font-bold">{formatNumber(Number(value))}</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Success Rate" value={formatPercent(summary?.success_rate)} />
        <StatCard label="Delivery Rate" value={formatPercent(summary?.delivery_rate)} />
        <StatCard label="Read Rate" value={formatPercent(summary?.read_rate)} />
        <StatCard label="CTR" value={formatPercent(summary?.ctr)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <TimelineChart title="Sent Timeline" data={timelines?.sent || []} />
        <TimelineChart title="Delivered Timeline" data={timelines?.delivered || []} />
        <TimelineChart title="Read Timeline" data={timelines?.read || []} />
      </div>
    </div>
  )
}

function MetricPanel({
  stats,
  filters,
  table,
  charts,
}: {
  stats: { label: string; value: string | number }[]
  filters?: React.ReactNode
  table: React.ReactNode
  charts?: React.ReactNode
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
        {stats.map((s) => <StatCard key={s.label} label={s.label} value={s.value} />)}
      </div>
      {charts}
      {filters}
      {table}
    </div>
  )
}

function TimelineChart({ title, data }: { title: string; data: { label: string; value: number }[] }) {
  return (
    <div className="surface-card p-4">
      <h4 className="mb-3 text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{title}</h4>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="label" tick={{ fontSize: 10 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="#0064E0" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function MiniChart({
  title,
  data,
  bar,
}: {
  title: string
  data: { label: string; value: number }[]
  bar?: boolean
}) {
  return (
    <div className="surface-card p-4">
      <h4 className="mb-3 text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{title}</h4>
      <div className="h-44">
        {data.length === 0 ? (
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No click data yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {bar ? (
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#0064E0" radius={[6, 6, 0, 0]} />
              </BarChart>
            ) : (
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#0064E0" strokeWidth={2} />
              </LineChart>
            )}
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}

function RecipientTable({
  columns,
  rows,
  loading,
  actions,
}: {
  columns: { key: string; label: string; render?: (row: RecipientRow) => React.ReactNode }[]
  rows: RecipientRow[]
  loading?: boolean
  actions?: (row: RecipientRow) => React.ReactNode
}) {
  return (
    <DataTable
      columns={columns}
      data={rows as { id: string }[]}
      loading={loading}
      actions={actions}
    />
  )
}
