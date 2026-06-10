# CyberRiskIQ — Industry Expert Presentation Guide

> **Purpose of this document:** Everything you need to present the CyberRiskIQ prototype to an industry expert with confidence — the story to tell, a slide-by-slide deck outline, a live demo script, the differentiators to emphasise, the methodology that earns credibility, and a prepared Q&A (including the hard questions an expert *will* ask).
>
> **Audience:** Senior cybersecurity / GRC practitioner or analyst (CISO, risk leader, security architect, or industry analyst).
> **Format:** Read this end-to-end once, then use Section 4 (Deck Outline) and Section 5 (Demo Script) as your run sheet on the day.

---

## Table of Contents
1. [Positioning — the one-line story](#1-positioning)
2. [The problem we solve](#2-the-problem)
3. [What CyberRiskIQ is and what we're achieving](#3-what-we-are-achieving)
4. [Slide-by-slide deck outline](#4-deck-outline)
5. [Live demo script (the centrepiece)](#5-demo-script)
6. [What makes it unique — differentiators](#6-differentiators)
7. [Competitive advantages vs the market](#7-competitive-advantages)
8. [Methodology & standards (your credibility anchor)](#8-methodology)
9. [Architecture & technology](#9-architecture)
10. [Anticipated questions & answers (Q&A prep)](#10-qa)
11. [Honest limitations & how to frame them](#11-limitations)
12. [Roadmap — from prototype to product](#12-roadmap)
13. [Delivery tips — how to present](#13-delivery-tips)
14. [Appendix — data model & glossary](#14-appendix)

---

<a name="1-positioning"></a>
## 1. Positioning — the one-line story

**Elevator pitch (memorise this):**

> *"CyberRiskIQ turns cybersecurity from a technical checklist into a financial conversation. It unifies threat intelligence, vulnerabilities, assets, incidents and compliance into a single platform — and quantifies every risk in dollars using the FAIR standard, so a CISO can walk into a board meeting and say 'here is our $X exposure, here is the ROI of fixing it,' instead of showing a wall of red and green dots."*

**The three words to anchor everything:** **Quantify. Unify. Comply.**

- **Quantify** — every risk expressed in money (Annualized Loss Expectancy, Value at Risk), not vague high/medium/low.
- **Unify** — threats, vulnerabilities, assets, incidents, IOCs and compliance in one pane of glass.
- **Comply** — purpose-built for the regulations that matter *now* in Europe: **DORA** and **NIS2**, plus NIST CSF 2.0, ISO 27001, SOC 2, PCI DSS, GDPR, HIPAA.

---

<a name="2-the-problem"></a>
## 2. The problem we solve

Frame the problem in the language your expert lives in every day:

1. **Risk is reported in colours, not currency.** Boards and CFOs cannot make budget decisions from a red/amber/green heat map. They need numbers. Most GRC tools still output qualitative scores.
2. **Tooling is fragmented.** Threat intel lives in one tool, vulnerability scanning in another, the asset CMDB in a third, incident response in a ticketing system, and compliance in spreadsheets. Nobody has the whole picture, and correlation is manual.
3. **Compliance is a moving target.** DORA (in force Jan 2025) and NIS2 raised the bar on incident reporting timelines, governance, and supply-chain accountability. Teams are scrambling to map controls and prove readiness.
4. **Security spend is hard to justify.** "We need $480k for this control" is a weak ask. "$480k averts $3.84M of annualized expected loss" wins the budget. Few teams can produce that second sentence on demand.

**The takeaway line:** *"Security teams are data-rich but decision-poor. CyberRiskIQ closes the gap between technical signal and business decision."*

---

<a name="3-what-we-are-achieving"></a>
## 3. What CyberRiskIQ is and what we're achieving

**What it is:** An integrated **Cyber Risk Quantification + GRC + Threat Operations** platform prototype. A single dashboard where security posture, financial exposure, and regulatory readiness are visible and actionable together.

**What we're achieving — the outcomes to claim:**

| Outcome | How CyberRiskIQ delivers it |
|---|---|
| **Board-ready financial risk reporting** | FAIR-based ALE and Monte Carlo Value-at-Risk, exportable as Executive / Board / Financial PDF reports |
| **A single source of truth** | Threats, vulnerabilities, assets, incidents, IOCs and compliance unified in one app |
| **Regulatory readiness on demand** | DORA incident reportability flags and NIS2 readiness scoring built into the data model |
| **Defensible budget decisions** | Per-risk treatment cost, ROI, and treatment strategy (Mitigate / Transfer / Accept / Avoid) |
| **Live threat operations** | Real-time threat feeds, IOC register, and Wazuh SIEM / MITRE ATT&CK integration |
| **Faster audits** | Compliance framework scoring with assessment history and exportable certificates |

**The headline outcome to repeat:** *"From technical telemetry to a dollar figure and a regulatory status — in one click."*

---

<a name="4-deck-outline"></a>
## 4. Slide-by-slide deck outline

A tight **14-slide** deck. Aim for ~20–25 minutes of talking plus demo plus Q&A. Each slide below lists the **headline**, **what to show**, and the **one thing to say**.

| # | Slide | What to show | The one line to say |
|---|---|---|---|
| 1 | **Title** | CyberRiskIQ logo/name, tagline "Quantify. Unify. Comply.", your name, date | "Today I'll show how we turn cyber risk into a business decision." |
| 2 | **The Problem** | The 4 pain points from Section 2 | "Security teams are data-rich but decision-poor." |
| 3 | **The Vision** | The elevator pitch, the 3 anchor words | "Risk as a financial conversation, not a colour chart." |
| 4 | **Product Overview** | Screenshot of the Dashboard | "One pane of glass for posture, exposure and compliance." |
| 5 | **Financial Quantification (FAIR)** | Dashboard Financial view — Aggregate ALE, 95th-percentile VaR, treatment budget | "Every risk in dollars, using the open FAIR standard." |
| 6 | **Risk Register** | Risks page — inherent vs residual, ALE, treatment, framework tags | "Each risk traced from technical score to financial impact to the control that fixes it." |
| 7 | **Threat Intelligence & IOCs** | Threats + IOC Register pages, live feeds | "Live external threat signal, curated into an internal IOC database." |
| 8 | **Vulnerability & Asset Management** | Vulnerabilities (CVSS 4.0) + Assets (criticality, business value) | "We tie vulnerabilities to the assets that actually matter to the business." |
| 9 | **Incident Response & DORA** | Incidents page — P1–P4, DORA reportable flag, MTTR, financial impact | "Incidents scored for regulatory reportability the moment they're declared." |
| 10 | **Compliance & GRC** | Compliance page — NIST CSF 2.0, ISO 27001, SOC 2, DORA, NIS2 scores | "Continuous compliance posture across the frameworks that matter — with AI-assisted control review." |
| 11 | **SIEM Integration (Wazuh + MITRE ATT&CK)** | Wazuh page — agent status, ATT&CK technique distribution, live alerts | "Grounded in real security operations, mapped to MITRE ATT&CK." |
| 12 | **Reporting** | Reports page → generate a PDF live | "Executive, Board, Financial and Regulatory reports in one click." |
| 13 | **What Makes Us Different** | The differentiators table (Section 6) | "Quantification-first, regulation-native, unified — most tools do one, we do all three." |
| 14 | **Roadmap & Ask** | Roadmap (Section 12) + your specific ask | "Here's where we go next — and here's the feedback/support I'm asking for." |

> **Tip:** Put the **live demo between slides 4 and 13** rather than as a separate block — narrate the slides *while* clicking through the real app. Experts trust a working product over bullet points.

---

<a name="5-demo-script"></a>
## 5. Live demo script (the centrepiece)

This is the part the expert will remember. Rehearse it until it's smooth. ~7–10 minutes.

**Setup before you start:** App open on the **Dashboard**, light theme (or dark — pick what reads best on the room's projector), browser zoomed so text is legible from the back.

1. **Open on the Dashboard.** "This is the command centre. Top line: our aggregate Annualized Loss Expectancy, our 95th-percentile Value at Risk, treatment budget, and regulatory indicators for DORA and NIS2."
2. **Toggle Financial ↔ Regulatory view.** "The same posture, two lenses — one for the CFO, one for the regulator."
3. **Point at the Risk Trend chart and Treatment Mix donut.** "Trend over seven months, and how our risk treatment budget is allocated across Mitigate, Transfer, Accept, Avoid."
4. **Click into the Risk Register.** "Here's the detail. Notice each risk has an *inherent* score and a *residual* score — what it was before controls, and after. And critically, an ALE in dollars."
5. **Open the FAIR Risk Analysis side panel on one risk.** "This is the FAIR model underneath — Threat Event Frequency, Vulnerability, Loss Magnitude — the inputs that produce the dollar figure. This is an open, defensible standard, not a black box."
6. **Switch to the Financial view / export FAIR CSV.** "Analysts can take this straight into their own models."
7. **Jump to Threats + IOC Register.** "Live external feeds on the left; the curated internal IOC database on the right. One click promotes an indicator into our register."
8. **Show Vulnerabilities then Assets.** "CVSS 4.0 scored vulnerabilities, tied to assets ranked by business value and criticality — so we prioritise by impact, not just severity."
9. **Show Incidents.** "When we declare an incident, the platform immediately flags whether it's DORA-reportable and estimates financial impact and downtime."
10. **Show Compliance.** "Framework-by-framework posture — NIST CSF 2.0, ISO 27001, DORA, NIS2 — with AI-assisted control assessment."
11. **(Optional) Show the Wazuh SIEM page.** "And it's grounded in real operations — live SIEM alerts mapped to MITRE ATT&CK."
12. **Finish on Reports — generate a PDF live.** "And it all rolls up into a board-ready report in one click." *(Open the generated PDF on screen.)*

**Closing line of the demo:** *"Everything you just saw is connected — a Wazuh alert becomes an IOC, an IOC informs a risk, a risk has a dollar value, that value rolls into the board report and the DORA filing. That connected thread is the product."*

---

<a name="6-differentiators"></a>
## 6. What makes it unique — differentiators

| Differentiator | Why it matters to an expert |
|---|---|
| **Quantification-first, not bolt-on** | Most GRC tools are qualitative (RAG ratings) with FAIR as an afterthought. CyberRiskIQ treats financial quantification (ALE + Monte Carlo VaR) as the core, not a plugin. |
| **Regulation-native for DORA & NIS2** | Built around the EU regulations that are live and under-served *today*. DORA reportability and NIS2 readiness are first-class data fields, not manual mappings. |
| **Genuinely unified** | Threat intel + vulns + assets + incidents + IOCs + compliance + SIEM in one model — competitors typically cover one or two of these well and integrate the rest. |
| **Operations-grounded** | Wazuh SIEM + MITRE ATT&CK integration ties strategic risk numbers back to real detections — closing the gap between the SOC and the boardroom. |
| **AI-assisted GRC** | Automated control assessment (LLM-assisted) reduces the manual effort that makes compliance slow and expensive. |
| **Stakeholder-tailored reporting** | Distinct Executive, Board, Financial (FAIR), and Regulatory report formats from one dataset. |

**The differentiation soundbite:** *"Other tools make you choose — quantification, or operations, or compliance. CyberRiskIQ is built on the premise that these are the same problem viewed from three seats: the SOC, the boardroom, and the regulator."*

---

<a name="7-competitive-advantages"></a>
## 7. Competitive advantages vs the market

Be ready to position against the categories the expert knows. Don't disparage incumbents — position by emphasis.

- **vs. enterprise GRC suites (ServiceNow GRC, RSA Archer, OneTrust):** Powerful but heavy, expensive, and qualitative-first. CyberRiskIQ leads with financial quantification and is purpose-built for DORA/NIS2, with a lighter, faster footprint.
- **vs. risk-quantification specialists (e.g. FAIR-based CRQ tools):** Strong on the dollar math but often *only* CRQ — they don't carry live threat intel, IOCs, vulnerability/asset context, or SIEM operations. CyberRiskIQ surrounds the quantification with the operational data that feeds it.
- **vs. threat-intel / vuln tools (TIPs, scanners):** Excellent at signal, weak at translating it into business/financial/regulatory terms. CyberRiskIQ is the translation layer on top.
- **The structural advantage:** **the connected thread.** Because everything shares one data model, a SOC detection can be traced all the way to a board-level dollar figure and a regulatory filing — something fragmented stacks cannot do without heavy integration work.

**Advantage summary line:** *"We're not trying to out-feature the giants on any single axis. Our advantage is the seam — the connective tissue between detection, dollars, and regulation that nobody owns end-to-end."*

---

<a name="8-methodology"></a>
## 8. Methodology & standards — your credibility anchor

An industry expert will judge you on rigour. Lead with the standards; they signal you're serious.

- **FAIR (Factor Analysis of Information Risk):** The open international standard for cyber risk quantification. We model **Threat Event Frequency (TEF)**, **Vulnerability**, and **Loss Magnitude (LM)** to derive **Loss Event Frequency (LEF)** and **Annualized Loss Expectancy (ALE)** — with min / likely / max ranges, not single points.
- **Monte Carlo simulation:** ALE ranges are run through simulation to produce a **loss exceedance / Value-at-Risk distribution** (50th through 99th percentiles), so we can state, e.g., "95% confident annual losses stay below $X."
- **Compliance frameworks:** **NIST CSF 2.0**, **ISO 27001**, **SOC 2**, **PCI DSS**, **GDPR**, **HIPAA** — scored by control status (Compliant / Partial / Non-Compliant).
- **Regulatory frameworks:** **DORA** (incident reporting, RTO/RPO, ICT risk) and **NIS2** (governance, supply-chain, readiness scoring) as first-class concepts.
- **MITRE ATT&CK:** SIEM alerts mapped to ATT&CK tactics and techniques for threat contextualisation.
- **CVSS 4.0:** Vulnerability severity scoring aligned to the latest standard.

**The credibility line:** *"Nothing here is a proprietary black box. Every number traces back to an open, peer-reviewed standard an auditor or analyst can independently validate."*

---

<a name="9-architecture"></a>
## 9. Architecture & technology

Keep this brief unless the expert is technical — then go deep.

- **Frontend:** React + Vite + TypeScript — a fast, modern single-page application.
- **UI:** Responsive design with light/dark theme support; charts via Recharts plus custom SVG visualisations (gauges, donuts, heat maps).
- **Risk engine:** FAIR calculations and Monte Carlo simulation logic in the application layer.
- **Reporting:** Client-side PDF generation (jsPDF) for Executive, Board, Financial and Regulatory reports, plus CSV export.
- **Integrations (prototype):** Wazuh SIEM API for live alerts; external threat-intel feeds; Supabase for compliance data persistence; LLM-assisted (Groq/Llama-3) control assessment.
- **State & persistence:** React hooks with local stores (e.g. the IOC register persists to local storage in the prototype).

**Architecture line:** *"It's a modern, modular web architecture — the risk engine, the integrations, and the reporting layer are cleanly separated, which is what makes the path to production straightforward."*

---

<a name="10-qa"></a>
## 10. Anticipated questions & answers (Q&A prep)

Rehearse these. The expert *will* probe. Confident, honest answers build more trust than a flawless demo.

**Q: Is this real data or mock data?**
> "This is a functional prototype running on representative sample data so we can demonstrate the full workflow end-to-end. The integrations (Wazuh, threat feeds, compliance store) are wired to real interfaces; the dataset is illustrative. Production deployment connects these to the customer's live sources."

**Q: Your average Remediation ROI shows ~1193%. That's not realistic.**
> *(Be direct — this is the single most likely challenge.)* "Good catch, and you're right to push on it. The current per-risk ROI uses `(ALE − treatment cost) / treatment cost`, which assumes a control eliminates the *entire* expected loss. That's optimistic — real controls reduce risk to a residual level, they rarely take it to zero. The realistic formula uses *risk reduction* — `(inherent ALE − residual ALE − cost) / cost` — which we already have the inputs for, since we track inherent and residual scores. Corrected, the average lands in a defensible ~100–400% range. In the prototype these are illustrative figures; the methodology is the point, and it's an easy, planned refinement."

**Q: How is this different from [ServiceNow GRC / Archer / OneTrust]?**
> Use Section 7. Lead with quantification-first + DORA/NIS2-native + the connected thread.

**Q: How defensible is the FAIR model to an auditor?**
> "FAIR is an open international standard, not our invention. Every dollar figure traces back to TEF, Vulnerability and Loss Magnitude inputs with documented ranges, run through Monte Carlo. An auditor can reproduce it."

**Q: How do you get the input estimates (TEF, Loss Magnitude)?**
> "In production these come from a mix of historical incident data, threat-intel frequencies, and calibrated expert estimation — the standard FAIR practice. The platform stores ranges, not false-precision single points, which is exactly how FAIR is meant to be used."

**Q: Where's the AI, and can I trust it?**
> "AI assists GRC control assessment — it accelerates the first-pass review of controls; a human approves. It's a force-multiplier for the analyst, not an autonomous decision-maker."

**Q: What's the security/privacy model?**
> "It's a prototype, so I'll be straight: production needs authentication, role-based access, audit logging, and encryption of the risk data — that's on the roadmap and is table stakes for a tool that holds an organisation's risk register."

**Q: Can it scale / multi-tenant?**
> "The architecture separates the risk engine, integrations and presentation cleanly, which gives us a clear path to a multi-tenant, API-backed production build. The prototype proves the workflow; the production phase hardens it."

---

<a name="11-limitations"></a>
## 11. Honest limitations & how to frame them

Owning the gaps *increases* credibility with an expert. Frame each as "prototype scope" + "clear path forward."

| Limitation | How to frame it |
|---|---|
| Sample/representative data | "Illustrative dataset to demonstrate the full workflow; production connects live sources." |
| ROI formula is optimistic | "Known — switches to risk-reduction-based ROI; inputs already captured." (See Q&A.) |
| No auth / RBAC yet | "Table-stakes for production, on the roadmap; prototype focuses on proving the workflow." |
| Monte Carlo is illustrative | "The simulation framing and percentiles are correct; production tunes iteration counts and live inputs." |
| Some integrations stubbed | "Interfaces are real; full data wiring is the productionisation step." |

**The framing principle:** *"This is a prototype that proves the concept and the workflow. None of the gaps are conceptual — they're the known, scoped engineering of taking a validated prototype to production."*

---

<a name="12-roadmap"></a>
## 12. Roadmap — from prototype to product

Show you've thought past the demo. Three phases:

- **Phase 1 — Hardening (production foundations):** Authentication + RBAC, audit logging, encrypted persistence, replace sample data with live integrations (SIEM, scanners, CMDB, threat feeds).
- **Phase 2 — Depth:** Refine the risk engine (risk-reduction ROI, calibrated FAIR inputs, richer Monte Carlo), expand framework coverage, deeper DORA/NIS2 reporting workflows and automated regulatory filing drafts.
- **Phase 3 — Scale & intelligence:** Multi-tenant SaaS, API for ecosystem integration, expanded AI (risk forecasting, control recommendation, anomaly detection), continuous-control-monitoring at scale.

**Roadmap line:** *"Prototype proves it works. Phase 1 makes it safe to deploy. Phases 2–3 make it a category leader."*

---

<a name="13-delivery-tips"></a>
## 13. Delivery tips — how to present

- **Lead with the business outcome, not the tech.** Open on "risk in dollars," not "React and Vite."
- **Demo > slides.** A working product is your strongest asset — spend the most time in the live app.
- **Tell the connected-thread story.** The single most memorable idea is that one data model links the SOC alert → IOC → risk → dollar figure → board report → regulatory filing. Repeat it.
- **Speak the standards.** FAIR, Monte Carlo, NIST CSF 2.0, DORA, NIS2, MITRE ATT&CK, CVSS 4.0 — name them; they signal rigour.
- **Pre-empt the ROI question.** Consider raising the ROI-methodology refinement *yourself* before they do — it shows intellectual honesty and disarms the obvious critique.
- **Know your numbers cold.** Be able to explain any figure on screen back to its inputs.
- **Have the PDF reports ready** as a leave-behind — a tangible artifact the expert keeps.
- **End with a specific ask.** Don't trail off. "I'm seeking your feedback on X" or "I'm looking for a design partner / pilot site / sponsorship for Phase 1."
- **Time it:** ~3 min problem/vision, ~10 min demo, ~5 min differentiation + roadmap, leave generous room for Q&A.

---

<a name="14-appendix"></a>
## 14. Appendix — data model & glossary

**Core entities (one connected model):**
- **Risk** — inherent score, residual score, treatment (Mitigate/Transfer/Accept/Avoid), treatment cost, remediation ROI, regulatory reference, and a nested **FAIR** object (TEF min/likely/max, Vulnerability %, Loss Magnitude min/likely/max, ALE, LEF).
- **Threat** — IOC type, severity, confidence, threat-actor attribution, source feed.
- **Vulnerability** — CVSS 4.0 score, severity, patch/exploit availability, remediation due date.
- **Asset** — class (Primary/Supporting), criticality, risk score (0–100), business/annual value, regulatory scope, owner.
- **Incident** — priority (P1–P4), DORA reportability flag, financial impact estimate, affected users, downtime, MTTR.
- **IOC** — IPs, domains, hashes, URLs, emails, files, registry keys, certificates, with confidence and attribution.
- **Compliance** — framework, control status (Compliant/Partial/Non-Compliant), score, assessment history.
- **Portfolio KPIs** — total ALE, 95th-percentile VaR, aggregate ROI, NIS2 readiness score.

**Glossary (for quick reference):**
- **ALE** — Annualized Loss Expectancy: expected financial loss per year from a risk.
- **VaR** — Value at Risk: the loss threshold at a given confidence level (e.g. 95%).
- **FAIR** — Factor Analysis of Information Risk: the open standard for quantifying cyber risk in financial terms.
- **TEF / LEF** — Threat Event Frequency / Loss Event Frequency.
- **Loss Magnitude** — the financial size of a loss event.
- **DORA** — Digital Operational Resilience Act (EU financial-sector ICT resilience regulation).
- **NIS2** — EU Network & Information Security Directive (2nd iteration).
- **MITRE ATT&CK** — knowledge base of adversary tactics and techniques.
- **CVSS** — Common Vulnerability Scoring System.
- **ROSI** — Return on Security Investment.

---

*Prepared as a presentation companion for the CyberRiskIQ prototype. Use Sections 4 and 5 as your run sheet, and rehearse Section 10 before you walk in.*
