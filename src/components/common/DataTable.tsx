import { Box } from '@mui/material'
import { DataGrid, type DataGridProps, type GridColDef } from '@mui/x-data-grid'
import { EmptyState } from './EmptyState'
import type { ReactNode } from 'react'

interface DataTableProps extends Omit<DataGridProps, 'columns'> {
  columns: GridColDef[]
  emptyTitle?: string
  emptyDescription?: string
  emptyAction?: ReactNode
  height?: number | string
}

export function DataTable({
  columns, rows, loading, emptyTitle = 'Nothing here yet',
  emptyDescription, emptyAction, height = 560, ...props
}: DataTableProps) {
  return (
    <Box sx={{ width: '100%', height }}>
      <DataGrid
        columns={columns}
        rows={rows}
        loading={loading}
        disableRowSelectionOnClick
        pageSizeOptions={[25, 50, 100]}
        initialState={{ pagination: { paginationModel: { pageSize: 25, page: 0 } } }}
        slots={{
          noRowsOverlay: () => (
            <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} />
          ),
        }}
        sx={{
          border: 'none',
          '& .MuiDataGrid-columnHeaders': { bgcolor: 'background.default' },
          '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': { outline: 'none' },
          '& .MuiDataGrid-row:hover': { bgcolor: 'action.hover' },
          '& .MuiDataGrid-row': { cursor: props.onRowClick ? 'pointer' : 'default' },
        }}
        {...props}
      />
    </Box>
  )
}

export type { GridColDef }
