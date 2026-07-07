import {
  Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle,
} from '@mui/material'
import type { ReactNode } from 'react'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message?: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  severity?: 'primary' | 'error'
  loading?: boolean
  onConfirm: () => void
  onClose: () => void
}

const paperSx = {
  borderRadius: '8px',
  border: '1px solid var(--color-border-subtle)',
  boxShadow: 'var(--shadow-2)',
}

export function ConfirmDialog({
  open, title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel',
  severity = 'primary', loading, onConfirm, onClose,
}: ConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      maxWidth="xs"
      fullWidth
      slotProps={{ paper: { sx: paperSx } }}
    >
      <DialogTitle sx={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text-primary)', pb: 1 }}>
        {title}
      </DialogTitle>
      {message && (
        <DialogContent sx={{ pt: 0 }}>
          {typeof message === 'string' ? (
            <DialogContentText sx={{ fontSize: 14, lineHeight: '21px', color: 'var(--color-text-secondary)' }}>
              {message}
            </DialogContentText>
          ) : (
            <div className="text-[var(--font-size-2xl)] leading-[var(--font-line-height-base)] text-[var(--color-text-secondary)]">
              {message}
            </div>
          )}
        </DialogContent>
      )}
      <DialogActions sx={{ px: 2.5, pb: 2, pt: 1, gap: 1 }}>
        <Button onClick={onClose} color="inherit" disabled={loading} sx={{ borderRadius: 50, textTransform: 'none', fontWeight: 600 }}>
          {cancelLabel}
        </Button>
        <Button onClick={onConfirm} variant="contained" color={severity} disabled={loading} sx={{ borderRadius: 50, textTransform: 'none', fontWeight: 600 }}>
          {loading
            ? (confirmLabel === 'Delete' ? 'Deleting…' : 'Please wait…')
            : confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
