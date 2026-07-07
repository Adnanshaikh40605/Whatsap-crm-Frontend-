import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, GitBranch } from 'lucide-react'
import { automationApi } from '../lib/api'
import { PageHeader, DataTable, StatusBadge } from '../components/ui/PageLayout'
import { Button } from '../components/ui/Button'
import { useDeleteConfirm } from '../hooks/useDeleteConfirm'
import type { BotFlow } from '../types/bot'

export function BotFlowsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['bot-flows'],
    queryFn: () => automationApi.botFlows().then((r) => r.data.results ?? r.data),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => automationApi.deleteBotFlow(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bot-flows'] }),
  })
  const { requestDelete, deleteDialog } = useDeleteConfirm()

  const createMutation = useMutation({
    mutationFn: () => automationApi.createBotFlow({
      title: 'New Bot Flow',
      start_trigger: 'hi',
      trigger_type: 'keyword',
      is_active: true,
      flow_data: { nodes: [], edges: [] },
    }),
    onSuccess: (res) => {
      const flow = res.data.data ?? res.data
      navigate(`/bot-flows/${flow.id}/builder`)
    },
  })

  const flows = ((data as BotFlow[]) ?? []).filter(
    (f) => !search || f.title.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="space-y-4">
      <PageHeader
        title="Bot Flows"
        actions={
          <Button loading={createMutation.isPending} onClick={() => createMutation.mutate()}>
            <Plus className="h-4 w-4" /> Add New Bot Flow
          </Button>
        }
      />

      <DataTable
        columns={[
          { key: 'title', label: 'Title', render: (r) => <span className="font-semibold text-slate-800">{r.title}</span> },
          { key: 'start_trigger', label: 'Start Trigger Subject', render: (r) => <code className="rounded bg-slate-100 px-2 py-0.5 text-brand-700">{r.start_trigger}</code> },
          { key: 'is_active', label: 'Status', render: (r) => <StatusBadge status={r.is_active ? 'active' : 'inactive'} /> },
        ]}
        data={flows}
        search={search}
        onSearch={setSearch}
        loading={isLoading}
        actions={(row) => (
          <div className="flex gap-1">
            <Button size="sm" variant="dark"><Pencil className="h-3 w-3" /></Button>
            <Button
              size="sm"
              variant="danger"
              onClick={() => requestDelete({
                itemName: row.title,
                itemType: 'bot flow',
                associatedDataMessage:
                  'Deleting this bot flow will permanently remove all associated replies and flow configuration.',
                onConfirm: () => deleteMutation.mutateAsync(row.id),
              })}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
            <Button size="sm" onClick={() => navigate(`/bot-flows/${row.id}/builder`)}>
              <GitBranch className="h-3 w-3" /> Flow Builder
            </Button>
          </div>
        )}
      />
      {deleteDialog}
    </div>
  )
}
