import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FileSpreadsheet, Send, Upload, User, Users } from 'lucide-react'
import { campaignApi, crmApi } from '../../lib/api'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { AppModal } from '../ui/AppModal'
import { FeedbackMessage } from '../common/FeedbackMessage'
import type { Campaign } from '../../types/bot'

type AudienceMode = 'existing' | 'single' | 'manual' | 'upload'

interface Props {
  campaign: Campaign | null
  open: boolean
  onClose: () => void
}

type ApiEnvelope<T> = { data?: T; results?: T }
type Group = { id: string; name: string; contact_count: number }
type ContactRow = { id: string; first_name?: string; last_name?: string; phone: string }

const unwrap = <T,>(value: ApiEnvelope<T> | T): T => {
  if (value && typeof value === 'object' && 'data' in value) return (value as ApiEnvelope<T>).data as T
  if (value && typeof value === 'object' && 'results' in value) return (value as ApiEnvelope<T>).results as T
  return value as T
}

const normalizePhone = (value: string) => {
  const digits = value.replace(/\D/g, '')
  if (digits.length === 10) return `91${digits}`
  if (digits.startsWith('00')) return digits.slice(2)
  return digits
}

const extractPhones = (text: string) => Array.from(new Set(
  text
    .split(/[\s,;]+/)
    .map(normalizePhone)
    .filter((phone) => phone.length >= 10),
))

export function LaunchAudienceModal({ campaign, open, onClose }: Props) {
  const queryClient = useQueryClient()
  const [mode, setMode] = useState<AudienceMode>('existing')
  const [selectedGroup, setSelectedGroup] = useState('')
  const [selectedContact, setSelectedContact] = useState('')
  const [manualNumbers, setManualNumbers] = useState('')
  const [groupName, setGroupName] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState('')

  const { data: groups } = useQuery({
    queryKey: ['contact-groups'],
    queryFn: () => crmApi.groups().then((r) => unwrap<Group[]>(r.data)),
    enabled: open,
    refetchOnMount: 'always',
  })
  const { data: contacts } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => crmApi.contacts().then((r) => unwrap<ContactRow[]>(r.data)),
    enabled: open,
    refetchOnMount: 'always',
  })

  const groupList = (groups as Group[]) ?? []
  const contactList = (contacts as ContactRow[]) ?? []
  const phones = useMemo(() => extractPhones(manualNumbers), [manualNumbers])

  const defaultGroupName = () => `${campaign?.name || 'Campaign'} audience ${new Date().toLocaleString()}`

  const launchMutation = useMutation({
    mutationFn: async () => {
      if (!campaign) return
      setError('')
      let groupId: string | null = selectedGroup || null

      if (mode === 'single') {
        if (!selectedContact) throw new Error('Select a saved contact first.')
        await campaignApi.update(campaign.id, {
          contact_group: null,
          audience_filter: { contact_ids: [selectedContact] },
        })
        await campaignApi.launch(campaign.id)
        return
      }

      if (mode === 'manual') {
        if (phones.length === 0) throw new Error('Add at least one valid phone number.')
        const groupResponse = await crmApi.createGroup({
          name: groupName.trim() || defaultGroupName(),
          category: 'campaign',
        })
        const group = unwrap<Group>(groupResponse.data)
        groupId = group.id

        await Promise.all(phones.map((phone, index) => crmApi.createContact({
          first_name: `Campaign Contact ${index + 1}`,
          phone,
          source: 'campaign',
          group_ids: [groupId],
        })))
      }

      if (mode === 'upload') {
        if (!file) throw new Error('Upload a CSV or Excel file first.')
        const groupResponse = await crmApi.createGroup({
          name: groupName.trim() || defaultGroupName(),
          category: 'campaign',
        })
        const group = unwrap<Group>(groupResponse.data)
        groupId = group.id

        const payload = new FormData()
        payload.append('file', file)
        payload.append('group_id', groupId)
        await crmApi.importContacts(payload)
      }

      await campaignApi.update(campaign.id, {
        contact_group: groupId,
        audience_filter: {},
      })
      await campaignApi.launch(campaign.id)
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['campaigns'] }),
        queryClient.invalidateQueries({ queryKey: ['contact-groups'] }),
        queryClient.invalidateQueries({ queryKey: ['contacts'] }),
      ])
      onClose()
      setMode('existing')
      setSelectedGroup('')
      setSelectedContact('')
      setManualNumbers('')
      setGroupName('')
      setFile(null)
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Campaign launch failed. Please check the audience and try again.')
    },
  })

  if (!open || !campaign) return null

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title="Launch campaign"
      subtitle={<>Choose who will receive <strong>{campaign.name}</strong> before sending.</>}
      footer={(
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={() => launchMutation.mutate()} loading={launchMutation.isPending}>
            <Send className="h-4 w-4" /> Launch now
          </Button>
        </>
      )}
    >
          <div className="grid gap-3 md:grid-cols-4">
            {[
              { id: 'existing', label: 'Saved group', icon: Users, note: 'All contacts or a group' },
              { id: 'single', label: 'One contact', icon: User, note: 'Pick a saved number' },
              { id: 'manual', label: 'Manual numbers', icon: Send, note: 'Paste phone numbers' },
              { id: 'upload', label: 'Excel / CSV', icon: FileSpreadsheet, note: 'Import a file first' },
            ].map((option) => {
              const Icon = option.icon
              const active = mode === option.id
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setMode(option.id as AudienceMode)}
                  className={`rounded-2xl border px-4 py-4 text-left transition ${active ? 'border-black bg-[#f1f4f7]' : 'bg-white hover:bg-[var(--hover)]'}`}
                  style={{ borderColor: active ? undefined : 'var(--border)' }}
                >
                  <Icon className="mb-3 h-5 w-5 text-brand-600" />
                  <div className="font-bold" style={{ color: 'var(--text-primary)' }}>{option.label}</div>
                  <div className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>{option.note}</div>
                </button>
              )
            })}
          </div>

          {mode === 'existing' && (
            <div className="space-y-3">
              <label className="block text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Recipient group</label>
              <select
                value={selectedGroup}
                onChange={(event) => setSelectedGroup(event.target.value)}
                className="h-12 w-full rounded-lg border bg-white px-3 text-base"
                style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}
              >
                <option value="">All active contacts</option>
                {groupList.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name} ({group.contact_count} contacts)
                  </option>
                ))}
              </select>
            </div>
          )}

          {mode === 'single' && (
            <div className="space-y-3">
              <label className="block text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Saved contact</label>
              {contactList.length === 0 ? (
                <FeedbackMessage variant="warning">
                  No contacts saved yet. Add a contact under Contacts first.
                </FeedbackMessage>
              ) : (
                <select
                  value={selectedContact}
                  onChange={(event) => setSelectedContact(event.target.value)}
                  className="h-12 w-full rounded-lg border bg-white px-3 text-base"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                >
                  <option value="">Select contact</option>
                  {contactList.map((contact) => {
                    const name = [contact.first_name, contact.last_name].filter(Boolean).join(' ').trim()
                    return (
                      <option key={contact.id} value={contact.id}>
                        {name ? `${name} (${contact.phone})` : contact.phone}
                      </option>
                    )
                  })}
                </select>
              )}
            </div>
          )}

          {mode === 'manual' && (
            <div className="space-y-4">
              <Input
                label="New group name"
                value={groupName}
                onChange={(event) => setGroupName(event.target.value)}
                placeholder={defaultGroupName()}
              />
              <div className="space-y-1.5">
                <label className="block text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Phone numbers</label>
                <textarea
                  value={manualNumbers}
                  onChange={(event) => setManualNumbers(event.target.value)}
                  placeholder="9372792693&#10;919876543210"
                  rows={6}
                  className="w-full rounded-lg border bg-white px-3 py-3 text-base outline-none focus:border-[#1876f2] focus:ring-2 focus:ring-[#1876f2]/10"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                />
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {phones.length} valid number{phones.length === 1 ? '' : 's'} found. Indian 10-digit numbers are saved with country code 91.
                </p>
              </div>
            </div>
          )}

          {mode === 'upload' && (
            <div className="space-y-4">
              <Input
                label="New group name"
                value={groupName}
                onChange={(event) => setGroupName(event.target.value)}
                placeholder={defaultGroupName()}
              />
              <label className="flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed bg-white p-6 text-center hover:bg-[var(--hover)]" style={{ borderColor: 'var(--border)' }}>
                <Upload className="mb-2 h-6 w-6 text-brand-600" />
                <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{file ? file.name : 'Upload CSV or Excel file'}</span>
                <span className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>Columns supported: phone, mobile, number, name, first_name, last_name, email, company</span>
                <input
                  type="file"
                  accept=".csv,.xlsx"
                  className="hidden"
                  onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                />
              </label>
            </div>
          )}

          {error ? (
            <FeedbackMessage variant="error">{error}</FeedbackMessage>
          ) : null}
    </AppModal>
  )
}
