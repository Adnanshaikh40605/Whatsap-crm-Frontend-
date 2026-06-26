import { useState } from 'react'
import { Sparkles, Send, Copy } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { onboardingApi } from '../../lib/api'
import { Button } from '../ui/Button'

interface AICampaignResult {
  campaign_name: string
  message_content: string
  template: { name: string; category: string; body: string }
  schedule_suggestion: string
  follow_up_sequence: { day: number; message: string }[]
  cta_buttons: string[]
}

export function AICampaignModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [prompt, setPrompt] = useState('')
  const [result, setResult] = useState<AICampaignResult | null>(null)

  const mutation = useMutation({
    mutationFn: (p: string) => onboardingApi.aiCampaign(p),
    onSuccess: (res: { data: { data?: AICampaignResult } & AICampaignResult }) => setResult(res.data.data ?? res.data as AICampaignResult),
  })

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-600" />
          <h2 className="text-lg font-bold text-slate-800">AI Campaign Builder</h2>
        </div>
        <p className="mt-1 text-sm text-slate-500">Describe your campaign in plain English</p>

        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder='e.g. "Create monsoon pest control offer campaign for Mumbai customers"'
          className="mt-4 w-full rounded-lg border border-slate-200 px-3 py-3 text-sm focus:border-brand-500 focus:outline-none"
          rows={3}
        />

        <Button className="mt-3" loading={mutation.isPending} disabled={prompt.length < 5}
          onClick={() => mutation.mutate(prompt)}>
          <Sparkles className="h-4 w-4" /> Generate Campaign
        </Button>

        {result && (
          <div className="mt-4 space-y-3 rounded-xl border border-green-200 bg-green-50 p-4">
            <h3 className="font-semibold text-green-800">{result.campaign_name}</h3>
            <div className="rounded-lg bg-white p-3 text-sm text-slate-700">
              <p className="font-medium text-xs text-slate-400 mb-1">Message Preview</p>
              {result.message_content}
            </div>
            <p className="text-xs text-green-700"><strong>Schedule:</strong> {result.schedule_suggestion}</p>
            <div className="flex flex-wrap gap-1">
              {result.cta_buttons?.map((btn) => (
                <span key={btn} className="rounded-full bg-white px-2 py-0.5 text-xs border">{btn}</span>
              ))}
            </div>
            <div className="flex gap-2">
              <Button size="sm"><Send className="h-3 w-3" /> Create Campaign</Button>
              <Button size="sm" variant="secondary"><Copy className="h-3 w-3" /> Copy</Button>
            </div>
          </div>
        )}

        <div className="mt-4 flex justify-end">
          <Button variant="ghost" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  )
}
