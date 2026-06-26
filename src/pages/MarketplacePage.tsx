import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Download, Check, Bug, Car, Building, Heart, Palmtree, GraduationCap } from 'lucide-react'
import { onboardingApi } from '../lib/api'
import { PageHeader } from '../components/ui/PageLayout'
import { Button } from '../components/ui/Button'
import { cn } from '../lib/utils'

const ICONS: Record<string, React.ReactNode> = {
  bug: <Bug className="h-8 w-8" />,
  car: <Car className="h-8 w-8" />,
  building: <Building className="h-8 w-8" />,
  heart: <Heart className="h-8 w-8" />,
  palmtree: <Palmtree className="h-8 w-8" />,
  graduation: <GraduationCap className="h-8 w-8" />,
}

interface IndustryPack {
  id: string
  name: string
  industry: string
  icon: string
  description: string
  flows: { title: string }[]
  templates: { name: string }[]
  installed: boolean
}

export function MarketplacePage() {
  const queryClient = useQueryClient()
  const [installing, setInstalling] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['marketplace'],
    queryFn: () => onboardingApi.marketplace().then((r) => r.data.data ?? r.data),
  })

  const installMutation = useMutation({
    mutationFn: (packId: string) => onboardingApi.installPack(packId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketplace'] })
      queryClient.invalidateQueries({ queryKey: ['bot-flows'] })
      queryClient.invalidateQueries({ queryKey: ['templates'] })
      setInstalling(null)
    },
    onError: () => setInstalling(null),
  })

  const packs = (data as IndustryPack[]) ?? []

  return (
    <div>
      <PageHeader
        title="Industry Template Marketplace"
        subtitle="One-click install ready-made automation packs for your industry"
      />

      {isLoading ? (
        <div className="flex justify-center py-12 text-slate-400">Loading packs...</div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {packs.map((pack) => (
            <div key={pack.id} className={cn(
              'rounded-xl border bg-white p-6 shadow-sm transition-shadow hover:shadow-md',
              pack.installed ? 'border-brand-300 ring-1 ring-brand-100' : 'border-slate-200',
            )}>
              <div className="flex items-start justify-between">
                <div className="rounded-xl bg-brand-50 p-3 text-brand-600">
                  {ICONS[pack.icon] || <Download className="h-8 w-8" />}
                </div>
                {pack.installed && (
                  <span className="flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">
                    <Check className="h-3 w-3" /> Installed
                  </span>
                )}
              </div>
              <h3 className="mt-4 text-lg font-bold text-slate-800">{pack.name}</h3>
              <p className="mt-1 text-sm text-slate-500">{pack.description}</p>

              <div className="mt-4 space-y-2 text-sm text-slate-600">
                <p><strong>{pack.flows?.length || 0}</strong> Bot Flows</p>
                <p><strong>{pack.templates?.length || 0}</strong> Templates</p>
              </div>

              <ul className="mt-3 space-y-1">
                {pack.flows?.slice(0, 3).map((f) => (
                  <li key={f.title} className="text-xs text-slate-500">• {f.title}</li>
                ))}
              </ul>

              <Button
                className="mt-4 w-full"
                variant={pack.installed ? 'secondary' : 'primary'}
                disabled={pack.installed}
                loading={installing === pack.id}
                onClick={() => { setInstalling(pack.id); installMutation.mutate(pack.id) }}
              >
                {pack.installed ? 'Installed' : <><Download className="h-4 w-4" /> Install Pack</>}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
