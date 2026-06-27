const LOCAL_API = 'http://localhost:8000/api/v1'
const PRODUCTION_API = 'https://api.driveronhire.ai/api/v1'

const PRODUCTION_HOSTS = new Set([
  'driveronhire.ai',
  'www.driveronhire.ai',
])

function isLocalhostApi(url: string): boolean {
  return url.includes('localhost') || url.includes('127.0.0.1')
}

/** Resolve API base URL for current environment (dev vs production). */
export function getApiUrl(): string {
  const configured = import.meta.env.VITE_API_URL as string | undefined

  if (typeof window !== 'undefined') {
    const host = window.location.hostname
    if (PRODUCTION_HOSTS.has(host)) {
      return PRODUCTION_API
    }
  }

  if (configured && !isLocalhostApi(configured)) {
    return configured.replace(/\/$/, '')
  }

  if (import.meta.env.PROD) {
    return PRODUCTION_API
  }

  return configured || LOCAL_API
}

export function getApiOrigin(): string {
  return getApiUrl().replace(/\/api\/v1\/?$/, '')
}
