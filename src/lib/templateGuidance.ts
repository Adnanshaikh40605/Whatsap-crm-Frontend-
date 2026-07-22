/** Meta WhatsApp template creation guidance shown in the builder. */

export type GuidanceStep = 'basics' | 'header' | 'body' | 'footer' | 'buttons' | 'review'

export interface StepTip {
  title: string
  items: string[]
}

export const CATEGORY_RULES = {
  utility: {
    label: 'Utility',
    useWhen: 'Transactional updates the customer already expects (order, booking, invoice, appointment).',
    do: [
      'Keep the message about a specific transaction or account update.',
      'Use clear facts: order ID, date, status, amount.',
      'Include Call / Website CTAs only when they help complete the transaction.',
    ],
    dont: [
      'Do not add promotions, discounts, or “buy now” language — Meta will reject or reclassify as Marketing.',
      'Do not send cold outreach or newsletters as Utility.',
      'Avoid vague body text with no transaction context.',
    ],
  },
  marketing: {
    label: 'Marketing',
    useWhen: 'Offers, promotions, product launches, and re-engagement campaigns.',
    do: [
      'Clearly state the offer and what the customer should do next.',
      'Use an opt-out friendly tone; keep claims honest.',
      'Use full https:// links (no bit.ly / short links).',
    ],
    dont: [
      'Do not impersonate system or bank alerts.',
      'Do not request passwords, OTPs, or sensitive personal data.',
      'Avoid spammy ALL CAPS or misleading urgency.',
    ],
  },
  authentication: {
    label: 'Authentication',
    useWhen: 'One-time passwords and login verification only.',
    do: [
      'Use Meta’s authentication structure (security recommendation + OTP button).',
      'Keep copy short and verification-focused.',
    ],
    dont: [
      'Do not mix marketing or sales offers into OTP templates.',
      'Do not use custom free-form promotional body text.',
    ],
  },
} as const

export const GLOBAL_POLICIES = [
  'Templates must be pre-approved by Meta before you can send them outside the 24-hour chat window.',
  'Choose the correct category — wrong category is a top rejection reason.',
  'Body cannot start or end with a variable like {{1}}.',
  'Variables must be sequential: {{1}}, then {{2}}, then {{3}}.',
  'Provide a real sample value for every variable (Meta reviews examples).',
  'No URL shorteners. Use full https:// links only.',
  'Header and footer must be plain text (no *bold* / _italic_ markup).',
  'Body may use WhatsApp formatting: *bold*, _italic_, ~strike~, ```mono```.',
]

export const FORMATTING_GUIDE = [
  { label: 'Bold', syntax: '*text*', example: '*Order confirmed*' },
  { label: 'Italic', syntax: '_text_', example: '_processing_' },
  { label: 'Strikethrough', syntax: '~text~', example: '~₹1,499~ ₹999' },
  { label: 'Monospace', syntax: '```text```', example: '```ORD-88291```' },
]

export const FIELD_LIMITS = [
  { field: 'Name', rule: 'Lowercase letters, numbers, underscores only. Max 512 chars.' },
  { field: 'Header text', rule: 'Optional. Max 60 chars. Plain text only. No formatting markers.' },
  { field: 'Body', rule: 'Required. Max 1024 chars. Formatting + variables allowed.' },
  { field: 'Footer', rule: 'Optional. Max 60 chars. Plain text only.' },
  { field: 'Buttons', rule: 'Either up to 10 Quick Replies OR up to 2 CTAs (Website / Call / Copy Code).' },
]

export const STEP_TIPS: Record<GuidanceStep, StepTip> = {
  basics: {
    title: 'Basics checklist',
    items: [
      'Name example: pest_booking_confirm (not “Pest Booking Confirm”).',
      'Pick Utility for service updates, Marketing for offers, Authentication for OTPs.',
      'Language should match the language of the body text.',
    ],
  },
  header: {
    title: 'Header tips',
    items: [
      'Text headers appear bold automatically — do not wrap with *asterisks*.',
      'Media headers need a sample image/video/document for Meta review.',
      'JPG/PNG for images, keep files under 5 MB.',
    ],
  },
  body: {
    title: 'Body tips',
    items: [
      'Write the full customer-facing message Meta will review.',
      'Use {{1}}, {{2}} for dynamic values and fill examples below.',
      'Do not start or end the body with a variable.',
      'Use *bold* sparingly for key facts (order ID, date, amount).',
    ],
  },
  footer: {
    title: 'Footer tips',
    items: [
      'Use a short brand line, e.g. Pest Control 99.',
      'Keep it plain text — no links or formatting.',
    ],
  },
  buttons: {
    title: 'Button tips',
    items: [
      'CTA and Quick Reply cannot be mixed in the same template.',
      'Website buttons need a full https:// URL.',
      'Phone buttons need E.164 format, e.g. +918080748282.',
      'Button labels max 25 characters.',
    ],
  },
  review: {
    title: 'Before you submit',
    items: [
      'Read the live preview — this is close to what Meta and customers see.',
      'Confirm category matches the content (no promo language in Utility).',
      'Submit to Meta starts automatic review; Pending is normal until approved.',
      'If rejected, open the template and read the exact Meta rejection reason.',
    ],
  },
}

/** Map common Meta rejection / error phrases to plain-language fixes. */
export function explainMetaTemplateError(raw: string): { summary: string; fix: string } {
  const text = String(raw || '').trim()
  const lower = text.toLowerCase()

  if (!text) {
    return {
      summary: 'Meta rejected this template without a detailed reason.',
      fix: 'Sync from Meta, then open the template detail page. Edit content to match Utility/Marketing rules and resubmit.',
    }
  }

  if (lower.includes('category') || lower.includes('invalid parameter') && lower.includes('category')) {
    return {
      summary: text,
      fix: 'Category likely does not match the message. Move promotional language to Marketing, or keep Utility strictly transactional.',
    }
  }
  if (lower.includes('variable') || lower.includes('param')) {
    return {
      summary: text,
      fix: 'Check variables: sequential {{1}}{{2}}…, examples filled, and body does not start/end with a variable.',
    }
  }
  if (lower.includes('format') || lower.includes('component')) {
    return {
      summary: text,
      fix: 'Remove formatting from header/footer. Keep *bold* / _italic_ only in the body.',
    }
  }
  if (lower.includes('url') || lower.includes('link') || lower.includes('website')) {
    return {
      summary: text,
      fix: 'Use a full https:// URL. Avoid shortened links like bit.ly.',
    }
  }
  if (lower.includes('button')) {
    return {
      summary: text,
      fix: 'Check button limits: max 2 CTAs or up to 10 quick replies — not both. Labels ≤ 25 characters.',
    }
  }
  if (lower.includes('duplicate') || lower.includes('already exists') || lower.includes('name')) {
    return {
      summary: text,
      fix: 'Rename the template (lowercase + underscores) or change the language, then submit again.',
    }
  }
  if (lower.includes('policy') || lower.includes('commerce') || lower.includes('abusive')) {
    return {
      summary: text,
      fix: 'Rewrite to remove spammy claims, sensitive data requests, or content that violates WhatsApp commerce policies.',
    }
  }

  return {
    summary: text,
    fix: 'Edit the template based on Meta’s message above, then Sync from Meta and resubmit if needed.',
  }
}

export function wrapSelection(text: string, start: number, end: number, wrapper: string): string {
  const selected = text.slice(start, end) || 'text'
  return `${text.slice(0, start)}${wrapper}${selected}${wrapper}${text.slice(end)}`
}
