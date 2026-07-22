import {
  CheckCheck, ExternalLink, Phone, Video, ArrowLeft, Plus, Camera, Mic, User,
} from 'lucide-react'
import type { TemplateBuilderForm } from '../../lib/templateBuilder'
import { renderBodyPreview } from '../../lib/templateBuilder'
import { cn } from '../../lib/utils'
import { IPhonePreviewFrame } from './IPhonePreviewFrame'
import { CHAT_WALLPAPER } from '../../lib/whatsappTheme'

interface TemplatePreviewProps {
  form: TemplateBuilderForm
  businessName?: string
  /** Slightly smaller width for detail-page sidebar. */
  compact?: boolean
  /** Hide the “iOS Preview” caption (e.g. when parent already labels the stage). */
  hideCaption?: boolean
}

export function TemplatePreview({
  form,
  businessName = 'Your Business',
  compact = false,
  hideCaption = false,
}: TemplatePreviewProps) {
  const bodyText = renderBodyPreview(form.body, form.variableExamples)
  const hasHeaderMedia = ['image', 'video', 'document'].includes(form.headerType) && form.headerMediaPreviewUrl
  const hasContent = Boolean(bodyText || form.footer || form.headerText || hasHeaderMedia || form.buttons.length)
  // ~30% smaller than the previous large iPhone preview
  const phoneWidth = compact ? 210 : 252

  return (
    <div className={cn('flex w-full flex-col items-center', compact ? 'max-w-[230px]' : 'max-w-[280px]')}>
      {!hideCaption && (
        <div className="mb-3 w-full px-1">
          <p className="text-sm font-bold text-[var(--color-text-primary)]">iOS Preview</p>
          <p className="mt-1 text-[11px] leading-snug text-[var(--color-text-muted)]">
            Visualization of how your template may appear in WhatsApp. Actual look can vary by device.
          </p>
        </div>
      )}

      <IPhonePreviewFrame width={phoneWidth}>
        <div className="flex h-full flex-col bg-[#efeae2]">
          {/* Status bar */}
          <div className="flex items-end justify-between bg-[#075e54] px-5 pb-1 pt-3 text-[11px] font-semibold text-white">
            <span>9:41</span>
            <div className="flex items-center gap-1.5 opacity-90">
              <span className="text-[10px]">5G</span>
              <span className="inline-block h-2.5 w-5 rounded-sm border border-white/90">
                <span className="ml-px mt-px block h-1.5 w-3.5 rounded-[1px] bg-white" />
              </span>
            </div>
          </div>

          {/* WhatsApp chat header */}
          <div className="flex items-center gap-2 bg-[#075e54] px-2.5 py-2 text-white">
            <ArrowLeft className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20">
              <User className="h-4 w-4" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold leading-tight">{businessName}</p>
              <p className="text-[10px] leading-tight text-white/80">online</p>
            </div>
            <Video className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
            <Phone className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
          </div>

          {/* Chat body */}
          <div
            className="flex min-h-0 flex-1 flex-col overflow-y-auto px-3 pb-3 pt-2"
            style={{
              backgroundColor: '#e5ddd5',
              backgroundImage: CHAT_WALLPAPER,
            }}
          >
            <p className="mb-2 text-center text-[10px] font-medium text-[#54656f]">Today</p>

            <div className="w-full max-w-[92%]">
              <div className="overflow-hidden rounded-lg rounded-tl-sm bg-white shadow-sm">
                {form.headerType === 'text' && form.headerText && (
                  <div className="border-b border-[#e9edef] px-3 py-2 text-[13px] font-semibold text-[#111b21]">
                    {form.headerText}
                  </div>
                )}

                {hasHeaderMedia && form.headerType === 'image' && (
                  <img
                    src={form.headerMediaPreviewUrl}
                    alt="Header"
                    className="w-full object-cover"
                    style={{ maxHeight: 160, minHeight: 100 }}
                  />
                )}

                {hasHeaderMedia && form.headerType === 'video' && (
                  <div className="flex h-28 items-center justify-center bg-[#111b21] text-xs text-white">
                    ▶ Video header
                  </div>
                )}

                {hasHeaderMedia && form.headerType === 'document' && (
                  <div className="flex items-center gap-2 border-b border-[#e9edef] bg-[#f0f2f5] px-3 py-3 text-xs text-[#54656f]">
                    📄 Document attachment
                  </div>
                )}

                {bodyText ? (
                  <div className="whitespace-pre-wrap px-3 py-2 text-[13px] leading-relaxed text-[#111b21]">
                    {bodyText}
                  </div>
                ) : !hasContent ? (
                  <div className="px-3 py-2.5 text-[13px] leading-relaxed text-[#111b21]">
                    Hello from WhatsFlow CRM. This is a test template message.
                  </div>
                ) : null}

                {form.footer && (
                  <div className="px-3 pb-1 text-[11px] text-[#8696a0]">{form.footer}</div>
                )}

                <div className="flex items-center justify-end gap-1 px-3 pb-1.5 text-[10px] text-[#667781]">
                  <span>10:21 AM</span>
                  <CheckCheck className="h-3.5 w-3.5 text-[#53bdeb]" aria-hidden />
                </div>

                {form.buttons.length > 0 && (
                  <div className="border-t border-[#e9edef]">
                    {form.buttons.map((btn) => (
                      <div
                        key={btn.id}
                        className="flex items-center justify-center gap-1.5 border-t border-[#e9edef] py-2.5 text-[12px] font-medium text-[#00a884] first:border-t-0"
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
          </div>

          {/* Composer bar */}
          <div className="flex items-center gap-1.5 bg-[#f0f2f5] px-2 py-2 pb-5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#00a884] text-white">
              <Plus className="h-4 w-4" aria-hidden />
            </div>
            <div className="flex h-8 flex-1 items-center rounded-full bg-white px-3 text-[11px] text-[#8696a0]">
              Message
            </div>
            <Camera className="h-4 w-4 shrink-0 text-[#54656f]" aria-hidden />
            <Mic className="h-4 w-4 shrink-0 text-[#54656f]" aria-hidden />
          </div>
        </div>
      </IPhonePreviewFrame>
    </div>
  )
}
