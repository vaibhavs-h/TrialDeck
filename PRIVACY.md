# Privacy Policy - Clinical Trial Operations Hub (TrialDeck)

_Last updated: November 2026_

TrialDeck is a Forge app for Jira and Confluence built for the Codegeist 2026 hackathon. It is a
prototype for coordinating and drafting clinical trial protocol deviation work.

## Where data lives
TrialDeck runs entirely on Atlassian Forge. Your data stays in your own Atlassian site. The app
does not operate its own servers or databases, and it does not send your data to any third-party
service.

## What the app accesses
When you install it, the app asks for standard permissions to:
- read Jira issues, users, and projects (`read:jira-work`, `read:jira-user`),
- create and update Jira issues and comments (`write:jira-work`),
- store app configuration and cached field mappings in Forge storage (`storage:app`),
- read Confluence protocol pages (`read:page:confluence`),
- create published deviation report pages in Confluence (`write:page:confluence`, `read:space:confluence`).

It uses these strictly to render the dashboard and issue panel, and to create tasks and reports you explicitly ask it to create.
It reads and writes only inside your Atlassian site, using the permissions of the person using it (`asUser`).

## What the app stores in Forge storage
The app stores only non-personal operational metadata in Atlassian Forge storage:
- `trialdeck:field_mapping:v1`: Cached Jira custom field IDs (15-minute TTL).
- `trialdeck:project_scope:v1`: User-selected active Jira project scope.
- `app_settings`: Configured alert thresholds (e.g., target threshold = 15).
- Internal operational graph records (linking amendment tasks to protocol versions).
No personal identifiers, patient records, or external credentials are ever stored.

## No real patient data
TrialDeck is intended for synthetic or pseudonymized data only (for example subject IDs such as
SUBJ-0042). Do not enter real patient names or identifiers.

## AI features
Where the app uses Atlassian Rovo agents, AI processing is handled by Atlassian under Atlassian's
own terms and privacy commitments. AI output is a draft for a person to review and approve.

## Changes and contact
We may update this policy as the app changes. Questions or concerns:
https://github.com/vaibhavs-h/TrialDeck/issues
