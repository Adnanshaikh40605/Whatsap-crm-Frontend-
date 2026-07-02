export interface BotFlow {
  id: string
  title: string
  start_trigger: string
  trigger_type: string
  is_active: boolean
  reply_count: number
  flow_data: FlowData
  created_at: string
  updated_at: string
}

export interface FlowData {
  nodes: FlowNode[]
  edges: FlowEdge[]
}

export interface FlowNode {
  id: string
  type: string
  position: { x: number; y: number }
  data: Record<string, unknown>
}

export interface FlowEdge {
  id: string
  source: string
  target: string
}

export interface BotReply {
  id: string
  title: string
  reply_type: 'simple' | 'media' | 'interactive'
  content: string
  options: string[]
  bot_flow: string | null
  is_active: boolean
}

export interface WhatsAppTemplate {
  id: string
  name: string
  language: string
  category: string
  status: string
  body: string
  header: Record<string, unknown>
  footer: string
  buttons: unknown[]
  components?: unknown[]
  variables?: unknown[]
  template_type?: string
  meta_status?: string
  quality_rating?: string
  rejected_reason?: string
  media_asset?: string | null
  media_asset_display?: string
  whatsapp_template_id?: string
  display_name?: string
  last_synced_at?: string | null
  updated_at: string
  created_at: string
}

export interface Campaign {
  id: string
  name: string
  status: string
  template: string | null
  template_name: string
  template_display: string
  contact_group: string | null
  group_name: string
  audience_filter?: { contact_ids?: string[] }
  total_recipients: number
  sent_count: number
  delivered_count: number
  read_count: number
  failed_count: number
  reply_count: number
  is_archived: boolean
  scheduled_at: string | null
  created_at: string
}

export interface MessageLog {
  id: string
  channel: string
  direction: string
  message_type: string
  content: string
  status: string
  provider_message_id?: string
  created_at: string
}
