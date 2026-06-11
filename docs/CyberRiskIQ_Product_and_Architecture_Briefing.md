# CyberRisk IQ — Complete Product & Architecture Briefing
### Industry Expert Edition

> **Why this document exists:** The first presentation guide framed CyberRisk IQ narrowly — "turning a technical checklist into a financial conversation." That is true, but it is only *half* the product (Pillar 1). This briefing covers the **complete** platform: dual-pillar CRQ + GRC, multi-framework assessment, per-framework board-ready reporting, per-risk ALE with recovery and mitigation-ROI analysis, the Unified Control Library, and the full functional / technical / system architecture — so an industry expert understands not just *what* it does, but *how* it is built and *why* it is defensible.
>
> **Source material:** This briefing consolidates the four development documents now preserved in `docs/architecture/`:
> - `CyberRiskIQ_Vision_Overview.docx` — plain-English product vision, problem, market
> - `CyberRiskIQ_Functional_and_Technical_Architecture.docx` — functional + technical architecture
> - `CyberRiskIQ_System_Architecture.docx` — 5 services, Kafka, PostgreSQL system design
> - `CyberRiskIQ_Technical_Architecture_Guide.docx` — build guide with code-level detail
>
> **Companion:** `docs/CyberRiskIQ_Presentation_Guide.md` remains the focused *delivery run-sheet* (slide outline, demo script, talking tips). This document is the *definitive product + architecture reference* behind it.

---

## Table of Contents
1. [Are we only doing "financial conversation"? — the honest scope answer](#1-scope-answer)
2. [What CyberRisk IQ really is](#2-what-it-really-is)
3. [The complete value we deliver](#3-complete-value)
4. [The problem & why now](#4-problem-why-now)
5. [Market opportunity](#5-market)
6. [Who it is for — target customer & personas](#6-personas)
7. [The two pillars & six modules](#7-pillars-modules)
8. [The methodology — FAIR, Monte Carlo, recovery & mitigation ROI](#8-methodology)
9. [Multi-framework assessment & per-framework reporting](#9-frameworks)
10. [The Unified Control Library — "fix once, satisfy all"](#10-ucl)
11. [The end-to-end flow — Discover → Score → Prioritise → Govern → Report](#11-flow)
12. [Functional architecture](#12-functional-arch)
13. [System & technical architecture](#13-system-arch)
14. [Prototype today vs the full build — honest mapping](#14-prototype-mapping)
15. [Differentiators & competitive position](#15-differentiators)
16. [How to present this broader story](#16-how-to-present)
17. [Q&A prep — the expert's hard questions](#17-qa)
18. [Roadmap — prototype → MVP → production](#18-roadmap)
19. [Appendix — glossary, data model, references](#19-appendix)

---

<a name="1-scope-answer"></a>
## 1. Are we only doing "financial conversation"? — the honest scope answer

**No.** Financial quantification is the *engine*, not the whole product. CyberRisk IQ is best described as a **translator with two pillars that share one risk engine**:

- **Pillar 1 — "Tell me how much I could lose."** Converts every vulnerability/asset/risk into a financial loss estimate (ALE) and ranks fixes by return on remediation spend. *This is the "financial conversation."*
- **Pillar 2 — "Help me prove we are following the law."** Takes those same financial numbers and automatically drives **multi-framework compliance assessment, regulatory registers (DORA / NIS2 / EU AI Act / SEC), and board-ready reports per framework.**

So the full pitch is: **"We quantify risk in money, *and* we turn that money into regulatory evidence and governance reporting — automatically, for the mid-market, at a price the enterprise tools can't match."**

The points you raised are all real and central to the product:

| You asked about… | Where it lives |
|---|---|
| Multiple frameworks for assessment | Pillar 2 → Regulatory Compliance Engine (§9) |
| Board-ready reports for every framework | Pillar 2 → Board & Executive Reporting (§7, §9) |
| Risk assessment per risk + which framework applies | Shared engine → GRC Risk Register Sync with regulatory tags (§7, §11) |
| ALE loss per risk | Pillar 1 → Financial Risk Scoring, FAIR + Monte Carlo (§8) |
| Possibility of recovery | Loss Magnitude modelling + Remediation ROI projection (§8) |
| Mitigation techniques on financial investment for better ROI | Pillar 1 → Remediation ROI Engine (§8) |

---

<a name="2-what-it-really-is"></a>
## 2. What CyberRisk IQ really is

**One-paragraph definition (from the vision document):**
> CyberRisk IQ takes a company's list of cybersecurity weaknesses and converts each one into a financial loss estimate — how much money the company could lose per year if each weakness is exploited. It then automatically routes those financial numbers into compliance reports for DORA, NIS2, and the EU AI Act, and generates board-ready summaries without manual work. It is built specifically for mid-market companies (500–5,000 employees), self-serve, connecting in ~30 minutes — not the 6-month, six-figure enterprise rollouts.

**The anchor idea:** Two apps on one engine. Pillar 1 (CRQ) and Pillar 2 (GRC) are like two apps running on the same phone — they share the same underlying financial-risk data, so a number calculated once flows everywhere it is needed.

**The category we sit in:** Cyber Risk Quantification (CRQ) **fused with** Governance, Risk & Compliance (GRC) — purpose-built for the mid-market. No incumbent does both well at this price point.

---

<a name="3-complete-value"></a>
## 3. The complete value we deliver

Frame the value as four connected outcomes, not one:

1. **Money on every risk.** Each vulnerability/asset gets an **ALE (Annualised Loss Expectancy)** in euros, expressed as a range — **P10 (best case), P50 (most likely), P90 (worst case)** — from a FAIR model run through Monte Carlo simulation.
2. **A prioritised, ROI-ranked fix list.** Every remediation is ranked by **financial risk reduced per euro spent**, so the security team works top-down and the CFO sees the return on each control investment.
3. **Multi-framework compliance, automatically.** The same numbers populate **DORA, NIS2, EU AI Act, SEC** workflows plus standards like **ISO 27001** — with a Unified Control Library so one control satisfies many frameworks at once.
4. **Board- and regulator-ready reporting per framework.** One-page board summaries in euros, CISO briefing packs, CFO insurance-gap analysis, and per-regulator export formats — generated, not assembled by hand.

**The headline line:** *"From a raw CVE to a euro figure, to a ranked fix with an ROI, to a DORA register entry, to a board slide — one connected thread, automatically."*

---

<a name="4-problem-why-now"></a>
## 4. The problem & why now

**The three problems (from the vision + functional docs):**
1. **No money value on cyber risk.** Boards get severity scores (CVSS 0–10) and red/amber/green heat maps. They ask "how much?" and nobody can answer. *Two servers with the same CVSS 8.5 are not equally urgent — one runs €2M/day in payments, one is a dead wiki. Today's tools can't tell the difference; ours can.*
2. **Compliance lives in spreadsheets.** DORA, NIS2, and the EU AI Act require live, financially-quantified risk registers. Most mid-market firms manage this in disconnected Excel/SharePoint, stitching evidence together for weeks before a regulator visit.
3. **Enterprise tools price out the mid-market.** Leading platforms start at **€150K+/year with ~6-month implementations**. A 600-person firm cannot afford that and falls back to spreadsheets.

**Why now — three forces converged in 2024–2025:**
- **DORA became law (Jan 2025)** — every EU financial entity must formally manage and report ICT risk.
- **NIS2 became law (Oct 2024)** — ~160,000 EU companies in critical sectors must manage and report cyber risk; board members face **personal liability** for inadequate oversight.
- **Safe Security acquired Balbix (Nov 2025)** — fusing vulnerability intelligence with financial risk, validating the thesis — but they build for 10,000+ employee enterprises. The 500–5,000 segment is unserved.
- **Fines bite:** DORA/NIS2 can reach **up to 2% of global revenue** (≈€1M on a €50M-revenue firm).

---

<a name="5-market"></a>
## 5. Market opportunity

*(Figures as stated in the vision document — present them as the project's market thesis, citable to the source research.)*

- **CRQ market:** **$4.84B (2025) → $9.66B (2031).**
- **Fastest-growing buyer segment:** mid-sized companies, **~14.62%/year**.
- **Trigger event:** Safe Security + Balbix proves the combined CRQ + vulnerability-intelligence model — but only for large enterprise. **The mid-market is the white space.**

---

<a name="6-personas"></a>
## 6. Who it is for — target customer & personas

**Ideal customer:** mid-market (500–5,000 employees), real regulatory exposure (DORA/NIS2), too small for €150K enterprise tools. Examples from the docs: a 600-person Frankfurt fintech under DORA; an 800-person Paris healthcare SaaS under NIS2; a 1,200-person Amsterdam insurtech under both; a 400-person German manufacturer whose enterprise customers now demand a quantified risk score to stay an approved supplier.

**Seven roles, one dataset, seven views** (RBAC-enforced):

| Role | Pain today | Gain with CyberRisk IQ |
|---|---|---|
| **CISO** | 3,000+ vulnerabilities by severity; can't justify budget in € | Sees the ~15 fixes that remove the majority of financial exposure; walks into the CFO meeting with euros |
| **SOC Analyst** | Works severity lists detached from business impact | Works an ROI-ranked queue tied to financial risk |
| **Risk Manager** | 3 weeks/quarter hand-building the GRC register | Register self-updates from live ALE; they review & approve |
| **Compliance Officer** | DORA in one sheet, NIS2 in another, security data elsewhere | One screen; live registers; pre-assembled evidence |
| **CFO** | Approves budgets off heat maps; can't size insurance or ROI | Total exposure in € by unit; insurance-gap analysis; exact ROI per control |
| **Board Member** | 40-slide technical deck; personal NIS2 liability | One page: top-10 risks in €, trend, compliance status |
| **IT Engineer** | Owns fixes without business context | Assigned items scoped to their assets |

---

<a name="7-pillars-modules"></a>
## 7. The two pillars & six modules

All six modules share the same financial-risk data.

### Pillar 1 — Unified CRQ & Vulnerability Intelligence
| Module | Capability | Key output |
|---|---|---|
| **Asset Intelligence** | Discovers IT/cloud assets, **Shadow AI** tools, and dormant **Non-Human Identities (NHI)**; rates business criticality | Complete asset inventory with criticality |
| **Financial Risk Scoring** | Converts each vulnerability to ALE via **FAIR + Monte Carlo** | ALE in € per risk — **P10 / P50 / P90** |
| **Remediation ROI Engine** | Ranks every fix by financial risk reduced per € of cost | Prioritised, board-justifiable fix list with € saved per action |

### Pillar 2 — GRC-Native Regulatory Quantification
| Module | Capability | Key output |
|---|---|---|
| **GRC Risk Register Sync** | Auto-populates the risk register with live ALE values + regulatory tags | Self-updating register, no manual entry |
| **Regulatory Compliance Engine** | Maintains **DORA** ICT register, **NIS2** obligations, **EU AI Act** inventory, **SEC** disclosure | One-click reports in each regulator's format |
| **Board & Executive Reporting** | Generates CISO packs, CFO insurance analysis, board top-10 in € | Board-ready one-pager + trend |

---

<a name="8-methodology"></a>
## 8. The methodology — FAIR, Monte Carlo, recovery & mitigation ROI

This is your **credibility anchor** with an expert. Every number traces to the open **FAIR** standard (used by PwC, Deloitte, major banks) — no black box.

### 8.1 From weakness to euros — the five FAIR steps
| Step | Plain English | FAIR term |
|---|---|---|
| 1 | How often would an attacker try this? | **Threat Event Frequency (TEF)** |
| 2 | If they try, how likely to succeed given our defences? | **Vulnerability = Threat Capability ÷ Control Strength** |
| 3 | How many actual losses per year? | **Loss Event Frequency (LEF) = TEF × Vulnerability** |
| 4 | What does one loss cost, end to end? | **Loss Magnitude (LM)** = direct + indirect costs |
| 5 | Expected total loss per year | **ALE = LEF × LM** |

**Concrete example (illustrative, from the docs):** Payment "Server A": attackers try ~12×/yr (TEF); ~50% succeed (Vulnerability) → ~6 losses/yr (LEF); each breach ≈ €1.2M (LM) → **ALE ≈ €7.2M/year.**

### 8.2 Why a *range*, not a single number — Monte Carlo
The engine runs a **10,000-iteration Monte Carlo simulation** (Apache Commons Math). Each iteration samples TEF, Vulnerability and Loss Magnitude from **BetaPERT distributions**, computes ALE, and the results yield **P10 / P50 / P90** percentiles. So you state, e.g., *"95% confident annual losses from this risk stay below €X."* This is exactly how FAIR is meant to be used — ranges, not false-precision point estimates.

### 8.3 Loss Magnitude & "possibility of recovery"
Loss Magnitude separates **primary loss** (incident response, regulatory fines per the DORA/NIS2 schedule, downtime revenue loss) from **secondary loss** (customer churn, legal liability, reputation). Recovery is modelled here: a risk with strong controls, segmentation, backups and insurance has a *lower and tighter* Loss Magnitude distribution — that is the quantified "possibility of recovery." Recovery posture compresses the P90 tail.

### 8.4 Mitigation techniques & ROI on investment
The **Remediation ROI Engine** answers "what should I spend money on, and what do I get back?":

```
Projected ALE  = re-run Monte Carlo with the control applied
                 (e.g. patch raises Control Strength: CS += 40)
Remediation ROI = (current ALE_P50 − projected ALE_P50) / remediation_cost
                 → sort all candidate fixes descending
```

So a €30K fix that cuts exposure by €2M ranks far above an €80K fix that cuts €50K. The output is a ranked list of **mitigation techniques with the euro risk-reduction and ROI of each** — the CFO-facing justification for the security budget.

> **Honesty note for the demo (carry over from the prototype review):** the *prototype's* sample ROI uses `(ALE − cost)/cost`, which assumes a control eliminates the *entire* loss and produces inflated figures (e.g. a ~1193% average). The *architecture* above is the correct, defensible method — ROI based on **risk reduction** (current P50 − projected P50). Raise this proactively; it shows rigour.

---

<a name="9-frameworks"></a>
## 9. Multi-framework assessment & per-framework reporting

Pillar 2 is explicitly **multi-framework**. For each risk, the platform records which obligations it touches and produces the assessment and report each one requires.

| Framework | Who it affects | What CyberRisk IQ automates | Report output |
|---|---|---|---|
| **DORA** | EU banks, insurers, fintechs, payment firms | Live ICT risk register with € values, supplier-risk mapping, incident classification (Major vs Non-Major per RTS), **72-hour** report templates | Pre-formatted ICT risk register + EBA incident template |
| **NIS2** | EU energy, health, transport, water, tech | Entity classification (Essential/Important), 10-domain obligation tracker, per-country incident notification (**24/72-hour** deadlines) | Obligation status + notification workflow |
| **EU AI Act** | Anyone using AI in HR/finance/customer decisions | Shadow-AI discovery, risk-tier classification, conformity workflow for high-risk systems, **SHAP** explainability for Article 13 transparency | AI inventory + conformity documentation |
| **SEC Disclosure** | US-listed companies | Materiality determination, disclosure drafting | Materiality decision + draft filing |
| **ISO 27001 & others** | Broad | Control mapping and evidence reuse via the Unified Control Library | Audit-ready evidence pack |

**Board-ready reporting per framework** is a first-class module: the board summary, CISO briefing pack, CFO insurance-gap analysis, and 30-day risk trend are generated automatically every quarter, in euros, with the regulatory status for each framework attached.

---

<a name="10-ucl"></a>
## 10. The Unified Control Library — "fix once, satisfy all"

A control like **multi-factor authentication** must often be proven to DORA, NIS2, ISO 27001, *and* a cyber-insurer. Without tooling: test four times, write four reports, send four evidence packs. With the **Unified Control Library**: test once, and the platform routes the right evidence to satisfy every mapped framework. **One test → many certifications.** This is one of the strongest time-and-cost arguments for a mid-market buyer with a small team.

---

<a name="11-flow"></a>
## 11. The end-to-end flow — Discover → Score → Prioritise → Govern → Report

Every action follows one five-step flow — the key to understanding the whole product:

1. **Discover** — connect to existing scanners (Qualys, Tenable, CrowdStrike), read known vulnerabilities, and surface what they miss: **Shadow AI** and dormant **Non-Human Identities**.
2. **Score** — for each weakness on each asset, compute ALE in euros via FAIR + Monte Carlo.
3. **Prioritise** — rank fixes by financial risk reduced ÷ remediation cost (ROI).
4. **Govern** — ALE values auto-populate the GRC register, the DORA ICT register, NIS2 tracking, and the EU AI Act inventory — no copy-paste between systems.
5. **Report** — generate board, CISO, CFO, and per-regulator outputs automatically.

**DORA worked example:** a new CVE on a payment server is detected → engine calculates ALE (e.g. €2.4M most-likely) → adds a DORA register entry flagged to the relevant article → if an incident occurs, it is auto-classified Major/Non-Major, the 72-hour clock starts, the template pre-fills, and the Compliance Officer is notified. Regulator asks to inspect → one screen, one export, zero prep.

---

<a name="12-functional-arch"></a>
## 12. Functional architecture

*(Source: `CyberRiskIQ_Functional_and_Technical_Architecture.docx`, Part 1.)*

- **Two pillars, six modules** (§7), all reading/writing one shared financial-risk dataset.
- **Role-to-module access map** enforced by RBAC across the seven personas (§6) — each role sees a tailored slice (e.g. Board Member: top-10 + status only; CFO: € totals + budget + full board report; SOC Analyst: assigned items, view-only scoring).
- **Business process** is the five-step flow (§11), identical whether the trigger is a new CVE, a Shadow-AI discovery, or an incident.

---

<a name="13-system-arch"></a>
## 13. System & technical architecture

*(Source: `CyberRiskIQ_System_Architecture.docx` + `CyberRiskIQ_Technical_Architecture_Guide.docx`.)*

A **five-layer, event-driven microservices platform.**

### 13.1 Stack at a glance
| Layer | Technology |
|---|---|
| Frontend | **React 18 + TypeScript + Recharts** (REST consumption) |
| API Gateway | **Spring Cloud Gateway 4** — JWT, routing, rate limiting, CORS |
| Backend services | **Spring Boot 3 (Java 21)** — 4 microservices |
| ML sidecar | **Python Flask** — GNN (PyTorch Geometric), LSTM (TensorFlow), Isolation Forest (scikit-learn), SHAP |
| Event bus | **Apache Kafka** — 6 topics, event-driven decoupling |
| Database | **PostgreSQL 16** — schema-per-tenant, Spring Data JPA, Flyway |
| Auth / RBAC | **OAuth2 + SAML2**, Spring Security, Open Policy Agent (OPA) |
| Platform | **Docker + Kubernetes**, Helm, GitHub Actions CI/CD |

### 13.2 The five services
| Service | Tech | Responsibility |
|---|---|---|
| **api-gateway** | Spring Cloud Gateway | Single entry point; validates JWT (RS256); per-tenant rate limits (Redis); injects `X-Tenant-ID` |
| **asset-ingestion-service** | Spring Boot | Pluggable connectors (Qualys/Tenable); CVE feeds (NVD, CISA KEV, EPSS); Shadow-AI & NHI discovery; publishes `asset.discovered` / `vuln.discovered` |
| **crq-engine-service** | Spring Boot | FAIR model, 10,000-iter Monte Carlo (Apache Commons Math), ALE P10/P50/P90, Remediation ROI; publishes `ale.calculated` |
| **ml-inference-service** | Python Flask | Optional sidecar called via REST (Resilience4j circuit breaker): risk-propagation GNN, anomaly LSTM, outlier Isolation Forest, SHAP explainability |
| **grc-workflow-service** | Spring Boot | Consumes `ale.calculated`; DORA/NIS2/EU AI Act engines; GRC register sync; RBAC (8 roles); board reporting (iText PDF) |

### 13.3 Why event-driven (the key decision to defend)
All inter-service communication goes through **Kafka**, not direct REST. If services called each other directly, a slow Asset service would stall the CRQ engine and one failure would cascade. With Kafka: the Asset service publishes `vuln.discovered`, the CRQ engine subscribes and recalculates ALE automatically, services scale independently, and a service that was offline can **replay missed events**.

**Kafka topics:** `asset.discovered`, `vuln.discovered`, `ale.calculated`, `grc.risk.updated`, `regulatory.event`, `anomaly.detected`.

### 13.4 Multi-tenancy
**Schema-per-tenant** in PostgreSQL: a `TenantInterceptor` extracts `tenant_id` from the JWT and runs `SET search_path TO tenant_{id}` before every query — SQL-level isolation where one tenant's query physically cannot reach another's data.

### 13.5 The AI/ML layer (and why a Python sidecar)
Java lacks native PyTorch, so ML runs as a **Python Flask sidecar** the Spring Boot CRQ engine calls over REST — the standard Java+Python pattern (Netflix/Uber/Spotify). Algorithms: **GraphSAGE GNN** (risk propagation / blast radius across the asset graph), **LSTM Autoencoder** (unsupervised anomaly detection in telemetry), **Isolation Forest** (outlier risk scenarios beyond standard FAIR), and **SHAP** (per-score explainability — directly serving EU AI Act Article 13 transparency).

---

<a name="14-prototype-mapping"></a>
## 14. Prototype today vs the full build — honest mapping

Be explicit with the expert: the prototype proves the **experience layer and the risk-engine logic**; the architecture above is the **production build-out**. The current React/Vite prototype already demonstrates most of the intended UX.

| Prototype page (built today) | Module it represents | Pillar | Production service behind it |
|---|---|---|---|
| Dashboard (ALE, VaR, treatment, DORA/NIS2) | Board & Executive Reporting | 2 | grc-workflow-service |
| Risk Register (FAIR panel, inherent/residual, ALE) | Financial Risk Scoring | 1 | crq-engine-service |
| Vulnerabilities (CVSS 4.0, exploit/patch flags) | Asset Intelligence / ingestion | 1 | asset-ingestion-service |
| Assets (criticality, business value) | Asset Intelligence | 1 | asset-ingestion-service |
| Threats + IOC Register | Threat context feeding scoring | 1 | asset-ingestion + feeds |
| Incidents (P1–P4, DORA reportable, MTTR) | Regulatory Compliance Engine | 2 | grc-workflow-service |
| Compliance (NIST CSF 2.0, ISO 27001, DORA, NIS2) | Regulatory Compliance Engine | 2 | grc-workflow-service |
| Wazuh SIEM + MITRE ATT&CK | Live ops grounding | 1 | asset-ingestion (connector) |
| Reports (Exec/Board/Financial/Regulatory PDF) | Board & Executive Reporting | 2 | grc-workflow-service |

**What is illustrative in the prototype:** sample data; ROI uses the simplified formula (see §8.4); Monte Carlo is represented rather than run at 10K iterations; backend services, Kafka, multi-tenancy, RBAC and the ML sidecar are the production phase. **None of these gaps are conceptual — they are scoped engineering.**

---

<a name="15-differentiators"></a>
## 15. Differentiators & competitive position

*(Source: vision + functional docs. Position by emphasis; don't disparage incumbents.)*

| Competitor | Does well | Cannot do | Sells to |
|---|---|---|---|
| **Safe Security** | CRQ, financial values, board reports | No GRC/regulatory workflow; no DORA/NIS2 module | Large enterprise, €150K+/yr |
| **Qualys** | Vulnerability scanning at scale | No financial ALE; no GRC/regulatory layer | Large enterprise, complex |
| **ServiceNow GRC** | Deep compliance workflow, audit trail | No live financial risk; heat maps only | Large enterprise, expensive/slow |
| **CyberRisk IQ** | **Financial CRQ + GRC workflow + multi-framework regulatory + mid-market pricing** | Not a scanner — connects to existing ones | **Mid-market, self-serve, ~30-min setup** |

**The structural advantage — the connected thread:** because everything shares one data model and one event bus, a single CVE flows automatically to a euro value, to an ROI-ranked fix, to a GRC/DORA register entry, to a board slide. Fragmented stacks cannot do this without heavy integration. **We own the seam between detection, dollars, and regulation that nobody owns end-to-end** — for the segment nobody serves.

---

<a name="16-how-to-present"></a>
## 16. How to present this broader story

1. **Lead with the two-pillar idea, not one.** "Quantify *and* comply — one engine." Correct the narrow framing in your opening.
2. **Tell the connected-thread story** (CVE → € → ROI fix → DORA register → board slide). It is the single most memorable idea; repeat it.
3. **Demo Pillar 1 then Pillar 2 explicitly.** Show Risks/ALE first, then Compliance/Reports — and say "same numbers, second pillar."
4. **Name the standards and the architecture.** FAIR, Monte Carlo, BetaPERT, DORA/NIS2/EU AI Act, MITRE ATT&CK, CVSS 4.0 — and Spring Boot + Kafka + PostgreSQL + schema-per-tenant. Experts trust specificity.
5. **Pre-empt the ROI question** (§8.4) — raise the risk-reduction-based ROI yourself.
6. **Frame the prototype honestly** with §14's mapping — "experience proven, production scoped."
7. **Anchor on the market window** — DORA/NIS2 live now, mid-market unserved, Safe Security/Balbix validates the model.
8. **End with a specific ask** — design partner, pilot site, or Phase-1 sponsorship.

*(For the slide-by-slide outline and minute-by-minute demo script, use the companion `CyberRiskIQ_Presentation_Guide.md`.)*

---

<a name="17-qa"></a>
## 17. Q&A prep — the expert's hard questions

**Q: So is this just CRQ with a financial dashboard?**
> "No — that's Pillar 1. Pillar 2 turns those numbers into multi-framework compliance and board reporting automatically. The differentiator is the fusion, for the mid-market."

**Q: Your average remediation ROI looked unrealistic (~1193%).**
> "Correct in the prototype — it uses `(ALE − cost)/cost`, which assumes a control removes the entire loss. The production engine uses **risk-reduction ROI**: re-run Monte Carlo with the control applied and take `(current P50 − projected P50)/cost`. That lands ROI in a defensible range. The methodology is the point; the prototype figure is illustrative."

**Q: How is FAIR defensible to an auditor?**
> "FAIR is an open international standard. Every euro traces back to TEF, Vulnerability and Loss Magnitude inputs as BetaPERT ranges, run through 10,000 Monte Carlo iterations. An auditor can reproduce it, and SHAP explains which factors drove each score."

**Q: How do you get TEF / Loss Magnitude inputs?**
> "Threat-intel frequencies (EPSS, CISA KEV), historical incident data, and calibrated expert estimation — standard FAIR practice. We store ranges, not false-precision points."

**Q: Why Spring Boot + Kafka rather than a monolith?**
> "Event-driven decoupling: a new CVE triggers automatic ALE recalculation without synchronous call chains; services scale independently; an offline service replays missed events. It's also the stack mid-market enterprises and their auditors already trust."

**Q: How do you keep tenants' data isolated?**
> "Schema-per-tenant in PostgreSQL with `SET search_path` per request — SQL-level isolation, not just row filters."

**Q: Multiple frameworks sounds like multiple tools' worth of work.**
> "That's the Unified Control Library: test a control once, route the evidence to every framework it satisfies. One test, many certifications."

**Q: You connect to scanners but aren't one — is that a weakness?**
> "Deliberate. We add the financial and regulatory layer on top of the scanners customers already own (Qualys/Tenable/CrowdStrike). We're complementary, not a rip-and-replace — which is exactly why a 30-minute setup is possible."

**Q: What about the EU AI Act and explainability?**
> "Every ALE score is SHAP-explainable and stored as structured data, which directly supports Article 13 transparency — and we inventory Shadow AI automatically as part of discovery."

---

<a name="18-roadmap"></a>
## 18. Roadmap — prototype → MVP → production

- **Now — Prototype (built):** React/Vite experience layer across all major modules; FAIR/ALE logic, multi-framework views, PDF/CSV reporting, SIEM/feeds integration on representative data.
- **Phase 1 — MVP backend & hardening:** stand up the Spring Boot services + Kafka + PostgreSQL (schema-per-tenant); wire live connectors (Qualys/Tenable, NVD/KEV/EPSS); switch ROI to risk-reduction method; OAuth2/SAML2 + RBAC; audit logging; encrypted persistence.
- **Phase 2 — Depth:** full 10K Monte Carlo engine, calibrated FAIR inputs, the ML sidecar (GNN blast-radius, LSTM anomaly, SHAP), Unified Control Library, deeper DORA/NIS2/EU AI Act workflows and auto-drafted filings.
- **Phase 3 — Scale:** multi-tenant SaaS, public API, ServiceNow/MetricStream sync, risk forecasting and control-recommendation intelligence, continuous control monitoring.

**Roadmap line:** *"The prototype proves the experience and the math. Phase 1 makes it real and safe to deploy. Phases 2–3 make it the mid-market category leader."*

---

<a name="19-appendix"></a>
## 19. Appendix — glossary, data model, references

### Glossary
- **CRQ** — Cyber Risk Quantification: expressing cyber risk in financial terms.
- **GRC** — Governance, Risk & Compliance.
- **FAIR** — Factor Analysis of Information Risk; the open CRQ standard.
- **ALE** — Annualised Loss Expectancy (P10/P50/P90 = best/most-likely/worst case).
- **TEF / LEF** — Threat Event Frequency / Loss Event Frequency.
- **Loss Magnitude** — financial size of a loss event (primary + secondary).
- **BetaPERT** — distribution used to model min/likely/max FAIR inputs.
- **Monte Carlo** — repeated random sampling (10,000 iterations) to produce a loss distribution.
- **EPSS / CISA KEV** — exploit-probability score / known-exploited-vulnerabilities catalog.
- **Shadow AI / NHI** — unsanctioned AI tools / non-human (machine) identities.
- **DORA / NIS2 / EU AI Act / SEC** — the regulatory regimes covered.
- **SHAP** — explainability method attributing each score to its drivers.
- **Schema-per-tenant** — one PostgreSQL schema per customer for hard isolation.

### Data model highlights (production)
- `public.tenants` — one row per customer; revenue stored as BIGINT cents to avoid float drift.
- `assets` — hostname, business_value, data_class, regulatory_scope[], `ale_p10/p50/p90` (populated by CRQ engine).
- `asset_connections` — self-referencing edges enabling **blast-radius** queries via recursive CTEs (replaces a graph DB at mid-market scale).
- `vulnerabilities` — CVE, CVSS, EPSS, KEV flag, MITRE TTPs, affected assets.
- `grc_risk_entries` — ALE values, regulatory flags, SHAP explanation, treatment.

### Source documents (in `docs/architecture/`)
- `CyberRiskIQ_Vision_Overview.docx`
- `CyberRiskIQ_Functional_and_Technical_Architecture.docx`
- `CyberRiskIQ_System_Architecture.docx`
- `CyberRiskIQ_Technical_Architecture_Guide.docx`

---

*Prepared as the definitive product + architecture briefing for the CyberRisk IQ prototype review. Pair with `CyberRiskIQ_Presentation_Guide.md` for the slide outline and demo run-sheet.*
