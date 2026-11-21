# 🧪 TrialDeck — Clinical Trial Operations Hub on Atlassian Forge

**TrialDeck** turns Jira and Confluence into a lightweight clinical trial operations layer. Teams log protocol
deviations as structured Jira issues, see cross-site patterns and overdue CAPAs on a dashboard, compare two versions
of a protocol and turn the changes into per-site tasks, and use a Rovo agent to draft deviation reports. A person
reviews and approves everything before it is saved. Built for **Codegeist 2026** (Apps for Specialized Industries).

Everything runs inside Atlassian: there is no server of our own. The React dashboard is hosted by Forge and shown in
Jira, and the Node.js backend runs as Forge functions, so data stays in the customer's own Atlassian site.

> TrialDeck is a coordination and drafting layer. It is **not** a validated system of record (21 CFR Part 11).
> Use **synthetic data only** and pseudonymized subject IDs (`SUBJ-0042`). No real patient data anywhere.

---

## 🛠️ Tech stack

| Layer | Technologies |
| :--- | :--- |
| Platform | Atlassian Forge (hosting, auth, permissions), Node.js 22 runtime (`nodejs22.x`) |
| Dashboard (`frontend/dashboard/`) | React 18, Vite 5, Tailwind CSS 3, Recharts, `@forge/bridge` (Forge Custom UI) |
| Issue panel (`frontend/panel/`) | Forge UI Kit (`@forge/react`) |
| Backend (`src/backend/`) | Forge resolvers (`@forge/resolver`), `@forge/api` (Jira and Confluence REST), `diff` |
| AI / agents | Rovo agent **Deviation Reporter** with two actions |
| Data | Jira is the source of truth. Forge storage (`@forge/kvs`) holds field mappings, cached aggregates, alerts and settings |
| Tooling | Forge CLI 15, `node --test` |

## 🌟 Key features

- **Dashboard (`#/`):** live KPIs (open deviations, major, overdue CAPAs, sites with repeat issues), deviations by site, a weekly trend, and a "needs attention" table. Export to CSV or print.
- **Deviations and site coordinator view (`#/coordinator`):** report a deviation from a drawer that loads the real Jira options. The subject ID must look like `SUBJ-0000`, and a confirmation preview shows every field before anything is written. Site tasks can be moved to Done.
- **Deviation detail (`#/deviation/<KEY>`) and Jira issue panel:** severity, protocol version, site, root cause, report status, CAPA and activity for one deviation. A reviewer can approve the regulatory report, which sets the Report status field and adds an audit comment.
- **CAPA tracker (`#/capa`):** overdue CAPAs, escalate one (an escalation comment and High priority), or create a CAPA task linked to its deviation.
- **Site directory (`#/sites`) and reports (`#/reports`):** per-site deviation counts, plus compliance and safety reports of deviations by category and by root cause.
- **Protocol amendment analysis (`#/amendment`):** pick a Confluence protocol page and two versions, see what changed, and get a per-site task plan (re-consent, IRB approval, retraining, form updates). Untick anything that does not apply, then approve to create the Jira tasks. The server refuses to create anything without explicit approval, and approving the same amendment twice does not create duplicates.
- **Pattern alerts:** every time a Jira issue is created or updated, TrialDeck recalculates five rules: 3 deviations at one site in 30 days; a root cause at 2 or more sites in 30 days (High at 3); a site with at least 2x the mean count across at least 3 sites (and at least 3 deviations); 2 major deviations at one site in 14 days; and a repeat of the same site's root cause within 90 days of its CAPA being resolved. The dashboard returns them with the rest of its data and shows the site-cluster insight banner.
- **Rovo agent, Deviation Reporter:** drafts a structured report (what happened, impact, root cause, corrective action, preventive action) from a deviation ticket. Every fact cites its issue key and field, missing information is written as "Not stated in ticket", and the draft is saved as a Jira comment only after the user replies **APPROVE**. Saved text starts with `AI DRAFT (human-approved)`.
- **Knowledge graph query:** the `queryKnowledgeGraph` resolver answers questions such as "Which sites haven't completed Amendment 3 retraining?" from deviations and amendment tasks, without returning issue summaries or subject IDs. It has no screen yet.
- **Human in the loop:** every write has a confirmation step, AI output is labelled as a draft, and agents only suggest. [WRITE_AUDIT.md](WRITE_AUDIT.md) lists every button, the resolver behind it and its confirmation.

> Amendment analysis is **keyword-based, not AI** (`src/backend/lib/amendmentAnalysis.js`). It produces a draft plan for a
> person to review; expect some over- and under-matching.
>
> The knowledge graph query uses deterministic query parsing, not an LLM. Unsupported question shapes return an explicit error.

---

## 🚀 Getting started

Requires **Node.js 22.23.4 or later** (a Forge CLI 15 requirement) and a free Atlassian account.

```bash
npm install -g @forge/cli@latest
forge login                      # Atlassian email + API token from id.atlassian.com/manage/api-tokens
npm install                      # one install for the whole repo
npm run build:dashboard          # builds frontend/dashboard/dist, which the manifest serves

npm run deploy                   # builds the dashboard, then forge deploy (development)
forge install -p Jira -s your-site.atlassian.net
forge install -p Confluence -s your-site.atlassian.net
forge tunnel                     # live reload while coding (manifest changes need a deploy)
```

`app.id` is already in `manifest.yml`, so **do not run `forge register`** again. Ask the app owner to add you as a
contributor in the Developer Console, then log in with your own account and token.

After a change to `manifest.yml` or scopes: `npm run deploy`, then `forge install --upgrade -p <product> -s <site>` for
each product. A scope change makes the deploy stop with a major-version approval; re-run it with
`forge deploy --approve MAJOR_VERSION_RULE` once you have read the message.

| Command | What it does |
| :--- | :--- |
| `npm run build:dashboard` | Builds the dashboard into `frontend/dashboard/dist` |
| `npm run deploy` | Builds the dashboard, then deploys to the **development** environment |
| `npm run deploy:prod` | Same, to **production** (needs the Deployer or Admin role) |
| `npm run test:feature2` | Runs the `node:test` suites in `tests/` |
| `forge lint` | Checks the manifest and the code |

Tests cover the JQL builders, CAPA overdue logic, field normalization, the five pattern rules and the knowledge graph.

### What the app expects in Jira and Confluence

| Where | What | Notes |
| :--- | :--- | :--- |
| Jira | Project `CLIN` | The key is currently fixed in the code |
| Jira | Issue types `Protocol Deviation`, `CAPA` and `Task` | Tasks are what amendments create |
| Jira | Custom fields `Site`, `Category`, `Subject ID`, `Protocol version`, `Root cause`, `Report status`, `Date detected` | Found by name; the **Site** field needs one option per site |
| Confluence | A protocol page published at least twice | Needed for amendment analysis. Edit the page and publish again to create version 2 |

### Permissions

| Scope | Why |
| :--- | :--- |
| `read:jira-work` | Read deviations, linked CAPAs and issue events |
| `write:jira-work` | Create and update deviations, CAPAs, site tasks and comments |
| `read:jira-user` | Read assignee and user metadata for the UI |
| `storage:app` | Field mappings, per-project aggregates, alerts and settings |
| `read:page:confluence` | Read protocol page versions for amendment analysis |

### Deployment

- **Environments:** `development` is for testing; `production` is the stable copy that the install link serves. They are deployed and installed separately, and a deploy to one never changes the other.
- **Install per product, per site:** an installation lives in one product (Jira or Confluence) on one site. Installing needs **site admin** rights.
- **Sharing:** in the Developer Console open the app, then **Distribution**, set sharing to allow anyone with the link, fill in the app details (they link to [PRIVACY.md](PRIVACY.md) and [TERMS.md](TERMS.md)), and copy the installation link.
- **Time limit:** Forge resolvers stop after 25 seconds. Creating many amendment tasks is split into small batches for this reason and reports anything left as pending.
- **Nothing external:** Forge Custom UI blocks outside scripts and fonts, so Tailwind and all fonts are bundled into the dashboard instead of loaded from a CDN. Add any new external host under `permissions.external` in `manifest.yml`.
- **Shared development environment:** all contributors deploy to the same one, so the last deploy wins. Use `forge tunnel` for personal testing.

---

## 📁 Repository structure

```
manifest.yml            Forge modules, scopes, resources (Forge requires it at the repo root)
package.json            The only package.json: backend and dashboard share one install
vite.config.mjs         Dashboard build (Vite); tailwind.config.cjs and postcss.config.cjs next to it
src/backend/            Forge functions (Forge requires handlers under src/)
  index.js              Resolver entry: every invoke() handler is registered here
  agent.js              Rovo agent actions (get-deviation, save-report-draft)
  issueEvent.js         Jira issue created/updated trigger, with triggers/issueEvent.js
  resolvers/            deviations, dashboard, writes, amendments, knowledgeGraph
  engine/               detectPatterns, reconcile, knowledgeGraph
  services/             confluence, deviationData, feature2Storage (Forge storage)
  lib/                  jira, jql, mapper, amendmentAnalysis
  config/               constants
frontend/
  panel/                Jira issue panel (Forge UI Kit)
  dashboard/            Custom UI source (React + Vite + Tailwind)
    index.html          Vite entry page
    src/components/common/   Shared UI (Shell, Icon, confirm and create modals)
    src/modules/             dashboard, coordinator, deviation, amendment
                             each with pages/ and components/
    src/hooks/               Data hooks that call the backend
tests/                  node:test suites
backup/                 Jira CSV export of the CLIN project
design/, confirm/, empty/    Stitch mockups and screen drafts (reference only, not built)
PRIVACY.md, TERMS.md    Linked from the distribution settings
WRITE_AUDIT.md          Every write action, its resolver and its confirmation
```

Keep Forge function code only in `src/backend/`. The `backend/...` handler paths in the manifest are resolved
relative to `src/`, so a top-level `backend/` directory is not a second source tree.

### Pages

The dashboard is one Custom UI page with a small hash router:

| Route | Page |
| :--- | :--- |
| `#/` | Overview dashboard |
| `#/coordinator` (also `#/tasks`) | Deviations and site coordinator view |
| `#/deviation/<KEY>` | Deviation detail, for example `#/deviation/CLIN-12` |
| `#/capa` | CAPA tracker |
| `#/sites` | Site directory |
| `#/reports` | Compliance and safety reports |
| `#/amendment` | Protocol amendments |
| `#/settings` | Thresholds |

## 🗄️ Data

Jira is the source of truth. TrialDeck reads and writes standard Jira issues and uses Forge storage only for caches and
settings.

| Data | Where it lives |
| :--- | :--- |
| Deviations | Jira issues of type `Protocol Deviation` with the custom fields above |
| CAPAs | Linked Jira issues of type `CAPA` (with a due date and owner) |
| Site tasks and amendment tasks | Jira `Task` issues. Amendment tasks carry the label `amendment-<pageId>-v<from>-v<to>` |
| Field mappings, aggregates, alerts, audit entries | Forge storage (`@forge/kvs`), per project |
| Settings | Forge storage key `app_settings`: overdue threshold in days, open-deviation target (default 15) and repeat-issue threshold (default 2) |

Custom field IDs are discovered from Jira metadata once and cached. A missing Subject ID stays missing and is never
invented. Issue events can arrive up to 3 minutes after the Jira change, project writes are serialized with a
short-lived lock, and the aggregate and alerts are committed in one transaction. Stored values are capped below Forge's
per-value limit (220 KiB): alerts are trimmed to the newest entries to fit, while an oversized aggregate fails
explicitly instead of being cut off silently.

---

## 🔒 Privacy & security notes

- **Data stays in your Atlassian site.** TrialDeck has no servers or databases of its own and calls no external services. The Rovo agent runs on Atlassian's Rovo under Atlassian's terms. See [PRIVACY.md](PRIVACY.md) and [TERMS.md](TERMS.md).
- **Permissions follow the user.** Dashboard and amendment resolvers run as the signed-in user, so they only see what that person can see. Issue-event reconciliation runs as the app.
- **Pseudonymized subjects only.** New deviations must use a subject ID like `SUBJ-0042`. The knowledge graph does not return subject IDs or issue summaries.
- **Nothing is written without a person.** Every write has a confirmation step. The amendment plan is rebuilt on the server and refused unless explicitly approved, and the agent saves a draft only after the user replies APPROVE.
- **Input is escaped.** Values placed into JQL are escaped and project keys are validated.
- **AI output is labelled.** Agent drafts and amendment plans are marked as drafts that need human review, and the agent only suggests severity.
- **Not a validated system.** The app states this on screen and here: it must not be used as the only record for regulated activities.

---

## 👥 Team workflow

`git pull` before you start and push often. Branch off `main` and open a pull request. There is one Forge app owner, who
adds collaborators through the Developer Console (the Developer role is enough for `forge deploy` and `forge tunnel`
in development). Only a Deployer or Admin can deploy to production.
