import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { crmApi } from '../lib/api'
import { Button } from '../components/ui/Button'
import type { Lead } from '../types'

interface Stage {
  id: string
  name: string
  color: string
  lead_count?: number
}

export function CrmPage() {
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  const filterHot = searchParams.get('filter') === 'hot'
  const [draggedLead, setDraggedLead] = useState<string | null>(null)

  const { data: stages } = useQuery({
    queryKey: ['stages'],
    queryFn: () => crmApi.stages().then((r) => r.data.results ?? r.data.data ?? r.data),
  })
  const { data: leads } = useQuery({
    queryKey: ['leads'],
    queryFn: () => crmApi.leads().then((r) => r.data.results ?? r.data.data ?? r.data),
  })

  const moveMutation = useMutation({
    mutationFn: ({ leadId, stageId }: { leadId: string; stageId: string }) =>
      crmApi.moveStage(leadId, stageId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['leads'] }),
  })

  const stageList = (stages as Stage[]) ?? []
  let leadList = (leads as Lead[]) ?? []
  if (filterHot) leadList = leadList.filter((l) => l.score >= 50)

  const leadsByStage = (stageId: string) =>
    leadList.filter((l) => l.stage === stageId)

  const onDrop = (stageId: string) => {
    if (draggedLead) {
      moveMutation.mutate({ leadId: draggedLead, stageId })
      setDraggedLead(null)
    }
  }

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>CRM Pipeline</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
            Drag & drop leads across stages {filterHot && '· Showing hot leads only'}
          </p>
        </div>
        <Button><Plus className="h-4 w-4" /> Add Lead</Button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {stageList.map((stage) => (
          <div
            key={stage.id}
            className="flex w-64 shrink-0 flex-col rounded-xl border"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => onDrop(stage.id)}
          >
            <div className="flex items-center gap-2 border-b px-4 py-3" style={{ borderColor: 'var(--border)' }}>
              <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: stage.color }} />
              <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{stage.name}</h3>
              <span className="ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold"
                style={{ background: 'var(--hover)', color: 'var(--text-muted)' }}>
                {leadsByStage(stage.id).length}
              </span>
            </div>
            <div className="flex-1 space-y-2 p-3 min-h-[200px]">
              {leadsByStage(stage.id).map((lead) => (
                <div
                  key={lead.id}
                  draggable
                  onDragStart={() => setDraggedLead(lead.id)}
                  className="cursor-grab rounded-xl border p-3 shadow-sm transition-shadow hover:shadow-md active:cursor-grabbing"
                  style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}
                >
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{lead.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{lead.contact_name}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[10px] font-medium capitalize rounded-lg px-2 py-0.5"
                      style={{ background: 'var(--hover)', color: 'var(--text-secondary)' }}>
                      {lead.priority}
                    </span>
                    <span className="text-xs font-bold text-brand-600">Score {lead.score}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        {stageList.length === 0 && (
          <p className="text-sm p-8" style={{ color: 'var(--text-muted)' }}>No pipeline stages configured.</p>
        )}
      </div>
    </div>
  )
}
