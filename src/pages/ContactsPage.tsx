import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Upload, Users, Plus } from 'lucide-react'
import { crmApi } from '../lib/api'
import { PageHeader, DataTable } from '../components/ui/PageLayout'
import { Button } from '../components/ui/Button'

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
  const [search, setSearch] = useState('')
  const [groupName, setGroupName] = useState('')
  const [groupCategory, setGroupCategory] = useState('')
  const [selectedGroup, setSelectedGroup] = useState('')
  const [file, setFile] = useState<File | null>(null)

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
    },
  })

  return (
    <div>
      <PageHeader
        title="Contacts"
        subtitle="Import contacts, create groups, and choose campaign audiences"
      />

      <div className="mb-4 grid gap-4 lg:grid-cols-[1fr_1.2fr]">
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
