import { useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft, ArrowRight, CheckCircle2, Copy, Loader2, Plus, Save, Send, Trash2, Upload,
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
]

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
    return <p className="mt-1 text-xs font-medium text-red-600">❌ {error}</p>
  }
  if (ok) {
    return (
      <p className="mt-1 flex items-center gap-1 text-xs font-medium text-emerald-600">
        <CheckCircle2 className="h-3.5 w-3.5" /> Looks good
      </p>
    )
  }
  if (hint) {
    return <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>{hint}</p>
  }
  return null
}

function fieldBorder(error?: string, ok?: boolean) {
  if (error) return '#dc2626'
  if (ok) return '#059669'
  return 'var(--border)'
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

  const inputClass = 'h-11 w-full rounded-lg border px-3 py-2 text-sm focus:border-[#1876f2] focus:outline-none'
  const labelClass = 'space-y-1.5 text-sm font-medium block'

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

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col">
      <div className="flex items-center justify-between border-b px-4 py-4 md:px-6" style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-card)' }}>
        <div className="flex items-center gap-3">
          <Link to="/whatsapp-crm/templates" className="rounded-lg p-2 hover:bg-[var(--hover)]">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Create WhatsApp Template</h1>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Live validation and preview — fix issues as you type</p>
          </div>
        </div>
        <div className="hidden gap-2 sm:flex">
          <Button
            variant="ghost"
            onClick={() => handleSubmit(false)}
            loading={submitPhase === 'creating'}
            disabled={!formIsValid}
          >
            <Save className="h-4 w-4" /> Save Draft
          </Button>
          <Button
            onClick={() => handleSubmit(true)}
            loading={['creating', 'submitting', 'waiting'].includes(submitPhase)}
            disabled={!formIsValid}
          >
            <Send className="h-4 w-4" /> Submit to Meta
          </Button>
        </div>
      </div>

      <div className="flex flex-1 flex-col lg:flex-row">
        <div className="flex w-full flex-col border-r lg:w-[60%]" style={{ borderColor: 'var(--border-subtle)' }}>
          <div className="flex gap-1 overflow-x-auto border-b px-4 py-3" style={{ borderColor: 'var(--border-subtle)' }}>
            {WIZARD_STEPS.map((s, idx) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setStep(idx)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  step === idx ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {idx + 1}. {s.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-5 md:px-6">
            {step === 0 && (
              <section className="space-y-4">
                <h2 className="text-base font-bold">Step 1 — Template Basics</h2>
                <label className={labelClass} style={{ color: 'var(--text-primary)' }} ref={(el) => { fieldRefs.current.name = el }}>
                  Template Name
                  <input
                    value={form.name}
                    onChange={(e) => {
                      setForm({ ...form, name: e.target.value })
                      markTouched('name')
                    }}
                    onBlur={() => markTouched('name')}
                    placeholder="pest_booking_confirm"
                    className={inputClass}
                    style={{ background: 'var(--bg)', borderColor: fieldBorder(nameError, nameOk) }}
                  />
                  <FieldFeedback
                    error={nameError}
                    ok={nameOk}
                    hint="Example: pest_booking_confirm"
                  />
                </label>

                <label className={labelClass} style={{ color: 'var(--text-primary)' }} ref={(el) => { fieldRefs.current.category = el }}>
                  Category
                  <select
                    value={form.category}
                    onChange={(e) => {
                      setForm({ ...form, category: e.target.value as TemplateBuilderForm['category'] })
                      markTouched('category')
                    }}
                    onBlur={() => markTouched('category')}
                    className={inputClass}
                    style={{ background: 'var(--bg)', borderColor: fieldBorder(categoryError, !categoryError && Boolean(touched.category || submitAttempted)) }}
                  >
                    <option value="utility">Utility — transactional updates</option>
                    <option value="marketing">Marketing — offers & promotions</option>
                    <option value="authentication">Authentication — OTP / login</option>
                  </select>
                  <FieldFeedback
                    error={categoryError}
                    hint={categoryHint || CATEGORY_DESCRIPTIONS[form.category]}
                  />
                </label>

                <div className="relative" ref={(el) => { fieldRefs.current.language = el }}>
                  <label className={labelClass} style={{ color: 'var(--text-primary)' }}>
                    Language
                    <input
                      value={langQuery}
                      onChange={(e) => { setLangQuery(e.target.value); setLangOpen(true); markTouched('language') }}
                      onFocus={() => setLangOpen(true)}
                      onBlur={() => markTouched('language')}
                      className={inputClass}
                      style={{ background: 'var(--bg)', borderColor: fieldBorder(languageError, languageOk) }}
                    />
                  </label>
                  <FieldFeedback error={languageError} ok={languageOk} />
                  {langOpen && (
                    <div className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border bg-white shadow-lg" style={{ borderColor: 'var(--border)' }}>
                      {filteredLangs.map((lang) => (
                        <button
                          key={lang.code}
                          type="button"
                          className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
                          onClick={() => {
                            setForm({ ...form, language: lang.code })
                            setLangQuery(lang.label)
                            setLangOpen(false)
                            markTouched('language')
                          }}
                        >
                          {lang.label} <span className="text-slate-400">({lang.code})</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            )}

            {step === 1 && (
              <section className="space-y-4">
                <h2 className="text-base font-bold">Step 2 — Header</h2>
                <label className={labelClass} style={{ color: 'var(--text-primary)' }}>
                  Header Type
                  <select
                    value={form.headerType}
                    onChange={(e) => setForm({
                      ...form,
                      headerType: e.target.value as TemplateBuilderForm['headerType'],
                      headerMediaAssetId: '',
                      headerMediaPreviewUrl: '',
                    })}
                    className={inputClass}
                    style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}
                  >
                    <option value="none">None</option>
                    <option value="text">Text</option>
                    <option value="image">Image</option>
                    <option value="video">Video</option>
                    <option value="document">Document</option>
                  </select>
                </label>

                {form.headerType === 'text' && (
                  <label className={labelClass} ref={(el) => { fieldRefs.current.headerText = el }} style={{ color: 'var(--text-primary)' }}>
                    Header Text
                    <input
                      value={form.headerText}
                      onChange={(e) => {
                        setForm({ ...form, headerText: e.target.value })
                        markTouched('headerText')
                      }}
                      onBlur={() => markTouched('headerText')}
                      maxLength={60}
                      className={inputClass}
                      style={{ background: 'var(--bg)', borderColor: fieldBorder(headerError, headerOk) }}
                    />
                    <p className="text-xs text-right" style={{ color: 'var(--text-muted)' }}>{form.headerText.length} / 60</p>
                    <FieldFeedback error={headerError} ok={headerOk} />
                  </label>
                )}

                {['image', 'video', 'document'].includes(form.headerType) && (
                  <div ref={(el) => { fieldRefs.current.headerMedia = el }}>
                    <p className="mb-2 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      Upload {form.headerType} (JPG/PNG, max 5 MB)
                    </p>
                    <label
                      className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed px-6 py-8"
                      style={{ borderColor: mediaError ? '#dc2626' : form.headerMediaAssetId ? '#059669' : 'var(--border)' }}
                    >
                      <Upload className="h-6 w-6 text-slate-400" />
                      <span className="text-sm text-slate-600">Click to upload</span>
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
                    {uploadMedia.isPending && <p className="mt-2 text-xs text-slate-500">Uploading...</p>}
                    <FieldFeedback error={mediaError} ok={Boolean(form.headerMediaAssetId)} />
                  </div>
                )}
              </section>
            )}

            {step === 2 && (
              <section className="space-y-4">
                <h2 className="text-base font-bold">Step 3 — Body</h2>
                <div ref={(el) => { fieldRefs.current.body = el }}>
                  <label className={labelClass} style={{ color: 'var(--text-primary)' }}>
                    Message Body
                    <div className="mb-2 flex flex-wrap gap-1.5">
                      {[
                        { label: 'B', title: 'Bold (*text*)', wrapper: '*' },
                        { label: 'I', title: 'Italic (_text_)', wrapper: '_' },
                        { label: 'S', title: 'Strikethrough (~text~)', wrapper: '~' },
                        { label: '<>', title: 'Monospace (```text```)', wrapper: '```' },
                      ].map((fmt) => (
                        <button
                          key={fmt.label}
                          type="button"
                          title={fmt.title}
                          onClick={() => applyBodyFormat(fmt.wrapper)}
                          className="rounded border px-2 py-1 text-xs font-bold hover:bg-[var(--hover)]"
                          style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                        >
                          {fmt.label}
                        </button>
                      ))}
                    </div>
                    <textarea
                      ref={bodyRef}
                      value={form.body}
                      onChange={(e) => {
                        setForm({ ...form, body: e.target.value })
                        markTouched('body')
                      }}
                      onBlur={() => markTouched('body')}
                      rows={8}
                      maxLength={1024}
                      placeholder={"Hello {{1}},\n\nYour booking *{{2}}* is confirmed for _{{3}}_."}
                      className="w-full rounded-lg border px-3 py-2 text-sm focus:border-[#1876f2] focus:outline-none"
                      style={{ background: 'var(--bg)', borderColor: fieldBorder(bodyError, bodyOk) }}
                    />
                  </label>
                  <div className="flex items-center justify-between">
                    <Button size="sm" variant="secondary" type="button" onClick={() => {
                      setForm({ ...form, body: insertNextVariable(form.body) })
                      markTouched('body')
                    }}>
                      <Plus className="h-3 w-3" /> Variable
                    </Button>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{form.body.length} / 1024</span>
                  </div>
                  <FieldFeedback error={bodyError} ok={bodyOk} />
                </div>

                {variableNums.length > 0 && (
                  <div ref={(el) => { fieldRefs.current.variableExamples = el }} className="space-y-3 rounded-xl border p-4" style={{ borderColor: varExError ? '#dc2626' : 'var(--border-subtle)' }}>
                    <p className="text-sm font-semibold">Variable Examples (required for Meta)</p>
                    {variableNums.map((num) => (
                      <label key={num} className="block text-sm">
                        {`{{${num}}}`}
                        <input
                          value={form.variableExamples[num] || ''}
                          onChange={(e) => updateVariableExample(num, e.target.value)}
                          onBlur={() => markTouched('variableExamples')}
                          placeholder={num === 1 ? 'Adnan' : num === 2 ? 'ORD12345' : 'Example'}
                          className={`mt-1 ${inputClass}`}
                          style={{
                            background: 'var(--bg)',
                            borderColor: fieldBorder(
                              varExError && !form.variableExamples[num]?.trim() ? varExError : undefined,
                              Boolean(form.variableExamples[num]?.trim()),
                            ),
                          }}
                        />
                      </label>
                    ))}
                    <FieldFeedback error={varExError} ok={!varExError && variableNums.every((n) => form.variableExamples[n]?.trim())} />
                  </div>
                )}
              </section>
            )}

            {step === 3 && (
              <section className="space-y-4">
                <h2 className="text-base font-bold">Step 4 — Footer (optional)</h2>
                <label className={labelClass} ref={(el) => { fieldRefs.current.footer = el }} style={{ color: 'var(--text-primary)' }}>
                  Footer Text
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
                    style={{ background: 'var(--bg)', borderColor: fieldBorder(footerError, form.footer.trim() ? footerOk : false) }}
                  />
                  <p className="text-xs text-right" style={{ color: 'var(--text-muted)' }}>{form.footer.length} / 60</p>
                  <FieldFeedback error={footerError} ok={Boolean(form.footer.trim()) && footerOk} />
                </label>
              </section>
            )}

            {step === 4 && (
              <section className="space-y-4" ref={(el) => { fieldRefs.current.buttons = el }}>
                <h2 className="text-base font-bold">Step 5 — Buttons</h2>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Max 2 CTA buttons (Website / Call / Copy Code) OR up to 10 Quick Replies.
                </p>
                {buttonAddState.usageHint && (
                  <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                    {buttonAddState.usageHint}
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="secondary" type="button" disabled={!buttonAddState.canAddQuickReply} onClick={() => addButton('quick_reply')}>
                    + Quick Reply
                  </Button>
                  <Button size="sm" variant="secondary" type="button" disabled={!buttonAddState.canAddCta} onClick={() => addButton('url')}>
                    + Website
                  </Button>
                  <Button size="sm" variant="secondary" type="button" disabled={!buttonAddState.canAddCta} onClick={() => addButton('phone_number')}>
                    + Call Phone
                  </Button>
                  <Button size="sm" variant="secondary" type="button" disabled={!buttonAddState.canAddCta} onClick={() => addButton('copy_code')}>
                    + Copy Code
                  </Button>
                </div>
                <FieldFeedback error={buttonsError} />

                {form.buttons.map((btn) => (
                  <div key={btn.id} className="rounded-xl border p-4 space-y-3" style={{ borderColor: buttonsError ? '#fecaca' : 'var(--border-subtle)' }}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase text-slate-500">{btn.type.replace('_', ' ')}</span>
                      <button
                        type="button"
                        onClick={() => requestDelete({
                          itemName: btn.text || 'Untitled button',
                          itemType: 'template button',
                          associatedDataMessage:
                            'This removes the button from your draft template only. It is not deleted from Meta until you save and submit changes.',
                          onConfirm: () => removeButton(btn.id),
                        })}
                        className="text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <input
                      value={btn.text}
                      onChange={(e) => updateButton(btn.id, { text: e.target.value })}
                      placeholder="Button text (max 25)"
                      maxLength={25}
                      className={inputClass}
                      style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}
                    />
                    {btn.type === 'url' && (
                      <input
                        value={btn.value}
                        onChange={(e) => updateButton(btn.id, { value: e.target.value })}
                        placeholder="https://example.com"
                        className={inputClass}
                        style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}
                      />
                    )}
                    {btn.type === 'phone_number' && (
                      <input
                        value={btn.value}
                        onChange={(e) => updateButton(btn.id, { value: e.target.value })}
                        placeholder="+919372792693"
                        className={inputClass}
                        style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}
                      />
                    )}
                    {btn.type === 'copy_code' && (
                      <input
                        value={btn.value}
                        onChange={(e) => updateButton(btn.id, { value: e.target.value })}
                        placeholder="458921"
                        className={inputClass}
                        style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}
                      />
                    )}
                  </div>
                ))}
              </section>
            )}

            {step === 5 && (
              <section className="space-y-4">
                <h2 className="text-base font-bold">Step 6 — Review & Submit</h2>
                {errors.length === 0 ? (
                  <FeedbackMessage variant="success">
                    All validations passed. Ready to submit.
                  </FeedbackMessage>
                ) : (
                  <FeedbackMessage variant="error">
                    <p className="font-semibold">Fix these before submitting:</p>
                    <ul className="mt-1 space-y-0.5 font-normal">
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
                            • {e.message}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </FeedbackMessage>
                )}

                <dl className="grid gap-2 text-sm">
                  <div className="flex justify-between border-b py-2" style={{ borderColor: 'var(--border-subtle)' }}>
                    <dt className="text-slate-500">Name</dt><dd className="font-medium">{form.name || '—'}</dd>
                  </div>
                  <div className="flex justify-between border-b py-2" style={{ borderColor: 'var(--border-subtle)' }}>
                    <dt className="text-slate-500">Category</dt><dd className="capitalize">{form.category}</dd>
                  </div>
                  <div className="flex justify-between border-b py-2" style={{ borderColor: 'var(--border-subtle)' }}>
                    <dt className="text-slate-500">Language</dt><dd>{form.language}</dd>
                  </div>
                  <div className="flex justify-between py-2">
                    <dt className="text-slate-500">Buttons</dt><dd>{form.buttons.length || 'None'}</dd>
                  </div>
                </dl>

                {submitPhase !== 'idle' && (
                  <div className="space-y-2">
                    {submitPhase === 'creating' && (
                      <div className="rounded-xl border p-4 text-sm" style={{ borderColor: 'var(--border-subtle)' }}>
                        <p className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Creating template...</p>
                      </div>
                    )}
                    {submitPhase === 'submitting' && (
                      <div className="rounded-xl border p-4 text-sm" style={{ borderColor: 'var(--border-subtle)' }}>
                        <p className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Submitting to Meta...</p>
                      </div>
                    )}
                    {submitPhase === 'waiting' && (
                      <div className="rounded-xl border p-4 text-sm" style={{ borderColor: 'var(--border-subtle)' }}>
                        <p className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Waiting for approval...</p>
                      </div>
                    )}
                    {submitPhase === 'completed' && (
                      <FeedbackMessage variant="success">Completed — redirecting to templates...</FeedbackMessage>
                    )}
                    {submitPhase === 'error' && (
                      <FeedbackMessage variant="error">
                        <p className="font-semibold">Meta / validation error</p>
                        <p className="mt-1 font-normal">{submitError}</p>
                        {submitFix && (
                          <p className="mt-2 font-normal text-red-800">
                            <span className="font-semibold">How to fix:</span> {submitFix}
                          </p>
                        )}
                      </FeedbackMessage>
                    )}
                  </div>
                )}

                <div className="flex flex-wrap gap-2 pt-2">
                  <Button
                    variant="ghost"
                    onClick={() => handleSubmit(false)}
                    loading={submitPhase === 'creating'}
                    disabled={!formIsValid}
                  >
                    <Save className="h-4 w-4" /> Save Draft
                  </Button>
                  <Button onClick={() => handleSubmit(true)} disabled={!formIsValid} loading={['creating', 'submitting', 'waiting'].includes(submitPhase)}>
                    <Send className="h-4 w-4" /> Submit to Meta
                  </Button>
                  <Button variant="secondary" type="button" onClick={() => setForm({ ...INITIAL_TEMPLATE_FORM, ...TEMPLATE_PRESETS.login_otp })}>
                    <Copy className="h-4 w-4" /> Load OTP preset
                  </Button>
                </div>
              </section>
            )}
          </div>

          <div className="flex justify-between border-t px-4 py-3 md:px-6" style={{ borderColor: 'var(--border-subtle)' }}>
            <Button variant="ghost" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            {step < WIZARD_STEPS.length - 1 && (
              <Button onClick={goNext}>
                Next <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="sticky top-0 flex w-full shrink-0 items-start justify-center bg-slate-50 px-4 py-6 lg:w-[300px] lg:min-h-full xl:w-[320px]">
          <TemplatePreview form={form} businessName={organization?.name || 'Your Business'} />
        </div>
      </div>
      {deleteDialog}
    </div>
  )
}
