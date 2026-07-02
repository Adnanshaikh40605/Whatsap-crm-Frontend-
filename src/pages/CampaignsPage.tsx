import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Plus, BarChart2, Archive, Send } from 'lucide-react'
import { campaignApi } from '../lib/api'
import { PageHeader, DataTable, StatusBadge, Tabs } from '../components/ui/PageLayout'
import { Button } from '../components/ui/Button'
import { CampaignWizard } from '../components/campaigns/CampaignWizard'
import { LaunchAudienceModal } from '../components/campaigns/LaunchAudienceModal'
import { formatDate } from '../lib/utils'
import type { Campaign } from '../types/bot'

export function CampaignsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const [tab, setTab] = useState('active')
  const [search, setSearch] = useState('')
  const [wizardOpen, setWizardOpen] = useState(false)
  const [launchCampaign, setLaunchCampaign] = useState<Campaign | null>(null)

  useEffect(() => {
    if (searchParams.get('wizard') === '1') {
      setWizardOpen(true)
      setSearchParams({})
    }
  }, [searchParams, setSearchParams])

  const { data, isLoading } = useQuery({
    queryKey: ['campaigns', tab],
    queryFn: () => campaignApi.list({ archived: tab === 'archive' ? 'true' : 'false' }).then((r) => r.data.results ?? r.data),
  })

  const campaigns = ((data as Campaign[]) ?? []).filter(
    (c) => !search || c.name.toLowerCase().includes(search.toLowerCase()),
  )

  const archiveMutation = useMutation({
    mutationFn: (id: string) => campaignApi.archive(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['campaigns'] }),
  })

  return (
    <div>
      <PageHeader
        title="Campaigns"
        subtitle="Send approved WhatsApp templates to contact groups and track sent, delivered, read, and failed status"
        actions={
          <Button onClick={() => setWizardOpen(true)}><Plus className="h-4 w-4" /> New Campaign</Button>
        }
      />
      <CampaignWizard open={wizardOpen} onClose={() => setWizardOpen(false)} />
      <LaunchAudienceModal
        campaign={launchCampaign}
        open={Boolean(launchCampaign)}
        onClose={() => setLaunchCampaign(null)}
      />

      <Tabs
        tabs={[
          { id: 'active', label: 'Active' },
          { id: 'archive', label: 'Archive' },
        ]}
        active={tab}
        onChange={setTab}
      />

      <DataTable
        columns={[
          { key: 'name', label: 'Title', render: (r) => <span className="font-medium">{r.name}</span> },
          { key: 'template_display', label: 'Template', render: (r) => r.template_display || r.template_name || '—' },
          { key: 'group_name', label: 'Audience', render: (r) => {
            const ids = (r as Campaign & { audience_filter?: { contact_ids?: string[] } }).audience_filter?.contact_ids
            if (ids?.length === 1) return '1 contact'
            if (ids && ids.length > 1) return `${ids.length} contacts`
            return r.group_name || 'All contacts'
          } },
          { key: 'total_recipients', label: 'No. of Contacts' },
          { key: 'sent_count', label: 'Sent' },
          { key: 'delivered_count', label: 'Delivered' },
          { key: 'read_count', label: 'Read' },
          { key: 'failed_count', label: 'Failed' },
          { key: 'created_at', label: 'Created At', render: (r) => formatDate(r.created_at) },
          { key: 'scheduled_at', label: 'Schedule At', render: (r) => formatDate(r.scheduled_at) },
          { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
        ]}
        data={campaigns}
        search={search}
        onSearch={setSearch}
        loading={isLoading}
        actions={(row) => (
          <div className="flex flex-wrap gap-1">
            {['draft', 'scheduled'].includes(row.status) && (
              <Button
                size="sm"
                onClick={() => setLaunchCampaign(row)}
              >
                <Send className="h-3 w-3" /> Launch
              </Button>
            )}
            <Button size="sm" variant="dark" onClick={() => navigate(`/whatsapp-crm/campaigns/${row.id}`)}>
              <BarChart2 className="h-3 w-3" /> Status
            </Button>
            {tab === 'active' && (
              <Button
                size="sm"
                variant="danger"
                onClick={() => archiveMutation.mutate(row.id)}
                loading={archiveMutation.isPending}
              >
                <Archive className="h-3 w-3" /> Archive
              </Button>
            )}
          </div>
        )}
      />
    </div>
  )
}
