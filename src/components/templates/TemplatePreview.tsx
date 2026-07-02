import { ExternalLink, Phone } from 'lucide-react'
import type { TemplateBuilderForm } from '../../lib/templateBuilder'
import { renderBodyPreview } from '../../lib/templateBuilder'

interface TemplatePreviewProps {
  form: TemplateBuilderForm
  businessName?: string
}

export function TemplatePreview({ form, businessName = 'Your Business' }: TemplatePreviewProps) {
  const bodyText = renderBodyPreview(form.body, form.variableExamples)
  const hasHeaderMedia = ['image', 'video', 'document'].includes(form.headerType) && form.headerMediaPreviewUrl

  return (
    <div className="flex flex-col items-center">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
        Live Preview
      </p>

      <div className="w-[280px] overflow-hidden rounded-[28px] border-4 shadow-xl" style={{ borderColor: '#1a1a1a', background: '#111' }}>
        <div className="flex items-center justify-between px-4 py-2 text-[10px] text-white/80">
          <span>9:41</span>
          <span className="font-medium">WhatsApp</span>
          <span>100%</span>
        </div>

        <div className="h-[520px] overflow-y-auto px-3 pb-4" style={{ background: '#e5ddd5' }}>
          <div className="mb-2 mt-2 text-center text-[10px] text-slate-600">Today</div>

          <div className="ml-auto max-w-[92%]">
            <div className="overflow-hidden rounded-lg bg-white shadow-sm">
              {form.headerType === 'text' && form.headerText && (
                <div className="border-b px-3 py-2 text-sm font-semibold text-slate-900">
                  {form.headerText}
                </div>
              )}

              {hasHeaderMedia && form.headerType === 'image' && (
                <img
                  src={form.headerMediaPreviewUrl}
                  alt="Header"
                  className="w-full object-cover"
                  style={{ maxHeight: 160, minHeight: 120 }}
                />
              )}

              {hasHeaderMedia && form.headerType === 'video' && (
                <div className="flex h-32 items-center justify-center bg-slate-900 text-xs text-white">
                  ▶ Video header
                </div>
              )}

              {hasHeaderMedia && form.headerType === 'document' && (
                <div className="flex items-center gap-2 border-b bg-slate-50 px-3 py-3 text-xs text-slate-700">
                  📄 Document attachment
                </div>
              )}

              {bodyText && (
                <div className="whitespace-pre-wrap px-3 py-2 text-[13px] leading-relaxed text-slate-800">
                  {bodyText}
                </div>
              )}

              {form.footer && (
                <div className="px-3 pb-2 text-[11px] text-slate-400">{form.footer}</div>
              )}

              <div className="px-2 pb-1 text-[10px] text-slate-400 text-right">3:17 am ✓✓</div>

              {form.buttons.length > 0 && (
                <div className="border-t">
                  {form.buttons.map((btn) => (
                    <div
                      key={btn.id}
                      className="flex items-center justify-center gap-1.5 border-t py-2.5 text-[13px] font-medium text-[#008069] first:border-t-0"
                    >
                      {btn.type === 'url' && <ExternalLink className="h-3.5 w-3.5" />}
                      {btn.type === 'phone_number' && <Phone className="h-3.5 w-3.5" />}
                      {btn.text || 'Button'}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <p className="mt-2 text-center text-[10px] text-slate-500">{businessName}</p>
        </div>
      </div>
    </div>
  )
}
