export type TemplateCategory = 'authentication' | 'utility' | 'marketing'
export type HeaderType = 'none' | 'text' | 'image' | 'video' | 'document'
export type ButtonType = 'quick_reply' | 'url' | 'phone_number' | 'copy_code'

export interface TemplateButton {
  id: string
  type: ButtonType
  text: string
  value: string
}

export interface TemplateBuilderForm {
  name: string
  category: TemplateCategory
  language: string
  headerType: HeaderType
  headerText: string
  headerMediaAssetId: string
  headerMediaPreviewUrl: string
  body: string
  variableExamples: Record<number, string>
  footer: string
  buttons: TemplateButton[]
}

export interface FieldError {
  field: string
  message: string
}

export const CATEGORY_DESCRIPTIONS: Record<TemplateCategory, string> = {
  authentication: 'One-time passwords and login verification.',
  utility: 'Booking updates, invoices, order updates, support.',
  marketing: 'Promotions, offers, discounts and campaigns.',
}

export const INITIAL_TEMPLATE_FORM: TemplateBuilderForm = {
  name: '',
  category: 'utility',
  language: 'en_US',
  headerType: 'none',
  headerText: '',
  headerMediaAssetId: '',
  headerMediaPreviewUrl: '',
  body: '',
  variableExamples: {},
  footer: '',
  buttons: [],
}

export function normalizeTemplateName(value: string): string {
  return value.toLowerCase().trim().replace(/[^a-z0-9_]+/g, '_').replace(/^_+|_+$/g, '')
}

export function extractVariableNumbers(text: string): number[] {
  const matches = text.match(/\{\{(\d+)\}\}/g) ?? []
  const nums = matches.map((m) => Number(m.replace(/[{}]/g, '')))
  return [...new Set(nums)].sort((a, b) => a - b)
}

export function insertNextVariable(body: string): string {
  const existing = extractVariableNumbers(body)
  const next = existing.length ? Math.max(...existing) + 1 : 1
  return `${body}{{${next}}}`
}

export function validateTemplateName(name: string, existingNames: string[] = []): string | null {
  const raw = name.trim()
  if (!raw) return 'Template name is required.'
  if (raw.length > 512) return 'Maximum 512 characters allowed.'
  if (/\s/.test(name)) return 'No spaces are allowed. Use underscores instead (e.g. pest_booking_confirm).'
  if (/[A-Z]/.test(name)) return 'Use only lowercase letters, numbers, and underscores.'
  if (/[^a-z0-9_]/.test(name)) return 'Special characters are not allowed. Use only lowercase letters, numbers, and underscores.'
  if (/^\d/.test(name)) return 'Template name cannot start with a number.'
  if (!/^[a-z][a-z0-9_]*$/.test(name)) {
    return 'Use only lowercase letters, numbers, and underscores.'
  }
  const normalized = normalizeTemplateName(name)
  if (existingNames.includes(normalized)) return 'Template name already exists for this language.'
  return null
}

export function describeMissingVariables(nums: number[]): string | null {
  if (!nums.length) return null
  const missing: number[] = []
  const max = Math.max(...nums)
  for (let i = 1; i <= max; i += 1) {
    if (!nums.includes(i)) missing.push(i)
  }
  if (!missing.length && nums[0] === 1 && nums.every((n, idx) => n === idx + 1)) return null
  if (missing.length) {
    return `Missing ${missing.map((n) => `{{${n}}}`).join(', ')}. Variable numbering must be sequential ({{1}}, {{2}}, {{3}}).`
  }
  if (nums[0] !== 1) {
    return 'Variables must be sequential starting at {{1}}.'
  }
  return null
}

export function validateVariablesSequential(body: string): string | null {
  const nums = extractVariableNumbers(body)
  if (!nums.length) return null

  const missingMsg = describeMissingVariables(nums)
  if (missingMsg) return missingMsg

  if (/\{\{(?!\d+\})[^}]*\}\}/.test(body)) {
    return 'Invalid variable format. Use {{1}}, {{2}}, {{3}} only.'
  }

  const trimmed = body.trim()
  if (/^\{\{\d+\}\}/.test(trimmed)) {
    return 'Body cannot start with a variable. Add text before {{1}}.'
  }
  if (/\{\{\d+\}\}$/.test(trimmed)) {
    return 'Body cannot end with a variable. Add text after the last variable.'
  }
  if (/\{\{\d+\}\}\s*\{\{\d+\}\}/.test(body)) {
    return 'Variables cannot be placed next to each other. Add text between them.'
  }
  if (nums.length > 10) {
    return 'Too many variables. Keep templates focused with fewer placeholders.'
  }
  return null
}

export function validateHeaderText(headerText: string): string | null {
  const text = headerText.trim()
  if (!text) return 'Header text cannot be empty.'
  if (headerText.length > 60) return 'Header text cannot exceed 60 characters.'
  const nums = extractVariableNumbers(headerText)
  const missingMsg = describeMissingVariables(nums)
  if (missingMsg) return missingMsg
  return null
}

const UTILITY_PROMO_WORDS = [
  'discount', 'offer', 'sale', 'free', 'buy now', 'coupon', 'limited time',
  'promo', '% off', 'deal', 'save now', 'flash sale',
]

const MARKETING_PROMO_HINTS = [
  'discount', 'offer', 'sale', 'free', 'buy', 'coupon', 'promo', '%', 'deal', 'off',
]

const AUTH_HINTS = [
  'otp', 'code', 'verification', 'verify', 'passcode', 'one-time', 'one time',
]

export function getTemplateContentText(form: TemplateBuilderForm): string {
  return [
    form.headerText,
    form.body,
    form.footer,
    ...form.buttons.map((b) => `${b.text} ${b.value}`),
  ].join(' ').toLowerCase()
}

export function validateCategoryContent(form: TemplateBuilderForm): FieldError[] {
  const errors: FieldError[] = []
  const text = getTemplateContentText(form)

  if (form.category === 'utility') {
    const hit = UTILITY_PROMO_WORDS.find((w) => text.includes(w))
    if (hit) {
      errors.push({
        field: 'category',
        message: 'Promotional content is not allowed in Utility templates. Choose the Marketing category instead.',
      })
    }
  }

  if (form.category === 'marketing') {
    // Soft guidance only — handled in UI via getCategoryHint().
  }

  if (form.category === 'authentication') {
    if (!form.body.trim()) {
      errors.push({ field: 'body', message: 'OTP message body is required.' })
    } else {
      const hasOtpHint = AUTH_HINTS.some((w) => text.includes(w))
      const hasCodeVar = extractVariableNumbers(form.body).includes(1)
      if (!hasOtpHint) {
        errors.push({
          field: 'body',
          message: 'Authentication templates should mention a verification code / OTP.',
        })
      }
      if (!hasCodeVar) {
        errors.push({
          field: 'body',
          message: 'OTP variable is missing. Include {{1}} for the verification code.',
        })
      }
    }
  }

  return errors
}

export function getCategoryHint(form: TemplateBuilderForm): string | null {
  const text = getTemplateContentText(form)
  if (form.category === 'marketing' && form.body.trim()) {
    const hasPromo = MARKETING_PROMO_HINTS.some((w) => text.includes(w))
    if (!hasPromo) {
      return 'This message appears transactional. Consider using the Utility category.'
    }
  }
  return null
}

export function validateVariableExamples(
  body: string,
  examples: Record<number, string>,
): string | null {
  const nums = extractVariableNumbers(body)
  for (const num of nums) {
    if (!examples[num]?.trim()) {
      return `Example required for variable {{${num}}}.`
    }
  }
  return null
}

export function validateUrl(url: string): string | null {
  if (!url.trim()) return 'URL is required.'
  if (!/^https:\/\//i.test(url.trim())) return 'URL must start with https://'
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'https:') return 'URL must start with https://'
    return null
  } catch {
    return 'Enter a valid URL (e.g. https://example.com).'
  }
}

export function validateE164(phone: string): string | null {
  if (!phone.trim()) return 'Phone number is required.'
  if (!phone.trim().startsWith('+')) return 'Country code required. Use E.164 format (e.g. +919372792693).'
  if (!/^\+[1-9]\d{7,14}$/.test(phone.trim())) {
    return 'Invalid phone number. Use E.164 format (e.g. +919372792693).'
  }
  return null
}

export const MAX_CTA_BUTTONS = 2
export const MAX_QUICK_REPLY_BUTTONS = 10

export function isCtaButtonType(type: ButtonType): boolean {
  return type !== 'quick_reply'
}

export function countCtaButtons(buttons: TemplateButton[]): number {
  return buttons.filter((b) => isCtaButtonType(b.type)).length
}

export function countQuickReplyButtons(buttons: TemplateButton[]): number {
  return buttons.filter((b) => b.type === 'quick_reply').length
}

export interface ButtonAddState {
  canAddQuickReply: boolean
  canAddCta: boolean
  ctaCount: number
  quickReplyCount: number
  usageHint: string | null
}

export function getButtonAddState(buttons: TemplateButton[]): ButtonAddState {
  const ctaCount = countCtaButtons(buttons)
  const quickReplyCount = countQuickReplyButtons(buttons)

  if (quickReplyCount > 0) {
    return {
      canAddQuickReply: quickReplyCount < MAX_QUICK_REPLY_BUTTONS,
      canAddCta: false,
      ctaCount,
      quickReplyCount,
      usageHint: `Quick replies: ${quickReplyCount} of ${MAX_QUICK_REPLY_BUTTONS} used. Remove quick replies to add CTA buttons.`,
    }
  }

  if (ctaCount > 0) {
    return {
      canAddQuickReply: false,
      canAddCta: ctaCount < MAX_CTA_BUTTONS,
      ctaCount,
      quickReplyCount,
      usageHint:
        ctaCount >= MAX_CTA_BUTTONS
          ? `You have used ${MAX_CTA_BUTTONS} of ${MAX_CTA_BUTTONS} CTA buttons. Remove one to add a different type.`
          : `CTA buttons: ${ctaCount} of ${MAX_CTA_BUTTONS} used.`,
    }
  }

  return {
    canAddQuickReply: true,
    canAddCta: true,
    ctaCount: 0,
    quickReplyCount: 0,
    usageHint: null,
  }
}

export function canAddButtonType(buttons: TemplateButton[], type: ButtonType): boolean {
  const state = getButtonAddState(buttons)
  if (type === 'quick_reply') return state.canAddQuickReply
  return state.canAddCta
}

export function validateButtons(buttons: TemplateButton[]): string | null {
  if (!buttons.length) return null
  if (buttons.length > 10) return 'Maximum 10 buttons are allowed.'

  const quickReplies = buttons.filter((b) => b.type === 'quick_reply')
  const ctas = buttons.filter((b) => isCtaButtonType(b.type))
  if (quickReplies.length && ctas.length) {
    return 'Use either Quick Reply buttons or CTA buttons, not both.'
  }
  if (quickReplies.length > MAX_QUICK_REPLY_BUTTONS) {
    return `Maximum ${MAX_QUICK_REPLY_BUTTONS} Quick Reply buttons allowed.`
  }
  if (ctas.length > MAX_CTA_BUTTONS) {
    return `Maximum ${MAX_CTA_BUTTONS} CTA buttons allowed.`
  }

  const labels = buttons.map((b) => b.text.trim().toLowerCase()).filter(Boolean)
  if (new Set(labels).size !== labels.length) {
    return 'Duplicate button names are not allowed.'
  }

  for (const btn of buttons) {
    if (!btn.text.trim()) return 'Every button needs button text.'
    if (btn.text.length > 25) return 'Quick Reply / button text must be 25 characters or fewer.'
    if (btn.type === 'url') {
      const err = validateUrl(btn.value)
      if (err) return err
    }
    if (btn.type === 'phone_number') {
      const err = validateE164(btn.value)
      if (err) return err
    }
    if (btn.type === 'copy_code' && !btn.value.trim()) {
      return 'Copy code example is required for copy-code buttons.'
    }
  }
  return null
}

export function validateTemplateForm(
  form: TemplateBuilderForm,
  existingNames: string[] = [],
): FieldError[] {
  const errors: FieldError[] = []

  const nameErr = validateTemplateName(form.name, existingNames)
  if (nameErr) errors.push({ field: 'name', message: nameErr })

  if (!form.category) errors.push({ field: 'category', message: 'Please select a template category.' })
  if (!form.language) errors.push({ field: 'language', message: 'Please select a language.' })

  if (form.headerType === 'text') {
    const headerErr = validateHeaderText(form.headerText)
    if (headerErr) errors.push({ field: 'headerText', message: headerErr })
  }

  if (['image', 'video', 'document'].includes(form.headerType)) {
    if (!form.headerMediaAssetId) {
      errors.push({ field: 'headerMedia', message: 'Upload media for the selected header type.' })
    }
  }

  if (!form.body.trim()) errors.push({ field: 'body', message: 'Body cannot be empty.' })
  if (form.body.length > 1024) errors.push({ field: 'body', message: 'Body cannot exceed 1024 characters.' })

  const varSeq = validateVariablesSequential(form.body)
  if (varSeq) errors.push({ field: 'body', message: varSeq })

  const varEx = validateVariableExamples(form.body, form.variableExamples)
  if (varEx) errors.push({ field: 'variableExamples', message: varEx })

  if (form.footer.length > 60) {
    errors.push({ field: 'footer', message: 'Footer cannot exceed 60 characters.' })
  }

  const btnErr = validateButtons(form.buttons)
  if (btnErr) errors.push({ field: 'buttons', message: btnErr })

  errors.push(...validateCategoryContent(form))

  // De-dupe by field keeping first message (name/body may get category extras).
  const seen = new Set<string>()
  return errors.filter((e) => {
    const key = `${e.field}:${e.message}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export function isTemplateFormValid(form: TemplateBuilderForm, existingNames: string[] = []): boolean {
  return validateTemplateForm(form, existingNames).length === 0
}

export function wrapSelection(text: string, start: number, end: number, wrapper: string): string {
  const selected = text.slice(start, end) || 'text'
  return `${text.slice(0, start)}${wrapper}${selected}${wrapper}${text.slice(end)}`
}

export function renderBodyPreview(body: string, examples: Record<number, string>): string {
  return body.replace(/\{\{(\d+)\}\}/g, (_, num) => examples[Number(num)]?.trim() || `{{${num}}}`)
}

export function buildTemplatePayload(form: TemplateBuilderForm, submitToMeta: boolean) {
  const variableNums = extractVariableNumbers(form.body)
  const variables = variableNums.map((n) => form.variableExamples[n]?.trim() || '')
  const headerFormat = form.headerType.toUpperCase()

  const header = form.headerType === 'none'
    ? {}
    : form.headerType === 'text'
      ? { type: 'HEADER', format: 'TEXT', text: form.headerText }
      : { type: 'HEADER', format: headerFormat }

  const buttons = form.buttons.map((btn) => {
    if (btn.type === 'quick_reply') {
      return { type: 'QUICK_REPLY', text: btn.text }
    }
    if (btn.type === 'url') {
      return { type: 'URL', text: btn.text, url: btn.value, example: [btn.value] }
    }
    if (btn.type === 'phone_number') {
      return { type: 'PHONE_NUMBER', text: btn.text, phone_number: btn.value }
    }
    return { type: 'COPY_CODE', text: btn.text, example: btn.value }
  })

  const components: Record<string, unknown>[] = []
  if (Object.keys(header).length) components.push(header)

  if (form.category === 'authentication') {
    components.push({ type: 'BODY', add_security_recommendation: true })
    if (form.buttons.length) {
      components.push({
        type: 'BUTTONS',
        buttons: form.buttons.map((btn) => ({
          type: 'OTP',
          otp_type: 'COPY_CODE',
          text: btn.text || 'Copy code',
        })),
      })
    }
  } else {
    const bodyComponent: Record<string, unknown> = { type: 'BODY', text: form.body }
    if (variables.length) bodyComponent.example = { body_text: [variables] }
    components.push(bodyComponent)
  }

  if (form.category !== 'authentication') {
    if (form.footer.trim()) components.push({ type: 'FOOTER', text: form.footer })
    if (buttons.length) components.push({ type: 'BUTTONS', buttons })
  }

  const templateType = form.category === 'authentication'
    ? 'authentication_otp'
    : form.headerType === 'image'
      ? 'image'
      : form.headerType === 'video'
        ? 'video'
        : form.headerType === 'document'
          ? 'document'
          : 'standard'

  return {
    name: normalizeTemplateName(form.name),
    category: form.category,
    template_type: templateType,
    language: form.language,
    header,
    body: form.body,
    footer: form.footer,
    buttons,
    variables,
    components,
    examples: { body_text: variables },
    media_asset: form.headerMediaAssetId || null,
    submit_to_meta: submitToMeta,
  }
}

export const TEMPLATE_PRESETS: Record<string, Partial<TemplateBuilderForm>> = {
  login_otp: {
    name: 'login_otp',
    category: 'authentication',
    language: 'en_US',
    headerType: 'none',
    body: 'Your verification code is {{1}}.\n\nThis code expires in 10 minutes.\n\nDo not share this code with anyone.',
    variableExamples: { 1: '458921' },
    footer: '',
    buttons: [],
  },
  booking_confirmation: {
    name: 'booking_confirmation',
    category: 'utility',
    language: 'en_US',
    headerType: 'none',
    body: 'Hello {{1}},\n\nYour booking {{2}} has been confirmed.\n\nCheck-in: {{3}}\n\nThank you for choosing us.',
    variableExamples: { 1: 'Adnan', 2: 'BKG1024', 3: '10 July 2026' },
    footer: '',
    buttons: [],
  },
  pest_home_offer: {
    name: 'pest_home_offer',
    category: 'utility',
    language: 'en_US',
    headerType: 'image',
    body: 'Hello {{1}},\n\nYour pest control service offer is live today:\n\n✅ Mosquito & termite treatment\n✅ Same-day booking available\n✅ Up to 30% OFF this season\n\nTap below to book your inspection.',
    variableExamples: { 1: 'Adnan' },
    footer: 'Pest Control 99',
    buttons: [
      { id: '1', type: 'url', text: 'Book Now', value: 'https://vacationbna.com' },
    ],
  },
  summer_offer: {
    name: 'summer_offer',
    category: 'marketing',
    language: 'en_US',
    headerType: 'image',
    body: 'Hello {{1}},\n\nEnjoy up to 30% OFF on your next booking.\n\nLimited time offer.',
    variableExamples: { 1: 'Adnan' },
    footer: 'VacationBNA',
    buttons: [
      { id: '1', type: 'url', text: 'Book Now', value: 'https://vacationbna.com' },
      { id: '2', type: 'phone_number', text: 'Call Us', value: '+919372792693' },
    ],
  },
}

export function templateToPreviewForm(template: {
  name: string
  category: string
  language: string
  header?: Record<string, unknown>
  body?: string
  footer?: string
  buttons?: unknown[]
  variables?: unknown[]
  media_asset?: string | null
}): TemplateBuilderForm {
  const header = template.header as { format?: string; type?: string; text?: string } | undefined
  const format = String(header?.format || '').toLowerCase()
  const headerType = format === 'text' ? 'text'
    : format === 'image' ? 'image'
      : format === 'video' ? 'video'
        : format === 'document' ? 'document'
          : 'none'

  const vars = Array.isArray(template.variables) ? template.variables as string[] : []
  const variableExamples: Record<number, string> = {}
  vars.forEach((val, idx) => { variableExamples[idx + 1] = val })

  const buttons = (Array.isArray(template.buttons) ? template.buttons : []).map((raw, idx) => {
    const btn = raw as Record<string, string>
    const type = String(btn.type || '').toLowerCase()
    return {
      id: `preview_${idx}`,
      type: type === 'url' ? 'url' as const
        : type === 'phone_number' ? 'phone_number' as const
          : type === 'copy_code' ? 'copy_code' as const
            : 'quick_reply' as const,
      text: btn.text || '',
      value: btn.url || btn.phone_number || btn.example || '',
    }
  })

  return {
    ...INITIAL_TEMPLATE_FORM,
    name: template.name,
    category: (template.category as TemplateCategory) || 'utility',
    language: template.language || 'en_US',
    headerType,
    headerText: header?.text || '',
    headerMediaAssetId: template.media_asset || '',
    body: template.body || '',
    footer: template.footer || '',
    variableExamples,
    buttons,
  }
}
