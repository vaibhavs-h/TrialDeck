# Amendment

Custom UI page showing what a protocol amendment changes and the per-site actions.

- `static/dashboard/src/` is copied into the app's `static/dashboard/src/` (new components plus an updated `App.jsx`).
- `design-reference/` holds the Stitch HTML and screenshot.
- Run: `cd static/dashboard && npm install && npm run dev`, then open the local URL with `#amendment`.

Status: not yet run. Uses mock data, and "Approve and create tasks" is UI-only (no Jira issues are created).
