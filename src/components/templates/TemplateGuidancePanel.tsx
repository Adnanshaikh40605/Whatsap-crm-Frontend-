import { useState } from 'react'
import { AlertTriangle, BookOpen, CheckCircle2, ChevronDown, Info } from 'lucide-react'
import {
  CATEGORY_RULES,
  FIELD_LIMITS,
  FORMATTING_GUIDE,
  GLOBAL_POLICIES,
  STEP_TIPS,
  type GuidanceStep,
} from '../../lib/templateGuidance'
import type { TemplateCategory } from '../../lib/templateBuilder'

interface Props {
  step: GuidanceStep
  category: TemplateCategory
}

export function TemplateGuidancePanel({ step, category }: Props) {
  const [open, setOpen] = useState(true)
  const rules = CATEGORY_RULES[category]
  const tip = STEP_TIPS[step]

  return (
    <div className="overflow-hidden rounded-xl border" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
      >
        <span className="flex items-center gap-2 text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
          <BookOpen className="h-4 w-4 text-brand-600" />
          Meta approval guide
        </span>
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} style={{ color: 'var(--text-muted)' }} />
      </button>

      {open && (
        <div className="space-y-4 border-t px-4 py-4" style={{ borderColor: 'var(--border-subtle)' }}>
          <div className="rounded-lg border px-3 py-2.5" style={{ borderColor: '#BFDBFE', background: '#EFF6FF' }}>
            <p className="flex items-start gap-2 text-xs font-semibold text-blue-800">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              This step: {tip.title}
            </p>
            <ul className="mt-2 space-y-1 text-xs text-blue-900">
              {tip.items.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
              {rules.label} category rules
            </p>
            <p className="mt-1 text-xs" style={{ color: 'var(--text-secondary)' }}>{rules.useWhen}</p>
            <div className="mt-2 grid gap-2">
              <div className="rounded-lg border px-3 py-2" style={{ borderColor: '#BBF7D0', background: '#F0FDF4' }}>
                <p className="mb-1 flex items-center gap-1 text-[11px] font-bold text-emerald-800">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Do
                </p>
                <ul className="space-y-1 text-[11px] text-emerald-900">
                  {rules.do.map((item) => <li key={item}>• {item}</li>)}
                </ul>
              </div>
              <div className="rounded-lg border px-3 py-2" style={{ borderColor: '#FECACA', background: '#FEF2F2' }}>
                <p className="mb-1 flex items-center gap-1 text-[11px] font-bold text-red-800">
                  <AlertTriangle className="h-3.5 w-3.5" /> Don’t
                </p>
                <ul className="space-y-1 text-[11px] text-red-900">
                  {rules.dont.map((item) => <li key={item}>• {item}</li>)}
                </ul>
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
              Body formatting
            </p>
            <div className="mt-2 space-y-1.5">
              {FORMATTING_GUIDE.map((row) => (
                <div key={row.label} className="flex items-center justify-between gap-2 text-[11px]">
                  <span style={{ color: 'var(--text-secondary)' }}>{row.label}</span>
                  <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px]">{row.syntax}</code>
                </div>
              ))}
            </div>
            <p className="mt-2 text-[11px]" style={{ color: 'var(--text-muted)' }}>
              Header & footer: plain text only (no * or _).
            </p>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
              Field limits
            </p>
            <ul className="mt-2 space-y-1 text-[11px]" style={{ color: 'var(--text-secondary)' }}>
              {FIELD_LIMITS.map((row) => (
                <li key={row.field}><span className="font-semibold">{row.field}:</span> {row.rule}</li>
              ))}
            </ul>
          </div>

          <details className="rounded-lg border px-3 py-2" style={{ borderColor: 'var(--border-subtle)' }}>
            <summary className="cursor-pointer text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
              All Meta policies (quick list)
            </summary>
            <ul className="mt-2 space-y-1 text-[11px]" style={{ color: 'var(--text-secondary)' }}>
              {GLOBAL_POLICIES.map((item) => <li key={item}>• {item}</li>)}
            </ul>
          </details>
        </div>
      )}
    </div>
  )
}
