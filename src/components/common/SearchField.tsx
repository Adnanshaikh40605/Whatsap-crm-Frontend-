import { InputAdornment, TextField, type TextFieldProps } from '@mui/material'
import { Search } from 'lucide-react'
import { ICON, ICON_STROKE } from '../../lib/icons'

type SearchFieldProps = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
} & Omit<TextFieldProps, 'onChange' | 'value'>

export function SearchField({ value, onChange, placeholder = 'Search…', sx, ...props }: SearchFieldProps) {
  return (
    <TextField
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      size="small"
      sx={{ minWidth: 240, ...sx }}
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <Search size={ICON.sm} strokeWidth={ICON_STROKE} style={{ color: 'inherit', opacity: 0.6 }} />
            </InputAdornment>
          ),
        },
      }}
      {...props}
    />
  )
}
