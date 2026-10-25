/**
 * @file ColdLight composite traits — the app-shell golden patterns.
 * @package @devpulse/coldlight
 *
 * A *composite trait* is a complete zone surface assembled from semantic roles
 * (../semantic) and resolved through ColdLight's renderForge — RenderForge is
 * ColdLight's resolver, not a second path. The golden values live in the DTCG
 * preset family
 * (scripts/build/styledictionary/tokens/src/presets/shell.tokens.json) as
 * `shell-<zone>`; SD5 compiles them to `--preset-shell-<zone>-*` and
 * `derive-kind-families.mjs` grants the `data-cl-*` families. This module is
 * the typed entry point the app shell imports: `shellTrait(zone)` returns the
 * resolved macro to spread onto the zone element. Layout stays Tailwind; only
 * the surface visual comes from here — there are no `<style>` blocks or inline
 * `var()` in the shell.
 */

import { type ResolvedMacro, renderForge } from "$lib/design/renderforge/index.js";
import type { EdgeRole, SurfaceRole } from "../semantic/index.js";

/** The golden surface + edge a shell zone wears — typed intent. */
interface ZoneTrait {
	readonly surface: SurfaceRole;
	readonly edge?: EdgeRole;
}

/**
 * Which golden role each shell zone wears. This is the reviewable contract the
 * curator checks `tokens/src/presets/shell.tokens.json` against; the token file
 * is the source that paints. Its keys are the zones that currently have a
 * composite trait.
 */
export const SHELL_TRAIT = {
	topbar: { surface: "overlay", edge: "soft" },
	statusbar: { surface: "overlay", edge: "soft" },
} as const satisfies Record<string, ZoneTrait>;

/** A shell zone with a composite trait. */
export type ShellZone = keyof typeof SHELL_TRAIT;

/**
 * Resolve a shell zone's composite trait. The zone wears preset `shell-<zone>`
 * under `data-kind="shell"`; families come from the preset (PRESET_FAMILIES),
 * so the shell needs no registered kind. Spread `.dataAttrs` onto the element
 * and serialize `.cssVars` with `cssVarString` for the `style` attribute.
 */
export function shellTrait(zone: ShellZone): ResolvedMacro {
	return renderForge({ kind: "shell", preset: `shell-${zone}` });
}
