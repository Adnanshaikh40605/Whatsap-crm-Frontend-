import { useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft, ArrowRight, Check, CheckCircle2, Copy, Loader2, Plus, Save, Send, Trash2, Upload,
} from 'lucide-react'
import { campaignApi } from '../lib/api'
import { filterLanguages } from '../lib/metaLanguages'
import {
  CATEGORY_DESCRIPTIONS,
  INITIAL_TEMPLATE_FORM,
  TEMPLATE_PRESETS,
  buildTemplatePayload,
  canAddButtonType,
  extractVariableNumbers,
  getButtonAddState,
  getCategoryHint,
  insertNextVariable,
  isTemplateFormValid,
  normalizeTemplateName,
  templateToPreviewForm,
  validateTemplateForm,
  wrapSelection,
  type FieldError,
  type TemplateBuilderForm,
  type TemplateButton,
  type TemplateCategory,
  type HeaderType,
} from '../lib/templateBuilder'
import { TemplatePreview } from '../components/templates/TemplatePreview'
import { Button } from '../components/ui/Button'
import { useDeleteConfirm } from '../hooks/useDeleteConfirm'
import { FeedbackMessage, useToast } from '../components/common'
import { fetchAllCampaignTemplates } from '../lib/templateList'
import { orgQueryKey } from '../lib/queryKeys'
import { useAuth } from '../context/AuthContext'
import { explainMetaTemplateError } from '../lib/templateGuidance'
import type { WhatsAppTemplate } from '../types/bot'

const WIZARD_STEPS = [
  { id: 'basics', label: 'Basics' },
  { id: 'header', label: 'Header' },
  { id: 'body', label: 'Body' },
  { id: 'footer', label: 'Footer' },
  { id: 'buttons', label: 'Buttons' },
  { id: 'review', label: 'Review' },
] as const

const FIELD_STEP: Record<string, number> = {
  name: 0,
  category: 0,
  language: 0,
  headerText: 1,
  headerMedia: 1,
  body: 2,
  variableExamples: 2,
  footer: 3,
  buttons: 4,
}

const CATEGORY_OPTIONS: { id: TemplateCategory; title: string; blurb: string }[] = [
  { id: 'utility', title: 'Utility', blurb: 'Bookings, invoices, updates' },
  { id: 'marketing', title: 'Marketing', blurb: 'Offers & campaigns' },
  { id: 'authentication', title: 'Authentication', blurb: 'OTP & login codes' },
]

const HEADER_OPTIONS: { id: HeaderType; label: string }[] = [
  { id: 'none', label: 'None' },
  { id: 'text', label: 'Text' },
  { id: 'image', label: 'Image' },
  { id: 'video', label: 'Video' },
  { id: 'document', label: 'Document' },
]

type SubmitPhase = 'idle' | 'creating' | 'submitting' | 'waiting' | 'completed' | 'error'

function newButtonId() {
  return `btn_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}

function FieldFeedback({
  error,
  ok,
  hint,
}: {
  error?: string
  ok?: boolean
  hint?: string
}) {
  if (error) {
    return <p className="mt-1.5 text-[12px] font-medium leading-snug text-[var(--color-feedback-critical)]">{error}</p>
  }
  if (ok) {
    return (
      <p className="mt-1.5 flex items-center gap-1 text-[12px] font-medium text-[var(--color-feedback-success)]">
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> Valid
      </p>
    )
  }
  if (hint) {
    return <p className="mt-1.5 text-[12px] leading-snug text-[var(--color-text-muted)]">{hint}</p>
  }
  return null
}

function fieldBorder(error?: string, ok?: boolean) {
  if (error) return 'var(--color-feedback-critical)'
  if (ok) return 'var(--color-feedback-success)'
  return 'var(--color-border-default)'
}

function StepRail({
  step,
  onSelect,
  stepHasError,
}: {
  step: number
  onSelect: (idx: number) => void
  stepHasError: (idx: number) => boolean
}) {
  return (
    <nav aria-label="Template steps" className="border-b px-4 md:px-8" style={{ borderColor: 'var(--color-border-subtle)', background: 'var(--color-surface-default)' }}>
      <ol className="flex items-stretch gap-0 overflow-x-auto">
        {WIZARD_STEPS.map((s, idx) => {
          const active = step === idx
          const done = idx < step
          const bad = stepHasError(idx)
          return (
            <li key={s.id} className="relative min-w-[88px] flex-1">
              <button
                type="button"
                onClick={() => onSelect(idx)}
                className="group flex w-full flex-col items-start gap-1.5 px-1 py-3 text-left transition-colors"
              >
                <span className="flex items-center gap-2">
                  <span
                    className="flex h-6 w-6 items-center justify-center text-[11px] font-bold transition-colors"
                    style={{
                      borderRadius: 'var(--radius-sm)',
                      background: active
                        ? 'var(--color-surface-raised)'
                        : done
                          ? 'var(--color-surface-base)'
                          : 'var(--color-surface-muted)',
                      color: active || done ? 'var(--color-text-inverse)' : 'var(--color-text-muted)',
                    }}
                  >
                    {done ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : idx + 1}
                  </span>
                  <span
                    className="text-[12px] font-semibold tracking-wide"
                    style={{
                      color: active
                        ? 'var(--color-text-primary)'
                        : bad
                          ? 'var(--color-feedback-critical)'
                          : 'var(--color-text-muted)',
                    }}
                  >
                    {s.label}
                  </span>
                </span>
                <span
                  className="h-0.5 w-full transition-colors"
                  style={{
                    background: active
                      ? 'var(--color-surface-raised)'
                      : done
                        ? 'var(--color-surface-base)'
                        : 'transparent',
                  }}
                />
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

export function CreateTemplatePage() {
  const navigate = useNavigate()
  const toast = useToast()
  const { organization } = useAuth()
  const orgId = organization?.id
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<TemplateBuilderForm>(INITIAL_TEMPLATE_FORM)
  const [langQuery, setLangQuery] = useState('English (US)')
  const [langOpen, setLangOpen] = useState(false)
  const [submitPhase, setSubmitPhase] = useState<SubmitPhase>('idle')
  const [submitError, setSubmitError] = useState('')
  const [submitFix, setSubmitFix] = useState('')
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [submitAttempted, setSubmitAttempted] = useState(false)
  const bodyRef = useRef<HTMLTextAreaElement | null>(null)
  const fieldRefs = useRef<Record<string, HTMLElement | null>>({})

  const { data: templatesData } = useQuery({
    queryKey: orgQueryKey(orgId, 'templates', 'all'),
    queryFn: fetchAllCampaignTemplates,
    enabled: Boolean(orgId),
  })

  const allTemplates = (templatesData as WhatsAppTemplate[]) ?? []
  const existingNames = allTemplates
    .filter((t) => t.language === form.language)
    .map((t) => normalizeTemplateName(t.name))

  const formIsValid = isTemplateFormValid(form, existingNames)
  const categoryHint = getCategoryHint(form)

  const errors = useMemo(() => validateTemplateForm(form, existingNames), [form, existingNames])
  const errorsByField = useMemo(() => {
    const map: Record<string, string> = {}
    errors.forEach((e) => {
      if (!map[e.field]) map[e.field] = e.message
    })
    return map
  }, [errors])

  const showFieldError = (field: string) => {
    if (!(touched[field] || submitAttempted)) return undefined
    return errorsByField[field]
  }

  const showFieldOk = (field: string, hasValue: boolean) => {
    if (!hasValue) return false
    if (!(touched[field] || submitAttempted || hasValue)) return false
    return !errorsByField[field]
  }

  const markTouched = (field: string) => {
    setTouched((prev) => (prev[field] ? prev : { ...prev, [field]: true }))
  }

  const variableNums = extractVariableNumbers(form.body)
  const filteredLangs = filterLanguages(langQuery)

  useEffect(() => {
    const preset = searchParams.get('preset')
    if (preset && TEMPLATE_PRESETS[preset]) {
      setForm({ ...INITIAL_TEMPLATE_FORM, ...TEMPLATE_PRESETS[preset] })
      return
    }
    const duplicateId = searchParams.get('duplicate')
    if (duplicateId && allTemplates.length) {
      const source = allTemplates.find((t) => t.id === duplicateId)
      if (source) setForm({ ...templateToPreviewForm(source), name: `${source.name}_copy` })
    }
  }, [searchParams, allTemplates])

  const uploadMedia = useMutation({
    mutationFn: (file: File) => {
      const data = new FormData()
      data.append('file', file)
      data.append('name', file.name)
      data.append('asset_type', form.headerType === 'video' ? 'video' : form.headerType === 'document' ? 'document' : 'image')
      return campaignApi.uploadMedia(data)
    },
    onSuccess: (response) => {
      const asset = response.data.data ?? response.data
      setForm((prev) => ({
        ...prev,
        headerMediaAssetId: asset.id,
        headerMediaPreviewUrl: asset.file_url || '',
      }))
      markTouched('headerMedia')
    },
  })

  const createTemplate = useMutation({
    mutationFn: ({ submitToMeta }: { submitToMeta: boolean }) =>
      campaignApi.createTemplate(buildTemplatePayload(form, submitToMeta)),
  })
  const { requestDelete, deleteDialog } = useDeleteConfirm()

  const scrollToField = (field: string) => {
    fieldRefs.current[field]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  const stepErrors = (stepIndex: number): FieldError[] => {
    const fieldsByStep: Record<number, string[]> = {
      0: ['name', 'category', 'language'],
      1: ['headerText', 'headerMedia'],
      2: ['body', 'variableExamples'],
      3: ['footer'],
      4: ['buttons'],
      5: [],
    }
    const fields = fieldsByStep[stepIndex] ?? []
    return errors.filter((e) => fields.includes(e.field))
  }

  const goNext = () => {
    const current = stepErrors(step)
    if (current.length) {
      current.forEach((e) => markTouched(e.field))
      setSubmitAttempted(true)
      scrollToField(current[0].field)
      return
    }
    setStep((s) => Math.min(s + 1, WIZARD_STEPS.length - 1))
  }

  const handleSubmit = async (submitToMeta: boolean) => {
    setSubmitAttempted(true)
    const allErrors = validateTemplateForm(form, existingNames)
    if (allErrors.length) {
      allErrors.forEach((e) => markTouched(e.field))
      setSubmitPhase('error')
      setSubmitError(allErrors.map((e) => e.message).join(' '))
      setSubmitFix('Fix the highlighted fields, then try again.')
      const firstField = allErrors[0].field
      setStep(FIELD_STEP[firstField] ?? 0)
      requestAnimationFrame(() => scrollToField(firstField))
      return
    }

    setSubmitError('')
    setSubmitFix('')
    try {
      setSubmitPhase('creating')
      await createTemplate.mutateAsync({ submitToMeta })

      if (submitToMeta) {
        setSubmitPhase('submitting')
        await new Promise((r) => setTimeout(r, 800))
        setSubmitPhase('waiting')
        await new Promise((r) => setTimeout(r, 800))
      }

      setSubmitPhase('completed')
      queryClient.invalidateQueries({ queryKey: orgQueryKey(orgId, 'templates') })
      setTimeout(() => navigate('/whatsapp-crm/templates'), 1500)
    } catch (err: unknown) {
      setSubmitPhase('error')
      const data = (err as { response?: { data?: Record<string, unknown> } })?.response?.data || {}
      const errObj = (data.error || data) as Record<string, unknown>
      const submitField = errObj.submit_to_meta
      const nameField = errObj.name
      let text = 'Failed to create template. Please try again.'
      if (Array.isArray(nameField) && nameField[0]) {
        text = String(nameField[0])
      } else if (Array.isArray(submitField) && submitField[0]) {
        text = String(submitField[0])
      } else if (typeof data.message === 'string') {
        text = data.message
      } else if (typeof errObj.message === 'string') {
        text = errObj.message
      } else if (errObj.error && typeof errObj.error === 'object') {
        const nested = errObj.error as { message?: string; error_user_msg?: string; error_user_title?: string }
        text = nested.error_user_msg || nested.error_user_title || nested.message || JSON.stringify(errObj.error)
      }
      const explained = explainMetaTemplateError(text)
      setSubmitError(explained.summary)
      setSubmitFix(explained.fix)
    }
  }

  const applyBodyFormat = (wrapper: string) => {
    const el = bodyRef.current
    if (!el) {
      setForm((prev) => ({ ...prev, body: `${prev.body}${wrapper}text${wrapper}` }))
      return
    }
    const start = el.selectionStart ?? form.body.length
    const end = el.selectionEnd ?? form.body.length
    const next = wrapSelection(form.body, start, end, wrapper)
    setForm((prev) => ({ ...prev, body: next }))
    markTouched('body')
    requestAnimationFrame(() => {
      el.focus()
      const cursor = start + wrapper.length + (end - start || 4)
      el.setSelectionRange(cursor, cursor)
    })
  }

  const updateVariableExample = (num: number, value: string) => {
    setForm((prev) => ({
      ...prev,
      variableExamples: { ...prev.variableExamples, [num]: value },
    }))
    markTouched('variableExamples')
  }

  const buttonAddState = useMemo(() => getButtonAddState(form.buttons), [form.buttons])

  const addButton = (type: TemplateButton['type']) => {
    setForm((prev) => {
      if (!canAddButtonType(prev.buttons, type)) return prev
      return {
        ...prev,
        buttons: [...prev.buttons, { id: newButtonId(), type, text: '', value: '' }],
      }
    })
    markTouched('buttons')
  }

  const updateButton = (id: string, patch: Partial<TemplateButton>) => {
    setForm((prev) => ({
      ...prev,
      buttons: prev.buttons.map((b) => (b.id === id ? { ...b, ...patch } : b)),
    }))
    markTouched('buttons')
  }

  const removeButton = (id: string) => {
    setForm((prev) => ({ ...prev, buttons: prev.buttons.filter((b) => b.id !== id) }))
    markTouched('buttons')
  }

  const inputClass =
    'h-11 w-full border bg-[var(--color-surface-default)] px-3 text-[14px] text-[var(--color-text-primary)] outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-surface-raised)] focus:shadow-[0_0_0_3px_var(--accent-subtle)]'
  const labelClass = 'block space-y-2 text-[12px] font-semibold uppercase tracking-[0.04em] text-[var(--color-text-secondary)]'

  const nameError = showFieldError('name')
  const nameOk = showFieldOk('name', Boolean(form.name.trim()))
  const categoryError = (touched.category || touched.body || submitAttempted)
    ? errorsByField.category
    : undefined
  const languageError = showFieldError('language')
  const languageOk = showFieldOk('language', Boolean(form.language))
  const headerError = showFieldError('headerText')
  const headerOk = showFieldOk('headerText', form.headerType === 'text' && Boolean(form.headerText.trim()))
  const mediaError = showFieldError('headerMedia')
  const bodyError = showFieldError('body')
  const bodyOk = showFieldOk('body', Boolean(form.body.trim()))
  const footerError = showFieldError('footer')
  const footerOk = Boolean(form.footer.trim()) && !errorsByField.footer && Boolean(touched.footer || submitAttempted)
  const buttonsError = showFieldError('buttons')
  const varExError = showFieldError('variableExamples')

  const stepTitle = WIZARD_STEPS[step]?.label ?? ''

  return (
    <div
      className="flex min-h-[calc(100vh-4rem)] flex-col"
      style={{
        background:
          'radial-gradient(1200px 480px at 12% -10%, rgba(66,184,100,0.10), transparent 55%), radial-gradient(900px 420px at 100% 0%, rgba(10,71,76,0.08), transparent 50%), var(--color-surface-muted)',
      }}
    >
      {/* Top bar */}
      <header
        className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3.5 md:px-8"
        style={{ borderColor: 'var(--color-border-subtle)', background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(8px)' }}
      >
        <div className="flex min-w-0 items-center gap-3">
          <Link
            to="/whatsapp-crm/templates"
            className="flex h-9 w-9 shrink-0 items-center justify-center border transition-colors hover:bg-[var(--color-surface-overlay)]"
            style={{ borderColor: 'var(--color-border-default)', borderRadius: 'var(--radius-sm)', color: 'var(--color-text-primary)' }}
            aria-label="Back to templates"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
              Templates
            </p>
            <h1 className="truncate text-[18px] font-bold leading-tight text-[var(--color-text-primary)]">
              New message template
            </h1>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleSubmit(false)}
            loading={submitPhase === 'creating' && !['submitting', 'waiting'].includes(submitPhase)}
            disabled={!formIsValid}
          >
            <Save className="h-3.5 w-3.5" /> Save draft
          </Button>
          <Button
            size="sm"
            onClick={() => handleSubmit(true)}
            loading={['creating', 'submitting', 'waiting'].includes(submitPhase)}
            disabled={!formIsValid}
          >
            <Send className="h-3.5 w-3.5" /> Submit to Meta
          </Button>
        </div>
      </header>

      <StepRail
        step={step}
        onSelect={setStep}
        stepHasError={(idx) => submitAttempted && stepErrors(idx).length > 0}
      />

      <div className="flex flex-1 flex-col lg:flex-row">
        {/* Editor */}
        <div className="flex min-w-0 flex-1 flex-col border-r" style={{ borderColor: 'var(--color-border-subtle)', background: 'var(--color-surface-default)' }}>
          <div className="flex-1 overflow-y-auto px-4 py-6 md:px-10">
            <div key={step} className="mx-auto max-w-[560px] animate-fade-in">
              <div className="mb-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-muted)]">
                  {step + 1} of {WIZARD_STEPS.length}
                </p>
                <h2 className="mt-1 text-[22px] font-bold tracking-tight text-[var(--color-text-primary)]">
                  {stepTitle}
                </h2>
              </div>

              {step === 0 && (
                <section className="space-y-6">
                  <div ref={(el) => { fieldRefs.current.name = el }}>
                    <label className={labelClass}>
                      Template name
                      <input
                        value={form.name}
                        onChange={(e) => {
                          setForm({ ...form, name: e.target.value })
                          markTouched('name')
                        }}
                        onBlur={() => markTouched('name')}
                        placeholder="pest_booking_confirm"
                        className={inputClass}
                        style={{ borderRadius: 'var(--radius-md)', borderColor: fieldBorder(nameError, nameOk) }}
                      />
                    </label>
                    <FieldFeedback error={nameError} ok={nameOk} hint="Lowercase letters, numbers, and underscores only." />
                  </div>

                  <div ref={(el) => { fieldRefs.current.category = el }}>
                    <p className={labelClass}>Category</p>
                    <div className="mt-2 grid gap-2 sm:grid-cols-3">
                      {CATEGORY_OPTIONS.map((opt) => {
                        const selected = form.category === opt.id
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => {
                              setForm({ ...form, category: opt.id })
                              markTouched('category')
                            }}
                            className="border px-3 py-3 text-left transition-colors"
                            style={{
                              borderRadius: 'var(--radius-md)',
                              borderColor: selected
                                ? 'var(--color-surface-base)'
                                : categoryError
                                  ? 'var(--color-feedback-critical)'
                                  : 'var(--color-border-default)',
                              background: selected ? 'var(--color-surface-muted)' : 'var(--color-surface-default)',
                              boxShadow: selected ? 'inset 0 0 0 1px var(--color-surface-base)' : undefined,
                            }}
                          >
                            <span className="block text-[13px] font-bold text-[var(--color-text-primary)]">{opt.title}</span>
                            <span className="mt-0.5 block text-[11px] text-[var(--color-text-muted)]">{opt.blurb}</span>
                          </button>
                        )
                      })}
                    </div>
                    <FieldFeedback
                      error={categoryError}
                      hint={categoryHint || CATEGORY_DESCRIPTIONS[form.category]}
                    />
                  </div>

                  <div className="relative" ref={(el) => { fieldRefs.current.language = el }}>
                    <label className={labelClass}>
                      Language
                      <input
                        value={langQuery}
                        onChange={(e) => { setLangQuery(e.target.value); setLangOpen(true); markTouched('language') }}
                        onFocus={() => setLangOpen(true)}
                        onBlur={() => markTouched('language')}
                        className={inputClass}
                        style={{ borderRadius: 'var(--radius-md)', borderColor: fieldBorder(languageError, languageOk) }}
                      />
                    </label>
                    <FieldFeedback error={languageError} ok={languageOk} />
                    {langOpen && (
                      <div
                        className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto border bg-[var(--color-surface-default)]"
                        style={{ borderColor: 'var(--color-border-default)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-1)' }}
                      >
                        {filteredLangs.map((lang) => (
                          <button
                            key={lang.code}
                            type="button"
                            className="block w-full px-3 py-2.5 text-left text-[13px] hover:bg-[var(--color-surface-muted)]"
                            onClick={() => {
                              setForm({ ...form, language: lang.code })
                              setLangQuery(lang.label)
                              setLangOpen(false)
                              markTouched('language')
                            }}
                          >
                            <span className="font-medium text-[var(--color-text-primary)]">{lang.label}</span>
                            <span className="ml-2 text-[var(--color-text-muted)]">{lang.code}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </section>
              )}

              {step === 1 && (
                <section className="space-y-6">
                  <div>
                    <p className={labelClass}>Header type</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {HEADER_OPTIONS.map((opt) => {
                        const selected = form.headerType === opt.id
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setForm({
                              ...form,
                              headerType: opt.id,
                              headerMediaAssetId: '',
                              headerMediaPreviewUrl: '',
                            })}
                            className="h-9 border px-3 text-[12px] font-semibold transition-colors"
                            style={{
                              borderRadius: 'var(--radius-sm)',
                              borderColor: selected ? 'var(--color-surface-base)' : 'var(--color-border-default)',
                              background: selected ? 'var(--color-surface-base)' : 'transparent',
                              color: selected ? 'var(--color-text-inverse)' : 'var(--color-text-primary)',
                            }}
                          >
                            {opt.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {form.headerType === 'text' && (
                    <div ref={(el) => { fieldRefs.current.headerText = el }}>
                      <label className={labelClass}>
                        Header text
                        <input
                          value={form.headerText}
                          onChange={(e) => {
                            setForm({ ...form, headerText: e.target.value })
                            markTouched('headerText')
                          }}
                          onBlur={() => markTouched('headerText')}
                          maxLength={60}
                          className={inputClass}
                          style={{ borderRadius: 'var(--radius-md)', borderColor: fieldBorder(headerError, headerOk) }}
                        />
                      </label>
                      <div className="mt-1 flex items-start justify-between gap-3">
                        <FieldFeedback error={headerError} ok={headerOk} />
                        <span className="shrink-0 text-[11px] text-[var(--color-text-muted)]">{form.headerText.length}/60</span>
                      </div>
                    </div>
                  )}

                  {['image', 'video', 'document'].includes(form.headerType) && (
                    <div ref={(el) => { fieldRefs.current.headerMedia = el }}>
                      <p className={labelClass}>Upload {form.headerType}</p>
                      <label
                        className="mt-2 flex cursor-pointer flex-col items-center gap-2 border border-dashed px-6 py-10 transition-colors hover:bg-[var(--color-surface-muted)]"
                        style={{
                          borderRadius: 'var(--radius-md)',
                          borderColor: mediaError
                            ? 'var(--color-feedback-critical)'
                            : form.headerMediaAssetId
                              ? 'var(--color-feedback-success)'
                              : 'var(--color-border-default)',
                        }}
                      >
                        <Upload className="h-5 w-5 text-[var(--color-text-muted)]" />
                        <span className="text-[13px] font-medium text-[var(--color-text-primary)]">
                          {form.headerMediaAssetId ? 'Replace file' : 'Choose file'}
                        </span>
                        <span className="text-[11px] text-[var(--color-text-muted)]">JPG or PNG · max 5 MB</span>
                        <input
                          type="file"
                          accept={form.headerType === 'image' ? 'image/jpeg,image/png' : undefined}
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (!file) return
                            if (file.size > 5 * 1024 * 1024) {
                              toast.error('File must be 5 MB or smaller.')
                              return
                            }
                            const preview = URL.createObjectURL(file)
                            setForm((prev) => ({ ...prev, headerMediaPreviewUrl: preview }))
                            markTouched('headerMedia')
                            uploadMedia.mutate(file)
                          }}
                        />
                      </label>
                      {uploadMedia.isPending && <p className="mt-2 text-[12px] text-[var(--color-text-muted)]">Uploading…</p>}
                      <FieldFeedback error={mediaError} ok={Boolean(form.headerMediaAssetId)} />
                    </div>
                  )}
                </section>
              )}

              {step === 2 && (
                <section className="space-y-6">
                  <div ref={(el) => { fieldRefs.current.body = el }}>
                    <p className={labelClass}>Message body</p>
                    <div
                      className="mt-2 overflow-hidden border"
                      style={{
                        borderRadius: 'var(--radius-md)',
                        borderColor: fieldBorder(bodyError, bodyOk),
                      }}
                    >
                      <div
                        className="flex flex-wrap items-center gap-1 border-b px-2 py-1.5"
                        style={{ borderColor: 'var(--color-border-subtle)', background: 'var(--color-surface-muted)' }}
                      >
                        {[
                          { label: 'B', title: 'Bold', wrapper: '*', className: 'font-bold' },
                          { label: 'I', title: 'Italic', wrapper: '_', className: 'italic' },
                          { label: 'S', title: 'Strike', wrapper: '~', className: 'line-through' },
                          { label: '<>', title: 'Monospace', wrapper: '```', className: 'font-mono text-[11px]' },
                        ].map((fmt) => (
                          <button
                            key={fmt.label}
                            type="button"
                            title={fmt.title}
                            onClick={() => applyBodyFormat(fmt.wrapper)}
                            className={`flex h-7 min-w-7 items-center justify-center px-1.5 text-[12px] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-default)] ${fmt.className}`}
                            style={{ borderRadius: 'var(--radius-xs)' }}
                          >
                            {fmt.label}
                          </button>
                        ))}
                        <span className="mx-1 h-4 w-px bg-[var(--color-border-default)]" />
                        <button
                          type="button"
                          onClick={() => {
                            setForm({ ...form, body: insertNextVariable(form.body) })
                            markTouched('body')
                          }}
                          className="inline-flex h-7 items-center gap-1 px-2 text-[11px] font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-surface-default)]"
                          style={{ borderRadius: 'var(--radius-xs)' }}
                        >
                          <Plus className="h-3 w-3" /> Variable
                        </button>
                        <span className="ml-auto pr-1 text-[11px] tabular-nums text-[var(--color-text-muted)]">
                          {form.body.length}/1024
                        </span>
                      </div>
                      <textarea
                        ref={bodyRef}
                        value={form.body}
                        onChange={(e) => {
                          setForm({ ...form, body: e.target.value })
                          markTouched('body')
                        }}
                        onBlur={() => markTouched('body')}
                        rows={9}
                        maxLength={1024}
                        placeholder={"Hello {{1}},\n\nYour booking {{2}} is confirmed."}
                        className="w-full resize-y border-0 bg-transparent px-3 py-3 text-[14px] leading-relaxed text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-muted)]"
                      />
                    </div>
                    <FieldFeedback error={bodyError} ok={bodyOk} />
                  </div>

                  {variableNums.length > 0 && (
                    <div ref={(el) => { fieldRefs.current.variableExamples = el }} className="space-y-3">
                      <p className={labelClass}>Sample values for variables</p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {variableNums.map((num) => (
                          <label key={num} className="block text-[12px] font-semibold text-[var(--color-text-secondary)]">
                            {`{{${num}}}`}
                            <input
                              value={form.variableExamples[num] || ''}
                              onChange={(e) => updateVariableExample(num, e.target.value)}
                              onBlur={() => markTouched('variableExamples')}
                              placeholder={num === 1 ? 'Adnan' : num === 2 ? 'ORD12345' : 'Example'}
                              className={`mt-1.5 ${inputClass}`}
                              style={{
                                borderRadius: 'var(--radius-md)',
                                borderColor: fieldBorder(
                                  varExError && !form.variableExamples[num]?.trim() ? varExError : undefined,
                                  Boolean(form.variableExamples[num]?.trim()),
                                ),
                              }}
                            />
                          </label>
                        ))}
                      </div>
                      <FieldFeedback
                        error={varExError}
                        ok={!varExError && variableNums.every((n) => form.variableExamples[n]?.trim())}
                      />
                    </div>
                  )}
                </section>
              )}

              {step === 3 && (
                <section className="space-y-2">
                  <div ref={(el) => { fieldRefs.current.footer = el }}>
                    <label className={labelClass}>
                      Footer text
                      <span className="ml-2 font-normal normal-case tracking-normal text-[var(--color-text-muted)]">(optional)</span>
                      <input
                        value={form.footer}
                        onChange={(e) => {
                          setForm({ ...form, footer: e.target.value })
                          markTouched('footer')
                        }}
                        onBlur={() => markTouched('footer')}
                        maxLength={60}
                        placeholder="Pest Control 99"
                        className={inputClass}
                        style={{ borderRadius: 'var(--radius-md)', borderColor: fieldBorder(footerError, form.footer.trim() ? footerOk : false) }}
                      />
                    </label>
                    <div className="mt-1 flex items-start justify-between gap-3">
                      <FieldFeedback error={footerError} ok={Boolean(form.footer.trim()) && footerOk} />
                      <span className="shrink-0 text-[11px] text-[var(--color-text-muted)]">{form.footer.length}/60</span>
                    </div>
                  </div>
                </section>
              )}

              {step === 4 && (
                <section className="space-y-5" ref={(el) => { fieldRefs.current.buttons = el }}>
                  <p className="text-[13px] text-[var(--color-text-muted)]">
                    Up to 2 CTA buttons, or up to 10 quick replies — not both.
                  </p>
                  {buttonAddState.usageHint && (
                    <p className="text-[12px] font-medium text-[var(--color-text-secondary)]">{buttonAddState.usageHint}</p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {([
                      { type: 'quick_reply' as const, label: 'Quick reply', enabled: buttonAddState.canAddQuickReply },
                      { type: 'url' as const, label: 'Website', enabled: buttonAddState.canAddCta },
                      { type: 'phone_number' as const, label: 'Call', enabled: buttonAddState.canAddCta },
                      { type: 'copy_code' as const, label: 'Copy code', enabled: buttonAddState.canAddCta },
                    ]).map((item) => (
                      <button
                        key={item.type}
                        type="button"
                        disabled={!item.enabled}
                        onClick={() => addButton(item.type)}
                        className="inline-flex h-9 items-center gap-1 border px-3 text-[12px] font-semibold disabled:opacity-40"
                        style={{
                          borderRadius: 'var(--radius-sm)',
                          borderColor: 'var(--color-border-strong)',
                          color: 'var(--color-text-primary)',
                        }}
                      >
                        <Plus className="h-3 w-3" /> {item.label}
                      </button>
                    ))}
                  </div>
                  <FieldFeedback error={buttonsError} />

                  <div className="space-y-3">
                    {form.buttons.map((btn, index) => (
                      <div
                        key={btn.id}
                        className="space-y-3 border-t pt-4"
                        style={{ borderColor: 'var(--color-border-subtle)' }}
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--color-text-muted)]">
                            Button {index + 1} · {btn.type.replace('_', ' ')}
                          </p>
                          <button
                            type="button"
                            onClick={() => requestDelete({
                              itemName: btn.text || 'Untitled button',
                              itemType: 'template button',
                              associatedDataMessage:
                                'This removes the button from your draft template only. It is not deleted from Meta until you save and submit changes.',
                              onConfirm: () => removeButton(btn.id),
                            })}
                            className="text-[var(--color-feedback-critical)] hover:opacity-80"
                            aria-label="Remove button"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <input
                          value={btn.text}
                          onChange={(e) => updateButton(btn.id, { text: e.target.value })}
                          placeholder="Button label"
                          maxLength={25}
                          className={inputClass}
                          style={{ borderRadius: 'var(--radius-md)', borderColor: 'var(--color-border-default)' }}
                        />
                        {btn.type === 'url' && (
                          <input
                            value={btn.value}
                            onChange={(e) => updateButton(btn.id, { value: e.target.value })}
                            placeholder="https://example.com"
                            className={inputClass}
                            style={{ borderRadius: 'var(--radius-md)', borderColor: 'var(--color-border-default)' }}
                          />
                        )}
                        {btn.type === 'phone_number' && (
                          <input
                            value={btn.value}
                            onChange={(e) => updateButton(btn.id, { value: e.target.value })}
                            placeholder="+919372792693"
                            className={inputClass}
                            style={{ borderRadius: 'var(--radius-md)', borderColor: 'var(--color-border-default)' }}
                          />
                        )}
                        {btn.type === 'copy_code' && (
                          <input
                            value={btn.value}
                            onChange={(e) => updateButton(btn.id, { value: e.target.value })}
                            placeholder="458921"
                            className={inputClass}
                            style={{ borderRadius: 'var(--radius-md)', borderColor: 'var(--color-border-default)' }}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {step === 5 && (
                <section className="space-y-6">
                  {errors.length === 0 ? (
                    <FeedbackMessage variant="success">Ready to submit — all checks passed.</FeedbackMessage>
                  ) : (
                    <FeedbackMessage variant="error">
                      <p className="font-semibold">Fix before submitting</p>
                      <ul className="mt-2 space-y-1 font-normal">
                        {errors.map((e) => (
                          <li key={`${e.field}-${e.message}`}>
                            <button
                              type="button"
                              className="text-left underline-offset-2 hover:underline"
                              onClick={() => {
                                setStep(FIELD_STEP[e.field] ?? 0)
                                requestAnimationFrame(() => scrollToField(e.field))
                              }}
                            >
                              {e.message}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </FeedbackMessage>
                  )}

                  <dl className="grid gap-0 text-[13px]">
                    {[
                      ['Name', form.name || '—'],
                      ['Category', form.category],
                      ['Language', form.language],
                      ['Buttons', String(form.buttons.length || 'None')],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        className="flex items-baseline justify-between gap-4 border-b py-3"
                        style={{ borderColor: 'var(--color-border-subtle)' }}
                      >
                        <dt className="text-[var(--color-text-muted)]">{label}</dt>
                        <dd className="font-semibold capitalize text-[var(--color-text-primary)]">{value}</dd>
                      </div>
                    ))}
                  </dl>

                  {submitPhase !== 'idle' && (
                    <div className="space-y-2">
                      {['creating', 'submitting', 'waiting'].includes(submitPhase) && (
                        <p className="flex items-center gap-2 text-[13px] text-[var(--color-text-secondary)]">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          {submitPhase === 'creating' && 'Creating template…'}
                          {submitPhase === 'submitting' && 'Submitting to Meta…'}
                          {submitPhase === 'waiting' && 'Waiting for approval…'}
                        </p>
                      )}
                      {submitPhase === 'completed' && (
                        <FeedbackMessage variant="success">Done — opening templates…</FeedbackMessage>
                      )}
                      {submitPhase === 'error' && (
                        <FeedbackMessage variant="error">
                          <p className="font-semibold">{submitError}</p>
                          {submitFix && <p className="mt-1 font-normal">{submitFix}</p>}
                        </FeedbackMessage>
                      )}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    <Button variant="ghost" onClick={() => handleSubmit(false)} loading={submitPhase === 'creating'} disabled={!formIsValid}>
                      <Save className="h-4 w-4" /> Save draft
                    </Button>
                    <Button onClick={() => handleSubmit(true)} disabled={!formIsValid} loading={['creating', 'submitting', 'waiting'].includes(submitPhase)}>
                      <Send className="h-4 w-4" /> Submit to Meta
                    </Button>
                    <Button
                      variant="secondary"
                      type="button"
                      onClick={() => setForm({ ...INITIAL_TEMPLATE_FORM, ...TEMPLATE_PRESETS.login_otp })}
                    >
                      <Copy className="h-4 w-4" /> OTP preset
                    </Button>
                  </div>
                </section>
              )}
            </div>
          </div>

          <footer
            className="flex items-center justify-between gap-3 border-t px-4 py-3 md:px-10"
            style={{ borderColor: 'var(--color-border-subtle)', background: 'var(--color-surface-default)' }}
          >
            <Button variant="ghost" size="sm" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
              <ArrowLeft className="h-3.5 w-3.5" /> Back
            </Button>
            {step < WIZARD_STEPS.length - 1 ? (
              <Button size="sm" onClick={goNext}>
                Continue <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            ) : (
              <Button size="sm" onClick={() => handleSubmit(true)} disabled={!formIsValid} loading={['creating', 'submitting', 'waiting'].includes(submitPhase)}>
                Submit to Meta
              </Button>
            )}
          </footer>
        </div>

        {/* Preview stage */}
        <aside
          className="sticky top-0 flex w-full shrink-0 flex-col items-center justify-start px-4 py-8 lg:w-[340px] lg:min-h-full xl:w-[380px]"
          style={{
            background:
              'linear-gradient(165deg, #0a474c 0%, #0d5c62 42%, #146b55 100%)',
          }}
        >
          <div className="mb-5 w-full max-w-[280px] text-center lg:text-left">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/55">Live preview</p>
            <p className="mt-1 text-[15px] font-bold text-white">
              {organization?.name || 'Your business'}
            </p>
          </div>
          <div className="flex justify-center">
            <TemplatePreview form={form} businessName={organization?.name || 'Your Business'} compact hideCaption />
          </div>
        </aside>
      </div>
      {deleteDialog}
    </div>
  )
}
