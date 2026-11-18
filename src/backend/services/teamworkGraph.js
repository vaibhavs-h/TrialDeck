import api from '@forge/api';

/**
 * Atlassian Teamwork Graph Consumer Service
 * Consumes contextual data from the Atlassian Teamwork Graph API (GraphQL)
 * when available and authorized, with seamless fallback to Jira/Confluence APIs.
 */

const TEAMWORK_GRAPH_QUERY = `
  query getIssueContext($issueId: ID!) {
    jira {
      issue(id: $issueId) {
        id
        key
        summary
        linkedWorkItems {
          edges {
            node {
              id
              key
              summary
            }
          }
        }
      }
    }
  }
`;

/**
 * Fetches cross-product context from the Atlassian Teamwork Graph.
 * If Teamwork Graph is not enabled or scopes are not granted, returns null gracefully.
 */
export async function fetchTeamworkGraphContext(issueKey) {
  if (!issueKey) return null;

  try {
    const userApi = api.asUser();
    if (typeof userApi.requestTeamworkGraph !== 'function') {
      return null;
    }

    const response = await userApi.requestTeamworkGraph(TEAMWORK_GRAPH_QUERY, {
      issueId: issueKey,
    });

    if (response && response.data && !response.errors) {
      const issueNode = response.data?.jira?.issue;
      const linked = issueNode?.linkedWorkItems?.edges?.map(e => e.node) || [];
      return {
        source: 'Atlassian Teamwork Graph API',
        available: true,
        issueKey: issueNode?.key || issueKey,
        summary: issueNode?.summary,
        linkedItems: linked,
      };
    }
    return null;
  } catch (error) {
    // Graceful degradation when Teamwork Graph is unavailable or lacks admin consent
    return null;
  }
}
