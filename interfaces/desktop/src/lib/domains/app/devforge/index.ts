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

// ── Types ───────────────────────────────────────────────────
export type { DevforgeBootstrapStatus, RehConfig, RehStatus } from "./util/devforge.types.js";
