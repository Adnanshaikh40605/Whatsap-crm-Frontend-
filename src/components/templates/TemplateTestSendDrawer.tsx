import { useEffect, useMemo, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Check, Copy, Send, X } from 'lucide-react'
import { campaignApi } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../common'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import type { WhatsAppTemplate } from '../../types/bot'

interface Props {
  open: boolean
  onClose: () => void
  template: WhatsAppTemplate | null
}

function normalizePhone(raw: string) {
  return raw.replace(/[^\d+]/g, '').trim()
}

function buildBodyParams(template: WhatsAppTemplate): string[] {
  const examples = (template as WhatsAppTemplate & { examples?: Record<string, unknown> }).examples
  if (examples && typeof examples === 'object') {
    const bodyText = examples.body_text
    if (Array.isArray(bodyText) && bodyText.length > 0) {
      if (Array.isArray(bodyText[0])) return (bodyText[0] as unknown[]).map(String)
      return bodyText.filter((v) => typeof v !== 'object').map(String)
    }
  }
  if (Array.isArray(template.variables) && template.variables.length > 0) {
    return template.variables.map(String)
  }
  return []
}

export function TemplateTestSendDrawer({ open, onClose, template }: Props) {
  const { user, organization } = useAuth()
  const toast = useToast()
  const [username, setUsername] = useState('')
  const [phone, setPhone] = useState('')
  const [phoneError, setPhoneError] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!open || !template) return
    setUsername(user?.username || organization?.name || '')
    setPhone('')
    setPhoneError('')
    setCopied(false)
  }, [open, template, user?.username, organization?.name])

  const bodyParams = useMemo(
    () => (template ? buildBodyParams(template) : []),
    [template],
  )

  const payload = useMemo(() => {
    if (!template) return null
    return {
      templateName: template.name,
      language: template.language,
      category: template.category,
      destination: normalizePhone(phone) || '<whatsapp_number>',
      userName: username || '<username>',
      organization: organization?.name || '',
      templateParams: bodyParams,
      metaTemplateId: template.whatsapp_template_id || null,
    }
  }, [template, phone, username, organization?.name, bodyParams])

  const payloadJson = useMemo(
    () => (payload ? JSON.stringify(payload, null, 2) : ''),
    [payload],
  )

  const testMutation = useMutation({
    mutationFn: () => {
      if (!template) throw new Error('No template')
      return campaignApi.sendTestTemplate(template.id, {
        phone: normalizePhone(phone),
        body_params: bodyParams.length > 0 ? bodyParams : undefined,
      })
    },
    onSuccess: () => {
      toast.success(`Test message sent to ${normalizePhone(phone)}`)
      onClose()
    },
    onError: (err: { response?: { data?: { message?: string; error?: unknown } } }) => {
      const data = err.response?.data
      const msg = typeof data?.message === 'string'
        ? data.message
        : typeof data?.error === 'string'
          ? data.error
          : 'Failed to send test message'
      toast.error(msg)
    },
  })

  if (!open || !template) return null

  const isApproved = template.status === 'approved'
    || String(template.meta_status || '').toUpperCase() === 'APPROVED'

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(payloadJson)
      setCopied(true)
      toast.success('Payload copied')
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Could not copy')
    }
  }

  const handleSend = () => {
    const cleaned = normalizePhone(phone)
    if (!cleaned || cleaned.replace(/\D/g, '').length < 10) {
      setPhoneError('Enter a valid WhatsApp number with country code (e.g. 919372792693)')
      return
    }
    setPhoneError('')
    if (!isApproved) {
      toast.error('Template must be approved before sending a test')
      return
    }
    testMutation.mutate()
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Close test send panel"
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="test-send-title"
        className="relative z-10 flex h-full w-full max-w-md flex-col border-l shadow-2xl animate-fade-in"
        style={{
          background: 'var(--bg-card, #fff)',
          borderColor: 'var(--border)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <header
          className="flex shrink-0 items-center justify-between border-b px-5 py-4"
          style={{ borderColor: 'var(--border)' }}
        >
          <div>
            <h2 id="test-send-title" className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              Test Send
            </h2>
            <p className="mt-0.5 text-xs" style={{ color: 'var(--text-muted)' }}>
              Send <span className="font-semibold">{template.name}</span> to any WhatsApp number
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-[var(--hover)]"
            aria-label="Close"
          >
            <X className="h-5 w-5" style={{ color: 'var(--text-muted)' }} />
          </button>
        </header>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
          {!isApproved && (
            <div
              className="rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: '#F7B928', background: '#FFF8E6', color: '#7A5B00' }}
            >
              This template is not approved yet. Meta only allows test sends for approved templates.
            </div>
          )}

          <Input
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Your name"
          />

          <Input
            label="WhatsApp Number"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value)
              if (phoneError) setPhoneError('')
            }}
            placeholder="919372792693"
            error={phoneError}
            inputMode="tel"
          />
          <p className="-mt-3 text-[11px]" style={{ color: 'var(--text-muted)' }}>
            Include country code without spaces (e.g. 91 for India).
          </p>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                Request payload
              </p>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium hover:bg-[var(--hover)]"
                style={{ color: 'var(--text-secondary)' }}
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <pre
              className="max-h-72 overflow-auto rounded-xl border p-4 font-mono text-[12px] leading-5"
              style={{
                borderColor: 'var(--border)',
                background: '#0f172a',
                color: '#e2e8f0',
              }}
            >
              {payloadJson}
            </pre>
          </div>
        </div>

        <footer
          className="flex shrink-0 gap-2 border-t px-5 py-4"
          style={{ borderColor: 'var(--border)' }}
        >
          <Button variant="secondary" className="flex-1" onClick={handleCopy}>
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            Copy JSON
          </Button>
          <Button
            className="flex-1"
            loading={testMutation.isPending}
            disabled={!isApproved}
            onClick={handleSend}
          >
            <Send className="h-4 w-4" /> Test
          </Button>
        </footer>
      </aside>
    </div>
  )
}
