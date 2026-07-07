import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Building2, MessageSquare, Users, Megaphone, Check } from 'lucide-react'
import { adminApi } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { PageHeader } from '../components/ui/PageLayout'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { cn } from '../lib/utils'

interface Company {
  id: string
  name: string
  slug: string
  industry: string
  whatsapp_connected: boolean
  member_count: number
  owner_email: string
  stats: {
    contacts: number
    leads: number
    campaigns: number
    conversations: number
    members: number
  }
}

export function CompaniesAdminPage() {
  const { organization, switchOrganization } = useAuth()
  const queryClient = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [newCompany, setNewCompany] = useState({ name: '', industry: '' })

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-companies'],
    queryFn: async () => {
      const res = await adminApi.companies()
      const payload = res.data
      return (payload?.data ?? payload?.results ?? payload) as Company[]
    },
  })

  const createMutation = useMutation({
    mutationFn: () => adminApi.createCompany(newCompany),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-companies'] })
      setShowCreate(false)
      setNewCompany({ name: '', industry: '' })
    },
  })

  const companies = Array.isArray(data) ? data : []

  return (
    <div className="space-y-4">
      <PageHeader
        title="Company Management"
        subtitle="Internal multi-company control — manage all businesses from one owner account"
        actions={
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4" /> Add Company
          </Button>
        }
      />

      <div className="rounded-[var(--radius-md)] border border-[var(--accent-subtle)] bg-[var(--color-surface-muted)] p-4">
        <p className="text-sm text-brand-800">
          <strong>Internal Mode</strong> — No SaaS billing or plan restrictions. Each company has isolated
          WhatsApp, contacts, leads, campaigns, templates, and analytics.
        </p>
      </div>

      {showCreate && (
        <div className="surface-card p-5">
          <h3 className="font-semibold text-slate-800">Create New Company</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Input label="Company Name" value={newCompany.name}
              onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
              placeholder="e.g. Future Business Ltd" />
            <Input label="Industry" value={newCompany.industry}
              onChange={(e) => setNewCompany({ ...newCompany, industry: e.target.value })}
              placeholder="e.g. real_estate, clinic" />
          </div>
          <div className="mt-4 flex gap-2">
            <Button loading={createMutation.isPending} onClick={() => createMutation.mutate()}
              disabled={!newCompany.name}>Create Company</Button>
            <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="py-12 text-center text-slate-400">Loading companies...</div>
      )}
      {isError && (
        <div className="py-12 text-center text-red-500">Could not load companies. Ensure you are logged in as superuser.</div>
      )}
      {!isLoading && !isError && companies.length === 0 && (
        <div className="py-12 text-center text-slate-400">No companies yet. Click Add Company to create one.</div>
      )}
      {!isLoading && !isError && companies.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {companies.map((company) => (
            <div key={company.id}
              className={cn(
                'rounded-xl border bg-white p-5 shadow-sm transition-shadow hover:shadow-md',
                organization?.id === company.id ? 'border-brand-400 ring-2 ring-brand-100' : 'border-slate-200',
              )}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-brand-50 p-2.5 text-brand-600">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">{company.name}</h3>
                    <p className="text-xs capitalize text-slate-500">{company.industry?.replace('_', ' ') || 'General'}</p>
                  </div>
                </div>
                {organization?.id === company.id && (
                  <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-700">Active</span>
                )}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-1.5 text-slate-600">
                  <Users className="h-3.5 w-3.5" /> {company.stats?.leads ?? 0} leads
                </div>
                <div className="flex items-center gap-1.5 text-slate-600">
                  <Megaphone className="h-3.5 w-3.5" /> {company.stats?.campaigns ?? 0} campaigns
                </div>
                <div className="flex items-center gap-1.5 text-slate-600">
                  <MessageSquare className="h-3.5 w-3.5" /> {company.stats?.conversations ?? 0} chats
                </div>
                <div className="flex items-center gap-1.5 text-slate-600">
                  <Users className="h-3.5 w-3.5" /> {company.stats?.members ?? 0} members
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2">
                {company.whatsapp_connected ? (
                  <span className="flex items-center gap-1 text-xs text-green-600"><Check className="h-3 w-3" /> WhatsApp connected</span>
                ) : (
                  <span className="text-xs text-slate-400">WhatsApp not connected</span>
                )}
              </div>

              <Button
                className="mt-4 w-full"
                variant={organization?.id === company.id ? 'secondary' : 'primary'}
                size="sm"
                disabled={organization?.id === company.id}
                onClick={() => switchOrganization(company.id)}
              >
                {organization?.id === company.id ? 'Currently Active' : 'Switch to This Company'}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
