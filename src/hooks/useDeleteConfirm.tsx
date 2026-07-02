import { useCallback, useState } from 'react'
import { ConfirmDialog } from '../components/common/ConfirmDialog'
import {
  buildDeleteConfirmMessage,
  buildDeleteConfirmTitle,
  type DeleteConfirmRequest,
} from '../lib/deleteConfirm'

export function useDeleteConfirm() {
  const [pending, setPending] = useState<DeleteConfirmRequest | null>(null)
  const [loading, setLoading] = useState(false)

  const requestDelete = useCallback((options: DeleteConfirmRequest) => {
    setPending(options)
  }, [])

  const closeDelete = useCallback(() => {
    if (!loading) setPending(null)
  }, [loading])

  const confirmDelete = useCallback(async () => {
    if (!pending) return
    setLoading(true)
    try {
      await pending.onConfirm()
      setPending(null)
    } finally {
      setLoading(false)
    }
  }, [pending])

  const deleteDialog = (
    <ConfirmDialog
      open={Boolean(pending)}
      title={pending ? buildDeleteConfirmTitle(pending.itemType) : ''}
      message={pending ? buildDeleteConfirmMessage(pending) : undefined}
      confirmLabel="Delete"
      cancelLabel="Cancel"
      severity="error"
      loading={loading}
      onConfirm={confirmDelete}
      onClose={closeDelete}
    />
  )

  return { requestDelete, closeDelete, deleteDialog, deleteLoading: loading }
}
