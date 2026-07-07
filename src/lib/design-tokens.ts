/** AiSensy design tokens for programmatic use (charts, inline styles). */
export const tokens = {
  font: {
    family: {
      primary: '"Roboto", ui-sans-serif, system-ui, sans-serif',
    },
    size: {
      xs: '10px',
      sm: '11px',
      md: '12px',
      lg: '13px',
      xl: '13.33px',
      '2xl': '14px',
      '3xl': '15px',
      '4xl': '16px',
      base: '14px',
    },
    weight: { base: 400, medium: 500, semibold: 600, bold: 700 },
    lineHeight: { base: '21px' },
  },
  color: {
    text: {
      primary: '#0a474c',
      secondary: '#2d6b70',
      tertiary: '#4a4a4a',
      muted: '#6b7c7e',
      inverse: '#fbfbfb',
    },
    surface: {
      base: '#0a474c',
      default: '#ffffff',
      muted: '#ebf5f3',
      raised: '#42b864',
      raisedHover: '#3aa358',
      raisedPressed: '#32964f',
    },
    border: {
      default: '#c5ddd8',
      subtle: '#d9ebe7',
    },
    feedback: {
      success: '#42b864',
      warning: '#f7b928',
      critical: '#e41e3f',
      info: '#1876f2',
    },
    focus: { ring: '#42b864' },
  },
  space: {
    1: '3px',
    2: '4px',
    3: '4.2px',
    4: '6px',
    5: '6.3px',
    6: '8px',
    7: '10px',
    8: '12px',
    9: '16px',
    10: '20px',
    11: '24px',
  },
  radius: {
    xs: '3.29px',
    sm: '6px',
    md: '8px',
    lg: '50px',
  },
  shadow: {
    1: 'rgba(0, 0, 0, 0.2) 0px 2px 4px 0px',
    2: 'rgba(0, 0, 0, 0.06) 0px 1px 6px 0px, rgba(0, 0, 0, 0.16) 0px 2px 32px 0px',
  },
  motion: {
    instant: '150ms',
    fast: '167ms',
    normal: '250ms',
    slow: '300ms',
  },
} as const
