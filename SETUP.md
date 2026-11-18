# Judge Quick Setup Guide (5 Minutes)

Welcome to **TrialDeck: Clinical Trial Operations Hub**! This guide allows judges to install and explore the full live functionality on any standard Jira site or Jira Cloud demo instance.

---

## ⚡ Zero Configuration: Instant Synthetic Mode

If you install the app on a fresh Jira project with zero setup, **TrialDeck automatically detects the lack of tickets and displays an interactive, read-only Synthetic Sample Mode**.
- You can immediately explore all charts, KPI indicators, site breakdown tables, and repeat issue pattern detection insights.
- The top banner will indicate: `Sample Data Mode — Showing 12 realistic clinical trial deviations across 6 sites`.
- You can toggle between sample mode and the empty state at any time.

---

## 🛠️ Step 1: Create the "Protocol Deviation" Work Type

To see live Jira search, issue creation, and Rovo agent functionality:
1. In Jira, go to **Project Settings** > **Issue Types** (or **Work Types**).
2. Click **Add Issue Type** (or **Create Work Type**):
   - **Name:** `Protocol Deviation`
   - **Type:** Standard Issue Type

---

## 🏷️ Step 2: Configure Custom Fields (Optional or for Full Features)

In your project's field layout (or global Custom Fields), create the following custom fields. **Field names are completely case-insensitive** (e.g., `site` or `Site` both work seamlessly):

| Field Name | Type | Suggested Allowed Values / Options | Description |
| :--- | :--- | :--- | :--- |
| **Site** | Dropdown / Select List | `Site 1`, `Site 2`, `Site 3`, `Site 4`, `Site 5`, `Site 6` | Clinical trial site location |
| **Category** | Dropdown / Select List | `major`, `minor` (or `Major`, `Minor`) | Deviation severity |
| **Root cause** | Dropdown / Select List | `Scheduling`, `Temperature Excursion`, `Staff Error`, `Patient Adherence`, `Informed Consent` | Primary underlying cause |
| **Subject ID** | Short Text | *(Text format, e.g., SUBJ-401)* | Pseudonymized trial participant ID |
| **Protocol version** | Dropdown or Text | `v2.0`, `v2.1` | Active protocol version |
| **date detected** | Date Picker | *(Standard date format)* | Date deviation was discovered |
| **Report status** | Dropdown / Select List | `Open`, `Under Review`, `Approved` | CRA review and approval status |

> **Note:** If any custom fields are omitted, the app will gracefully degrade without crashing, highlighting missing fields in the setup advisor banner.

---

## 📥 Step 3: Import Sample Tickets via CSV (1 Minute)

A pre-packaged, validated CSV dataset is included in this repository at `sample-tickets.csv`:
1. In Jira, click the **Settings** (gear icon) > **System** > **External System Import** > **CSV**.
2. Upload [`sample-tickets.csv`](./sample-tickets.csv).
3. Select your target Jira Project.
4. In the field mapping step:
   - Map `Summary` -> `Summary`
   - Map `Description` -> `Description`
   - Map `Issue Type` -> `Issue Type`
   - Map `site` -> `Site`
   - Map `category` -> `Category`
   - Map `Root cause` -> `Root cause`
   - Map `Subject ID` -> `Subject ID`
   - Map `date detected` -> `date detected`
   - Map `Report status` -> `Report status`
   - Map `Protocol version` -> `Protocol version`
5. Click **Begin Import**. All 10 synthetic tickets will be imported with recent dates.

---

## 🚀 Step 4: Explore the Features

### 1. Trial Dashboard (Global Page)
- Navigate to **Apps** > **Trial Dashboard** (or access `jira:globalPage` via sidebar).
- Notice that the app auto-detects your active project.
- **KPIs & Trend:** View total open deviations, major severity breakdown, and 12-week trend line.
- **Sites with Repeat Issues:** Notice that **Site 4** and **Site 2** are flagged for clustering repeated scheduling and temperature excursion deviations.
- **Project Scope Selector:** Open **Settings** to switch between specific projects or view `All Detected Projects`.

### 2. Issue Panel (Jira Issue View)
- Open any imported `Protocol Deviation` ticket (e.g., from Site 4).
- Open the **Protocol Deviation** panel on the right sidebar.
- View severity tags, root cause analysis, site history, and recommended CRA action steps.

### 3. Rovo Agent: "Deviation Reporter"
- Open Atlassian Rovo chat or click the Rovo agent icon.
- Type: `Draft a report for deviation <ISSUE-KEY>` (e.g., `Draft a report for deviation PROJ-1`).
- The agent will:
  1. Call `get-deviation` to read the live Jira fields and comments.
  2. Call `find-similar-deviations` to search for similar historical issues at that site.
  3. Formulate a structured 5-part clinical trial report.
  4. Prompt you: *"Reply APPROVE to save this draft to the ticket."*
  5. Upon typing `APPROVE`, it saves the report formatted in rich Atlassian Document Format (ADF) as a comment and marks the Report status as Approved.
