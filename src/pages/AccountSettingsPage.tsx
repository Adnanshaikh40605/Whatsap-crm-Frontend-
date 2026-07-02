import { Navigate } from 'react-router-dom'

/** Legacy route — account settings live under Project Settings. */
export function AccountSettingsPage() {
  return <Navigate to="/whatsapp-crm/settings/account" replace />
}
