import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Upload, Users, Plus, UserPlus } from 'lucide-react'
import { crmApi } from '../lib/api'
import { PageHeader, DataTable } from '../components/ui/PageLayout'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { useToast } from '../components/common'

interface ContactGroup {
  id: string
  name: string
  category: string
  description: string
  contact_count: number
}

interface Contact {
  id: string
  full_name: string
  first_name: string
  last_name: string
  phone: string
  email: string
  company: string
  source: string
  created_at: string
}

export function ContactsPage() {
  const queryClient = useQueryClient()
  const toast = useToast()
  const [search, setSearch] = useState('')
  const [groupName, setGroupName] = useState('')
  const [groupCategory, setGroupCategory] = useState('')
  const [selectedGroup, setSelectedGroup] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [contactForm, setContactForm] = useState({
    name: '',
    phone: '',
    email: '',
    company: '',
  })

  const { data: groupsData, isLoading: groupsLoading } = useQuery({
    queryKey: ['contact-groups'],
    queryFn: () => crmApi.groups().then((r) => r.data.results ?? r.data.data ?? r.data),
  })
  const { data: contactsData, isLoading: contactsLoading } = useQuery({
    queryKey: ['contacts', selectedGroup],
    queryFn: () => crmApi.contacts(selectedGroup ? { group: selectedGroup } : undefined).then((r) => r.data.results ?? r.data.data ?? r.data),
  })

  const groups = (groupsData as ContactGroup[]) ?? []
  const contacts = useMemo(() => ((contactsData as Contact[]) ?? []).filter((contact) => {
    const haystack = `${contact.full_name} ${contact.phone} ${contact.email} ${contact.company}`.toLowerCase()
    return !search || haystack.includes(search.toLowerCase())
  }), [contactsData, search])

  const createGroup = useMutation({
    mutationFn: () => crmApi.createGroup({ name: groupName, category: groupCategory }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-groups'] })
      setGroupName('')
      setGroupCategory('')
    },
  })

  const importContacts = useMutation({
    mutationFn: () => {
      const data = new FormData()
      if (file) data.append('file', file)
      if (selectedGroup) data.append('group_id', selectedGroup)
      return crmApi.importContacts(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
      queryClient.invalidateQueries({ queryKey: ['contact-groups'] })
      setFile(null)
      toast.success('Contacts imported')
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message || 'Import failed')
    },
  })

  const createContact = useMutation({
    mutationFn: () => {
      const trimmedName = contactForm.name.trim()
      const [firstName, ...rest] = trimmedName.split(/\s+/)
      const payload: Record<string, unknown> = {
        phone: contactForm.phone.trim(),
        source: 'manual',
      }
      if (firstName) payload.first_name = firstName
      if (rest.length) payload.last_name = rest.join(' ')
      if (contactForm.email.trim()) payload.email = contactForm.email.trim()
      if (contactForm.company.trim()) payload.company = contactForm.company.trim()
      if (selectedGroup) payload.group_ids = [selectedGroup]
      return crmApi.createContact(payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
      queryClient.invalidateQueries({ queryKey: ['contact-groups'] })
      setContactForm({ name: '', phone: '', email: '', company: '' })
      toast.success('Contact added')
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message || 'Failed to add contact')
    },
  })

  const submitContact = (event: React.FormEvent) => {
    event.preventDefault()
    if (!contactForm.phone.trim()) {
      toast.error('Phone number is required')
      return
    }
    createContact.mutate()
  }

  return (
    <div>
      <PageHeader
        title="Contacts"
        subtitle="Add contacts one by one, import in bulk, create groups, and choose campaign audiences"
      />

      <div className="mb-4 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <div className="surface-card p-4">
          <div className="mb-3 flex items-center gap-2">
            <Users className="h-4 w-4 text-brand-600" />
            <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Contact groups</h3>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <input
              value={groupName}
              onChange={(event) => setGroupName(event.target.value)}
              placeholder="Group name"
              className="h-11 rounded-lg border px-3 py-2 text-sm focus:border-[#1876f2] focus:outline-none"
              style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
            />
            <input
              value={groupCategory}
              onChange={(event) => setGroupCategory(event.target.value)}
              placeholder="Category"
              className="h-11 rounded-lg border px-3 py-2 text-sm focus:border-[#1876f2] focus:outline-none"
              style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
            />
          </div>
          <Button className="mt-3" onClick={() => groupName && createGroup.mutate()} loading={createGroup.isPending}>
            <Plus className="h-4 w-4" /> Add group
          </Button>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedGroup('')}
              className="rounded-[100px] border px-4 py-2 text-xs font-bold"
              style={{ borderColor: !selectedGroup ? 'var(--text-primary)' : 'var(--border)', background: !selectedGroup ? 'var(--text-primary)' : 'var(--bg-card)', color: !selectedGroup ? 'var(--bg-card)' : 'var(--text-primary)' }}
            >
              All contacts
            </button>
            {groups.map((group) => (
              <button
                key={group.id}
                onClick={() => setSelectedGroup(group.id)}
                className="rounded-[100px] border px-4 py-2 text-xs font-bold"
                style={{ borderColor: selectedGroup === group.id ? 'var(--text-primary)' : 'var(--border)', background: selectedGroup === group.id ? 'var(--text-primary)' : 'var(--bg-card)', color: selectedGroup === group.id ? 'var(--bg-card)' : 'var(--text-primary)' }}
              >
                {group.name} ({group.contact_count})
              </button>
            ))}
            {groupsLoading && <span className="text-xs text-[var(--text-muted)]">Loading groups...</span>}
          </div>
        </div>

        <div className="surface-card p-4">
          <div className="mb-3 flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-brand-600" />
            <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Add contact</h3>
          </div>
          <p className="mb-3 text-sm" style={{ color: 'var(--text-muted)' }}>
            Add a single phone number manually. Use 10-digit or full international format (e.g. 919372792693).
            {selectedGroup ? ' The contact will be added to the selected group.' : ''}
          </p>
          <form onSubmit={submitContact} className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Name"
              value={contactForm.name}
              onChange={(event) => setContactForm((form) => ({ ...form, name: event.target.value }))}
              placeholder="e.g. Adnan Shaikh"
            />
            <Input
              label="Phone"
              value={contactForm.phone}
              onChange={(event) => setContactForm((form) => ({ ...form, phone: event.target.value }))}
              placeholder="e.g. 9372792693"
              required
            />
            <Input
              label="Email"
              type="email"
              value={contactForm.email}
              onChange={(event) => setContactForm((form) => ({ ...form, email: event.target.value }))}
              placeholder="Optional"
            />
            <Input
              label="Company"
              value={contactForm.company}
              onChange={(event) => setContactForm((form) => ({ ...form, company: event.target.value }))}
              placeholder="Optional"
            />
            <div className="sm:col-span-2">
              <Button type="submit" loading={createContact.isPending} disabled={!contactForm.phone.trim()}>
                <Plus className="h-4 w-4" /> Add contact
              </Button>
            </div>
          </form>
        </div>

        <div className="surface-card p-4 lg:col-span-2 xl:col-span-1">
          <div className="mb-3 flex items-center gap-2">
            <Upload className="h-4 w-4 text-brand-600" />
            <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Bulk import</h3>
          </div>
          <p className="mb-3 text-sm" style={{ color: 'var(--text-muted)' }}>
            Upload CSV/XLSX with columns: name, phone, email, company.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="file"
              accept=".csv,.xlsx"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              className="h-11 flex-1 rounded-lg border px-3 py-2 text-sm focus:border-[#1876f2] focus:outline-none"
              style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
            />
            <Button onClick={() => file && importContacts.mutate()} loading={importContacts.isPending}>
              Import
            </Button>
          </div>
        </div>
      </div>

      <DataTable
        columns={[
          { key: 'full_name', label: 'Name', render: (row) => row.full_name || `${row.first_name} ${row.last_name}`.trim() || '-' },
          { key: 'phone', label: 'Phone' },
          { key: 'email', label: 'Email', render: (row) => row.email || '-' },
          { key: 'company', label: 'Company', render: (row) => row.company || '-' },
          { key: 'source', label: 'Source' },
        ]}
        data={contacts}
        search={search}
        onSearch={setSearch}
        loading={contactsLoading}
      />
    </div>
  )
}
