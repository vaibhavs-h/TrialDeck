# TrialDeck Demo Video Script (4 Minutes 30 Seconds)

**Target Duration:** 4:30 | **Pacing:** Clear, professional, clinical-ops oriented.

---

## 📋 Pre-Recording Checklist
- [ ] Fresh or prepared Jira instance with TrialDeck installed.
- [ ] Project with `sample-tickets.csv` imported.
- [ ] Confluence protocol page with at least two versions (e.g. `Protocol v1.0` and `Protocol v2.1`).
- [ ] Browser zoom set to 110% or 125% for high readability.
- [ ] Clean browser window with no private tabs or unrelated bookmarks.

---

## 🎬 Scene-by-Scene Script

### Scene 1: The Problem (0:00 - 0:40)
* **Visual:** Brief shot of a messy spreadsheet with multiple tabs for different clinical trial sites, followed by cutting to Jira Cloud.
* **Narration:**  
  *"In clinical trials, protocol deviations like missed visit windows, drug temperature excursions, and consent errors represent severe regulatory and patient safety risks. Today, clinical research associates track these across disjointed spreadsheets. Systemic issues across trial sites are often discovered months too late during audits. This is TrialDeck—a clinical trial operations hub built on Atlassian Forge, Jira, Confluence, and Rovo."*

---

### Scene 2: Trial Dashboard & Pattern Engine (0:40 - 1:30)
* **Visual:** Open **Apps** > **Trial Dashboard**. Show KPIs, the 12-week incident trend chart, and highlight the amber **"Sites with repeat issues"** card.
* **Narration:**  
  *"From the Jira global page, TrialDeck immediately visualizes all active protocol deviations across our sites. Look at this insight: our real-time pattern detection engine automatically flags Site 4 and Site 2. Both sites have logged repeated visit window deviations in the last 30 days. Rather than waiting for a sponsor audit, clinical operations can immediately spot this systemic training gap."*

---

### Scene 3: Issue Panel & Regulatory Sign-Off (1:30 - 2:15)
* **Visual:** Click on deviation ticket `SAMPLE-101` (or `CLIN-101`). Show the Jira issue panel on the right sidebar. Highlight the **Regulatory Deviation Report** card.
* **Narration:**  
  *"Opening the deviation ticket reveals the TrialDeck UI Kit issue panel. It displays the trial site, protocol version, and pseudonymized participant ID. Below, you see our human-in-the-loop report card. Regulatory compliance requires that an investigator formally sign off on every report. If changes are needed, one click triggers revisions; once approved, a complete audit trail is permanently logged."*

---

### Scene 4: Agent 1 - Deviation Reporter (2:15 - 2:55)
* **Visual:** Open Rovo chat. Type: `Draft a report for deviation SAMPLE-101`. Show the structured output and type `APPROVE`.
* **Narration:**  
  *"Drafting regulatory deviation reports is time-consuming. Let's ask our first Rovo agent, Deviation Reporter. The agent calls get-deviation and find-similar-deviations to extract facts directly from Jira without hallucinating. It drafts a 5-part report citing exact ticket records. Notice our strict governance: nothing is written until we explicitly confirm. When we type APPROVE, it saves the report as a rich Atlassian Document Format comment and automatically publishes an audit-ready page in Confluence."*

---

### Scene 5: Agent 2 - Amendment Analyst (2:55 - 3:35)
* **Visual:** In Rovo chat, type: `Analyze protocol amendment between version 1 and 2`. Show the change list and task preview, then type `APPROVE`.
* **Narration:**  
  *"Next, meet Amendment Analyst. When study sponsors release a protocol amendment, coordinators have to manually comb through 100-page documents. Our agent diffs the Confluence versions, categorizes changes into eligibility, schedule windows, and safety, and previews the rollout tasks for each site. When we type APPROVE, it creates the rollout tasks in Jira across all investigator sites, batching them safely to prevent timeouts and duplicates."*

---

### Scene 6: Agent 3 - Trial Insights & MCP Server (3:35 - 4:15)
* **Visual:** In Rovo chat, ask: `What cross-site signals or patterns are detected?`. Then switch to Claude Desktop or terminal running an MCP tool call to show `find-cross-site-signals`.
* **Narration:**  
  *"Our third agent, Trial Insights, delivers real-time operational intelligence, answering questions about cross-site signals and CAPA overdue dates. Furthermore, TrialDeck implements the Model Context Protocol via rovo:mcp. Any MCP-compatible external client, like Claude Desktop or Cursor, can call our read-only clinical operations tools directly using Atlassian's managed MCP endpoint."*

---

### Scene 7: Closing & Prize Callouts (4:15 - 4:30)
* **Visual:** Return to the Trial Dashboard with all metrics loaded.
* **Narration:**  
  *"With 3 specialized Rovo agents, an open MCP server, and Atlassian Teamwork Graph context, TrialDeck turns Atlassian Cloud into an intelligent, audit-ready clinical trial command center. Thank you!"*
