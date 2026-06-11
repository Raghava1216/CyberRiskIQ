// Mirrors the user's enterprise platform `formutilfunctions.getCurrentUser()`.
// In their app this reads localStorage.current_logged_User and `privileges`
// is a comma-separated string. Here we provide a mock admin user that holds
// every CyberRisk IQ privilege so all tabs/sections render.

export interface CurrentUser {
  id: string;
  name: string;
  role: string;
  initials: string;
  privileges: string;
}

export const CR_PRIVILEGES = [
  'CR_DASHBOARD',
  'CR_RISK',
  'CR_THREAT',
  'CR_VULN',
  'CR_ASSET',
  'CR_IOC',
  'CR_INCIDENT',
  'CR_COMPLIANCE',
  'CR_REPORTS',
  'CR_SETTINGS',
  'CR_WAZUH',
] as const;

const MOCK_USER: CurrentUser = {
  id: '1',
  name: 'System Admin',
  role: 'Administrator',
  initials: 'SA',
  privileges: CR_PRIVILEGES.join(','),
};

export function getCurrentUser(): CurrentUser {
  try {
    const raw = localStorage.getItem('current_logged_User');
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<CurrentUser>;
      return { ...MOCK_USER, ...parsed };
    }
  } catch {
    // ignore malformed storage
  }
  return MOCK_USER;
}

export function getPrivileges(): string[] {
  return getCurrentUser().privileges?.split(',').map((p) => p.trim()) ?? [];
}
