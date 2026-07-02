import type { ReactNode } from 'react'

export interface DeleteConfirmRequest {
  itemName: string
  itemType?: string
  associatedDataMessage?: string
  onConfirm: () => void | Promise<unknown>
}

export function buildDeleteConfirmMessage({
  itemName,
  itemType = 'item',
  associatedDataMessage,
}: Omit<DeleteConfirmRequest, 'onConfirm'>): ReactNode {
  const defaultAssociated =
    associatedDataMessage ??
    'Deleting this item will permanently remove all associated data from your workspace.'

  return (
    <>
      <strong>Are you sure you want to delete this {itemType}?</strong>
      <br />
      <br />
      You are about to delete <strong>{itemName}</strong>.
      <br />
      <br />
      <strong>This action cannot be undone.</strong>
      <br />
      <br />
      {defaultAssociated}
    </>
  )
}

export function buildDeleteConfirmTitle(itemType = 'item') {
  return `Delete ${itemType}?`
}
