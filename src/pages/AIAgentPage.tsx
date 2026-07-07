import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  Sparkles, Car, Bug, Palmtree, MessageSquare, UserCheck, Calendar,
  Zap, Settings, Clock, Target, ArrowRight,
  BarChart3, Lightbulb,
} from 'lucide-react'
import { aiApi, inboxApi, analyticsApi } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Card } from '../components/ui/Card'
import { KPIWidget, MiniBarChart } from '../components/ui/KPIWidget'
import { SectionHeader } from '../components/ui/SectionHeader'
import { Badge } from '../components/ui/Badge'
import { cn, formatChatTime, formatNumber } from '../lib/utils'
import type { Conversation } from '../types'

const IconMap: Record<string, any> = {
  Car, Bug, Palmtree, MessageSquare
}

export function AIAgentPage() {
  const { organization } = useAuth()
  const [activeAgent, setActiveAgent] = useState(organization?.industry || 'pest_control')
  const [message, setMessage] = useState('')
  const [chat, setChat] = useState<{ role: 'user' | 'ai'; text: string }[]>([])

  const { data: conversations } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => inboxApi.conversations().then((r) => r.data.results ?? r.data.data ?? r.data),
  })

  const { data: agentsData } = useQuery({
    queryKey: ['ai-agents'],
    queryFn: () => aiApi.agents().then(r => r.data.data ?? r.data)
  })

  const { data: insightsData } = useQuery({
    queryKey: ['ai-insights'],
    queryFn: () => aiApi.insights().then(r => r.data.data ?? r.data)
  })

  const { data: dashboardData } = useQuery({
    queryKey: ['analytics-dashboard'],
    queryFn: () => analyticsApi.dashboard().then((r) => r.data.data ?? r.data),
  })

  const agentsList = (agentsData as any[]) ?? []
  const profile = agentsList.find((a) => a.industry === activeAgent) ?? agentsList[0] ?? {
    name: 'AI Agent', icon: 'MessageSquare', color: '#3b82f6', leads: 0, appointments: 0, conversion: 0, avgResponse: '0s'
  }

  const totalLeads = agentsList.reduce((s, a) => s + (a.leads || 0), 0)
  const totalAppointments = agentsList.reduce((s, a) => s + (a.appointments || 0), 0)
  const convList = (conversations as Conversation[]) ?? []
  const botConvs = convList.filter((c) => c.is_bot_active)

  const chatMutation = useMutation({
    mutationFn: (msg: string) => aiApi.chat(msg),
    onSuccess: (res) => {
      const reply = res.data?.data?.reply ?? res.data?.reply ?? 'How can I help?'
      setChat((prev) => [...prev, { role: 'ai', text: reply }])
    },
  })

  const send = () => {
    if (!message.trim()) return
    setChat((prev) => [...prev, { role: 'user', text: message }])
    chatMutation.mutate(message)
    setMessage('')
  }

  const recommendations = (insightsData?.conversion_suggestions as string[]) ?? []
  const weeklyData = (dashboardData?.lead_trend as any[])?.map(d => d.leads) ?? [0,0,0,0,0,0,0]

  return (
    <div className="w-full space-y-4 animate-fade-in">
      <SectionHeader
        title="AI Agents"
        subtitle="Analytics-driven AI workspace — monitor, test, and optimize your agents"
        badge="Hero Feature"
        actions={
          <Link to="/whatsapp-crm/settings/ai-bot">
            <Button variant="secondary" size="sm"><Settings className="h-3.5 w-3.5" /> Configure</Button>
          </Link>
        }
      />

      {/* Top KPIs */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KPIWidget label="Leads Handled" value={formatNumber(totalLeads)} change="+18% this month" trend="up"
          icon={<UserCheck className="h-4 w-4" />} />
        <KPIWidget label="Appointments Booked" value={formatNumber(totalAppointments)} change="+24 this week" trend="up"
          icon={<Calendar className="h-4 w-4" />} />
        <KPIWidget label="Avg Response Time" value="1.1s" change="Under 2s target" trend="up"
          icon={<Clock className="h-4 w-4" />} />
        <KPIWidget label="AI Conversion Rate" value={`${profile.conversion}%`} change="Industry benchmark: 25%" trend="up"
          icon={<Target className="h-4 w-4" />} />
      </div>

      {/* Agent cards */}
      <div className="grid gap-3 md:grid-cols-3">
        {agentsList.map((agent) => {
          const Icon = IconMap[agent.icon] || MessageSquare
          const isActive = activeAgent === agent.industry
          const isCurrent = organization?.industry === agent.industry
          return (
            <button key={agent.id} onClick={() => setActiveAgent(agent.industry)}
              className={cn('surface-card p-4 text-left transition-all duration-200',
                isActive && 'ring-2 ring-brand-500/50 shadow-md')}
              style={{ borderColor: isActive ? agent.color : undefined }}>
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ background: `${agent.color}15`, color: agent.color }}>
                  <Icon className="h-5 w-5" />
                </div>
                <Badge variant={isCurrent ? 'success' : 'default'}>{isCurrent ? 'Active' : 'Available'}</Badge>
              </div>
              <h3 className="mt-3 text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{agent.name}</h3>
              <div className="mt-2 grid grid-cols-3 gap-2">
                <div>
                  <p className="text-lg font-bold" style={{ color: agent.color }}>{agent.leads.toLocaleString()}</p>
                  <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Leads</p>
                </div>
                <div>
                  <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{agent.appointments}</p>
                  <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Bookings</p>
                </div>
                <div>
                  <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{agent.conversion}%</p>
                  <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Conv.</p>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Main workspace */}
      <div className="grid gap-4 lg:grid-cols-12">
        {/* Analytics + Test */}
        <div className="space-y-4 lg:col-span-8">
          <Card title="Agent Analytics" subtitle={`${profile.name} — last 7 days`}
            action={<MiniBarChart data={weeklyData} className="h-8" />}>
            <div className="grid gap-3 sm:grid-cols-4">
              {[
                { label: 'Conversations', value: botConvs.length, icon: MessageSquare },
                { label: 'Qualified', value: Math.round((profile.leads || 0) * 0.35), icon: UserCheck },
                { label: 'Booked', value: profile.appointments || 0, icon: Calendar },
                { label: 'Handovers', value: Math.round(botConvs.length * 0.12), icon: Zap },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="rounded-xl p-3 text-center" style={{ background: 'var(--bg-subtle)' }}>
                  <Icon className="mx-auto h-4 w-4" style={{ color: 'var(--accent)' }} />
                  <p className="mt-1 text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{value}</p>
                  <p className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>{label}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 flex h-24 items-end gap-1">
              {weeklyData.map((v, i) => (
                <div key={i} className="flex-1 rounded-t-md bg-brand-600/20 transition-all hover:bg-brand-600/40"
                  style={{ height: `${(v / Math.max(...weeklyData)) * 100}%` }}>
                  <div className="h-full w-full rounded-t-md bg-brand-600" style={{ opacity: 0.3 + (v / 100) }} />
                </div>
              ))}
            </div>
          </Card>

          <Card title={`Test ${profile.name}`} subtitle="Simulate customer conversations"
            action={<Badge variant="success" dot>Live</Badge>}>
            <div className="flex h-64 flex-col">
              <div className="flex-1 space-y-2 overflow-y-auto rounded-xl p-3" style={{ background: 'var(--bg-subtle)' }}>
                {chat.length === 0 && (
                  <p className="py-8 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
                    Try: &quot;I need a driver from Mumbai airport&quot; or &quot;Book pest inspection&quot;
                  </p>
                )}
                {chat.map((msg, i) => (
                  <div key={i} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                    <div className={cn('max-w-[80%] rounded-xl px-3 py-2 text-sm',
                      msg.role === 'user' ? 'bg-brand-600 text-white' : 'border')}
                      style={msg.role === 'ai' ? { background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text-primary)' } : undefined}>
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex gap-2">
                <Input value={message} onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type a customer message..." onKeyDown={(e) => e.key === 'Enter' && send()} />
                <Button onClick={send} loading={chatMutation.isPending} size="sm">
                  <Sparkles className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Right panel */}
        <div className="space-y-4 lg:col-span-4">
          <Card title="AI Recommendations" action={<Lightbulb className="h-4 w-4 text-amber-500" />}>
            <div className="space-y-2">
              {recommendations.map((rec, i) => (
                <div key={i} className="flex gap-2 rounded-xl p-3 text-xs" style={{ background: 'var(--bg-subtle)' }}>
                  <ArrowRight className="mt-0.5 h-3 w-3 shrink-0 text-brand-600" />
                  <span style={{ color: 'var(--text-secondary)' }}>{rec}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Recent AI Conversations"
            action={<Link to="/whatsapp-crm/inbox" className="text-xs text-brand-600 hover:underline">View all</Link>}>
            {botConvs.length ? (
              <div className="space-y-2">
                {botConvs.slice(0, 4).map((conv) => (
                  <Link key={conv.id} to="/whatsapp-crm/inbox"
                    className="flex items-center gap-2 rounded-xl p-2 surface-interactive">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold"
                      style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}>
                      {conv.contact?.first_name?.[0] || '?'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {conv.contact?.full_name || conv.contact?.phone}
                      </p>
                      <p className="truncate text-[10px]" style={{ color: 'var(--text-muted)' }}>
                        {conv.last_message_preview}
                      </p>
                    </div>
                    <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                      {formatChatTime(conv.last_message_at)}
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="py-4 text-center text-xs" style={{ color: 'var(--text-muted)' }}>No AI conversations yet</p>
            )}
          </Card>

          <Card title="Capabilities">
            <div className="space-y-2">
              {[
                { icon: MessageSquare, title: 'Answer FAQs', desc: '24/7 automated responses' },
                { icon: UserCheck, title: 'Qualify Leads', desc: 'Collect & score automatically' },
                { icon: Calendar, title: 'Book Appointments', desc: 'Schedule callbacks & visits' },
                { icon: Zap, title: 'Smart Handover', desc: 'Transfer to human when needed' },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex gap-2.5 rounded-xl p-2.5" style={{ background: 'var(--bg-subtle)' }}>
                  <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: 'var(--accent)' }} />
                  <div>
                    <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</p>
                    <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <Link to="/analytics" className="mt-3 flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline">
              Full analytics <BarChart3 className="h-3 w-3" />
            </Link>
          </Card>
        </div>
      </div>
    </div>
  )
}
