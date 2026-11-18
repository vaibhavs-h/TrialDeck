---
name: trialdeck-operations
description: Query protocol deviations, cross-site pattern signals, deviation traceability, and amendment rollout status from TrialDeck.
version: 1.0.0
tools:
  - list-deviations
  - find-cross-site-signals
  - trace-deviation
  - site-amendment-status
---

# TrialDeck Clinical Trial Operations Skill

This skill allows AI agents (such as Claude Code, Cursor, or Rovo agents) to interact with TrialDeck's Model Context Protocol (MCP) server.

## When to Use

Use this skill when the user asks questions about:
1. **Clinical Trial Protocol Deviations**: Searching or listing deviations across trial sites, severity categories (major/minor), or root causes.
2. **Cross-Site Signals & Risk Patterns**: Detecting systemic issues across clinical investigator sites (e.g., recurring visit window excursions, temperature excursion spikes).
3. **Operational Traceability**: Looking up a specific deviation's history, linked CAPAs (Corrective and Preventive Actions), and similar historical occurrences.
4. **Protocol Amendment Rollout**: Tracking site-by-site compliance, retraining tasks, and IRB submission status following a protocol amendment.

---

## Available Tools

### 1. `list-deviations`
- **Description:** Retrieve protocol deviations with optional filtering.
- **Parameters:**
  - `site` (optional, string): Filter by site name (e.g., `Site 4`, `Site 2`).
  - `category` (optional, string): Filter by severity (`major` or `minor`).
  - `rootCause` (optional, string): Filter by root cause (e.g., `Training`, `Scheduling`, `Temperature Excursion`).
  - `days` (optional, number): Lookback window in days (default: `90`).
- **Response:** Array of deviations with ticket key, summary, site, category, root cause, and status.

### 2. `find-cross-site-signals`
- **Description:** Run pattern detection algorithms across all sites to identify clusters and anomalies.
- **Parameters:** None.
- **Response:** List of signals with rule type (`SITE_CLUSTER`, `CROSS_SITE_ROOT_CAUSE`), affected site, incident count, and recommended action.

### 3. `trace-deviation`
- **Description:** Retrieve full 360-degree context for a single deviation.
- **Parameters:**
  - `issueKey` (required, string): The Jira issue key (e.g., `CLIN-12`, `PROJ-101`).
- **Response:** Core deviation fields, linked CAPA status, due date, overdue flag, and similar historical deviations.

### 4. `site-amendment-status`
- **Description:** Track protocol amendment rollout across sites.
- **Parameters:** None.
- **Response:** Breakdown of rollout tasks per site (completed vs. pending retraining and IRB submissions).

---

## Example Prompts

### Example 1: Cross-Site Risk Analysis
> *"What cross-site deviation clusters or patterns are currently active across our clinical trial sites?"*
- **Tool Called:** `find-cross-site-signals()`
- **Expected Output:** Identifies repeat visit window deviations at Site 4 and Site 2, and recommends CRA retraining.

### Example 2: Filtering Deviations by Site and Severity
> *"Show me all major protocol deviations logged for Site 2 in the past 60 days."*
- **Tool Called:** `list-deviations({ site: "Site 2", category: "major", days: 60 })`
- **Expected Output:** Lists temperature excursion and drug handling deviations with Jira keys.

### Example 3: Tracing CAPA and Historical Precedent
> *"Trace deviation CLIN-104. Does it have an open CAPA and have we seen similar incidents before?"*
- **Tool Called:** `trace-deviation({ issueKey: "CLIN-104" })`
- **Expected Output:** Reports the deviation status, linked CAPA due date, and cites historical precedents.
