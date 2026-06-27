import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from './context/ThemeContext'
import { MuiProvider } from './theme/MuiProvider'
import { ToastProvider } from './components/common/ToastProvider'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute, PublicRoute } from './components/auth/ProtectedRoute'
import { AppShell } from './components/layout/AppShell'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { ProjectsPage } from './pages/ProjectsPage'
import { DashboardPage } from './pages/DashboardPage'
import { InboxPage } from './pages/InboxPage'
import { CampaignsPage } from './pages/CampaignsPage'
import { TemplatesPage } from './pages/TemplatesPage'
import { ContactsPage } from './pages/ContactsPage'
import { CrmPage } from './pages/CrmPage'
import { MediaPage } from './pages/MediaPage'
import { QRCodePage } from './pages/QRCodePage'
import { CompaniesAdminPage } from './pages/CompaniesAdminPage'
import { OnboardingWizard } from './pages/OnboardingWizard'
import { CampaignDetailPage } from './pages/CampaignDetailPage'
import { SettingsPage } from './pages/SettingsPage'
import { WhatsAppApiGuidePage } from './pages/WhatsAppApiGuidePage'
import { SmsPage } from './pages/SmsPage'
import { MessageLogPage } from './pages/MessageLogPage'
import { SmsDashboardPage } from './pages/SmsDashboardPage'
import { AccountSettingsPage } from './pages/AccountSettingsPage'
import { ModulePlaceholderPage } from './pages/ModulePlaceholderPage'

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
      <MuiProvider>
      <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
            <Route path="/onboarding" element={<ProtectedRoute><OnboardingWizard /></ProtectedRoute>} />
            <Route path="/projects" element={<ProtectedRoute><ProjectsPage /></ProtectedRoute>} />
            <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
              <Route path="/" element={<Navigate to="/projects" replace />} />

              <Route path="/account" element={<AccountSettingsPage />} />

              <Route path="/whatsapp-crm/dashboard" element={<DashboardPage />} />
              <Route path="/whatsapp-crm/inbox" element={<InboxPage />} />
              <Route path="/whatsapp-crm/templates" element={<TemplatesPage />} />
              <Route path="/whatsapp-crm/campaigns" element={<CampaignsPage />} />
              <Route path="/whatsapp-crm/campaigns/:id" element={<CampaignDetailPage />} />
              <Route path="/whatsapp-crm/contacts" element={<ContactsPage />} />
              <Route path="/whatsapp-crm/contact-groups" element={<ContactsPage />} />
              <Route path="/whatsapp-crm/message-logs" element={<MessageLogPage channel="whatsapp" title="WhatsApp Message Logs" subtitle="WhatsApp-only sent, delivered, read, failed, and inbound message history." />} />
              <Route path="/whatsapp-crm/media" element={<MediaPage />} />
              <Route path="/whatsapp-crm/api-settings" element={<QRCodePage />} />
              <Route path="/whatsapp-crm/setup-guide" element={<WhatsAppApiGuidePage />} />
              <Route path="/whatsapp-crm/settings" element={<SettingsPage />} />
              <Route path="/whatsapp-crm/settings/:section" element={<SettingsPage />} />
              <Route path="/whatsapp-crm/automation" element={<ModulePlaceholderPage project="WhatsApp CRM" title="WhatsApp Automation" description="WhatsApp-only automation workflows, triggers, and bot actions." items={['New WhatsApp message trigger', 'Send approved template', 'Assign conversation', 'Webhook/action steps']} />} />
              <Route path="/whatsapp-crm/reports" element={<ModulePlaceholderPage project="WhatsApp CRM" title="WhatsApp Reports" description="WhatsApp-only delivery, campaign, template, inbox, and agent performance reports." items={['Campaign funnel', 'Template quality', 'Delivery/read rates', 'Agent response time']} />} />

              <Route path="/sms-crm/dashboard" element={<SmsDashboardPage />} />
              <Route path="/sms-crm/send" element={<SmsPage />} />
              <Route path="/sms-crm/templates" element={<ModulePlaceholderPage project="SMS CRM" title="SMS Templates" description="DLT-approved SMS templates with PE IDs, template IDs, and variable mapping." items={['Template ID', 'PE ID / Entity ID', 'Transactional/Promotional category', 'Variable-safe body']} />} />
              <Route path="/sms-crm/campaigns" element={<ModulePlaceholderPage project="SMS CRM" title="Bulk SMS Campaigns" description="SMS-only campaigns using approved sender IDs and DLT templates." items={['Audience selection', 'DLT template mapping', 'Smartping route', 'Delivery reports']} />} />
              <Route path="/sms-crm/contacts" element={<ModulePlaceholderPage project="SMS CRM" title="SMS Contacts" description="SMS-only contacts and phone-number audiences, isolated from WhatsApp conversations." items={['Phone number import', 'Consent source', 'Opt-out status', 'Segment tags']} />} />
              <Route path="/sms-crm/contact-groups" element={<ModulePlaceholderPage project="SMS CRM" title="SMS Contact Groups" description="SMS-only contact groups for bulk campaigns and compliance filtering." items={['Campaign group', 'Transactional audience', 'Promotional audience', 'Opt-out filtered list']} />} />
              <Route path="/sms-crm/sender-ids" element={<ModulePlaceholderPage project="SMS CRM" title="Sender IDs" description="DLT-approved headers/sender IDs used only by the SMS CRM." items={['Header name', 'Entity ID / PE ID', 'DLT approval status', 'Smartping route mapping']} />} />
              <Route path="/sms-crm/message-logs" element={<MessageLogPage channel="sms" title="SMS Message Logs" subtitle="SMS-only provider IDs, queued/sent/failed status, and delivery history." />} />
              <Route path="/sms-crm/api-settings" element={<ModulePlaceholderPage project="SMS CRM" title="SMS API Settings" description="Smartping/API credentials, DLT IDs, sender ID mapping, and callback setup." items={['Smartping API key/token', 'Base URL and route', 'Sender ID mapping', 'DLT Entity ID', 'Delivery callback URL']} />} />
              <Route path="/sms-crm/reports" element={<ModulePlaceholderPage project="SMS CRM" title="SMS Reports" description="SMS-only campaign delivery, DLT template usage, sender ID performance, and failure reports." items={['Submitted vs delivered', 'Failed reason breakdown', 'Sender ID usage', 'Campaign export']} />} />

              <Route path="/qr-code" element={<Navigate to="/whatsapp-crm/api-settings" replace />} />
              <Route path="/docs/whatsapp-api" element={<Navigate to="/whatsapp-crm/setup-guide" replace />} />
              <Route path="/inbox" element={<Navigate to="/whatsapp-crm/inbox" replace />} />
              <Route path="/sms" element={<Navigate to="/sms-crm/send" replace />} />
              <Route path="/contacts" element={<Navigate to="/whatsapp-crm/contacts" replace />} />
              <Route path="/crm" element={<CrmPage />} />
              <Route path="/templates" element={<Navigate to="/whatsapp-crm/templates" replace />} />
              <Route path="/media" element={<Navigate to="/whatsapp-crm/media" replace />} />
              <Route path="/automation" element={<Navigate to="/whatsapp-crm/automation" replace />} />
              <Route path="/campaigns" element={<Navigate to="/whatsapp-crm/campaigns" replace />} />
              <Route path="/campaigns/:id" element={<CampaignDetailPage />} />
              <Route path="/message-log" element={<Navigate to="/whatsapp-crm/message-logs" replace />} />
              <Route path="/settings" element={<Navigate to="/whatsapp-crm/settings" replace />} />
              <Route path="/settings/:section" element={<SettingsPage />} />

              <Route path="/bot-flows" element={<Navigate to="/whatsapp-crm/automation" replace />} />
              <Route path="/bot-flows/:id/builder" element={<Navigate to="/whatsapp-crm/automation" replace />} />
              <Route path="/bot-replies" element={<Navigate to="/whatsapp-crm/automation" replace />} />
              <Route path="/marketplace" element={<Navigate to="/projects" replace />} />
              <Route path="/analytics" element={<Navigate to="/whatsapp-crm/reports" replace />} />
              <Route path="/ai-agent" element={<Navigate to="/whatsapp-crm/automation" replace />} />
              <Route path="/team" element={<Navigate to="/whatsapp-crm/settings/team" replace />} />
              <Route path="/admin/companies" element={<CompaniesAdminPage />} />
              <Route path="/chatbot" element={<Navigate to="/whatsapp-crm/automation" replace />} />
            </Route>
            <Route path="*" element={<Navigate to="/projects" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
      </ToastProvider>
      </MuiProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
