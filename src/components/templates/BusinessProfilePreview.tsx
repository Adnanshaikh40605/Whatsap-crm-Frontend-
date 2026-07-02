import { Globe, Mail, MapPin, Phone } from 'lucide-react'

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

  return (
    <div className="flex flex-col items-center">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
        Customer Preview
      </p>
      <div className="w-[280px] overflow-hidden rounded-[28px] border-4 shadow-xl" style={{ borderColor: '#1a1a1a', background: '#111' }}>
        <div className="bg-[#075e54] px-4 py-6 text-center text-white">
          <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-white/20">
            {logo ? (
              <img src={logo} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-2xl font-bold">{profile.business_name?.[0]?.toUpperCase() || '?'}</span>
            )}
          </div>
          <h3 className="text-lg font-bold">{profile.business_name || 'Business Name'}</h3>
          {profile.phone_number && (
            <p className="mt-1 flex items-center justify-center gap-1 text-sm text-white/90">
              <Phone className="h-3.5 w-3.5" /> {profile.phone_number}
            </p>
          )}
        </div>
        <div className="space-y-3 bg-white p-4 text-sm" style={{ color: 'var(--text-primary)' }}>
          {profile.description && (
            <p className="whitespace-pre-wrap leading-relaxed">{profile.description}</p>
          )}
          {profile.vertical_label && (
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
              {profile.vertical_label}
            </p>
          )}
          {profile.email && (
            <p className="flex items-center gap-2 text-xs"><Mail className="h-3.5 w-3.5" /> {profile.email}</p>
          )}
          {websites.map((site) => (
            <p key={site} className="flex items-center gap-2 text-xs text-[#008069]">
              <Globe className="h-3.5 w-3.5" /> {site.replace(/^https?:\/\//, '')}
            </p>
          ))}
          {profile.address && (
            <p className="flex items-start gap-2 text-xs"><MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {profile.address}</p>
          )}
          {!profile.description && !profile.email && websites.length === 0 && !profile.address && (
            <p className="text-center text-xs" style={{ color: 'var(--text-muted)' }}>
              Profile details will appear here
            </p>
          )}
        </div>
      </div>
      <p className="mt-3 max-w-[280px] text-center text-[10px]" style={{ color: 'var(--text-muted)' }}>
        Approximate preview of how customers see your WhatsApp Business profile
      </p>
    </div>
  )
}
