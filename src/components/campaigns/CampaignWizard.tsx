import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { X, ChevronRight, Check } from 'lucide-react'
import { campaignApi, crmApi } from '../../lib/api'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'

const STEPS = ['Campaign Name', 'Audience', 'Template', 'Schedule', 'Review']

interface Props {
  open: boolean
  onClose: () => void
}

export function CampaignWizard({ open, onClose }: Props) {
  const queryClient = useQueryClient()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({
    name: '',
    contact_group: '',
    template_id: '',
    scheduled_at: '',
    message_content: '',
  })

  const { data: templates } = useQuery({
    queryKey: ['templates'],
    queryFn: () => campaignApi.templates().then((r) => r.data.results ?? r.data.data ?? r.data),
    enabled: open,
    refetchOnMount: 'always',
  })
  const { data: groups } = useQuery({
    queryKey: ['contact-groups'],
    queryFn: () => crmApi.groups().then((r) => r.data.results ?? r.data.data ?? r.data),
    enabled: open,
    refetchOnMount: 'always',
  })

  const createMutation = useMutation({
    mutationFn: () => campaignApi.create({
      name: form.name,
      template: form.template_id,
      contact_group: form.contact_group || null,
      message_content: form.message_content,
      audience_filter: {},
      scheduled_at: form.scheduled_at || undefined,
      status: form.scheduled_at ? 'scheduled' : 'draft',
    }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['campaigns'] })
      onClose()
      setStep(0)
    },
  })

  if (!open) return null

  const tplList = ((templates as { id: string; name: string; category: string; status: string }[]) ?? [])
    .filter((template) => template.status === 'approved')
  const groupList = (groups as { id: string; name: string; contact_count: number }[]) ?? []

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-[24px] border shadow-2xl" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}>
        <div className="flex items-center justify-between border-b px-6 py-4" style={{ borderColor: 'var(--border)' }}>
          <h2 className="font-bold" style={{ color: 'var(--text-primary)' }}>Create Campaign</h2>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-[var(--hover)]"><X className="h-5 w-5" style={{ color: 'var(--text-muted)' }} /></button>
        </div>

        <div className="flex gap-1 px-6 py-4">
          {STEPS.map((s, i) => (
            <div key={s} className="flex flex-1 flex-col items-center gap-1">
              <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                i < step ? 'bg-brand-600 text-white' : i === step ? 'bg-[#0a1317] text-white ring-2 ring-[#0a1317]' : 'bg-[var(--hover)]'
              }`} style={i > step ? { color: 'var(--text-muted)' } : undefined}>
                {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </div>
              <span className="text-[9px] font-medium text-center hidden sm:block" style={{ color: i === step ? 'var(--text-primary)' : 'var(--text-muted)' }}>{s}</span>
            </div>
          ))}
        </div>

        <div className="px-6 py-4 min-h-[200px]">
          {step === 0 && (
            <Input label="Campaign Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Monsoon Pest Control Offer" />
          )}
          {step === 1 && (
            <div className="space-y-2">
              <p className="text-sm font-medium mb-3" style={{ color: 'var(--text-primary)' }}>Select Contact Group</p>
              <button onClick={() => setForm({ ...form, contact_group: '' })}
                className={`w-full rounded-2xl border px-4 py-3 text-left text-sm font-bold ${
                  form.contact_group === '' ? 'border-[#0a1317] bg-[#f1f4f7]' : ''}`}
                style={{ borderColor: form.contact_group === '' ? undefined : 'var(--border)', color: 'var(--text-primary)' }}>
                All contacts
              </button>
              {groupList.map((group) => (
                <button key={group.id} onClick={() => setForm({ ...form, contact_group: group.id })}
                  className={`w-full rounded-2xl border px-4 py-3 text-left text-sm font-bold capitalize ${
                    form.contact_group === group.id ? 'border-[#0a1317] bg-[#f1f4f7]' : ''}`}
                  style={{ borderColor: form.contact_group === group.id ? undefined : 'var(--border)', color: 'var(--text-primary)' }}>
                  {group.name}
                  <span className="ml-2 text-xs normal-case" style={{ color: 'var(--text-muted)' }}>
                    {group.contact_count} contacts
                  </span>
                </button>
              ))}
            </div>
          )}
          {step === 2 && (
            <div className="space-y-2">
              <p className="text-sm font-medium mb-3" style={{ color: 'var(--text-primary)' }}>Choose Template</p>
              {tplList.length === 0 && (
                <p className="rounded-2xl border border-[#f7b928] bg-[#fff5cc] px-4 py-3 text-xs font-bold text-[#0a1317]">
                  No approved template found. Create a template and wait for Meta approval before launching a campaign.
                </p>
              )}
              {tplList.map((t) => (
                <button key={t.id} onClick={() => setForm({ ...form, template_id: t.id })}
                  className={`w-full rounded-2xl border px-4 py-3 text-left text-sm ${
                    form.template_id === t.id ? 'border-[#0a1317] bg-[#f1f4f7]' : ''}`}
                  style={{ borderColor: form.template_id === t.id ? undefined : 'var(--border)' }}>
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{t.name}</span>
                  <span className="ml-2 text-xs capitalize" style={{ color: 'var(--text-muted)' }}>{t.category}</span>
                </button>
              ))}
            </div>
          )}
          {step === 3 && (
            <div className="space-y-4">
              <Input label="Schedule (optional)" type="datetime-local" value={form.scheduled_at}
                onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })} />
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Leave empty to send immediately after review</p>
            </div>
          )}
          {step === 4 && (
            <div className="space-y-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
              <div className="rounded-2xl p-4" style={{ background: 'var(--hover)' }}>
                <p><strong style={{ color: 'var(--text-primary)' }}>Name:</strong> {form.name}</p>
                <p><strong style={{ color: 'var(--text-primary)' }}>Group:</strong> {groupList.find((g) => g.id === form.contact_group)?.name || 'All contacts'}</p>
                <p><strong style={{ color: 'var(--text-primary)' }}>Template:</strong> {tplList.find((t) => t.id === form.template_id)?.name || 'None'}</p>
                <p><strong style={{ color: 'var(--text-primary)' }}>Schedule:</strong> {form.scheduled_at || 'Send now'}</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between border-t px-6 py-4" style={{ borderColor: 'var(--border)' }}>
          <Button variant="ghost" onClick={() => step > 0 ? setStep(step - 1) : onClose()}>
            {step === 0 ? 'Cancel' : 'Back'}
          </Button>
          {step < STEPS.length - 1 ? (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={(step === 0 && !form.name) || (step === 2 && !form.template_id)}
            >
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button loading={createMutation.isPending} onClick={() => createMutation.mutate()}>
              Send Campaign
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
