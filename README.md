# Clinical Trial Operations Hub

Forge app (Jira + Confluence + Rovo) for Codegeist 2026. Log protocol deviations as structured
Jira issues, see cross-site patterns on a dashboard, and use Rovo agents to draft deviation
reports and turn protocol amendments into per-site task lists. A human approves all AI output.

**Stack:** Atlassian Forge, React, Node.js 22 (plain JavaScript), Vite, Recharts, Rovo.
**Data policy:** synthetic data only, pseudonymized subject IDs.

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

## Team workflow

`git pull` before starting, push often. One Forge app owner; add collaborators via the Developer
Console. Roles: frontend, backend, AI/agents.
