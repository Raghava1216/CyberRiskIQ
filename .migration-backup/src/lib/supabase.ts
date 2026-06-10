// =============================================================
// LOCAL MOCK — No Supabase connection needed
// Replaces @supabase/supabase-js for local development
// =============================================================

// ── Seed Data (matches complianceTypes.ts schema exactly) ────

const SEED: Record<string, any[]> = {

  compliance_frameworks: [
    { id: 'fw1', name: 'GDPR',         version: '2018', category: 'Privacy',   score: 63, controls_total: 11, controls_compliant: 7,  controls_partial: 3, controls_noncompliant: 1 },
    { id: 'fw2', name: 'HIPAA',        version: '1996', category: 'Industry',  score: 65, controls_total: 12, controls_compliant: 8,  controls_partial: 2, controls_noncompliant: 2 },
    { id: 'fw3', name: 'ISO 27001',    version: '2022', category: 'Security',  score: 74, controls_total: 12, controls_compliant: 9,  controls_partial: 2, controls_noncompliant: 1 },
    { id: 'fw4', name: 'NIST CSF',     version: '2.0',  category: 'Security',  score: 82, controls_total: 12, controls_compliant: 10, controls_partial: 1, controls_noncompliant: 1 },
    { id: 'fw5', name: 'PCI DSS',      version: '4.0',  category: 'Industry',  score: 71, controls_total: 12, controls_compliant: 8,  controls_partial: 2, controls_noncompliant: 2 },
    { id: 'fw6', name: 'SOC 2 Type II',version: '2017', category: 'Security',  score: 88, controls_total: 12, controls_compliant: 11, controls_partial: 1, controls_noncompliant: 0 },
  ],

  compliance_controls: [
    // GDPR (fw1) — 11 controls
    { id: 'g01',  framework_id: 'fw1', framework_name: 'GDPR', control_id: 'GDPR-1',  title: 'Data Processing Agreements',  domain: 'Data Governance',  status: 'compliant',     score: 100, evidence: '', owner: '', notes: '', guidance: '', sort_order: 1,  due_date: null },
    { id: 'g02',  framework_id: 'fw1', framework_name: 'GDPR', control_id: 'GDPR-2',  title: 'Privacy by Design',           domain: 'Privacy',          status: 'compliant',     score: 100, evidence: '', owner: '', notes: '', guidance: '', sort_order: 2,  due_date: null },
    { id: 'g03',  framework_id: 'fw1', framework_name: 'GDPR', control_id: 'GDPR-3',  title: 'Data Subject Rights',         domain: 'Privacy',          status: 'compliant',     score: 100, evidence: '', owner: '', notes: '', guidance: '', sort_order: 3,  due_date: null },
    { id: 'g04',  framework_id: 'fw1', framework_name: 'GDPR', control_id: 'GDPR-4',  title: 'Consent Management',          domain: 'Privacy',          status: 'compliant',     score: 100, evidence: '', owner: '', notes: '', guidance: '', sort_order: 4,  due_date: null },
    { id: 'g05',  framework_id: 'fw1', framework_name: 'GDPR', control_id: 'GDPR-5',  title: 'Data Breach Notification',    domain: 'Incident',         status: 'compliant',     score: 100, evidence: '', owner: '', notes: '', guidance: '', sort_order: 5,  due_date: null },
    { id: 'g06',  framework_id: 'fw1', framework_name: 'GDPR', control_id: 'GDPR-6',  title: 'Data Retention Policy',       domain: 'Data Governance',  status: 'compliant',     score: 100, evidence: '', owner: '', notes: '', guidance: '', sort_order: 6,  due_date: null },
    { id: 'g07',  framework_id: 'fw1', framework_name: 'GDPR', control_id: 'GDPR-7',  title: 'Cookie Consent',              domain: 'Privacy',          status: 'compliant',     score: 100, evidence: '', owner: '', notes: '', guidance: '', sort_order: 7,  due_date: null },
    { id: 'g08',  framework_id: 'fw1', framework_name: 'GDPR', control_id: 'GDPR-8',  title: 'Cross-border Transfers',      domain: 'Data Governance',  status: 'partial',       score: 60,  evidence: '', owner: '', notes: '', guidance: '', sort_order: 8,  due_date: null },
    { id: 'g09',  framework_id: 'fw1', framework_name: 'GDPR', control_id: 'GDPR-9',  title: 'DPO Appointment',             domain: 'Governance',       status: 'partial',       score: 50,  evidence: '', owner: '', notes: '', guidance: '', sort_order: 9,  due_date: null },
    { id: 'g10',  framework_id: 'fw1', framework_name: 'GDPR', control_id: 'GDPR-10', title: 'DPIA Process',                domain: 'Risk',             status: 'partial',       score: 40,  evidence: '', owner: '', notes: '', guidance: '', sort_order: 10, due_date: null },
    { id: 'g11',  framework_id: 'fw1', framework_name: 'GDPR', control_id: 'GDPR-11', title: 'Vendor Risk Management',      domain: 'Risk',             status: 'noncompliant',  score: 10,  evidence: '', owner: '', notes: '', guidance: '', sort_order: 11, due_date: null },

    // HIPAA (fw2) — 12 controls
    { id: 'h01',  framework_id: 'fw2', framework_name: 'HIPAA', control_id: 'HIPAA-1',  title: 'Access Controls',              domain: 'Access',     status: 'compliant',    score: 100, evidence: '', owner: '', notes: '', guidance: '', sort_order: 1,  due_date: null },
    { id: 'h02',  framework_id: 'fw2', framework_name: 'HIPAA', control_id: 'HIPAA-2',  title: 'Audit Controls',               domain: 'Audit',      status: 'compliant',    score: 100, evidence: '', owner: '', notes: '', guidance: '', sort_order: 2,  due_date: null },
    { id: 'h03',  framework_id: 'fw2', framework_name: 'HIPAA', control_id: 'HIPAA-3',  title: 'Integrity Controls',           domain: 'Integrity',  status: 'compliant',    score: 100, evidence: '', owner: '', notes: '', guidance: '', sort_order: 3,  due_date: null },
    { id: 'h04',  framework_id: 'fw2', framework_name: 'HIPAA', control_id: 'HIPAA-4',  title: 'Transmission Security',        domain: 'Network',    status: 'compliant',    score: 100, evidence: '', owner: '', notes: '', guidance: '', sort_order: 4,  due_date: null },
    { id: 'h05',  framework_id: 'fw2', framework_name: 'HIPAA', control_id: 'HIPAA-5',  title: 'PHI Safeguards',               domain: 'Privacy',    status: 'compliant',    score: 100, evidence: '', owner: '', notes: '', guidance: '', sort_order: 5,  due_date: null },
    { id: 'h06',  framework_id: 'fw2', framework_name: 'HIPAA', control_id: 'HIPAA-6',  title: 'Business Associate Agreements',domain: 'Governance', status: 'compliant',    score: 100, evidence: '', owner: '', notes: '', guidance: '', sort_order: 6,  due_date: null },
    { id: 'h07',  framework_id: 'fw2', framework_name: 'HIPAA', control_id: 'HIPAA-7',  title: 'Workforce Training',           domain: 'Training',   status: 'compliant',    score: 100, evidence: '', owner: '', notes: '', guidance: '', sort_order: 7,  due_date: null },
    { id: 'h08',  framework_id: 'fw2', framework_name: 'HIPAA', control_id: 'HIPAA-8',  title: 'Incident Response',            domain: 'Incident',   status: 'compliant',    score: 100, evidence: '', owner: '', notes: '', guidance: '', sort_order: 8,  due_date: null },
    { id: 'h09',  framework_id: 'fw2', framework_name: 'HIPAA', control_id: 'HIPAA-9',  title: 'Risk Assessment',              domain: 'Risk',       status: 'partial',      score: 55,  evidence: '', owner: '', notes: '', guidance: '', sort_order: 9,  due_date: null },
    { id: 'h10',  framework_id: 'fw2', framework_name: 'HIPAA', control_id: 'HIPAA-10', title: 'Contingency Planning',         domain: 'Continuity', status: 'partial',      score: 45,  evidence: '', owner: '', notes: '', guidance: '', sort_order: 10, due_date: null },
    { id: 'h11',  framework_id: 'fw2', framework_name: 'HIPAA', control_id: 'HIPAA-11', title: 'Device & Media Controls',      domain: 'Physical',   status: 'noncompliant', score: 20,  evidence: '', owner: '', notes: '', guidance: '', sort_order: 11, due_date: null },
    { id: 'h12',  framework_id: 'fw2', framework_name: 'HIPAA', control_id: 'HIPAA-12', title: 'Physical Safeguards',          domain: 'Physical',   status: 'noncompliant', score: 15,  evidence: '', owner: '', notes: '', guidance: '', sort_order: 12, due_date: null },

    // ISO 27001 (fw3) — 12 controls
    { id: 'i01',  framework_id: 'fw3', framework_name: 'ISO 27001', control_id: 'ISO-1',  title: 'Information Security Policy', domain: 'Governance',   status: 'compliant',    score: 100, evidence: '', owner: '', notes: '', guidance: '', sort_order: 1,  due_date: null },
    { id: 'i02',  framework_id: 'fw3', framework_name: 'ISO 27001', control_id: 'ISO-2',  title: 'Asset Management',            domain: 'Assets',       status: 'compliant',    score: 100, evidence: '', owner: '', notes: '', guidance: '', sort_order: 2,  due_date: null },
    { id: 'i03',  framework_id: 'fw3', framework_name: 'ISO 27001', control_id: 'ISO-3',  title: 'Access Control',              domain: 'Access',       status: 'compliant',    score: 100, evidence: '', owner: '', notes: '', guidance: '', sort_order: 3,  due_date: null },
    { id: 'i04',  framework_id: 'fw3', framework_name: 'ISO 27001', control_id: 'ISO-4',  title: 'Cryptography',                domain: 'Cryptography', status: 'compliant',    score: 100, evidence: '', owner: '', notes: '', guidance: '', sort_order: 4,  due_date: null },
    { id: 'i05',  framework_id: 'fw3', framework_name: 'ISO 27001', control_id: 'ISO-5',  title: 'Physical Security',           domain: 'Physical',     status: 'compliant',    score: 100, evidence: '', owner: '', notes: '', guidance: '', sort_order: 5,  due_date: null },
    { id: 'i06',  framework_id: 'fw3', framework_name: 'ISO 27001', control_id: 'ISO-6',  title: 'Operations Security',         domain: 'Operations',   status: 'compliant',    score: 100, evidence: '', owner: '', notes: '', guidance: '', sort_order: 6,  due_date: null },
    { id: 'i07',  framework_id: 'fw3', framework_name: 'ISO 27001', control_id: 'ISO-7',  title: 'Communications Security',     domain: 'Network',      status: 'compliant',    score: 100, evidence: '', owner: '', notes: '', guidance: '', sort_order: 7,  due_date: null },
    { id: 'i08',  framework_id: 'fw3', framework_name: 'ISO 27001', control_id: 'ISO-8',  title: 'System Acquisition',          domain: 'Development',  status: 'compliant',    score: 100, evidence: '', owner: '', notes: '', guidance: '', sort_order: 8,  due_date: null },
    { id: 'i09',  framework_id: 'fw3', framework_name: 'ISO 27001', control_id: 'ISO-9',  title: 'Supplier Relationships',      domain: 'Vendor',       status: 'compliant',    score: 100, evidence: '', owner: '', notes: '', guidance: '', sort_order: 9,  due_date: null },
    { id: 'i10',  framework_id: 'fw3', framework_name: 'ISO 27001', control_id: 'ISO-10', title: 'Incident Management',         domain: 'Incident',     status: 'partial',      score: 60,  evidence: '', owner: '', notes: '', guidance: '', sort_order: 10, due_date: null },
    { id: 'i11',  framework_id: 'fw3', framework_name: 'ISO 27001', control_id: 'ISO-11', title: 'Business Continuity',         domain: 'Continuity',   status: 'partial',      score: 50,  evidence: '', owner: '', notes: '', guidance: '', sort_order: 11, due_date: null },
    { id: 'i12',  framework_id: 'fw3', framework_name: 'ISO 27001', control_id: 'ISO-12', title: 'Compliance Monitoring',       domain: 'Governance',   status: 'noncompliant', score: 20,  evidence: '', owner: '', notes: '', guidance: '', sort_order: 12, due_date: null },

    // NIST CSF (fw4) — 12 controls
    { id: 'n01',  framework_id: 'fw4', framework_name: 'NIST CSF', control_id: 'NIST-1',  title: 'Asset Identification',    domain: 'Identify',  status: 'compliant',    score: 100, evidence: '', owner: '', notes: '', guidance: '', sort_order: 1,  due_date: null },
    { id: 'n02',  framework_id: 'fw4', framework_name: 'NIST CSF', control_id: 'NIST-2',  title: 'Risk Assessment',         domain: 'Identify',  status: 'compliant',    score: 100, evidence: '', owner: '', notes: '', guidance: '', sort_order: 2,  due_date: null },
    { id: 'n03',  framework_id: 'fw4', framework_name: 'NIST CSF', control_id: 'NIST-3',  title: 'Access Management',       domain: 'Protect',   status: 'compliant',    score: 100, evidence: '', owner: '', notes: '', guidance: '', sort_order: 3,  due_date: null },
    { id: 'n04',  framework_id: 'fw4', framework_name: 'NIST CSF', control_id: 'NIST-4',  title: 'Awareness Training',      domain: 'Protect',   status: 'compliant',    score: 100, evidence: '', owner: '', notes: '', guidance: '', sort_order: 4,  due_date: null },
    { id: 'n05',  framework_id: 'fw4', framework_name: 'NIST CSF', control_id: 'NIST-5',  title: 'Data Security',           domain: 'Protect',   status: 'compliant',    score: 100, evidence: '', owner: '', notes: '', guidance: '', sort_order: 5,  due_date: null },
    { id: 'n06',  framework_id: 'fw4', framework_name: 'NIST CSF', control_id: 'NIST-6',  title: 'Protective Technology',   domain: 'Protect',   status: 'compliant',    score: 100, evidence: '', owner: '', notes: '', guidance: '', sort_order: 6,  due_date: null },
    { id: 'n07',  framework_id: 'fw4', framework_name: 'NIST CSF', control_id: 'NIST-7',  title: 'Anomaly Detection',       domain: 'Detect',    status: 'compliant',    score: 100, evidence: '', owner: '', notes: '', guidance: '', sort_order: 7,  due_date: null },
    { id: 'n08',  framework_id: 'fw4', framework_name: 'NIST CSF', control_id: 'NIST-8',  title: 'Continuous Monitoring',   domain: 'Detect',    status: 'compliant',    score: 100, evidence: '', owner: '', notes: '', guidance: '', sort_order: 8,  due_date: null },
    { id: 'n09',  framework_id: 'fw4', framework_name: 'NIST CSF', control_id: 'NIST-9',  title: 'Detection Processes',     domain: 'Detect',    status: 'compliant',    score: 100, evidence: '', owner: '', notes: '', guidance: '', sort_order: 9,  due_date: null },
    { id: 'n10',  framework_id: 'fw4', framework_name: 'NIST CSF', control_id: 'NIST-10', title: 'Response Planning',       domain: 'Respond',   status: 'compliant',    score: 100, evidence: '', owner: '', notes: '', guidance: '', sort_order: 10, due_date: null },
    { id: 'n11',  framework_id: 'fw4', framework_name: 'NIST CSF', control_id: 'NIST-11', title: 'Recovery Planning',       domain: 'Recover',   status: 'partial',      score: 65,  evidence: '', owner: '', notes: '', guidance: '', sort_order: 11, due_date: null },
    { id: 'n12',  framework_id: 'fw4', framework_name: 'NIST CSF', control_id: 'NIST-12', title: 'Supply Chain Risk',       domain: 'Identify',  status: 'noncompliant', score: 25,  evidence: '', owner: '', notes: '', guidance: '', sort_order: 12, due_date: null },

    // PCI DSS (fw5) — 12 controls
    { id: 'p01',  framework_id: 'fw5', framework_name: 'PCI DSS', control_id: 'PCI-1',  title: 'Network Security Controls',   domain: 'Network',      status: 'compliant',    score: 100, evidence: '', owner: '', notes: '', guidance: '', sort_order: 1,  due_date: null },
    { id: 'p02',  framework_id: 'fw5', framework_name: 'PCI DSS', control_id: 'PCI-2',  title: 'Secure Configurations',       domain: 'Configuration',status: 'compliant',    score: 100, evidence: '', owner: '', notes: '', guidance: '', sort_order: 2,  due_date: null },
    { id: 'p03',  framework_id: 'fw5', framework_name: 'PCI DSS', control_id: 'PCI-3',  title: 'Cardholder Data Protection',  domain: 'Data',         status: 'compliant',    score: 100, evidence: '', owner: '', notes: '', guidance: '', sort_order: 3,  due_date: null },
    { id: 'p04',  framework_id: 'fw5', framework_name: 'PCI DSS', control_id: 'PCI-4',  title: 'Encryption in Transit',       domain: 'Cryptography', status: 'compliant',    score: 100, evidence: '', owner: '', notes: '', guidance: '', sort_order: 4,  due_date: null },
    { id: 'p05',  framework_id: 'fw5', framework_name: 'PCI DSS', control_id: 'PCI-5',  title: 'Malware Protection',          domain: 'Endpoint',     status: 'compliant',    score: 100, evidence: '', owner: '', notes: '', guidance: '', sort_order: 5,  due_date: null },
    { id: 'p06',  framework_id: 'fw5', framework_name: 'PCI DSS', control_id: 'PCI-6',  title: 'Secure Development',          domain: 'Development',  status: 'compliant',    score: 100, evidence: '', owner: '', notes: '', guidance: '', sort_order: 6,  due_date: null },
    { id: 'p07',  framework_id: 'fw5', framework_name: 'PCI DSS', control_id: 'PCI-7',  title: 'Restrict Access',             domain: 'Access',       status: 'compliant',    score: 100, evidence: '', owner: '', notes: '', guidance: '', sort_order: 7,  due_date: null },
    { id: 'p08',  framework_id: 'fw5', framework_name: 'PCI DSS', control_id: 'PCI-8',  title: 'Identify & Authenticate',     domain: 'Identity',     status: 'compliant',    score: 100, evidence: '', owner: '', notes: '', guidance: '', sort_order: 8,  due_date: null },
    { id: 'p09',  framework_id: 'fw5', framework_name: 'PCI DSS', control_id: 'PCI-9',  title: 'Physical Access Controls',    domain: 'Physical',     status: 'partial',      score: 60,  evidence: '', owner: '', notes: '', guidance: '', sort_order: 9,  due_date: null },
    { id: 'p10',  framework_id: 'fw5', framework_name: 'PCI DSS', control_id: 'PCI-10', title: 'Logging & Monitoring',        domain: 'Monitoring',   status: 'partial',      score: 55,  evidence: '', owner: '', notes: '', guidance: '', sort_order: 10, due_date: null },
    { id: 'p11',  framework_id: 'fw5', framework_name: 'PCI DSS', control_id: 'PCI-11', title: 'Security Testing',            domain: 'Testing',      status: 'noncompliant', score: 20,  evidence: '', owner: '', notes: '', guidance: '', sort_order: 11, due_date: null },
    { id: 'p12',  framework_id: 'fw5', framework_name: 'PCI DSS', control_id: 'PCI-12', title: 'Information Security Policy', domain: 'Governance',   status: 'noncompliant', score: 15,  evidence: '', owner: '', notes: '', guidance: '', sort_order: 12, due_date: null },

    // SOC 2 Type II (fw6) — 12 controls
    { id: 's01',  framework_id: 'fw6', framework_name: 'SOC 2 Type II', control_id: 'SOC-1',  title: 'Security Availability',       domain: 'Availability', status: 'compliant', score: 100, evidence: '', owner: '', notes: '', guidance: '', sort_order: 1,  due_date: null },
    { id: 's02',  framework_id: 'fw6', framework_name: 'SOC 2 Type II', control_id: 'SOC-2',  title: 'Processing Integrity',        domain: 'Integrity',    status: 'compliant', score: 100, evidence: '', owner: '', notes: '', guidance: '', sort_order: 2,  due_date: null },
    { id: 's03',  framework_id: 'fw6', framework_name: 'SOC 2 Type II', control_id: 'SOC-3',  title: 'Confidentiality',             domain: 'Privacy',      status: 'compliant', score: 100, evidence: '', owner: '', notes: '', guidance: '', sort_order: 3,  due_date: null },
    { id: 's04',  framework_id: 'fw6', framework_name: 'SOC 2 Type II', control_id: 'SOC-4',  title: 'Privacy Controls',            domain: 'Privacy',      status: 'compliant', score: 100, evidence: '', owner: '', notes: '', guidance: '', sort_order: 4,  due_date: null },
    { id: 's05',  framework_id: 'fw6', framework_name: 'SOC 2 Type II', control_id: 'SOC-5',  title: 'Logical Access',              domain: 'Access',       status: 'compliant', score: 100, evidence: '', owner: '', notes: '', guidance: '', sort_order: 5,  due_date: null },
    { id: 's06',  framework_id: 'fw6', framework_name: 'SOC 2 Type II', control_id: 'SOC-6',  title: 'Change Management',           domain: 'Operations',   status: 'compliant', score: 100, evidence: '', owner: '', notes: '', guidance: '', sort_order: 6,  due_date: null },
    { id: 's07',  framework_id: 'fw6', framework_name: 'SOC 2 Type II', control_id: 'SOC-7',  title: 'Risk Mitigation',             domain: 'Risk',         status: 'compliant', score: 100, evidence: '', owner: '', notes: '', guidance: '', sort_order: 7,  due_date: null },
    { id: 's08',  framework_id: 'fw6', framework_name: 'SOC 2 Type II', control_id: 'SOC-8',  title: 'Vendor Management',           domain: 'Vendor',       status: 'compliant', score: 100, evidence: '', owner: '', notes: '', guidance: '', sort_order: 8,  due_date: null },
    { id: 's09',  framework_id: 'fw6', framework_name: 'SOC 2 Type II', control_id: 'SOC-9',  title: 'Incident Response',           domain: 'Incident',     status: 'compliant', score: 100, evidence: '', owner: '', notes: '', guidance: '', sort_order: 9,  due_date: null },
    { id: 's10',  framework_id: 'fw6', framework_name: 'SOC 2 Type II', control_id: 'SOC-10', title: 'Monitoring Activities',       domain: 'Monitoring',   status: 'compliant', score: 100, evidence: '', owner: '', notes: '', guidance: '', sort_order: 10, due_date: null },
    { id: 's11',  framework_id: 'fw6', framework_name: 'SOC 2 Type II', control_id: 'SOC-11', title: 'Logical & Physical Access',   domain: 'Access',       status: 'compliant', score: 100, evidence: '', owner: '', notes: '', guidance: '', sort_order: 11, due_date: null },
    { id: 's12',  framework_id: 'fw6', framework_name: 'SOC 2 Type II', control_id: 'SOC-12', title: 'Encryption Standards',        domain: 'Cryptography', status: 'partial',   score: 70,  evidence: '', owner: '', notes: '', guidance: '', sort_order: 12, due_date: null },
  ],

  compliance_assessments: [],
  assessment_results: [],
};

// ── Seed localStorage once (clear old keys first to avoid stale data) ─────

const SEEDED_KEY = '__cyberriskiq_seeded_v2__';

if (!localStorage.getItem(SEEDED_KEY)) {
  // Clear any previous partial seeds
  Object.keys(SEED).forEach(k => localStorage.removeItem(k));
  // Write fresh seed
  Object.entries(SEED).forEach(([table, rows]) => {
    localStorage.setItem(table, JSON.stringify(rows));
  });
  localStorage.setItem(SEEDED_KEY, '1');
}

// ── Chainable query builder ───────────────────────────────────────────────

const createQueryBuilder = (table: string) => {
  let _filters:    Array<{ key: string; value: any; op: string }> = [];
  let _insertData: any = null;
  let _updateData: any = null;
  let _isDelete  = false;
  let _selectCols: string | undefined;
  let _limit: number | undefined;
  let _neqFilters: Array<{ key: string; value: any }> = [];

  const read = (): any[] => JSON.parse(localStorage.getItem(table) || '[]');
  const write = (rows: any[]) => localStorage.setItem(table, JSON.stringify(rows));

  const applyFilters = (rows: any[]) => {
    let out = rows;
    for (const f of _filters)    out = out.filter(r => r[f.key] === f.value);
    for (const f of _neqFilters) out = out.filter(r => r[f.key] !== f.value);
    return out;
  };

  const resolve = async (): Promise<{ data: any; error: null }> => {
    const all = read();

    if (_isDelete) {
      write(applyFilters(all).length ? all.filter(r => !applyFilters([r]).length) : []);
      // actually: remove matched rows
      const matched = new Set(applyFilters(all).map(r => r.id));
      write(all.filter(r => !matched.has(r.id)));
      return { data: null, error: null };
    }

    if (_insertData !== null) {
      const rows = Array.isArray(_insertData) ? _insertData : [_insertData];
      const stamped = rows.map(r => ({
        id: r.id ?? crypto.randomUUID(),
        created_at: new Date().toISOString(),
        ...r,
      }));
      write([...all, ...stamped]);
      return { data: stamped, error: null };
    }

    if (_updateData !== null) {
      const updated = all.map(r => {
        const match = _filters.every(f => r[f.key] === f.value);
        return match ? { ...r, ..._updateData } : r;
      });
      write(updated);
      return { data: updated, error: null };
    }

    let result = applyFilters(all);
    if (_limit !== undefined) result = result.slice(0, _limit);
    return { data: result, error: null };
  };

  const b: any = {
    select:      (cols?: string)           => { _selectCols = cols; return b; },
    insert:      (rows: any)               => { _insertData = rows; return b; },
    update:      (row: any)                => { _updateData = row;  return b; },
    delete:      ()                        => { _isDelete = true;   return b; },
    upsert:      (rows: any)               => { _insertData = rows; return b; },
    eq:          (k: string, v: any)       => { _filters.push({ key: k, value: v, op: 'eq' }); return b; },
    neq:         (k: string, v: any)       => { _neqFilters.push({ key: k, value: v }); return b; },
    gt:          (_k: string, _v: any)     => b,
    lt:          (_k: string, _v: any)     => b,
    gte:         (_k: string, _v: any)     => b,
    lte:         (_k: string, _v: any)     => b,
    like:        (_k: string, _v: any)     => b,
    ilike:       (_k: string, _v: any)     => b,
    in:          (_k: string, _v: any[])   => b,
    is:          (_k: string, _v: any)     => b,
    contains:    (_k: string, _v: any)     => b,
    overlaps:    (_k: string, _v: any)     => b,
    not:         (_k: string, _op: string, _v: any) => b,
    or:          (_q: string)              => b,
    filter:      (_k: string, _op: string, _v: any) => b,
    order:       (_col: string, _o?: any)  => b,
    limit:       (n: number)               => { _limit = n; return b; },
    range:       (_f: number, _t: number)  => b,
    textSearch:  (_k: string, _v: any)     => b,

    single: async () => {
      const { data } = await resolve();
      const arr = Array.isArray(data) ? data : [data];
      return { data: arr[0] ?? null, error: null };
    },

    maybeSingle: async () => {
      const { data } = await resolve();
      const arr = Array.isArray(data) ? data : [data];
      return { data: arr[0] ?? null, error: null };
    },

    then: (onFulfilled: (v: any) => any) => resolve().then(onFulfilled),
  };

  return b;
};

// ── Public supabase mock ──────────────────────────────────────────────────

export const supabase = {
  from: (table: string) => createQueryBuilder(table),

  auth: {
    signInWithPassword: async () => ({
      data: { user: { id: 'local-user', email: 'admin@local.dev' }, session: {} },
      error: null,
    }),
    signUp: async () => ({
      data: { user: { id: 'local-user', email: 'admin@local.dev' } },
      error: null,
    }),
    signOut:  async () => ({ error: null }),
    getUser:  async () => ({ data: { user: { id: 'local-user', email: 'admin@local.dev' } }, error: null }),
    getSession: async () => ({
      data: { session: { user: { id: 'local-user', email: 'admin@local.dev' } } },
      error: null,
    }),
    onAuthStateChange: (_e: any, cb: Function) => {
      cb('SIGNED_IN', { user: { id: 'local-user', email: 'admin@local.dev' } });
      return { data: { subscription: { unsubscribe: () => {} } } };
    },
  },

  channel:       (_n: string) => ({ on: () => ({ subscribe: () => {} }) }),
  removeChannel: () => {},
};

/*import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);*/