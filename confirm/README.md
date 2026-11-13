# Confirm

Amendment Execution Hub with the "Create 12 Jira tasks?" confirmation dialog.

- `static/dashboard/src/components/` goes into the app's `static/dashboard/src/components/`.
- Mount it with `import ExecutionHub from './components/ExecutionHub.jsx'` and render it inside `<Shell>`
  (for example when `window.location.hash === '#confirm'`).
- `design-reference/` holds the Stitch HTML and screenshot.

Status: not yet run. Uses mock data. "Create tasks" is UI-only (no Jira issues are created until a resolver exists).
