# Clinical Trial Operations Hub

Forge app (Jira + Confluence + Rovo) for Codegeist 2026. Log protocol deviations as structured
Jira issues, see cross-site patterns on a dashboard, and use Rovo agents to draft deviation
reports and turn protocol amendments into per-site task lists. A human approves all AI output.

**Stack:** Atlassian Forge, React, Node.js 22 (plain JavaScript), Vite, Recharts, Rovo.
**Data policy:** synthetic data only, pseudonymized subject IDs.

---

## 🏆 Judge Quick Start (5 Minutes)

Judges evaluating this hackathon submission can follow our step-by-step setup guide:
👉 **Read the full [Judge Setup Guide (SETUP.md)](./SETUP.md)**

- **Zero-Setup Mode:** If installed on a clean Jira instance without any tickets, TrialDeck automatically launches in **Interactive Synthetic Mode** (~12 deviations across 6 sites), demonstrating live charts, KPIs, site cluster alerts, and CAPA tracking out of the box.
- **Instant CSV Import:** To test live Jira JQL queries, issue panels, and the Rovo agent on your own site in under 60 seconds, import [`sample-tickets.csv`](./sample-tickets.csv) into any Jira project.

---

## Setup

Requires Node >= 22.23.4 and Forge CLI 15.x.

```bash
npm install -g @forge/cli@latest
forge login
npm install             # one install for the whole repo
npm run build:dashboard

forge register          # app owner only, once: writes app.id into manifest.yml
npm run deploy          # builds the dashboard, then forge deploy
forge install --demo-site   # or: forge install (choose product and site)
forge tunnel            # live reload (manifest changes need forge deploy)
```

After manifest or scope changes: `forge deploy`, then `forge install --upgrade`.

## Repository structure

```
manifest.yml            Forge modules, scopes, resources (Forge requires it at the repo root)
package.json            The only package.json (backend and dashboard share one install)
vite.config.mjs         Dashboard build (Vite); tailwind.config.cjs, postcss.config.cjs
src/backend/            Forge functions (Forge requires handlers under src/)
  index.js              Resolver entry: every invoke() handler is registered here
  config/               Constants (issue type, limits)
  resolvers/            One file per area: deviations, dashboard, amendments
  services/             Jira and Confluence API helpers
frontend/
  panel/                Jira issue panel (Forge UI Kit)
  dashboard/            Trial dashboard source (Custom UI: React + Vite + Tailwind)
    index.html               Vite entry page
    src/components/common/   Shared UI (Shell, Icon)
    src/modules/             dashboard, coordinator, deviation, amendment
                             each with pages/, components/ and data/ (mock data)
    src/hooks/               Data hooks that call the backend
design/                 Stitch mockups and notes (reference only, not built)
PRIVACY.md, TERMS.md    Linked from the Marketplace/distribution settings
```

Keep Forge function code only in `src/backend/`; the manifest's `backend/...` handler paths are
resolved relative to `src/`, so a top-level `backend/` directory is not a second Forge source tree.

## Protocol amendment analysis

Dashboard, then **Protocol Amendments** (`#/amendment`). It compares two versions of a Confluence
protocol page, lists what changed, and builds a per-site task plan (re-consent, IRB approval,
retraining, form updates). Nothing is written to Jira until a person approves the plan.

To try it:
1. Create a Confluence page and publish it, then edit it and publish again, so it has two versions.
2. Make sure the Jira Site field has options (one per site) and project `CLIN` has a Task issue type.
3. Pick the page and the two versions, then **Analyze amendment**, untick anything that does not apply,
   and **Approve and create tasks**.

The classification is keyword-based (`src/backend/lib/amendmentAnalysis.js`), so it is a draft for
review, not a decision. Tasks are labelled `amendment-<pageId>-v<from>-v<to>` so approving the same
amendment twice does not create duplicates.

## Deviation dashboard and issue panel

The backend reads Protocol Deviation issues and their linked CAPA issues using Jira's paginated
`/rest/api/3/search/jql` endpoint. Custom field IDs are discovered from Jira metadata once and kept
in Forge KVS; dashboard resolvers continue to run as the current user, while issue-event
reconciliation runs as the app. Missing Subject IDs remain missing and are never synthesized.

Created/updated Jira issue events recalculate these project-level rules: 3 deviations at one site in
30 days; a root cause appearing at 2 or more sites in 30 days (High at 3); a site count at least 2x
the mean across at least 3 sites, with at least 3 deviations; 2 major deviations at one site in 14
days; and a repeat of the same site's root cause after linked CAPA resolution within 90 days. Forge
delivers trigger events asynchronously, potentially up to 3 minutes after the Jira change.
Project writes are serialized with a short-lived KVS lock and the aggregate/alert pair is committed
in one KVS transaction. Stored values are capped below Forge's per-value limit (220 KiB); alerts are
trimmed to the newest entries to fit, while an oversized aggregate fails explicitly rather than
being silently truncated.

Run local checks with:

```bash
npm run test:feature2
$env:ATL_FORGE_ATTRIBUTION_SKILL_NAME='forge-app-builder'; forge lint
```

The dashboard/panel still requires Jira project `CLIN`, issue type `Protocol Deviation`, and issue
type `CAPA`; the Subject ID field is assumed to contain pseudonymized values only. CAPA linking is
identified by linked issue type `CAPA`; a configured link type can further constrain it.

## Linked knowledge graph queries

The `queryKnowledgeGraph` resolver builds a permission-filtered graph from Jira deviations and
protocol-amendment tasks in `CLIN`. It links deviations to their Site and Protocol Version fields,
people to issues by Jira assignee/reporter account, and amendment tasks to sites and the amendment
page/version encoded in their Jira labels. It does not return issue summaries or Subject IDs.

The initial natural-language query supports questions such as "Which sites haven't completed
Amendment 3 retraining?" It treats Amendment 3 as the target protocol page version `v3` in an
`amendment-<pageId>-v<from>-v<to>` label, or matches the literal text "Amendment 3". A site is
reported as incomplete if no matching task exists or its task is not in Jira's Done status category.
The query uses the current Jira user's visibility, searches at most 500 deviations and 500
amendment tasks, and returns warnings when site metadata is unavailable or a result cap is reached.
This is deterministic query parsing, not an LLM; unsupported query shapes return an explicit error.

## Team workflow

`git pull` before starting, push often. One Forge app owner; add collaborators via the Developer
Console. Roles: frontend, backend, AI/agents.
