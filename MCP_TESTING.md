# MCP Testing & Integration Guide

TrialDeck exposes its read-only clinical trial operations actions through Atlassian's managed **Rovo MCP Server** (`rovo:mcp`). This allows external MCP-compatible AI clients (e.g. Claude Desktop, Claude Code, Cursor) and internal Rovo Studio agents to call our operational tools.

---

## 🔒 Security & Admin Enablement

1. **Read-Only Exposure:** Only non-destructive, read-only tools are exposed over MCP (`list-deviations`, `find-cross-site-signals`, `trace-deviation`, `site-amendment-status`). No write tools are ever exposed.
2. **Organization Admin Enablement:**
   - In Atlassian Administration, go to **Settings** > **Connected Apps** (or **Rovo** > **MCP Servers**).
   - Under your site, find **TrialDeck Operations Tools**.
   - Ensure the tools are enabled for user access.

---

## 🔌 Connecting an MCP Client

Atlassian provides a standardized endpoint for Forge app MCP tools:
```
Endpoint URL: https://mcp.atlassian.com/forge/ari:cloud:ecosystem::app/9849cd64-8b47-4814-9199-4c4fd1985d15
```

### Example: Claude Desktop Configuration (`claude_desktop_config.json`)
```json
{
  "mcpServers": {
    "trialdeck": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-fetch",
        "https://mcp.atlassian.com/forge/ari:cloud:ecosystem::app/9849cd64-8b47-4814-9199-4c4fd1985d15"
      ],
      "env": {
        "ATLASSIAN_API_TOKEN": "<YOUR_ATLASSIAN_API_TOKEN>",
        "ATLASSIAN_USER_EMAIL": "<YOUR_EMAIL>"
      }
    }
  }
}
```

---

## 🧪 Exact Prompts to Verify

Once connected, run these 3 prompts in your MCP client:

### Test 1: Cross-Site Signal Analysis
> **Prompt:** *"Are there any repeat deviation clusters across our clinical trial sites?"*
- **Tool Called:** `find-cross-site-signals`
- **Verification:** Expect a response detailing the `SITE_CLUSTER` alert at Site 4 / Site 2 regarding patient visit windows.

### Test 2: Deviation Filtering
> **Prompt:** *"List all minor deviations logged for Site 4."*
- **Tool Called:** `list-deviations` with arguments `{"site": "Site 4", "category": "minor"}`
- **Verification:** Returns the list of matching deviations with summaries, dates, and statuses.

### Test 3: Operational Traceability
> **Prompt:** *"Trace deviation SAMPLE-101 (or CLIN-101). What is its linked CAPA and status?"*
- **Tool Called:** `trace-deviation` with argument `{"issueKey": "SAMPLE-101"}`
- **Verification:** Returns root cause, pseudonymized subject ID, linked CAPA summary, and overdue flag.
