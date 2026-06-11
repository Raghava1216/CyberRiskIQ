# CyberRisk IQ — Board Submission

**Prepared for:** Board of Directors / Industry Review Panel
**Subject:** CyberRisk IQ — mid-market Cyber Risk Quantification + GRC platform
**Status:** Prototype complete; seeking approval to proceed to MVP build
**Classification:** Confidential — for board distribution only
**Date:** June 2026 · **Version:** 1.0

---

## 1. Executive summary

CyberRisk IQ converts a company's cybersecurity weaknesses into **financial loss figures (in euros)** and routes those figures automatically into **multi-framework regulatory compliance and board-ready reporting**. It is the only platform combining cyber risk quantification (CRQ) **and** governance, risk & compliance (GRC) purpose-built for the **mid-market (500–5,000 employees)** — a segment the enterprise incumbents price out and ignore.

The market window is open now: DORA (Jan 2025) and NIS2 (Oct 2024) are law, the EU AI Act is in force, and the recent Safe Security/Balbix consolidation validates the combined model — but only for large enterprise. A working prototype demonstrates the full user experience across both product pillars. **We request board approval to proceed to the MVP backend build.**

---

## 2. The decision requested

The board is asked to approve:

1. **Proceeding to Phase 1 (MVP backend build)** — standing up the production services behind the validated prototype.
2. **Engaging 2–4 design-partner customers** from the target mid-market segment to co-validate and provide reference accounts.
3. **Resourcing the Phase 1 team** (engineering, compliance/SME input, go-to-market groundwork) for the defined build window.

---

## 3. The problem

Mid-market companies face three simultaneous, unsolved problems:

- **No financial value on cyber risk.** Boards receive severity scores (CVSS 0–10) and traffic-light heat maps. When they ask "how much could this cost us?", nobody can answer. Two systems with identical severity scores can carry vastly different financial exposure — today's tools cannot tell them apart.
- **Compliance managed in spreadsheets.** DORA, NIS2, and the EU AI Act require live, financially-quantified risk registers. Most mid-market firms maintain these manually across disconnected spreadsheets, taking weeks to assemble evidence for a regulator.
- **Enterprise tools are out of reach.** Leading platforms start at **€150,000+ per year with ~6-month implementations** — unaffordable for a 600-person company, which then falls back to spreadsheets.

**Consequence:** boards govern cyber risk blind, compliance is reactive and fragile, and security spend cannot be justified in financial terms. Under NIS2, board members now carry **personal liability** for inadequate oversight.

---

## 4. Market opportunity & timing

| Factor | Detail |
|---|---|
| Market size | CRQ market **$4.84B (2025) → $9.66B (2031)** |
| Fastest-growing segment | Mid-sized companies, **~14.62% per year** |
| Regulatory trigger | **DORA** (Jan 2025), **NIS2** (Oct 2024), **EU AI Act** now in force |
| Penalty exposure | DORA/NIS2 fines up to **2% of global revenue** |
| Validating event | Safe Security acquired Balbix (Nov 2025) — proves CRQ + vulnerability fusion, but builds for 10,000+ employee enterprises |

**The white space:** the 500–5,000 employee segment has the regulatory obligation and the risk, but no affordable tool. Nobody serves it well today.

---

## 5. What CyberRisk IQ is

A single platform built on **two pillars sharing one risk engine**:

- **Pillar 1 — Cyber Risk Quantification.** Converts every vulnerability into an **Annualised Loss Expectancy (ALE)** in euros, and ranks fixes by financial return on remediation spend.
- **Pillar 2 — GRC-Native Regulatory Quantification.** Takes those same numbers and drives **multi-framework compliance (DORA, NIS2, EU AI Act, SEC, ISO 27001)** and **board-ready reporting per framework** — automatically.

Because both pillars share one data model, a single new vulnerability flows automatically from a euro figure, to an ROI-ranked fix, to a regulatory register entry, to a board slide — with no manual re-keying.

---

## 6. What it delivers

| Capability | Outcome for the customer |
|---|---|
| **Financial value per risk** | ALE in euros as a range — **P10 / P50 / P90** (best / most-likely / worst case), via the FAIR standard + Monte Carlo simulation |
| **Possibility of recovery** | Loss-magnitude modelling reflects controls, segmentation, backups and insurance — quantifying how recoverable each risk is |
| **Mitigation ROI** | Every fix ranked by **financial risk reduced per euro spent**, giving the CFO a defensible security budget |
| **Multi-framework assessment** | One assessment maps each risk to every framework it touches |
| **Board-ready reports per framework** | Auto-generated board one-pager, CISO pack, CFO insurance-gap analysis, per-regulator exports |
| **Unified Control Library** | "Fix once, satisfy all" — test a control once, satisfy DORA, NIS2, ISO 27001 and insurers simultaneously |

---

## 7. Competitive position

| Provider | Strength | Gap | Segment |
|---|---|---|---|
| Safe Security | Financial CRQ, board reports | No GRC/regulatory workflow | Enterprise, €150K+/yr |
| Qualys | Vulnerability scanning at scale | No financial ALE; no GRC | Enterprise |
| ServiceNow GRC | Compliance workflow, audit trail | No live financial risk (heat maps only) | Enterprise |
| **CyberRisk IQ** | **CRQ + GRC + multi-framework regulatory, mid-market pricing** | Not a scanner — integrates with existing ones | **Mid-market, self-serve** |

**Structural advantage:** we own the connected thread from detection → euros → remediation ROI → regulatory evidence → board reporting, for the segment nobody serves.

---

## 8. Status — what is built vs what remains

**Built today (prototype):** a complete React/TypeScript experience layer demonstrating both pillars — risk register with FAIR/ALE, vulnerabilities, assets, threats, incidents, multi-framework compliance (NIST CSF 2.0, ISO 27001, DORA, NIS2), SIEM/MITRE ATT&CK grounding, and exportable executive/board/financial/regulatory reports on representative data.

**Phase 1 build (requested):**
- Production backend services (ingestion, CRQ engine, GRC workflow) on **Spring Boot + Apache Kafka + PostgreSQL**, with schema-per-tenant isolation.
- Live connectors to existing scanners (Qualys, Tenable) and CVE feeds (NVD, CISA KEV, EPSS).
- Full 10,000-iteration Monte Carlo engine and **corrected risk-reduction ROI methodology** (see §10).
- Authentication, role-based access control (RBAC), and audit logging.

**None of the remaining gaps are conceptual — they are scoped engineering.**

---

## 9. Roadmap

| Phase | Outcome |
|---|---|
| **Now — Prototype** | Validated experience and risk-engine logic across both pillars |
| **Phase 1 — MVP** | Live backend, real connectors, RBAC, corrected ROI, deployable to first design partners |
| **Phase 2 — Depth** | Full Monte Carlo, ML layer (risk propagation, anomaly detection, explainability for EU AI Act), Unified Control Library, deeper regulatory workflows |
| **Phase 3 — Scale** | Multi-tenant SaaS, public API, GRC-suite sync, forecasting and control-recommendation intelligence |

---

## 10. Risks & mitigations

| Risk | Mitigation |
|---|---|
| **Methodology credibility** — early ROI figures are unrealistically high (simplified formula assumes 100% risk elimination) | Phase 1 adopts risk-reduction ROI: `(current ALE − projected ALE) / cost`, grounded in the open FAIR standard and auditor-reproducible |
| **Quality of risk inputs** (TEF, loss magnitude) | Use threat-intel feeds (EPSS, CISA KEV) + calibrated expert estimation; store ranges, not false-precision points |
| **Regulatory accuracy** across DORA/NIS2/EU AI Act | Compliance SME validation in Phase 1; per-framework templates reviewed before customer use |
| **We are not a scanner** | Deliberate — we integrate with the scanners customers already own, enabling ~30-minute setup rather than rip-and-replace |
| **Incumbent moves down-market** | Speed and mid-market focus; regulatory-native GRC is our defensible wedge |

---

## 11. Recommendation

Approve progression to **Phase 1 (MVP build)** and authorise engagement of **2–4 design-partner customers**. The regulatory window is open now, the mid-market is unserved, the model has been externally validated by recent consolidation, and a working prototype de-risks the build. Delay cedes the timing advantage to incumbents moving down-market.

---

*Supporting detail: see `CyberRiskIQ_Product_and_Architecture_Briefing.md` (full product + architecture) and the source architecture documents in `docs/architecture/`.*
