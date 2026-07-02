import dayjs, { type Dayjs } from 'dayjs'
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker'

interface Props {
  label?: string
  value: string
  onChange: (value: string) => void
}

export function ScheduleDateTimeField({ label = 'Schedule', value, onChange }: Props) {
  const parsed = value ? dayjs(value) : null

  return (
    <DateTimePicker
      label={label}
      value={parsed?.isValid() ? parsed : null}
      onChange={(next: Dayjs | null) => {
        onChange(next?.isValid() ? next.toISOString() : '')
      }}
      minDateTime={dayjs()}
      ampm
      disablePast
      format="DD/MM/YYYY, hh:mm A"
      slotProps={{
        textField: {
          fullWidth: true,
          size: 'small',
        },
        popper: {
          sx: { zIndex: 1500 },
        },
      }}
    />
  )
}

export function formatScheduleLabel(value: string) {
  if (!value) return 'Send now'
  const parsed = dayjs(value)
  return parsed.isValid() ? parsed.format('DD MMM YYYY, hh:mm A') : value
}
