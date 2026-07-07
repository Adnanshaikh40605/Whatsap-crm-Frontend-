import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { X, ChevronRight, Check, User, Users } from 'lucide-react'
import { campaignApi, crmApi } from '../../lib/api'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { formatScheduleLabel, ScheduleDateTimeField } from '../ui/ScheduleDateTimeField'
import { FeedbackMessage } from '../common/FeedbackMessage'

const STEPS = ['Campaign Name', 'Audience', 'Template', 'Schedule', 'Review']

type AudienceType = 'all' | 'group' | 'single'

interface Props {
  open: boolean
  onClose: () => void
}

interface ContactRow {
  id: string
  first_name?: string
  last_name?: string
  phone: string
}

export function CampaignWizard({ open, onClose }: Props) {
  const queryClient = useQueryClient()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({
    name: '',
    audience_type: 'all' as AudienceType,
    contact_group: '',
    contact_id: '',
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
  const { data: contacts } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => crmApi.contacts().then((r) => r.data.results ?? r.data.data ?? r.data),
    enabled: open,
    refetchOnMount: 'always',
  })

  const createMutation = useMutation({
    mutationFn: () => {
      const audience_filter =
        form.audience_type === 'single' && form.contact_id
          ? { contact_ids: [form.contact_id] }
          : {}

      return campaignApi.create({
        name: form.name,
        template: form.template_id,
        contact_group: form.audience_type === 'group' ? form.contact_group || null : null,
        message_content: form.message_content,
        audience_filter,
        scheduled_at: form.scheduled_at || undefined,
        status: form.scheduled_at ? 'scheduled' : 'draft',
      })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['campaigns'] })
      onClose()
      setStep(0)
      setForm({
        name: '',
        audience_type: 'all',
        contact_group: '',
        contact_id: '',
        template_id: '',
        scheduled_at: '',
        message_content: '',
      })
    },
  })

  if (!open) return null

  const tplList = ((templates as { id: string; name: string; category: string; status: string }[]) ?? [])
    .filter((template) => template.status === 'approved')
  const groupList = (groups as { id: string; name: string; contact_count: number }[]) ?? []
  const contactList = (contacts as ContactRow[]) ?? []

  const contactLabel = (contact: ContactRow) => {
    const name = [contact.first_name, contact.last_name].filter(Boolean).join(' ').trim()
    return name ? `${name} · ${contact.phone}` : contact.phone
  }

  const audienceSummary = () => {
    if (form.audience_type === 'single') {
      const contact = contactList.find((c) => c.id === form.contact_id)
      return contact ? contactLabel(contact) : 'No contact selected'
    }
    if (form.audience_type === 'group') {
      return groupList.find((g) => g.id === form.contact_group)?.name || 'All contacts'
    }
    return 'All contacts'
  }

  const audienceValid =
    form.audience_type === 'all' ||
    (form.audience_type === 'group' && Boolean(form.contact_group)) ||
    (form.audience_type === 'single' && Boolean(form.contact_id))

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
            <div className="space-y-4">
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Who should receive this campaign?</p>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'all' as const, label: 'All contacts', icon: Users },
                  { id: 'group' as const, label: 'Group', icon: Users },
                  { id: 'single' as const, label: 'One number', icon: User },
                ].map((option) => {
                  const Icon = option.icon
                  const active = form.audience_type === option.id
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setForm({
                        ...form,
                        audience_type: option.id,
                        contact_group: option.id === 'group' ? form.contact_group : '',
                        contact_id: option.id === 'single' ? form.contact_id : '',
                      })}
                      className={`rounded-2xl border px-3 py-3 text-center text-xs font-bold ${
                        active ? 'border-[#0a1317] bg-[#f1f4f7]' : ''
                      }`}
                      style={{ borderColor: active ? undefined : 'var(--border)', color: 'var(--text-primary)' }}
                    >
                      <Icon className="mx-auto mb-1 h-4 w-4" />
                      {option.label}
                    </button>
                  )
                })}
              </div>

              {form.audience_type === 'all' && (
                <FeedbackMessage variant="info">
                  Sends to every active contact in your CRM ({contactList.length} contact{contactList.length === 1 ? '' : 's'}).
                </FeedbackMessage>
              )}

              {form.audience_type === 'group' && (
                <div className="space-y-2">
                  {groupList.length === 0 ? (
                    <FeedbackMessage variant="warning">
                      No groups yet. Create one under Contacts, or use &quot;One number&quot; to send to a saved contact.
                    </FeedbackMessage>
                  ) : null}
                  {groupList.map((group) => (
                    <button
                      key={group.id}
                      type="button"
                      onClick={() => setForm({ ...form, contact_group: group.id })}
                      className={`w-full rounded-2xl border px-4 py-3 text-left text-sm font-bold capitalize ${
                        form.contact_group === group.id ? 'border-[#0a1317] bg-[#f1f4f7]' : ''
                      }`}
                      style={{ borderColor: form.contact_group === group.id ? undefined : 'var(--border)', color: 'var(--text-primary)' }}
                    >
                      {group.name}
                      <span className="ml-2 text-xs normal-case" style={{ color: 'var(--text-muted)' }}>
                        {group.contact_count} contacts
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {form.audience_type === 'single' && (
                <div className="space-y-2">
                  {contactList.length === 0 ? (
                    <FeedbackMessage variant="warning">
                      No contacts saved yet. Add your number under Contacts first, then come back here.
                    </FeedbackMessage>
                  ) : (
                    contactList.map((contact) => (
                      <button
                        key={contact.id}
                        type="button"
                        onClick={() => setForm({ ...form, contact_id: contact.id })}
                        className={`w-full rounded-2xl border px-4 py-3 text-left text-sm ${
                          form.contact_id === contact.id ? 'border-[#0a1317] bg-[#f1f4f7]' : ''
                        }`}
                        style={{ borderColor: form.contact_id === contact.id ? undefined : 'var(--border)' }}
                      >
                        <span className="font-bold" style={{ color: 'var(--text-primary)' }}>
                          {[contact.first_name, contact.last_name].filter(Boolean).join(' ') || 'Contact'}
                        </span>
                        <span className="mt-0.5 block text-xs" style={{ color: 'var(--text-muted)' }}>{contact.phone}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
          {step === 2 && (
            <div className="space-y-2">
              <p className="text-sm font-medium mb-3" style={{ color: 'var(--text-primary)' }}>Choose Template</p>
              {tplList.length === 0 && (
                <FeedbackMessage variant="warning">
                  No approved template found. Create a template and wait for Meta approval before launching a campaign.
                </FeedbackMessage>
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
              <ScheduleDateTimeField
                label="Schedule (optional)"
                value={form.scheduled_at}
                onChange={(scheduled_at) => setForm({ ...form, scheduled_at })}
              />
              {form.scheduled_at ? (
                <button
                  type="button"
                  onClick={() => setForm({ ...form, scheduled_at: '' })}
                  className="text-xs font-semibold text-brand-600 hover:underline"
                >
                  Clear schedule — send immediately
                </button>
              ) : null}
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Leave empty to send immediately after review</p>
            </div>
          )}
          {step === 4 && (
            <div className="space-y-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
              <div className="rounded-2xl p-4" style={{ background: 'var(--hover)' }}>
                <p><strong style={{ color: 'var(--text-primary)' }}>Name:</strong> {form.name}</p>
                <p><strong style={{ color: 'var(--text-primary)' }}>Audience:</strong> {audienceSummary()}</p>
                <p><strong style={{ color: 'var(--text-primary)' }}>Template:</strong> {tplList.find((t) => t.id === form.template_id)?.name || 'None'}</p>
                <p><strong style={{ color: 'var(--text-primary)' }}>Schedule:</strong> {formatScheduleLabel(form.scheduled_at)}</p>
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
              disabled={
                (step === 0 && !form.name) ||
                (step === 1 && !audienceValid) ||
                (step === 2 && !form.template_id)
              }
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
