# Deviation (design reference)

Stitch HTML and screenshot for the Jira issue panel shown on a protocol deviation.

The richer UI Kit panel built from this design is `frontend/panel/DeviationPanel.jsx`. It is not
wired in yet: `frontend/panel/index.jsx` (the hello-world panel that Forge actually loads) does not
import it. To switch, make `index.jsx` render the DeviationPanel code.

Status: not yet run. Custom field IDs are placeholders and the `draftReport` resolver does not exist yet.
