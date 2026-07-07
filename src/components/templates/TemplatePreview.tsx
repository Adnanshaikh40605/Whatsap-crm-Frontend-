import { CheckCheck, ExternalLink, Phone } from 'lucide-react'
import type { TemplateBuilderForm } from '../../lib/templateBuilder'
import { renderBodyPreview } from '../../lib/templateBuilder'
import { cn } from '../../lib/utils'
import { IPhone8Frame } from './IPhone8Frame'
import { CHAT_WALLPAPER } from '../../lib/whatsappTheme'

interface TemplatePreviewProps {
  form: TemplateBuilderForm
  businessName?: string
  /** Tighter layout for detail-page sidebar (no extra horizontal padding). */
  compact?: boolean
}

export function TemplatePreview({ form, businessName = 'Your Business', compact = false }: TemplatePreviewProps) {
  const bodyText = renderBodyPreview(form.body, form.variableExamples)
  const hasHeaderMedia = ['image', 'video', 'document'].includes(form.headerType) && form.headerMediaPreviewUrl
  const hasContent = bodyText || form.footer || form.headerText || hasHeaderMedia || form.buttons.length > 0

  return (
    <div
      className={cn(
        'flex flex-col items-center',
        compact ? 'w-[252px]' : 'w-full max-w-[280px]',
      )}
    >
      <p className="mb-3 w-full text-center text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
        Live Preview
      </p>

      <IPhone8Frame className="w-full">
        {/* Status bar */}
        <div className="flex items-center justify-between bg-black px-2 py-0.5 text-[7px] font-medium text-white/90">
          <span>9:41</span>
          <span>WhatsApp</span>
          <span>100%</span>
        </div>

        {/* Chat wallpaper */}
        <div
          className="flex h-[calc(100%-14px)] flex-col overflow-y-auto px-2 pb-2"
          style={{
            backgroundColor: '#e5ddd5',
            backgroundImage: CHAT_WALLPAPER,
          }}
        >
          <p className="my-1.5 text-center text-[8px] text-[#54656f]">Today</p>

          <div className="mx-auto w-full max-w-[95%]">
            <div className="overflow-hidden rounded-md rounded-tl-none bg-white shadow-sm">
              {form.headerType === 'text' && form.headerText && (
                <div className="border-b border-[#e9edef] px-2 py-1.5 text-[10px] font-semibold text-[#111b21]">
                  {form.headerText}
                </div>
              )}

              {hasHeaderMedia && form.headerType === 'image' && (
                <img
                  src={form.headerMediaPreviewUrl}
                  alt="Header"
                  className="w-full object-cover"
                  style={{ maxHeight: 72, minHeight: 48 }}
                />
              )}

              {hasHeaderMedia && form.headerType === 'video' && (
                <div className="flex h-16 items-center justify-center bg-[#111b21] text-[8px] text-white">
                  ▶ Video header
                </div>
              )}

              {hasHeaderMedia && form.headerType === 'document' && (
                <div className="flex items-center gap-1 border-b border-[#e9edef] bg-[#f0f2f5] px-2 py-2 text-[8px] text-[#54656f]">
                  📄 Document attachment
                </div>
              )}

              {bodyText ? (
                <div className="whitespace-pre-wrap px-2 py-1.5 text-[10px] leading-relaxed text-[#111b21]">
                  {bodyText}
                </div>
              ) : !hasContent ? (
                <div className="px-2 py-2 text-[10px] leading-relaxed text-[#111b21]">
                  Hello from WhatsFlow CRM. This is a test template message.
                </div>
              ) : null}

              {form.footer && (
                <div className="px-2 pb-1 text-[8px] text-[#8696a0]">{form.footer}</div>
              )}

              <div className="flex items-center justify-end gap-0.5 px-2 pb-1 text-[7px] text-[#667781]">
                <span>3:17 am</span>
                <CheckCheck className="h-2.5 w-2.5 text-[#53bdeb]" aria-hidden />
              </div>

              {form.buttons.length > 0 && (
                <div className="border-t border-[#e9edef]">
                  {form.buttons.map((btn) => (
                    <div
                      key={btn.id}
                      className="flex items-center justify-center gap-1 border-t border-[#e9edef] py-1.5 text-[9px] font-medium text-[#00a884] first:border-t-0"
                    >
                      {btn.type === 'url' && <ExternalLink className="h-2.5 w-2.5" />}
                      {btn.type === 'phone_number' && <Phone className="h-2.5 w-2.5" />}
                      {btn.text || 'Button'}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <p className="mt-auto pt-2 text-center text-[8px] text-[#667781]">{businessName}</p>
        </div>
      </IPhone8Frame>
    </div>
  )
}
