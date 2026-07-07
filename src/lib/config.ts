const LOCAL_API = 'http://localhost:8000/api/v1'
const PRODUCTION_API = 'https://api.driveronhire.ai/api/v1'

const PRODUCTION_HOSTS = new Set([
  'driveronhire.ai',
  'www.driveronhire.ai',
])

function isLocalHost(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1'
}

function useProductionApiFromLocal(): boolean {
  return import.meta.env.VITE_USE_PRODUCTION_API === 'true'
}

/**
 * Resolve API URL at runtime from the browser hostname.
 * - localhost / 127.0.0.1  → local Django API (unless VITE_USE_PRODUCTION_API=true)
 * - driveronhire.ai        → production API
 * Works even if an old build baked in localhost from VITE_API_URL.
 */
export function getApiUrl(): string {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname
    if (isLocalHost(host)) {
      if (useProductionApiFromLocal()) {
        return PRODUCTION_API
      }
      return LOCAL_API
    }
    if (PRODUCTION_HOSTS.has(host)) {
      return PRODUCTION_API
    }
  }

  // Vite dev server / build-time fallback
  if (import.meta.env.DEV) {
    if (useProductionApiFromLocal()) {
      return PRODUCTION_API
    }
    const configured = import.meta.env.VITE_API_URL as string | undefined
    return configured || LOCAL_API
  }

  return PRODUCTION_API
}

export function getApiOrigin(): string {
  return getApiUrl().replace(/\/api\/v1\/?$/, '')
}
