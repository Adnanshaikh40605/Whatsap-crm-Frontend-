import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { Alert, Snackbar, type AlertColor } from '@mui/material'

interface Toast { message: string; severity: AlertColor; key: number }
interface ToastContextType {
  notify: (message: string, severity?: AlertColor) => void
  success: (message: string) => void
  error: (message: string) => void
  info: (message: string) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null)
  const [open, setOpen] = useState(false)

  const notify = useCallback((message: string, severity: AlertColor = 'info') => {
    setToast({ message, severity, key: Date.now() })
    setOpen(true)
  }, [])

  const value: ToastContextType = {
    notify,
    success: (m) => notify(m, 'success'),
    error: (m) => notify(m, 'error'),
    info: (m) => notify(m, 'info'),
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Snackbar
        key={toast?.key}
        open={open}
        autoHideDuration={4000}
        onClose={() => setOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        {toast ? (
          <Alert onClose={() => setOpen(false)} severity={toast.severity} variant="filled" sx={{ borderRadius: 2 }}>
            {toast.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
