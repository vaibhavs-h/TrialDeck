# TrialDeck Write Action Audit & Implementation Status

This document inventories every button, form, and control across all TrialDeck pages, tracking implementation status and live Jira write handlers.

## Final Implementation Audit Table

| Page / Component | Button / Control | Live Action & Resolver | Confirmation Step | Status |
|---|---|---|---|---|
| **Overview (`#/`)** | "Export CSV" (`DashboardHeader.jsx`) | Client-side CSV generator with full compliance metadata header (`# TrialDeck Live Export...`) and sanitized quotes. | Instant file download dialog (`.csv`) | **LIVE** |
| **Overview (`#/`)** | "Print" (`DashboardHeader.jsx`) | Triggers standard browser print/PDF preview dialog (`window.print()`). | Browser print preview | **LIVE** |
| **Overview (`#/`)** | "Escalate →" (`KpiRow.jsx`) | Navigates directly to CAPA Tracker (`#/capa`) where each overdue item can be escalated. | Direct route navigation | **LIVE** |
| **Deviations (`#/coordinator`)** | "Report deviation" (`SiteContextBar.jsx` & `ReportDeviationDrawer.jsx`) | Full in-app drawer with options loaded via `getCreateMeta()`. Client-side regex verification for Subject ID (`/^SUBJ-\d{4}$/`). Calls `createDeviation`. Converts description to ADF and writes dropdown options. | `ConfirmModal` preview displaying all fields, Subject ID, and Site before submitting to Jira. | **LIVE** |
| **Deviations (`#/coordinator`)** | Task Checkbox (`MyTasksCard.jsx`) | Live task transition calling `transitionIssue({ issueKey, targetStatus })`. Transitions task to `Done` or `To Do`. | `ConfirmModal` displays task ID, title, and target Jira status before executing. | **LIVE** |
| **Deviation Detail (`#/deviation/<KEY>`)** | "Approve Regulatory Report" (`TrialDeckGlancePanel.jsx` & `frontend/panel/index.jsx`) | Sets Report Status custom field to `"Approved"` and posts a GCP compliance audit trail comment in Jira via `updateReportStatus`. | `ConfirmModal` warns of permanent compliance audit trail comment and confirms update. | **LIVE** |
| **Deviation Detail (`#/deviation/<KEY>`)** | "+ Create Task" (`TrialDeckGlancePanel.jsx`) | Opens `CreateCapaModal` to create a Task in CLIN linked to the deviation with the "Relates" issue link via `createCapaTask`. | `ConfirmModal` previews deviation key, assignee, due date, and summary. | **LIVE** |
| **Deviation Detail (`#/deviation/<KEY>`)** | "Edit Fields" (`IssueDetailsCard.jsx`) | Allows inline editing of Category, Root Cause, and Due Date, updating Jira via `updateDeviation`. | `ConfirmModal` lists fields and values to be saved to Jira. | **LIVE** |
| **CAPA Tracker (`#/capa`)** | "+ CAPA Task" (`AdditionalPages.jsx`) | Opens `CreateCapaModal` to create linked task via `createCapaTask`. | `ConfirmModal` preview before submission. | **LIVE** |
| **CAPA Tracker (`#/capa`)** | "Mark Done" (`AdditionalPages.jsx`) | Transitions issue live to `"Done"` using `transitionIssue`. | `ConfirmModal` prompts user to confirm transition on target issue key. | **LIVE** |
| **CAPA Tracker (`#/capa`)** | "Escalate" (`AdditionalPages.jsx`) | Raises issue priority to `"High"` and adds an ADF formal escalation audit comment via `escalateCapa`. | `ConfirmModal` warns about priority elevation and comment addition. | **LIVE** |
| **Site Directory (`#/sites`)** | "+ Checkpoint Task" (`AdditionalPages.jsx`) | Opens `CreateSiteTaskModal` to log site follow-up tasks in Jira via `createSiteTask`. | `ConfirmModal` confirms task title, site, and target due date. | **LIVE** |
| **Hub Settings (`#/settings`)** | "Save Configuration" (`SettingsPage.jsx`) | Saves operational thresholds (`overdueThresholdDays`, `targetThreshold`, `repeatSiteThreshold`) to Forge app storage via `saveSettings`. | Inline success message and live refresh of thresholds across pages. | **LIVE** |

---

## Not Working / Not Done

- **Confluence / Rovo Features**: Intentionally not included per project constraints.
- **Protocol Amendments Diffing (`#/amendment`)**: Left untouched per project constraints.
- All requested Jira write actions across Overview, Coordinator, Deviations, CAPA Tracker, Sites, Details, Issue Panel, and Settings are fully implemented and verified.
