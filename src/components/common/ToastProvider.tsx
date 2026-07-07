import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { FeedbackMessage, type FeedbackVariant } from './FeedbackMessage'

interface Toast {
  message: string
  variant: FeedbackVariant
  key: number
}

interface ToastContextType {
  notify: (message: string, variant?: FeedbackVariant) => void
  success: (message: string) => void
  error: (message: string) => void
  warning: (message: string) => void
  info: (message: string) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

const AUTO_HIDE_MS = 4500

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null)
  const [open, setOpen] = useState(false)

  const notify = useCallback((message: string, variant: FeedbackVariant = 'info') => {
    setToast({ message, variant, key: Date.now() })
    setOpen(true)
  }, [])

  useEffect(() => {
    if (!open || !toast) return
    const timer = window.setTimeout(() => setOpen(false), AUTO_HIDE_MS)
    return () => window.clearTimeout(timer)
  }, [open, toast])

  const value: ToastContextType = {
    notify,
    success: (m) => notify(m, 'success'),
    error: (m) => notify(m, 'error'),
    warning: (m) => notify(m, 'warning'),
    info: (m) => notify(m, 'info'),
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      {open && toast ? (
        <div
          className="pointer-events-none fixed inset-x-0 bottom-6 z-[9999] flex justify-center px-4 sm:justify-end sm:px-6"
          key={toast.key}
        >
          <div className="pointer-events-auto w-full max-w-md">
            <FeedbackMessage
              variant={toast.variant}
              elevated
              onClose={() => setOpen(false)}
            >
              {toast.message}
            </FeedbackMessage>
          </div>
        </div>
      ) : null}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
