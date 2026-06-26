import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Sparkles, Zap, Clock, Play } from 'lucide-react'
import { automationApi, aiApi } from '../lib/api'
import { PageHeader } from '../components/ui/PageLayout'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'



export function AutomationPage() {
  const queryClient = useQueryClient()
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiResult, setAiResult] = useState<Record<string, unknown> | null>(null)

  const { data: workflows } = useQuery({
    queryKey: ['workflows'],
    queryFn: () => automationApi.workflows().then((r) => r.data.results ?? r.data.data ?? r.data),
  })
  const { data: followUps } = useQuery({
    queryKey: ['follow-ups'],
    queryFn: () => automationApi.followUps().then((r) => r.data.results ?? r.data.data ?? r.data),
  })
  const { data: templateData } = useQuery({
    queryKey: ['automation-templates'],
    queryFn: () => automationApi.templates().then((r) => r.data.data ?? r.data),
  })

  const defaultFollowUp = templateData?.follow_ups?.[0]

  const createFollowUp = useMutation({
    mutationFn: () => {
      if (!defaultFollowUp) throw new Error('Templates not loaded')
      return automationApi.createFollowUp(defaultFollowUp)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['follow-ups'] }),
  })

  const aiWorkflow = useMutation({
    mutationFn: (prompt: string) => aiApi.generateWorkflow(prompt),
    onSuccess: (res) => setAiResult(res.data?.data ?? res.data),
  })

  const wfList = (workflows as { id: string; name: string; trigger: string; run_count: number; is_active: boolean }[]) ?? []
  const fuList = (followUps as { id: string; name: string; steps: unknown[]; is_active: boolean }[]) ?? []

  return (
    <div>
      <PageHeader title="Automation Engine" subtitle="Workflows, follow-up sequences, and AI-generated automations" />

      <div className="mb-6 rounded-xl border border-purple-200 bg-purple-50 p-5">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-5 w-5 text-purple-600" />
          <h3 className="font-semibold text-purple-900">AI Workflow Generator</h3>
        </div>
        <p className="text-sm text-purple-700 mb-3">Describe automation in plain English — AI builds it for you</p>
        <Input value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)}
          placeholder='e.g. "Follow up every day for 7 days if customer does not reply"' />
        <Button className="mt-3" loading={aiWorkflow.isPending} onClick={() => aiWorkflow.mutate(aiPrompt)} disabled={!aiPrompt}>
          <Sparkles className="h-4 w-4" /> Generate Workflow
        </Button>
        {aiResult && (
          <div className="mt-4 rounded-lg bg-white p-4 border border-purple-100">
            <p className="font-semibold text-green-700">✓ {String(aiResult.name)}</p>
            <p className="text-sm text-slate-600 mt-1">Type: {String(aiResult.type)} | Trigger: {String(aiResult.trigger || 'auto')}</p>
            {(aiResult.saved as { id: string })?.id && <p className="text-xs text-green-600 mt-1">Saved to your account</p>}
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-brand-600" />
              <h3 className="font-semibold text-slate-800">Workflows</h3>
            </div>
          </div>
          <p className="text-xs text-slate-500 mb-3">Triggers: New Lead, New Message, Tag Added, Campaign Clicked, No Reply</p>
          {wfList.length === 0 ? (
            <p className="text-sm text-slate-400">No workflows yet. Use AI generator above.</p>
          ) : wfList.map((wf) => (
            <div key={wf.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 mb-2">
              <div>
                <p className="text-sm font-medium text-slate-800">{wf.name}</p>
                <p className="text-xs text-slate-500 capitalize">{wf.trigger.replace('_', ' ')} · {wf.run_count} runs</p>
              </div>
              <span className={wf.is_active ? 'text-green-600 text-xs' : 'text-slate-400 text-xs'}>
                {wf.is_active ? 'Active' : 'Paused'}
              </span>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-600" />
              <h3 className="font-semibold text-slate-800">Follow-Up Sequences</h3>
            </div>
            <Button size="sm" onClick={() => createFollowUp.mutate()} loading={createFollowUp.isPending} disabled={!defaultFollowUp}>
              <Plus className="h-3 w-3" /> Add 5-Day Sequence
            </Button>
          </div>
          <p className="text-xs text-slate-500 mb-3">Auto-stop when customer replies</p>
          {fuList.length === 0 ? (
            <p className="text-sm text-slate-400">No sequences yet. Click Add to create default 5-day follow-up.</p>
          ) : fuList.map((fu) => (
            <div key={fu.id} className="rounded-lg bg-slate-50 px-3 py-2 mb-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-800">{fu.name}</p>
                <span className="flex items-center gap-1 text-xs text-slate-500">
                  <Play className="h-3 w-3" /> {(fu.steps as unknown[])?.length ?? 0} steps
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
