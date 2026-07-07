import { useState } from 'react'
import { Sparkles, Send, Copy } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { onboardingApi } from '../../lib/api'
import { Button } from '../ui/Button'
import { AppModal } from '../ui/AppModal'

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

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title="AI Campaign Builder"
      subtitle="Describe your campaign in plain English"
      size="lg"
      footer={(
        <Button variant="ghost" onClick={onClose}>Close</Button>
      )}
    >
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder='e.g. "Create monsoon pest control offer campaign for Mumbai customers"'
        className="w-full resize-y rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-default)] px-3 py-3 text-[var(--font-size-2xl)] text-[var(--color-text-primary)] outline-none transition-colors focus:border-[var(--color-focus-ring)] focus:ring-2 focus:ring-[var(--color-focus-ring)]/20"
        rows={3}
      />

      <Button className="w-full sm:w-auto" loading={mutation.isPending} disabled={prompt.length < 5}
        onClick={() => mutation.mutate(prompt)}>
        <Sparkles className="h-4 w-4" /> Generate Campaign
      </Button>

      {result && (
        <div className="space-y-3 rounded-[var(--radius-md)] border border-[var(--color-feedback-success)]/30 bg-[var(--color-feedback-success-muted)] p-4">
          <h3 className="text-[var(--font-size-3xl)] font-semibold text-[var(--color-text-primary)]">{result.campaign_name}</h3>
          <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-default)] p-3 text-[var(--font-size-2xl)] text-[var(--color-text-secondary)]">
            <p className="mb-1 text-[var(--font-size-md)] font-semibold text-[var(--color-text-muted)]">Message Preview</p>
            {result.message_content}
          </div>
          <p className="text-[var(--font-size-md)] text-[var(--color-text-secondary)]">
            <strong>Schedule:</strong> {result.schedule_suggestion}
          </p>
          <div className="flex flex-wrap gap-1">
            {result.cta_buttons?.map((btn) => (
              <span key={btn} className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-default)] px-2 py-0.5 text-[var(--font-size-md)]">
                {btn}
              </span>
            ))}
          </div>
          <div className="flex gap-2 pt-1">
            <Button size="sm"><Send className="h-3.5 w-3.5" /> Use Template</Button>
            <Button size="sm" variant="ghost"><Copy className="h-3.5 w-3.5" /> Copy</Button>
          </div>
        </div>
      )}
    </AppModal>
  )
}
