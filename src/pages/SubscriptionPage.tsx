import { useQuery } from '@tanstack/react-query'
import { CreditCard, Check } from 'lucide-react'
import { billingApi } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { PageHeader } from '../components/ui/PageLayout'
import { Button } from '../components/ui/Button'

const plans = [
  { name: 'Free', price: '₹0', features: ['2 agents', '500 contacts', '1,000 messages/mo'] },
  { name: 'Starter', price: '₹2,999', features: ['5 agents', '5,000 contacts', '10,000 messages/mo'] },
  { name: 'Growth', price: '₹7,999', features: ['20 agents', '50,000 contacts', '100,000 messages/mo', 'Bot Flows', 'Campaigns'] },
  { name: 'Enterprise', price: 'Custom', features: ['Unlimited agents', 'Unlimited contacts', 'White label', 'AI Bot', 'Priority support'] },
]

export function SubscriptionPage() {
  const { organization } = useAuth()

  const { data: subscription } = useQuery({
    queryKey: ['subscription'],
    queryFn: () => billingApi.subscription().then((r) => r.data.data ?? r.data),
    enabled: !!organization,
  })

  const { data: usage } = useQuery({
    queryKey: ['usage'],
    queryFn: () => billingApi.usage().then((r) => r.data.data ?? r.data),
    enabled: !!organization,
  })

  return (
    <div>
      <PageHeader title="My Subscription" subtitle="Manage your plan, billing, and usage limits" />

      <div className="mb-6 rounded-xl border border-brand-200 bg-brand-50 p-6">
        <div className="flex items-center gap-4">
          <div className="rounded-full bg-brand-600 p-3"><CreditCard className="h-6 w-6 text-white" /></div>
          <div>
            <p className="text-lg font-bold capitalize text-brand-800">{subscription?.plan ?? organization?.plan ?? 'Free'} Plan</p>
            <p className="text-sm text-brand-600 capitalize">Status: {subscription?.status ?? 'trialing'}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {plans.map((plan) => (
          <div key={plan.name} className={`rounded-xl border bg-white p-5 shadow-sm ${organization?.plan === plan.name.toLowerCase() ? 'border-brand-500 ring-2 ring-brand-200' : 'border-slate-200'}`}>
            <h3 className="font-bold text-slate-800">{plan.name}</h3>
            <p className="mt-1 text-2xl font-bold text-brand-700">{plan.price}<span className="text-sm font-normal text-slate-500">/mo</span></p>
            <ul className="mt-4 space-y-2">
              {plan.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-slate-600">
                  <Check className="h-3.5 w-3.5 text-brand-600" /> {f}
                </li>
              ))}
            </ul>
            <Button className="mt-4 w-full" variant={organization?.plan === plan.name.toLowerCase() ? 'secondary' : 'primary'}>
              {organization?.plan === plan.name.toLowerCase() ? 'Current Plan' : 'Upgrade'}
            </Button>
          </div>
        ))}
      </div>

      {usage && Array.isArray(usage) && usage.length > 0 && (
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="font-semibold text-slate-800">This Month Usage</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {usage.map((u: { metric: string; count: number }) => (
              <div key={u.metric} className="rounded-lg bg-slate-50 p-3 text-center">
                <p className="text-2xl font-bold text-slate-800">{u.count}</p>
                <p className="text-xs capitalize text-slate-500">{u.metric.replace(/_/g, ' ')}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
