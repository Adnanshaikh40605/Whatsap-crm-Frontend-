import { useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft, ArrowRight, Copy, Loader2, Plus, Save, Send, Trash2, Upload,
} from 'lucide-react'
import { campaignApi } from '../lib/api'
import { filterLanguages } from '../lib/metaLanguages'
import {
  CATEGORY_DESCRIPTIONS,
  INITIAL_TEMPLATE_FORM,
  TEMPLATE_PRESETS,
  buildTemplatePayload,
  extractVariableNumbers,
  insertNextVariable,
  isTemplateFormValid,
  templateToPreviewForm,
  validateTemplateForm,
  type FieldError,
  type TemplateBuilderForm,
  type TemplateButton,
} from '../lib/templateBuilder'
import { TemplatePreview } from '../components/templates/TemplatePreview'
import { Button } from '../components/ui/Button'
import { useDeleteConfirm } from '../hooks/useDeleteConfirm'
import { FeedbackMessage, useToast } from '../components/common'
import type { WhatsAppTemplate } from '../types/bot'

const WIZARD_STEPS = [
  { id: 'basics', label: 'Basics' },
  { id: 'header', label: 'Header' },
  { id: 'body', label: 'Body' },
  { id: 'footer', label: 'Footer' },
  { id: 'buttons', label: 'Buttons' },
  { id: 'review', label: 'Review' },
]

type SubmitPhase = 'idle' | 'creating' | 'submitting' | 'waiting' | 'completed' | 'error'

function newButtonId() {
  return `btn_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}

function FieldHint({ error }: { error?: string }) {
  if (!error) return null
  return <p className="mt-1 text-xs text-red-600">❌ {error}</p>
}

export function CreateTemplatePage() {
  const navigate = useNavigate()
  const toast = useToast()
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<TemplateBuilderForm>(INITIAL_TEMPLATE_FORM)
  const [langQuery, setLangQuery] = useState('English (US)')
  const [langOpen, setLangOpen] = useState(false)
  const [submitPhase, setSubmitPhase] = useState<SubmitPhase>('idle')
  const [submitError, setSubmitError] = useState('')
  const fieldRefs = useRef<Record<string, HTMLElement | null>>({})

  const { data: templatesData } = useQuery({
    queryKey: ['templates'],
    queryFn: () => campaignApi.templates().then((r) => r.data.results ?? r.data.data ?? r.data),
  })

  const allTemplates = (templatesData as WhatsAppTemplate[]) ?? []
  const existingNames = allTemplates
    .filter((t) => t.language === form.language)
    .map((t) => t.name)

  const errors = useMemo(() => validateTemplateForm(form, existingNames), [form, existingNames])
  const errorsByField = useMemo(() => {
    const map: Record<string, string> = {}
    errors.forEach((e) => { map[e.field] = e.message })
    return map
  }, [errors])

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
      scrollToField(current[0].field)
      return
    }
    setStep((s) => Math.min(s + 1, WIZARD_STEPS.length - 1))
  }

  const handleSubmit = async (submitToMeta: boolean) => {
    const allErrors = validateTemplateForm(form, existingNames)
    if (allErrors.length) {
      scrollToField(allErrors[0].field)
      setStep(allErrors[0].field === 'name' ? 0 : allErrors[0].field.startsWith('header') ? 1 : 2)
      return
    }

    setSubmitError('')
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
      queryClient.invalidateQueries({ queryKey: ['templates'] })
      setTimeout(() => navigate('/whatsapp-crm/templates'), 1500)
    } catch (err: unknown) {
      setSubmitPhase('error')
      const data = (err as { response?: { data?: Record<string, unknown> } })?.response?.data || {}
      const errObj = (data.error || data) as Record<string, unknown>
      const submitField = errObj.submit_to_meta
      let text = 'Failed to create template. Check Meta credentials and try again.'
      if (Array.isArray(submitField) && submitField[0]) {
        text = String(submitField[0])
      } else if (typeof data.message === 'string') {
        text = data.message
      } else if (typeof errObj.message === 'string') {
        text = errObj.message
      } else if (errObj.error && typeof errObj.error === 'object') {
        text = String((errObj.error as { message?: string }).message || JSON.stringify(errObj.error))
      }
      setSubmitError(text)
    }
  }

  const updateVariableExample = (num: number, value: string) => {
    setForm((prev) => ({
      ...prev,
      variableExamples: { ...prev.variableExamples, [num]: value },
    }))
  }

  const addButton = (type: TemplateButton['type']) => {
    setForm((prev) => ({
      ...prev,
      buttons: [...prev.buttons, { id: newButtonId(), type, text: '', value: '' }],
    }))
  }

  const updateButton = (id: string, patch: Partial<TemplateButton>) => {
    setForm((prev) => ({
      ...prev,
      buttons: prev.buttons.map((b) => (b.id === id ? { ...b, ...patch } : b)),
    }))
  }

  const removeButton = (id: string) => {
    setForm((prev) => ({ ...prev, buttons: prev.buttons.filter((b) => b.id !== id) }))
  }

  const inputClass = 'h-11 w-full rounded-lg border px-3 py-2 text-sm focus:border-[#1876f2] focus:outline-none'
  const labelClass = 'space-y-1.5 text-sm font-medium block'

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col">
      <div className="flex items-center justify-between border-b px-4 py-4 md:px-6" style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-card)' }}>
        <div className="flex items-center gap-3">
          <Link to="/whatsapp-crm/templates" className="rounded-lg p-2 hover:bg-[var(--hover)]">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Create WhatsApp Template</h1>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Full-page builder with Meta validations and live preview</p>
          </div>
        </div>
        <div className="hidden gap-2 sm:flex">
          <Button variant="ghost" onClick={() => handleSubmit(false)} loading={submitPhase === 'creating'}>
            <Save className="h-4 w-4" /> Save Draft
          </Button>
          <Button
            onClick={() => handleSubmit(true)}
            loading={['creating', 'submitting', 'waiting'].includes(submitPhase)}
            disabled={!isTemplateFormValid(form, existingNames)}
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
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="booking_confirmation"
                    className={inputClass}
                    style={{ background: 'var(--bg)', borderColor: errorsByField.name ? '#dc2626' : 'var(--border)' }}
                  />
                  <FieldHint error={errorsByField.name} />
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Lowercase, numbers, underscores only. Max 512 chars.</p>
                </label>

                <label className={labelClass} style={{ color: 'var(--text-primary)' }}>
                  Category
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value as TemplateBuilderForm['category'] })}
                    className={inputClass}
                    style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}
                  >
                    <option value="authentication">Authentication</option>
                    <option value="utility">Utility</option>
                    <option value="marketing">Marketing</option>
                  </select>
                  <p className="text-xs italic" style={{ color: 'var(--text-muted)' }}>{CATEGORY_DESCRIPTIONS[form.category]}</p>
                </label>

                <div className="relative" ref={(el) => { fieldRefs.current.language = el }}>
                  <label className={labelClass} style={{ color: 'var(--text-primary)' }}>
                    Language
                    <input
                      value={langQuery}
                      onChange={(e) => { setLangQuery(e.target.value); setLangOpen(true) }}
                      onFocus={() => setLangOpen(true)}
                      className={inputClass}
                      style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}
                    />
                  </label>
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
                      onChange={(e) => setForm({ ...form, headerText: e.target.value })}
                      maxLength={60}
                      className={inputClass}
                      style={{ background: 'var(--bg)', borderColor: errorsByField.headerText ? '#dc2626' : 'var(--border)' }}
                    />
                    <p className="text-xs text-right" style={{ color: 'var(--text-muted)' }}>{form.headerText.length} / 60</p>
                    <FieldHint error={errorsByField.headerText} />
                  </label>
                )}

                {['image', 'video', 'document'].includes(form.headerType) && (
                  <div ref={(el) => { fieldRefs.current.headerMedia = el }}>
                    <p className="mb-2 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      Upload {form.headerType} (JPG/PNG, max 5 MB)
                    </p>
                    <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed px-6 py-8" style={{ borderColor: errorsByField.headerMedia ? '#dc2626' : 'var(--border)' }}>
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
                          uploadMedia.mutate(file)
                        }}
                      />
                    </label>
                    {uploadMedia.isPending && <p className="mt-2 text-xs text-slate-500">Uploading...</p>}
                    <FieldHint error={errorsByField.headerMedia} />
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
                    <textarea
                      value={form.body}
                      onChange={(e) => setForm({ ...form, body: e.target.value })}
                      rows={8}
                      maxLength={1024}
                      placeholder="Hello {{1}}, your order {{2}} is confirmed."
                      className="w-full rounded-lg border px-3 py-2 text-sm focus:border-[#1876f2] focus:outline-none"
                      style={{ background: 'var(--bg)', borderColor: errorsByField.body ? '#dc2626' : 'var(--border)' }}
                    />
                  </label>
                  <div className="flex items-center justify-between">
                    <Button size="sm" variant="secondary" type="button" onClick={() => setForm({ ...form, body: insertNextVariable(form.body) })}>
                      <Plus className="h-3 w-3" /> Variable
                    </Button>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{form.body.length} / 1024</span>
                  </div>
                  <FieldHint error={errorsByField.body} />
                </div>

                {variableNums.length > 0 && (
                  <div ref={(el) => { fieldRefs.current.variableExamples = el }} className="space-y-3 rounded-xl border p-4" style={{ borderColor: 'var(--border-subtle)' }}>
                    <p className="text-sm font-semibold">Variable Examples (required for Meta)</p>
                    {variableNums.map((num) => (
                      <label key={num} className="block text-sm">
                        {`{{${num}}}`}
                        <input
                          value={form.variableExamples[num] || ''}
                          onChange={(e) => updateVariableExample(num, e.target.value)}
                          placeholder={num === 1 ? 'Adnan' : num === 2 ? 'ORD12345' : 'Example'}
                          className={`mt-1 ${inputClass}`}
                          style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}
                        />
                      </label>
                    ))}
                    <FieldHint error={errorsByField.variableExamples} />
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
                    onChange={(e) => setForm({ ...form, footer: e.target.value })}
                    maxLength={60}
                    placeholder="VacationBNA"
                    className={inputClass}
                    style={{ background: 'var(--bg)', borderColor: errorsByField.footer ? '#dc2626' : 'var(--border)' }}
                  />
                  <p className="text-xs text-right" style={{ color: 'var(--text-muted)' }}>{form.footer.length} / 60</p>
                  <FieldHint error={errorsByField.footer} />
                </label>
              </section>
            )}

            {step === 4 && (
              <section className="space-y-4" ref={(el) => { fieldRefs.current.buttons = el }}>
                <h2 className="text-base font-bold">Step 5 — Buttons</h2>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Max 2 CTA buttons (Website / Call / Copy Code) OR up to 10 Quick Replies — exactly like Meta.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="secondary" type="button" onClick={() => addButton('quick_reply')}>+ Quick Reply</Button>
                  <Button size="sm" variant="secondary" type="button" onClick={() => addButton('url')}>+ Website</Button>
                  <Button size="sm" variant="secondary" type="button" onClick={() => addButton('phone_number')}>+ Call Phone</Button>
                  <Button size="sm" variant="secondary" type="button" onClick={() => addButton('copy_code')}>+ Copy Code</Button>
                </div>
                <FieldHint error={errorsByField.buttons} />

                {form.buttons.map((btn) => (
                  <div key={btn.id} className="rounded-xl border p-4 space-y-3" style={{ borderColor: 'var(--border-subtle)' }}>
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
                      placeholder="Button text"
                      className={inputClass}
                      style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}
                    />
                    {btn.type === 'url' && (
                      <input
                        value={btn.value}
                        onChange={(e) => updateButton(btn.id, { value: e.target.value })}
                        placeholder="https://vacationbna.com"
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
                    All Meta validations passed. Ready to submit.
                  </FeedbackMessage>
                ) : (
                  <FeedbackMessage variant="error">
                    <p className="font-semibold">Fix these before submitting:</p>
                    <ul className="mt-1 space-y-0.5 font-normal">
                      {errors.map((e) => (
                        <li key={`${e.field}-${e.message}`}>• {e.message}</li>
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
                      <FeedbackMessage variant="error">{submitError}</FeedbackMessage>
                    )}
                  </div>
                )}

                <div className="flex flex-wrap gap-2 pt-2">
                  <Button variant="ghost" onClick={() => handleSubmit(false)} loading={submitPhase === 'creating'}>
                    <Save className="h-4 w-4" /> Save Draft
                  </Button>
                  <Button onClick={() => handleSubmit(true)} disabled={!isTemplateFormValid(form, existingNames)} loading={['creating', 'submitting', 'waiting'].includes(submitPhase)}>
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

        <div className="sticky top-0 flex w-full shrink-0 items-start justify-center bg-slate-50 px-3 py-6 lg:w-auto lg:min-h-full lg:min-w-[272px]">
          <TemplatePreview form={form} businessName="Pest Control 99" compact />
        </div>
      </div>
      {deleteDialog}
    </div>
  )
}
