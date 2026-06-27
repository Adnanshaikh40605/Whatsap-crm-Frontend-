import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { getApiUrl } from './config'

export const api = axios.create({
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  config.baseURL = getApiUrl()
  const token = localStorage.getItem('access_token')
  const orgId = localStorage.getItem('organization_id')
  if (token) config.headers.Authorization = `Bearer ${token}`
  if (orgId) config.headers['X-Organization-ID'] = orgId
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean }
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      const refresh = localStorage.getItem('refresh_token')
      if (refresh) {
        try {
          const { data } = await axios.post(`${getApiUrl()}/auth/refresh/`, { refresh })
          const tokens = data.data?.tokens ?? data
          localStorage.setItem('access_token', tokens.access)
          if (tokens.refresh) localStorage.setItem('refresh_token', tokens.refresh)
          original.headers.Authorization = `Bearer ${tokens.access}`
          return api(original)
        } catch {
          localStorage.clear()
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(error)
  },
)

export const authApi = {
  login: (name: string, password: string) =>
    api.post('/auth/login/', { name, password }),
  register: (data: {
    username: string
    password: string
    first_name: string
    last_name: string
    organization_name: string
  }) => api.post('/auth/register/', data),
  me: () => api.get('/auth/me/'),
  changePassword: (old_password: string, new_password: string) =>
    api.post('/auth/change-password/', { old_password, new_password }),
  updateProfile: (data: Partial<{ first_name: string; last_name: string; phone: string; username: string }>) =>
    api.patch('/auth/me/', data),
  passwordReset: (email: string) => api.post('/auth/password-reset/', { email }),
  passwordResetConfirm: (uid: string, token: string, password: string) =>
    api.post('/auth/password-reset/confirm/', { uid, token, password }),
}

export const orgApi = {
  list: () => api.get('/organizations/'),
  current: () => api.get('/organizations/current/'),
  switch: (id: string, project_password?: string) =>
    api.post(`/organizations/${id}/switch/`, project_password ? { project_password } : {}),
  verifyAccess: (id: string, project_password: string) =>
    api.post(`/organizations/${id}/verify_access/`, { project_password }),
  create: (data: { name: string; description?: string; project_type?: string; project_password: string }) =>
    api.post('/organizations/', data),
  update: (id: string, data: Record<string, unknown>) => api.patch(`/organizations/${id}/`, data),
  updateAppearance: (id: string, data: FormData) => api.patch(`/organizations/${id}/`, data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  members: (orgId: string) => api.get(`/organizations/${orgId}/members/`),
  addMember: (orgId: string, data: { email: string; role: string }) =>
    api.post(`/organizations/${orgId}/members/`, data),
  delete: (id: string, project_password: string) =>
    api.delete(`/organizations/${id}/`, { data: { project_password } }),
}

export const crmApi = {
  contacts: (params?: Record<string, string>) => api.get('/crm/contacts/', { params }),
  createContact: (data: Record<string, unknown>) => api.post('/crm/contacts/', data),
  groups: (params?: Record<string, string>) => api.get('/crm/groups/', { params }),
  createGroup: (data: Record<string, unknown>) => api.post('/crm/groups/', data),
  updateGroup: (id: string, data: Record<string, unknown>) => api.patch(`/crm/groups/${id}/`, data),
  importContacts: (data: FormData) => api.post('/crm/contacts/import/', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  leads: (params?: Record<string, string>) => api.get('/crm/leads/', { params }),
  moveStage: (leadId: string, stageId: string) => api.post(`/crm/leads/${leadId}/move_stage/`, { stage_id: stageId }),
  stages: () => api.get('/crm/stages/'),
  activities: () => api.get('/crm/activities/'),
}

export const inboxApi = {
  conversations: (params?: Record<string, string>) =>
    api.get('/inbox/conversations/', { params }),
  messages: (conversationId: string) =>
    api.get('/inbox/messages/', { params: { conversation: conversationId } }),
  sendMessage: (data: { conversation: string; content: string; is_internal_note?: boolean }) =>
    api.post('/inbox/messages/', data),
  takeover: (id: string) => api.post(`/inbox/conversations/${id}/takeover/`),
  addTag: (id: string, tag: string) => api.post(`/inbox/conversations/${id}/add_tag/`, { tag }),
  markRead: (id: string) => api.post(`/inbox/conversations/${id}/mark_read/`),
}

export const smsApi = {
  send: (data: { phone?: string; contact_id?: string; content: string; first_name?: string; last_name?: string }) =>
    api.post('/sms-crm/messages/send/', data),
  dashboard: () => api.get('/sms-crm/dashboard/'),
  settings: () => api.get('/sms-crm/api-settings/'),
  updateSettings: (data: Record<string, unknown>) => api.patch('/sms-crm/api-settings/', data),
  messages: () => api.get('/sms-crm/messages/logs/'),
}

export const campaignApi = {
  list: (params?: Record<string, string>) => api.get('/campaigns/', { params }),
  get: (id: string) => api.get(`/campaigns/${id}/`),
  create: (data: Record<string, unknown>) => api.post('/campaigns/', data),
  update: (id: string, data: Record<string, unknown>) => api.patch(`/campaigns/${id}/`, data),
  launch: (id: string) => api.post(`/campaigns/${id}/launch/`),
  archive: (id: string) => api.post(`/campaigns/${id}/archive/`),
  dashboard: (id: string) => api.get(`/campaigns/${id}/dashboard/`),
  templates: () => api.get('/campaigns/templates/'),
  createTemplate: (data: Record<string, unknown>) => api.post('/campaigns/templates/', data),
  submitTemplate: (id: string) => api.post(`/campaigns/templates/${id}/submit_meta/`),
  refreshTemplate: (id: string) => api.post(`/campaigns/templates/${id}/refresh_meta/`),
  syncTemplates: () => api.post('/campaigns/templates/sync_meta/'),
  previewTemplate: (id: string) => api.get(`/campaigns/templates/${id}/preview/`),
  deleteTemplate: (id: string) => api.delete(`/campaigns/templates/${id}/`),
  media: (params?: Record<string, string>) => api.get('/campaigns/media/', { params }),
  uploadMedia: (data: FormData) => api.post('/campaigns/media/', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
}

export const automationApi = {
  workflows: () => api.get('/automation/workflows/'),
  followUps: () => api.get('/automation/follow-ups/'),
  botFlows: () => api.get('/automation/bot-flows/'),
  getBotFlow: (id: string) => api.get(`/automation/bot-flows/${id}/`),
  createBotFlow: (data: Record<string, unknown>) => api.post('/automation/bot-flows/', data),
  updateBotFlow: (id: string, data: Record<string, unknown>) => api.patch(`/automation/bot-flows/${id}/`, data),
  deleteBotFlow: (id: string) => api.delete(`/automation/bot-flows/${id}/`),
  toggleBotFlow: (id: string) => api.post(`/automation/bot-flows/${id}/toggle_status/`),
  saveFlow: (id: string, flowData: unknown) => api.post(`/automation/bot-flows/${id}/save_flow/`, { flow_data: flowData }),
  botReplies: (params?: Record<string, string>) => api.get('/automation/bot-replies/', { params }),
  createBotReply: (data: Record<string, unknown>) => api.post('/automation/bot-replies/', data),
  createFollowUp: (data: Record<string, unknown>) => api.post('/automation/follow-ups/', data),
  templates: () => api.get('/automation/templates/'),
}

export const messageLogApi = {
  list: (params?: Record<string, string>) => api.get('/inbox/messages/', { params }),
}

export const onboardingApi = {
  status: () => api.get('/onboarding/status/'),
  whatsappConfig: () => api.get('/onboarding/whatsapp/config/'),
  whatsappConnect: (data: { code?: string; waba_id?: string; phone_number_id?: string; access_token?: string }) =>
    api.post('/onboarding/whatsapp/connect/', data),
  completeStep: (step: number, data: Record<string, unknown>) =>
    api.post(`/onboarding/step/${step}/`, data),
  marketplace: () => api.get('/onboarding/marketplace/'),
  installPack: (packId: string) => api.post('/onboarding/marketplace/install/', { pack_id: packId }),
  aiSetup: (data: { business_description: string; qualification_questions?: string[] }) =>
    api.post('/onboarding/ai/setup/', data),
  aiCampaign: (prompt: string) => api.post('/onboarding/ai/campaign/', { prompt }),
}

export const billingApi = {
  subscription: () => api.get('/billing/subscription/'),
  usage: () => api.get('/billing/usage/'),
  wallet: () => api.get('/billing/wallet/'),
  topUp: (amount_cents: number, gateway_payment_id?: string) =>
    api.post('/billing/wallet/topup/', { amount_cents, gateway_payment_id }),
  transactions: () => api.get('/billing/wallet/transactions/'),
}

export const quotesApi = {
  list: () => api.get('/quotes/'),
  create: (data: Record<string, unknown>) => api.post('/quotes/', data),
  send: (id: string) => api.post(`/quotes/${id}/send_whatsapp/`),
  approve: (id: string) => api.post(`/quotes/${id}/approve/`),
}

export const invoicesApi = {
  list: () => api.get('/invoices/'),
  create: (data: Record<string, unknown>) => api.post('/invoices/', data),
  markPaid: (id: string, amount?: number) => api.post(`/invoices/${id}/mark_paid/`, { amount }),
  send: (id: string) => api.post(`/invoices/${id}/send_whatsapp/`),
  remind: (id: string) => api.post(`/invoices/${id}/send_reminder/`),
}

export const analyticsApi = {
  dashboard: () => api.get('/analytics/dashboard/'),
  agents: () => api.get('/analytics/agents/'),
}

export const aiApi = {
  agents: () => api.get('/ai/agents/'),
  chat: (message: string, conversationId?: string) =>
    api.post('/ai/chat/', { message, conversation_id: conversationId }),
  summarize: (messages: { content: string; direction: string }[]) =>
    api.post('/ai/summarize/', { messages }),
  generateWorkflow: (prompt: string) => api.post('/ai/workflow/generate/', { prompt }),
  insights: () => api.get('/ai/insights/'),
}

export const adminApi = {
  companies: () => api.get('/organizations/admin/companies/'),
  createCompany: (data: { name: string; industry?: string; website?: string }) =>
    api.post('/organizations/admin/companies/', data),
  getCompany: (id: string) => api.get(`/organizations/admin/companies/${id}/`),
}

export const platformApi = {
  apiKeys: () => api.get('/platform/keys/'),
  createApiKey: (name: string, scopes?: string[]) =>
    api.post('/platform/keys/', { name, scopes }),
  webhooks: () => api.get('/platform/webhooks/'),
  createWebhook: (data: { url: string; events: string[] }) =>
    api.post('/platform/webhooks/', data),
}

export const coreApi = {
  options: () => api.get('/core/options/'),
}
