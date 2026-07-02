import { useMemo, type ReactNode } from 'react'
import { ThemeProvider, CssBaseline } from '@mui/material'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { getTheme } from './index'
import { useTheme } from '../context/ThemeContext'

/**
 * Bridges the existing ThemeContext (light/dark + localStorage) to MUI.
 * Keeps a single source of truth for the active mode during the migration.
 */
export function MuiProvider({ children }: { children: ReactNode }) {
  const { theme: mode } = useTheme()
  const muiTheme = useMemo(() => getTheme(mode), [mode])
  return (
    <ThemeProvider theme={muiTheme}>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <CssBaseline />
        {children}
      </LocalizationProvider>
    </ThemeProvider>
  )
}
