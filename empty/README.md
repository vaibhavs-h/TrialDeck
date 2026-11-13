# Empty

Zero-state of the Deviations dashboard, shown when no Protocol Deviation issues exist yet.

- `static/dashboard/src/components/` goes into the app's `static/dashboard/src/components/`.
- Mount it with `import EmptyDeviations from './components/EmptyDeviations.jsx'` and render it inside `<Shell>`
  when the deviation list is empty. Pass `onCreate`, `onImport`, `onLearnMore`, `onConfigure` handlers.
- `design-reference/` holds the Stitch HTML and screenshot.

Status: not yet run. Static copy only; the buttons need handlers.
