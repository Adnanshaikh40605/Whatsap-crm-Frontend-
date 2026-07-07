import { useQuery } from '@tanstack/react-query'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell,
} from 'recharts'
import { Users, TrendingUp, MessageSquare, IndianRupee, Target, Megaphone } from 'lucide-react'
import { analyticsApi, aiApi } from '../lib/api'
import { PageHeader } from '../components/ui/PageLayout'
import { formatNumber } from '../lib/utils'

const COLORS = ['#16a34a', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899']

interface DashboardData {
  overview: {
    total_leads: number
    leads_this_month: number
    conversion_rate: number
    open_conversations: number
    messages_this_month: number
    revenue: number
    quotes_sent: number
    quotes_approved: number
  }
  campaigns: { total: number; sent: number; delivered: number; read: number; replies: number }
  pipeline: { stage: string; count: number; color: string }[]
  lead_trend: { date: string; leads: number }[]
}

export function AnalyticsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['analytics-dashboard'],
    queryFn: () => analyticsApi.dashboard().then((r) => r.data.data ?? r.data),
  })

  const { data: agents } = useQuery({
    queryKey: ['agent-performance'],
    queryFn: () => analyticsApi.agents().then((r) => r.data.data ?? r.data),
  })

  const { data: aiInsights } = useQuery({
    queryKey: ['ai-insights'],
    queryFn: () => aiApi.insights().then((r) => r.data.data ?? r.data),
  })

  const d = data as DashboardData | undefined
  const insights = aiInsights as Record<string, unknown> | undefined

  if (isLoading) return <div className="flex h-64 items-center justify-center text-slate-400">Loading analytics...</div>

  const stats = [
    { label: 'Total Leads', value: formatNumber(d?.overview.total_leads ?? 0), icon: Users, color: 'text-blue-600 bg-blue-50' },
    { label: 'Conversion Rate', value: `${d?.overview.conversion_rate ?? 0}%`, icon: Target, color: 'text-brand-600 bg-brand-50' },
    { label: 'Revenue', value: `₹${formatNumber(d?.overview.revenue ?? 0)}`, icon: IndianRupee, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Open Chats', value: formatNumber(d?.overview.open_conversations ?? 0), icon: MessageSquare, color: 'text-purple-600 bg-purple-50' },
    { label: 'Leads This Month', value: formatNumber(d?.overview.leads_this_month ?? 0), icon: TrendingUp, color: 'text-orange-600 bg-orange-50' },
    { label: 'Campaign Replies', value: formatNumber(d?.campaigns.replies ?? 0), icon: Megaphone, color: 'text-pink-600 bg-pink-50' },
  ]

  return (
    <div className="space-y-4">
      <PageHeader title="Analytics & AI Insights" subtitle="Growth metrics, campaign performance, and AI-powered business recommendations" />

      {insights && (
        <div className="rounded-[var(--radius-md)] border border-purple-200 bg-gradient-to-r from-purple-50 to-[var(--color-surface-muted)] p-5">
          <h3 className="font-semibold text-purple-900 mb-3">AI Business Insights</h3>
          <div className="grid gap-3 sm:grid-cols-4 mb-4">
            {[
              { label: 'Missed Leads', value: insights.missed_leads },
              { label: 'Hot Leads', value: insights.hot_leads },
              { label: 'Follow-Up Opportunities', value: insights.follow_up_opportunities },
              { label: 'Stale Leads', value: insights.stale_leads },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-lg bg-white/80 p-3 text-center">
                <p className="text-xl font-bold text-slate-800">{formatNumber(Number(value ?? 0))}</p>
                <p className="text-xs text-slate-500">{label}</p>
              </div>
            ))}
          </div>
          <div className="space-y-1">
            {(insights.conversion_suggestions as string[] ?? []).map((s, i) => (
              <p key={i} className="text-sm text-purple-800">→ {s}</p>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className={`inline-flex rounded-lg p-2 ${color}`}><Icon className="h-4 w-4" /></div>
            <p className="mt-3 text-2xl font-bold text-slate-800">{value}</p>
            <p className="text-xs text-slate-500">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 font-semibold text-slate-800">Lead Trend (7 Days)</h3>
          {(!d?.lead_trend || d.lead_trend.length === 0) ? (
            <div className="flex h-[250px] items-center justify-center rounded-lg bg-slate-50 text-sm text-slate-400">
              No lead trend data available yet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={d.lead_trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="leads" stroke="#16a34a" strokeWidth={2} dot={{ fill: '#16a34a' }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 font-semibold text-slate-800">Pipeline Distribution</h3>
          {(!d?.pipeline || d.pipeline.length === 0) ? (
            <div className="flex h-[250px] items-center justify-center rounded-lg bg-slate-50 text-sm text-slate-400">
              No pipeline data available yet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={d.pipeline}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="stage" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#16a34a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 font-semibold text-slate-800">Campaign Performance</h3>
          {(!d?.campaigns || (d.campaigns.sent === 0 && d.campaigns.delivered === 0 && d.campaigns.read === 0 && d.campaigns.replies === 0)) ? (
            <div className="flex h-[250px] items-center justify-center rounded-lg bg-slate-50 text-sm text-slate-400">
              No campaign data available yet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Sent', value: d.campaigns.sent ?? 0 },
                    { name: 'Delivered', value: d.campaigns.delivered ?? 0 },
                    { name: 'Read', value: d.campaigns.read ?? 0 },
                    { name: 'Replies', value: d.campaigns.replies ?? 0 },
                  ]}
                  cx="50%" cy="50%" outerRadius={80} dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {COLORS.map((c, i) => <Cell key={i} fill={c} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 font-semibold text-slate-800">Agent Performance</h3>
          <div className="space-y-3">
            {(!agents || (agents as any[]).length === 0) ? (
              <div className="flex h-32 items-center justify-center rounded-lg bg-slate-50 text-sm text-slate-400">
                No agent data yet.
              </div>
            ) : (
              (agents as { name: string; role: string; leads: number; conversations: number }[]).map((agent) => (
                <div key={agent.name} className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
                  <div>
                    <p className="font-medium text-slate-800">{agent.name}</p>
                    <p className="text-xs capitalize text-slate-500">{agent.role}</p>
                  </div>
                  <div className="text-right text-sm">
                    <p className="text-slate-600">{agent.leads} leads</p>
                    <p className="text-slate-500">{agent.conversations} chats</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
