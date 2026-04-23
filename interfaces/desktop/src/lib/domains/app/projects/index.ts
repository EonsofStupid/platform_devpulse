/**
 * @file Projects domain — public API.
 * @module @devpulse/domains/app/projects
 *
 * Other domains + routes MUST import from this barrel only. Reaching
 * into `data-access/` or `feature/` from outside the domain violates
 * the Nx library-type dependency rules (see CLAUDE.md §1.1.1).
 */

export {
	type Project,
	type ProjectReference,
	projectsState,
	type ReferenceKind,
} from "./data-access/projects.state.svelte.js";

export { default as ProjectReferences } from "./feature/ProjectReferences.svelte";
export { default as ProjectSwitcher } from "./feature/ProjectSwitcher.svelte";
