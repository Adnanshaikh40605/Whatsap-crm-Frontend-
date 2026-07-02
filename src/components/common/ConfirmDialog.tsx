import {
  Box, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle,
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

export function ConfirmDialog({
  open, title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel',
  severity = 'primary', loading, onConfirm, onClose,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      {message && (
        <DialogContent>
          {typeof message === 'string' ? (
            <DialogContentText component="div">{message}</DialogContentText>
          ) : (
            <Box sx={{ color: 'text.secondary', typography: 'body2', lineHeight: 1.6 }}>
              {message}
            </Box>
          )}
        </DialogContent>
      )}
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit" disabled={loading}>
          {cancelLabel}
        </Button>
        <Button onClick={onConfirm} variant="contained" color={severity} disabled={loading}>
          {loading
            ? (confirmLabel === 'Delete' ? 'Deleting…' : 'Please wait…')
            : confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
