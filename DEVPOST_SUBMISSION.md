# Devpost Submission: Clinical Trial Operations Hub (TrialDeck)

## 📌 Tagline
AI-powered clinical trial operations platform on Jira, Confluence, and Rovo that unifies protocol deviation tracking, cross-site pattern detection, and automated amendment rollouts.

---

## 💡 Inspiration
Clinical trials are high-stakes, multi-million-dollar endeavors governed by strict regulatory standards (FDA 21 CFR Part 312, ICH GCP). Yet, protocol deviations—such as missed patient visit windows, temperature excursions in drug storage, or consent version mismatches—are routinely tracked in fragmented spreadsheets across clinical sites.

When deviations are logged in silos:
- Cross-site trends (e.g., three separate sites experiencing patient visit window violations due to the same scheduling ambiguity) go unnoticed until an audit.
- Protocol amendments require tedious manual text diffing to figure out which sites need retraining or IRB resubmission.
- Clinical research teams spend hours drafting repetitive regulatory deviation reports rather than focusing on patient safety.

We built **TrialDeck** to turn Atlassian Cloud into a real-time clinical trial command center that empowers coordinators and sponsors while upholding strict human-in-the-loop compliance.

---

## 🛠️ What It Does
1. **Clinical Trial Operations Dashboard**:
   - Live Jira tracking of deviations, severity breakdowns (Major vs. Minor), 12-week incident trends, and overdue CAPAs.
   - Built-in **Pattern Detection Engine**: Analyzes deviations across sites in real time, automatically flagging repeat issue clusters and systemic root causes.
   - Multi-Project Scope Selector: Works across any Jira project, automatically detecting projects with deviation tickets.
   - Zero-Setup Synthetic Mode: When installed on fresh sites with zero tickets, TrialDeck provides a 12-deviation synthetic demonstration mode out of the box.

2. **Three Specialized Rovo Agents with Human-in-the-Loop Governance**:
   - **Deviation Reporter**: Pulls real ticket data to draft structured 5-part regulatory deviation reports (What happened, Impact, Root cause, Corrective action, Preventive action). Requires explicit user approval (`APPROVE`) before publishing as a rich ADF comment in Jira and a published report page in Confluence.
   - **Amendment Analyst**: Diffs Confluence protocol versions, extracts clinical changes across 5 key operational domains (Eligibility, Procedures, Consent, Safety, Dosing), and creates deduplicated per-site rollout tasks in Jira upon approval.
   - **Trial Insights**: Answers conversational questions about cross-site patterns, CAPAs, and amendment implementation across sites.

3. **Rovo Model Context Protocol (MCP) Server**:
   - Exposes safe, read-only tools (`list-deviations`, `find-cross-site-signals`, `trace-deviation`, `site-amendment-status`) via `rovo:mcp`.
   - Allows external developer assistants (Cursor, Claude Desktop) and internal workspace agents to query trial health securely.

4. **Atlassian Teamwork Graph Integration**:
   - Consumes cross-product contextual links from the Atlassian Teamwork Graph API to provide deep traceability between clinical deviations and related Jira/Confluence work items.

---

## 🔧 How We Built It
- **Atlassian Forge Platform**: Backend functions running on Node.js 22, with `@forge/kvs` for fast configuration storage.
- **Frontend Architecture**:
  - Global Page: Custom UI built with React 18, Vite, Tailwind CSS, and Recharts.
  - Jira Issue Panel: Native Forge UI Kit with interactive regulatory sign-off buttons.
- **Rovo Intelligence**: 3 specialized agents, 9 custom actions, and a managed `rovo:mcp` server.
- **Confluence Integration**: REST API v2 for parsing storage XHTML, generating word/array diffs, and publishing approved deviation report pages.
- **Data Compliance**: 100% synthetic pseudonymized participant identifiers (`SUBJ-0045`), zero patient health information (PHI), and strict CSP compliance with no external egress.

---

## 🧗 Challenges We Overcame
- **Real-Time Diffing in Forge**: Protocol documents can be lengthy. We built an efficient streaming block tokenizer (`htmlToBlocks`) that strips macro markup and preserves section headings before diffing.
- **Execution Budgets & Batching**: Creating dozens of Jira tasks across sites can exceed serverless timeouts. We designed a batched task creator (10 tasks per call) with idempotency guarantees that prevents duplicate ticket creation if executed multiple times.
- **Robust Field Resolution**: Clinical teams use team-managed and company-managed Jira projects with varying field casing. We implemented a case-insensitive alias resolver with TTL caching that never throws fatal exceptions on unmapped fields.

---

## 🏆 Category & Bonus Prize Proof

| Prize Category | Implementation Proof |
| :--- | :--- |
| **Best Agents** | Ships 3 distinct `rovo:agent` modules (`deviation-reporter`, `amendment-analyst`, `trial-insights`) powered by 9 custom `action` modules. Employs citation verification and explicit human approval gates before any Jira or Confluence write. |
| **Best MCP** | Implements the official `rovo:mcp` module (`trialdeck-mcp-server`), exposing 4 read-only clinical operations tools. Accompanied by open-source `skills/trialdeck/SKILL.md` and complete testing instructions in `MCP_TESTING.md`. |
| **Best Teamwork Graph** | Consumes cross-product relationships via `requestTeamworkGraph` in `src/backend/services/teamworkGraph.js`, enriching deviation traces with linked work items. |

---

## 🚀 Judge Access & Testing Instructions
1. **Installation Link**: `<INSTALL_LINK>`
2. **Video Demo**: `<YOUTUBE_LINK>` (Under 4:45)
3. **Repository**: `<REPO_URL>`
4. **Step-by-Step Instructions**: Please refer to [`SETUP.md`](./SETUP.md) for 5-minute zero-setup and CSV import testing.
