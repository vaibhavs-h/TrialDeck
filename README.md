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
npm run install:all
npm run build:dashboard

forge register          # app owner only, once: writes app.id into manifest.yml
forge deploy
forge install --demo-site   # or: forge install (choose product and site)
forge tunnel            # live reload (manifest changes need forge deploy)
```

After manifest or scope changes: `forge deploy`, then `forge install --upgrade`.

## Team workflow

`git pull` before starting, push often. One Forge app owner; add collaborators via the Developer
Console. Roles: frontend, backend, AI/agents.
