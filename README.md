# Clinical Trial Operations Hub (TrialDeck)

> **Atlassian Codegeist 2026 Hackathon Submission**  
> AI-powered clinical operations platform unifying Jira, Confluence, and Atlassian Rovo to manage protocol deviations, cross-site pattern clusters, and protocol amendments.

[![Atlassian Forge](https://img.shields.io/badge/Platform-Atlassian%20Forge-blue.svg)](https://developer.atlassian.com/platform/forge/)
[![Rovo Agents](https://img.shields.io/badge/Rovo-Agents%20%26%20MCP-purple.svg)](https://www.atlassian.com/software/rovo)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 💡 The Problem
In clinical trials, protocol deviations (e.g., missed patient visit windows, investigational drug temperature excursions, consent errors) represent substantial regulatory and safety risks. Historically, clinical research coordinators (CRCs) and clinical research associates (CRAs) track these deviations in isolated spreadsheets across investigator sites. As a result:
- **Systemic cross-site issues are discovered months too late** during sponsor audits.
- **Protocol amendments** require tedious manual diffing and fragmented task tracking across sites.
- **Reporting overhead** drains valuable clinician time away from patient care.

---

## 🏥 The Solution: TrialDeck
TrialDeck turns Atlassian Cloud into a real-time **Clinical Trial Operations Hub**:
1. **Automated Cross-Site Pattern Engine**: Detects repeat incident clusters (e.g., visit window delays at Site 4 and Site 2) in real time.
2. **Three Specialized Rovo Agents with Human-in-the-Loop Governance**:
   - **Deviation Reporter**: Formulates structured 5-part regulatory deviation reports citing live ticket data, approved by humans before saving to Jira and Confluence.
   - **Amendment Analyst**: Diffs Confluence protocol versions and creates deduplicated per-site rollout tasks in Jira upon approval.
   - **Trial Insights**: Answers natural language questions regarding cross-site signals, CAPA statuses, and rollout metrics.
3. **Model Context Protocol (MCP) Server**: Exposes read-only clinical operations tools to external AI clients (Claude Desktop, Cursor) via Atlassian's managed MCP server.
4. **Teamwork Graph Consumer**: Enriches deviation records with cross-product linked work items via the Atlassian Teamwork Graph API.

---

## 🏆 Codegeist 2026 Prize Mapping

| Prize Category | Module(s) & Implementation in TrialDeck | How It Meets the Requirement |
| :--- | :--- | :--- |
| **Best Agents** | `modules.rovo:agent` (`deviation-reporter`, `amendment-analyst`, `trial-insights`), `modules.action` (9 custom actions) | Ships 3 specialized agents solving distinct clinical workflows with strict human approval governance and citation integrity. |
| **Best MCP** | `modules.rovo:mcp` (`trialdeck-mcp-server`), `skills/trialdeck/SKILL.md`, `MCP_TESTING.md` | Exposes 4 safe, read-only operational tools over the standard Model Context Protocol, consumable by Claude Desktop, Cursor, or internal Rovo agents. |
| **Best Teamwork Graph** | `src/backend/services/teamworkGraph.js`, `src/backend/agentInsights.js` (`trace-deviation`) | **Consumes** data from the Atlassian Teamwork Graph GraphQL API to enrich deviation traces with cross-product linked items with resilient fallback. |

---

## 🏗️ Architecture

```
                                  ATLASSIAN CLOUD
 ┌─────────────────────────────────────────────────────────────────────────────────┐
 │                                                                                 │
 │   JIRA GLOBAL PAGE (Custom UI)               JIRA ISSUE PANEL (UI Kit)          │
 │   - Trial Dashboard & KPIs                   - Severity & Subject ID Card       │
 │   - Cross-Site Trend Chart (Recharts)        - Human-in-the-Loop Report Card    │
 │   - Repeat Issue Clusters & Insights         - Approve / Request Changes Flow   │
 │   - Project Scope Selector (Settings)        - Similar Site Deviations          │
 │                                                                                 │
 └─────────────────────────┬───────────────────────────────┬───────────────────────┘
                           │                               │
                           ▼                               ▼
 ┌─────────────────────────────────────────────────────────────────────────────────┐
 │                         BACKEND RESOLVERS & SERVICES                            │
 │  - deviationData.js: Dynamic project auto-detection & case-insensitive fields   │
 │  - detectPatterns.js: Real-time pattern engine (clusters, spikes, outliers)     │
 │  - writes.js: KVS storage & validated issue / task creation                     │
 │  - sampleData.js: 12-ticket high-fidelity synthetic demo mode                   │
 └─────────────────────────┬───────────────────────────────┬───────────────────────┘
                           │                               │
 ┌─────────────────────────┴─────────────┐   ┌─────────────┴───────────────────────┐
 │         ATLASSIAN ROVO AGENTS         │   │         ROVO MCP SERVER             │
 │  1. Deviation Reporter                │   │  trialdeck-mcp-server               │
 │     (get-deviation, save-report)      │   │  - list-deviations                  │
 │  2. Amendment Analyst                 │   │  - find-cross-site-signals          │
 │     (analyze-amendment, create-tasks) │   │  - trace-deviation                  │
 │  3. Trial Insights                    │   │  - site-amendment-status            │
 │     (find-cross-site-signals, trace)  │   │  Consumable by Claude / Cursor      │
 └─────────────────────────┬─────────────┘   └─────────────────────────────────────┘
                           │
                           ▼
 ┌─────────────────────────────────────────────────────────────────────────────────┐
 │               CONFLUENCE CLOUD & ATLASSIAN TEAMWORK GRAPH API                   │
 │  - confluence.js: Storage XHTML diffing & automated report page publishing      │
 │  - teamworkGraph.js: GraphQL query for cross-product linked work items          │
 └─────────────────────────────────────────────────────────────────────────────────┘
```

---

## ⚡ Judge Quick Start (5 Minutes)

Judges evaluating this hackathon submission can follow our step-by-step setup guide:  
👉 **[Read the Full Judge Setup Guide (SETUP.md)](./SETUP.md)**

1. **Zero-Setup Mode**: If installed on a fresh site without any tickets, TrialDeck automatically launches in **Interactive Synthetic Mode** (~12 deviations across 6 sites), demonstrating live charts, KPIs, site cluster alerts, and CAPA tracking out of the box.
2. **Instant CSV Import**: Import [`sample-tickets.csv`](./sample-tickets.csv) into any Jira project in under 60 seconds to test live JQL queries, issue panels, and the Rovo agent on your own site.

---

## 💻 Tech Stack
- **Runtime:** Atlassian Forge (Node.js 22 plain JavaScript).
- **Frontend:** Jira Global Page (Custom UI: React 18, Vite, Tailwind CSS, Recharts); Issue Panel (Forge UI Kit).
- **Backend:** Forge Resolvers, `@forge/kvs`, `@forge/api`.
- **AI & Integrations:** Atlassian Rovo Agent, Model Context Protocol (`rovo:mcp`), Confluence REST API v2, Atlassian Teamwork Graph API (GraphQL).
- **Data Policy:** 100% synthetic data, pseudonymized participant IDs (`SUBJ-xxxx`), zero external network egress (CSP compliant).
