import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  MessageSquare, Building2, Users, HelpCircle, Bot, Rocket,
  Check, ChevronRight, ChevronLeft, Sparkles,
} from 'lucide-react'
import { onboardingApi, coreApi } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { useQuery } from '@tanstack/react-query'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { cn } from '../lib/utils'

const STEPS = [
  { id: 1, title: 'Connect WhatsApp', icon: MessageSquare, desc: 'Link your WhatsApp Business in under 3 minutes' },
  { id: 2, title: 'Business Details', icon: Building2, desc: 'Tell us about your business' },
  { id: 3, title: 'Add Team', icon: Users, desc: 'Invite your team members' },
  { id: 4, title: 'Lead Questions', icon: HelpCircle, desc: 'What info do you collect from leads?' },
  { id: 5, title: 'AI Agent Setup', icon: Bot, desc: 'AI configures your workspace automatically' },
  { id: 6, title: 'Launch', icon: Rocket, desc: 'Go live and start receiving leads' },
]


declare global {
  interface Window {
    FB: {
      init: (params: Record<string, unknown>) => void
      login: (callback: (response: { authResponse?: { code?: string } }) => void, params: Record<string, unknown>) => void
    }
    fbAsyncInit: () => void
  }
}

export function OnboardingWizard() {
  const navigate = useNavigate()
  const { organization, refreshUser } = useAuth()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiResult, setAiResult] = useState<Record<string, unknown> | null>(null)

  const { data: options } = useQuery({
    queryKey: ['core-options'],
    queryFn: () => coreApi.options().then((r) => r.data.data ?? r.data),
  })

  const industries = options?.industries ?? []
  const teamSizes = options?.team_sizes ?? []

  const [business, setBusiness] = useState({
    name: organization?.name || '',
    industry: '',
    team_size: '',
    website: '',
  })
  const [teamEmails, setTeamEmails] = useState([''])
  const [questions, setQuestions] = useState(['What is your name?', 'What service do you need?', 'Your location?'])
  const [businessDescription, setBusinessDescription] = useState('')
  const [whatsappConnected, setWhatsappConnected] = useState(false)

  useEffect(() => {
    onboardingApi.status().then((r) => {
      const data = r.data.data ?? r.data
      if (data.onboarding_completed) {
        navigate('/')
        return
      }
      setStep(data.onboarding_step || 1)
      setWhatsappConnected(data.whatsapp_connected)
      if (data.onboarding_data?.ai_setup_result) {
        setAiResult(data.onboarding_data.ai_setup_result)
      }
    }).catch(() => {})
  }, [navigate])

  const handleWhatsAppConnect = async () => {
    setConnecting(true)
    try {
      const configRes = await onboardingApi.whatsappConfig()
      const config = configRes.data.data ?? configRes.data

      if (config.app_id && window.FB) {
        window.FB.login(
          async (response) => {
            if (response.authResponse?.code) {
              await onboardingApi.whatsappConnect({
                code: response.authResponse.code,
                waba_id: '',
                phone_number_id: '',
              })
              setWhatsappConnected(true)
            }
            setConnecting(false)
          },
          { config_id: config.config_id, response_type: 'code', override_default_response_type: true },
        )
      } else {
        // Dev mode: simulate connection
        await onboardingApi.whatsappConnect({
          code: 'dev_mode',
          waba_id: 'dev_waba_' + Date.now(),
          phone_number_id: 'dev_phone_' + Date.now(),
        })
        setWhatsappConnected(true)
        setConnecting(false)
      }
    } catch {
      setConnecting(false)
    }
  }

  const handleAISetup = async () => {
    if (!businessDescription.trim()) return
    setAiLoading(true)
    try {
      const res = await onboardingApi.aiSetup({
        business_description: businessDescription,
        qualification_questions: questions,
      })
      setAiResult(res.data.data ?? res.data)
    } finally {
      setAiLoading(false)
    }
  }

  const nextStep = async () => {
    setLoading(true)
    try {
      if (step === 2) {
        await onboardingApi.completeStep(2, business)
      } else if (step === 3) {
        await onboardingApi.completeStep(3, { invites: teamEmails.filter(Boolean) })
      } else if (step === 4) {
        await onboardingApi.completeStep(4, { questions })
      } else if (step === 5) {
        await onboardingApi.completeStep(5, {
          business_description: businessDescription || `I run a ${business.industry || 'business'} company`,
          qualification_questions: questions,
        })
      } else if (step === 6) {
        await onboardingApi.completeStep(6, {})
        await refreshUser()
        navigate('/')
        return
      }
      setStep((s) => Math.min(s + 1, 6))
    } finally {
      setLoading(false)
    }
  }

  const progress = ((step - 1) / (STEPS.length - 1)) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-slate-50">
      <div className="mx-auto max-w-3xl px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600">
            <MessageSquare className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Set up WhatsFlow in 5 minutes</h1>
          <p className="mt-1 text-slate-500">No technical knowledge required</p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="mb-2 flex justify-between text-xs text-slate-500">
            <span>Step {step} of {STEPS.length}</span>
            <span>{Math.round(progress)}% complete</span>
          </div>
          <div className="h-2 rounded-full bg-slate-200">
            <div className="h-2 rounded-full bg-brand-600 transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
          <div className="mt-4 flex justify-between">
            {STEPS.map((s) => {
              const Icon = s.icon
              const done = step > s.id
              const active = step === s.id
              return (
                <div key={s.id} className={cn('flex flex-col items-center gap-1', active ? 'text-brand-700' : done ? 'text-brand-500' : 'text-slate-300')}>
                  <div className={cn('flex h-8 w-8 items-center justify-center rounded-full border-2', active ? 'border-brand-600 bg-brand-50' : done ? 'border-brand-500 bg-brand-500 text-white' : 'border-slate-200')}>
                    {done ? <Check className="h-4 w-4" /> : <Icon className="h-3.5 w-3.5" />}
                  </div>
                  <span className="hidden text-[10px] font-medium sm:block">{s.title}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-xl font-bold text-slate-800">{STEPS[step - 1].title}</h2>
          <p className="mt-1 text-sm text-slate-500">{STEPS[step - 1].desc}</p>

          <div className="mt-6">
            {/* Step 1: WhatsApp Connect */}
            {step === 1 && (
              <div className="text-center">
                {whatsappConnected ? (
                  <div className="rounded-xl border border-green-200 bg-green-50 p-6">
                    <Check className="mx-auto h-12 w-12 text-green-600" />
                    <p className="mt-3 font-semibold text-green-800">WhatsApp Connected!</p>
                    <p className="mt-1 text-sm text-green-600">Your inbox, CRM, and automations are ready.</p>
                  </div>
                ) : (
                  <>
                    <div className="mx-auto mb-6 max-w-sm rounded-xl border border-slate-200 p-6">
                      <MessageSquare className="mx-auto h-16 w-16 text-brand-600" />
                      <p className="mt-4 text-sm text-slate-600">
                        Connect via Meta Embedded Signup — select your Business Manager, WhatsApp Account, and phone number.
                      </p>
                    </div>
                    <Button size="lg" loading={connecting} onClick={handleWhatsAppConnect}>
                      <MessageSquare className="h-5 w-5" /> Connect WhatsApp
                    </Button>
                    <p className="mt-3 text-xs text-slate-400">Takes less than 3 minutes • Powered by Meta</p>
                  </>
                )}
              </div>
            )}

            {/* Step 2: Business Details */}
            {step === 2 && (
              <div className="space-y-4">
                <Input label="Business Name" value={business.name} onChange={(e) => setBusiness({ ...business, name: e.target.value })} />
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Industry</label>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {industries.map((ind: any) => (
                      <button key={ind.id} onClick={() => setBusiness({ ...business, industry: ind.id })}
                        className={cn('rounded-lg border px-3 py-2 text-sm transition-colors', business.industry === ind.id ? 'border-brand-500 bg-brand-50 text-brand-700 font-medium' : 'border-slate-200 hover:border-slate-300')}>
                        {ind.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Team Size</label>
                  <div className="flex flex-wrap gap-2">
                    {teamSizes.map((size: any) => (
                      <button key={size.id} onClick={() => setBusiness({ ...business, team_size: size.id })}
                        className={cn('rounded-full border px-3 py-1.5 text-sm', business.team_size === size.id ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200')}>
                        {size.label}
                      </button>
                    ))}
                  </div>
                </div>
                <Input label="Website (optional)" value={business.website} onChange={(e) => setBusiness({ ...business, website: e.target.value })} placeholder="https://yourbusiness.com" />
              </div>
            )}

            {/* Step 3: Team */}
            {step === 3 && (
              <div className="space-y-3">
                <p className="text-sm text-slate-500">Invite team members now or skip and add later.</p>
                {teamEmails.map((email, i) => (
                  <Input key={i} label={i === 0 ? 'Team member email' : ''} value={email}
                    onChange={(e) => { const copy = [...teamEmails]; copy[i] = e.target.value; setTeamEmails(copy) }}
                    placeholder="colleague@company.com" type="email" />
                ))}
                <Button variant="ghost" size="sm" onClick={() => setTeamEmails([...teamEmails, ''])}>+ Add another</Button>
              </div>
            )}

            {/* Step 4: Qualification Questions */}
            {step === 4 && (
              <div className="space-y-3">
                <p className="text-sm text-slate-500">What information should your bot collect from leads?</p>
                {questions.map((q, i) => (
                  <Input key={i} label={`Question ${i + 1}`} value={q}
                    onChange={(e) => { const copy = [...questions]; copy[i] = e.target.value; setQuestions(copy) }} />
                ))}
                <Button variant="ghost" size="sm" onClick={() => setQuestions([...questions, ''])}>+ Add question</Button>
              </div>
            )}

            {/* Step 5: AI Setup */}
            {step === 5 && (
              <div className="space-y-4">
                <div className="rounded-xl border border-purple-200 bg-purple-50 p-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-purple-600" />
                    <p className="font-semibold text-purple-800">AI Business Setup Assistant</p>
                  </div>
                  <p className="mt-1 text-sm text-purple-600">Describe your business and AI will create flows, CRM, templates, and follow-ups.</p>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">What business do you run?</label>
                  <textarea
                    value={businessDescription}
                    onChange={(e) => setBusinessDescription(e.target.value)}
                    placeholder="e.g. We provide pest control services in Mumbai for homes and offices..."
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    rows={3}
                  />
                </div>
                <Button onClick={handleAISetup} loading={aiLoading} disabled={!businessDescription.trim()}>
                  <Sparkles className="h-4 w-4" /> Generate with AI
                </Button>
                {aiResult && (
                  <div className="rounded-xl border border-green-200 bg-green-50 p-4 space-y-2">
                    <p className="font-semibold text-green-800">AI Generated Setup ✓</p>
                    <p className="text-sm text-green-700"><strong>Industry:</strong> {String(aiResult.industry)}</p>
                    <p className="text-sm text-green-700"><strong>Welcome:</strong> {String(aiResult.welcome_message)}</p>
                    <p className="text-sm text-green-700"><strong>Pipeline:</strong> {(aiResult.pipeline_stages as string[])?.join(' → ')}</p>
                  </div>
                )}
              </div>
            )}

            {/* Step 6: Launch */}
            {step === 6 && (
              <div className="text-center">
                <Rocket className="mx-auto h-16 w-16 text-brand-600" />
                <h3 className="mt-4 text-lg font-bold text-slate-800">You're all set!</h3>
                <p className="mt-2 text-sm text-slate-500">Your workspace is configured with:</p>
                <div className="mt-4 grid gap-2 text-left sm:grid-cols-2">
                  {['WhatsApp Inbox', 'CRM Pipeline', 'Bot Flows', 'Follow-up Sequences', 'Message Templates', 'AI Agent'].map((item) => (
                    <div key={item} className="flex items-center gap-2 rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-800">
                      <Check className="h-4 w-4 text-brand-600" /> {item}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="mt-8 flex justify-between">
            <Button variant="ghost" disabled={step === 1} onClick={() => setStep((s) => s - 1)}>
              <ChevronLeft className="h-4 w-4" /> Back
            </Button>
            <Button
              onClick={nextStep}
              loading={loading}
              disabled={step === 1 && !whatsappConnected}
            >
              {step === 6 ? 'Launch Workspace' : 'Continue'}
              {step < 6 && <ChevronRight className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
