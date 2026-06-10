// CCM (Continuous Control Monitoring) Engine
// Provides scoring logic and localStorage persistence for control test data

export type TestResult     = 'pass' | 'partial' | 'fail' | 'not_tested';
export type EvidenceStatus = 'collected' | 'partial' | 'expired' | 'missing';
export type MonitoringFreq = 'continuous' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual' | 'ad_hoc';

export interface CCMControlData {
  control_id:       string;
  framework_id:     string;
  test_result:      TestResult;
  evidence_status:  EvidenceStatus;
  monitoring_freq:  MonitoringFreq;
  last_tested_date: string | null;
  tested_by?:       string;
  notes?:           string;
}

export interface CCMScore {
  score:                number;
  status:               'compliant' | 'partial' | 'noncompliant' | 'not_applicable';
  test_component:       number;
  evidence_component:   number;
  monitoring_component: number;
  recency_penalty:      number;
  breakdown:            string;
  data_source:          'ccm' | 'none';
}

// ── Storage helpers ──────────────────────────────────────────────────────────

const storageKey = (controlId: string, frameworkId: string) =>
  `ccm_${frameworkId}_${controlId}`;

export async function fetchCCMData(
  controlId: string,
  frameworkId: string,
): Promise<CCMControlData | null> {
  const raw = localStorage.getItem(storageKey(controlId, frameworkId));
  if (!raw) return null;
  try { return JSON.parse(raw) as CCMControlData; } catch { return null; }
}

export async function fetchAllCCMData(
  controlIds: string[],
  frameworkId: string,
): Promise<Record<string, CCMControlData>> {
  const result: Record<string, CCMControlData> = {};
  for (const id of controlIds) {
    const d = await fetchCCMData(id, frameworkId);
    if (d) result[id] = d;
  }
  return result;
}

export async function saveCCMData(data: CCMControlData): Promise<void> {
  localStorage.setItem(
    storageKey(data.control_id, data.framework_id),
    JSON.stringify(data),
  );
}

// ── Seed helpers ─────────────────────────────────────────────────────────────

const MOCK_TEST_RESULTS:     TestResult[]     = ['pass', 'partial', 'fail', 'not_tested'];
const MOCK_EVIDENCE_STATUSES: EvidenceStatus[] = ['collected', 'partial', 'expired', 'missing'];
const MOCK_FREQS:             MonitoringFreq[] = ['continuous', 'daily', 'weekly', 'monthly', 'quarterly'];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

export function seedMockCCMData(controlIds: string[], frameworkId: string): void {
  for (const id of controlIds) {
    const key = storageKey(id, frameworkId);
    if (localStorage.getItem(key)) continue; // already seeded
    const data: CCMControlData = {
      control_id:       id,
      framework_id:     frameworkId,
      test_result:      randomItem(MOCK_TEST_RESULTS),
      evidence_status:  randomItem(MOCK_EVIDENCE_STATUSES),
      monitoring_freq:  randomItem(MOCK_FREQS),
      last_tested_date: Math.random() > 0.3 ? daysAgo(Math.floor(Math.random() * 365)) : null,
      tested_by:        'System',
      notes:            '',
    };
    localStorage.setItem(key, JSON.stringify(data));
  }
}

// ── Scoring engine ───────────────────────────────────────────────────────────

const TEST_SCORES: Record<TestResult, number> = {
  pass:       100,
  partial:     55,
  fail:         0,
  not_tested:  30,
};

const EVIDENCE_SCORES: Record<EvidenceStatus, number> = {
  collected:  100,
  partial:     60,
  expired:     20,
  missing:      0,
};

const FREQ_SCORES: Record<MonitoringFreq, number> = {
  continuous: 100,
  daily:       90,
  weekly:      80,
  monthly:     70,
  quarterly:   55,
  annual:      35,
  ad_hoc:      20,
};

function recencyPenalty(lastTestedDate: string | null): number {
  if (!lastTestedDate) return 20; // no date → max penalty
  const days = (Date.now() - new Date(lastTestedDate).getTime()) / (1000 * 60 * 60 * 24);
  if (days <= 30)  return 0;
  if (days <= 90)  return 5;
  if (days <= 180) return 10;
  if (days <= 365) return 15;
  return 20;
}

export function calculateCCMScore(data: CCMControlData): CCMScore {
  const test_component       = TEST_SCORES[data.test_result]      ?? 30;
  const evidence_component   = EVIDENCE_SCORES[data.evidence_status] ?? 0;
  const monitoring_component = FREQ_SCORES[data.monitoring_freq]  ?? 20;
  const recency              = recencyPenalty(data.last_tested_date);

  // Weighted average: test 40%, evidence 35%, monitoring 25%
  const raw =
    test_component       * 0.40 +
    evidence_component   * 0.35 +
    monitoring_component * 0.25;

  const score = Math.max(0, Math.min(100, Math.round(raw - recency)));

  let status: CCMScore['status'];
  if (score >= 80)      status = 'compliant';
  else if (score >= 45) status = 'partial';
  else if (data.test_result === 'not_tested' && data.evidence_status === 'missing')
                        status = 'not_applicable';
  else                  status = 'noncompliant';

  const breakdown =
    `Test: ${test_component} · Evidence: ${evidence_component} · Monitoring: ${monitoring_component}` +
    (recency > 0 ? ` · Recency penalty: -${recency}` : '') +
    ` → Score: ${score}`;

  return {
    score,
    status,
    test_component,
    evidence_component,
    monitoring_component,
    recency_penalty: recency,
    breakdown,
    data_source: 'ccm',
  };
}
