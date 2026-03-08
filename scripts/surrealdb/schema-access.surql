-- =============================================================================
-- ACCESS CONTROL: Users, roles, permissions
-- Run AFTER all schema files. Requires root authentication.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- GLOBAL NAMESPACE: Read-only for agents
-- VIEWER role = SELECT only, no INSERT/UPDATE/DELETE
-- -----------------------------------------------------------------------------

USE NS global;
DEFINE USER agent_reader ON NAMESPACE PASSWORD 'agent_readonly_2026' ROLES VIEWER;

-- -----------------------------------------------------------------------------
-- PROJECTS NAMESPACE: Per-agent write access
-- EDITOR role = full CRUD on data within namespace
-- Each agent gets its own user scoped to this namespace
-- -----------------------------------------------------------------------------

USE NS projects;
DEFINE USER claude ON NAMESPACE PASSWORD 'claude_projects_2026' ROLES EDITOR;
DEFINE USER cursor ON NAMESPACE PASSWORD 'cursor_projects_2026' ROLES EDITOR;
-- Add more agents as needed

-- -----------------------------------------------------------------------------
-- AGENTS NAMESPACE: Per-agent isolated write access
-- EDITOR role = full CRUD on data within namespace
-- Each agent can only access their own database
-- (enforced by signin: agent authenticates to their specific DB)
-- -----------------------------------------------------------------------------

USE NS agents;
DEFINE USER claude ON NAMESPACE PASSWORD 'claude_agent_2026' ROLES EDITOR;
DEFINE USER cursor ON NAMESPACE PASSWORD 'cursor_agent_2026' ROLES EDITOR;
-- Add more agents as needed

-- =============================================================================
-- NOTE: For now, Claude MCP connects as root for simplicity.
-- Once the schema is stable, switch MCP to namespace-level auth:
--
--   For reading global:
--     SIGNIN as agent_reader on NS global
--
--   For writing project data:
--     SIGNIN as claude on NS projects, USE DB devpulse
--
--   For writing agent data:
--     SIGNIN as claude on NS agents, USE DB claude
--
-- The MCP config will need multiple connections or a proxy layer
-- to handle cross-namespace operations.
-- =============================================================================
