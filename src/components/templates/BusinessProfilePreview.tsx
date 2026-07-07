import { Globe, Mail, MapPin, Phone } from 'lucide-react'
import { WA } from '../../lib/whatsappTheme'

export interface BusinessProfilePreviewData {
  business_name: string
  phone_number?: string
  description?: string
  vertical_label?: string
  email?: string
  websites?: string[]
  address?: string
  profile_picture_url?: string
  logoPreview?: string
}

export function BusinessProfilePreview({ profile }: { profile: BusinessProfilePreviewData }) {
  const logo = profile.logoPreview || profile.profile_picture_url
  const websites = profile.websites?.filter(Boolean) ?? []
  const hasDetails = profile.description || profile.email || websites.length > 0 || profile.address

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
        Customer preview
      </p>
      <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
        How customers see your WhatsApp Business profile
      </p>

      <div className="mt-5 flex justify-center">
        <div
          className="w-full max-w-[260px] overflow-hidden rounded-2xl border shadow-md"
          style={{ borderColor: WA.border, background: WA.surface }}
        >
          <div className="px-5 py-6 text-center text-white" style={{ background: WA.panel }}>
            <div
              className="mx-auto mb-3 flex h-[72px] w-[72px] items-center justify-center overflow-hidden rounded-full"
              style={{ background: 'rgba(255,255,255,0.12)' }}
            >
              {logo ? (
                <img src={logo} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="text-2xl font-bold">{profile.business_name?.[0]?.toUpperCase() || '?'}</span>
              )}
            </div>
            <h3 className="text-base font-semibold leading-tight">{profile.business_name || 'Business Name'}</h3>
            {profile.phone_number && (
              <p className="mt-1.5 flex items-center justify-center gap-1.5 text-xs text-white/85">
                <Phone className="h-3.5 w-3.5 shrink-0" />
                <span>{profile.phone_number}</span>
              </p>
            )}
          </div>

          <div className="space-y-3 p-4 text-sm" style={{ color: WA.text }}>
            {profile.vertical_label && (
              <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: WA.textMuted }}>
                {profile.vertical_label}
              </p>
            )}
            {profile.description ? (
              <p className="whitespace-pre-wrap text-[13px] leading-relaxed" style={{ color: WA.textSecondary }}>
                {profile.description}
              </p>
            ) : null}
            {profile.email && (
              <p className="flex items-center gap-2 text-xs" style={{ color: WA.textSecondary }}>
                <Mail className="h-3.5 w-3.5 shrink-0" style={{ color: WA.textMuted }} />
                {profile.email}
              </p>
            )}
            {websites.map((site) => (
              <p key={site} className="flex items-center gap-2 text-xs" style={{ color: WA.primary }}>
                <Globe className="h-3.5 w-3.5 shrink-0" />
                {site.replace(/^https?:\/\//, '')}
              </p>
            ))}
            {profile.address && (
              <p className="flex items-start gap-2 text-xs" style={{ color: WA.textSecondary }}>
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: WA.textMuted }} />
                {profile.address}
              </p>
            )}
            {!hasDetails && (
              <p className="py-2 text-center text-xs" style={{ color: WA.textMuted }}>
                Add details to preview your profile
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
