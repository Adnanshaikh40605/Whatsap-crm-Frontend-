export interface User {
  id: string
  username?: string
  email: string
  first_name: string
  last_name: string
  full_name: string
  phone: string
  email_verified: boolean
  is_staff?: boolean
  is_superuser?: boolean
  org_role?: string
  platform_role?: 'super_admin' | 'admin' | 'staff'
  created_at: string
}

export interface Organization {
  id: string
  name: string
  description: string
  project_type: 'whatsapp' | 'sms' | 'email' | 'other'
  slug: string
  plan: string
  industry: string
  team_size: string
  logo: string | null
  timezone: string
  whatsapp_connected: boolean
  whatsapp_phone_number_id?: string
  whatsapp_business_account_id?: string
  whatsapp_api_status?: 'live' | 'pending' | 'not_connected'
  whatsapp_setup_status?: string
  onboarding_completed: boolean
  onboarding_step: number
  branding: Record<string, unknown>
  settings: Record<string, unknown>
  member_count: number
  plan_limits: Record<string, number>
  is_active: boolean
  white_label_domain: string
  has_project_password?: boolean
  membership_role?: string
  created_at: string
}

export interface Contact {
  id: string
  first_name: string
  last_name: string
  full_name: string
  email: string
  phone: string
  company: string
  source: string
  tags: string[]
  assigned_to: string | null
  created_at: string
}

export interface Lead {
  id: string
  title: string
  contact: string
  contact_name: string
  stage: string | null
  stage_name: string
  value: string
  score: number
  priority: string
  assigned_to: string | null
  created_at: string
}

export interface Conversation {
  id: string
  contact: Contact
  status: string
  assigned_to: string | null
  last_message_at: string | null
  last_message_preview: string
  last_outbound_status?: string
  unread_count: number
  is_bot_active: boolean
  tags?: string[]
  metadata?: { last_message_direction?: string }
}

export interface Campaign {
  id: string
  name: string
  status: string
  total_recipients: number
  sent_count: number
  delivered_count: number
  read_count: number
  reply_count: number
  scheduled_at: string | null
}

export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}
