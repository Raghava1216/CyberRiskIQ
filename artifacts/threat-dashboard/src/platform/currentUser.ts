// Local equivalent of the enterprise `util.getCurrentUser()` privilege helper.
// Privileges use the CyberRisk module prefix `CR_` (mirroring the in-house `RA_`).

export interface CurrentUser {
  id: string;
  name: string;
  role: string;
  /** Comma-separated privilege codes, matching the enterprise contract. */
  privileges: string;
}

const CR_PRIVILEGES = [
  'CR_VIEW_DASHBOARD',
  'CR_VIEW_RISKS',
  'CR_VIEW_THREATS',
  'CR_VIEW_VULNERABILITIES',
  'CR_VIEW_ASSETS',
  'CR_VIEW_IOC',
  'CR_VIEW_INCIDENTS',
  'CR_VIEW_COMPLIANCE',
  'CR_VIEW_REPORTS',
  'CR_VIEW_WAZUH',
  'CR_HEAD',
  'CR_ANALYST',
  'CR_ADMIN',
  'CR_CREATE_RISK',
  'CR_CREATE_INCIDENT',
];

export function getCurrentUser(): CurrentUser {
  return {
    id: 'cr-admin',
    name: 'System Admin',
    role: 'Administrator',
    privileges: CR_PRIVILEGES.join(','),
  };
}

/** True when the current user holds any of the comma-separated privilege codes. */
export function hasPrivilege(privilege?: string): boolean {
  if (!privilege) return true;
  const held = new Set(
    getCurrentUser().privileges.split(',').map((p) => p.trim()),
  );
  return privilege
    .split(',')
    .map((p) => p.trim())
    .some((p) => held.has(p));
}
