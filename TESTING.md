# Manual Testing Plan (Per Environment)

This document provides a comprehensive verification checklist for validating TrialDeck in **Development**, **Staging/Demo**, and **Production** environments.

---

## 1. Fresh Site Verification (Zero Tickets)
- [ ] Install TrialDeck on a site with zero `Protocol Deviation` issues.
- [ ] Open **Apps** > **Trial Dashboard**.
- [ ] Verify amber alert appears: *"Work Type Setup Recommended"*.
- [ ] Verify **Sample Data Mode** automatically activates with 12 deviations and 2 overdue CAPAs.
- [ ] Verify repeat cluster insight displays for Site 4 and Site 2.
- [ ] Click **"Hide sample data"**; verify clean empty state appears with links to `SETUP.md`.
- [ ] Click **"Show sample data"**; verify sample mode re-renders properly.

---

## 2. Live Jira Data & CSV Import
- [ ] Import `sample-tickets.csv` into a target Jira project.
- [ ] Open **Trial Dashboard**.
- [ ] Verify the banner switches to live mode (`isSampleData: false`).
- [ ] Verify KPI cards reflect live counts (total deviations, major severity breakdown, affected sites).
- [ ] Verify the 12-week trend chart reflects live date-detected records.
- [ ] Navigate to **Settings** (`#/settings`); test switching between individual project scopes and `All Detected Projects`.

---

## 3. UI Kit Issue Panel
- [ ] Open any imported deviation issue in Jira (e.g. `SAMPLE-101`).
- [ ] In the right sidebar, open the **Protocol Deviation** panel.
- [ ] Verify severity lozenge, site, and pseudonymized Subject ID render cleanly.
- [ ] Verify similar historical deviations appear in the list.
- [ ] Verify the **Regulatory Deviation Report** card displays status (`Not started` or `Draft`).
- [ ] Click **"Approve Report"**; verify status changes to `Approved` with a success banner.
- [ ] Click **"Request Changes"**; verify status updates to `Changes Requested`.

---

## 4. Rovo Agent 1: Deviation Reporter
- [ ] In Rovo chat: type `Draft a report for deviation <KEY>`.
- [ ] Verify the agent calls `get-deviation` and `find-similar-deviations`.
- [ ] Verify output contains all 5 required sections plus citations.
- [ ] Verify prompt asks for explicit `APPROVE`.
- [ ] Type `APPROVE`.
- [ ] Verify comment is posted to Jira ticket in rich Atlassian Document Format (ADF).
- [ ] If Confluence space is accessible, verify published Confluence page link is embedded in the comment.

---

## 5. Rovo Agent 2: Amendment Analyst
- [ ] Ensure a Confluence protocol page has at least two versions.
- [ ] In Rovo chat: type `List available protocol pages`.
- [ ] Verify page appears in the list (capped at 20).
- [ ] Type: `Analyze amendment between version 1 and 2 for page <PAGE_ID>`.
- [ ] Verify classified changes appear with source sentence citations.
- [ ] Verify preview of site rollout tasks appears.
- [ ] Type `APPROVE`.
- [ ] Verify up to 10 tasks are created in Jira with labels `protocol-amendment`.
- [ ] Verify running approval again skips duplicate tasks.

---

## 6. Rovo Agent 3: Trial Insights
- [ ] In Rovo chat: ask `What cross-site signals or patterns are detected?`.
- [ ] Verify agent calls `find-cross-site-signals` and reports Site 4 / Site 2 clusters.
- [ ] Ask: `Trace deviation <KEY>`.
- [ ] Verify agent calls `trace-deviation` and returns linked CAPA details.
- [ ] Ask: `What is the amendment rollout status across sites?`.
- [ ] Verify agent calls `site-amendment-status` and lists completed vs pending tasks.

---

## 7. Model Context Protocol (MCP) Server
- [ ] Connect Claude Desktop or Cursor using the endpoint in `MCP_TESTING.md`.
- [ ] Execute `find-cross-site-signals` from the external client; verify pattern cluster JSON is returned.
- [ ] Execute `list-deviations` with `{"site": "Site 2"}`; verify filtered deviation array.
- [ ] Execute `trace-deviation` with an issue key; verify deviation context.

---

## 8. Trigger Loop Prevention
- [ ] Trigger an issue update via Rovo agent comment save.
- [ ] Inspect Forge logs (`forge logs`); verify the trigger handler identifies the update as originating from the app actor and returns `{ ok: true, data: { ignored: true, reason: 'app_event_loop_prevention' } }` without looping.
