/** Scope React Query cache keys to the active organization (multi-tenant). */
export function orgQueryKey(orgId: string | undefined, ...parts: unknown[]) {
  return ['org', orgId ?? 'none', ...parts] as const
}
