/** Synchronous active-org id for API headers — kept in lockstep with AuthContext. */
let activeOrgId: string | null =
  typeof localStorage !== 'undefined' ? localStorage.getItem('organization_id') : null

export function getActiveOrgId(): string | null {
  return activeOrgId
}

export function setActiveOrgId(id: string | null): void {
  activeOrgId = id
  if (typeof localStorage === 'undefined') return
  if (id) localStorage.setItem('organization_id', id)
  else localStorage.removeItem('organization_id')
}
