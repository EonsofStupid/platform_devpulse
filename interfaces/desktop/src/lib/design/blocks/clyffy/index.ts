/**
 * @file Clyffy Blocks Barrel
 * @description Pre-composed Clyffy persona surfaces — the mascot avatar
 * and the knowledge-drop nudge. Both compose ColdLight primitives only;
 * neither hand-rolls markup or CSS.
 *
 * Drives the locked product requirement #7 (model_loader_requirements.md):
 * "First page = Clyffy knowledge-drop overlay surface · passive nudges
 * on mouseover of technical links / actions." Every feature that wants
 * Clyffy to appear consumes these blocks rather than reimplementing the
 * surface.
 */

export { default as ClyffyKnowledgeNudge } from "./ClyffyKnowledgeNudge.svelte";
export {
	type ClyffyMascotPose,
	type ClyffyMascotSize,
	default as ClyffyMascot,
} from "./ClyffyMascot.svelte";
