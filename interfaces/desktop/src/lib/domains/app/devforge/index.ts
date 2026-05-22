/**
 * @module @devpulse/domains/app/devforge
 *
 * Public API for the DevForge domain. IDE integration, REH lifecycle,
 * recent projects, window management.
 */

// ── State ───────────────────────────────────────────────────
export { devforgeState } from "./data-access/devforge.state.svelte.js";

// ── Services ────────────────────────────────────────────────
export {
	addProject,
	closeDevforgeWindow,
	getDevforgeStatus,
	listRecentProjects,
	openDevforgeWindow,
	removeProject,
} from "./data-access/devforge.svc.js";

// ── Feature ─────────────────────────────────────────────────
export { default as DevForgeDashboard } from "./feature/dashboard/DevForgeDashboard.svelte";

// ── Types ───────────────────────────────────────────────────
export type { DevforgeBootstrapStatus, RehStatus } from "./util/devforge.types.js";
