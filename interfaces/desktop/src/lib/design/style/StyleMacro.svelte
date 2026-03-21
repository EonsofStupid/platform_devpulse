<!--
	@component StyleMacro
	@package @devpulse/coldlight
	@layer style

	THE visual resolution component for ColdLight.

	Resolution order (later wins):
	  1. platformBase.globalTokens ($state, VPB can update)
	  2. compiledBase[kind] (build-time colocated visual defaults)
	  3. localOverrides (per-instance prop)

	Output:
	  - CSS custom properties via style attribute (--cl-*)
	  - SVG filter classes on wrapper
	  - data-encoding for VPB persistence
	  - data-macro-id for theme identification
	  - data-macro-kind for component type

	Performance:
	  - ONE $derived.by per macro instance
	  - Standard for loop over pre-computed keys
	  - Zero object spreading
	  - Browser CSS engine handles cascade to children
-->
<script lang="ts">
import type { Snippet } from "svelte";
import { platformBase } from "./base-state.svelte.js";
import { propMappings, macroKeys, type StyleMacroProps } from "./macro-mappings.js";

// Compiled base is imported statically — generated at build time
// TODO: Generate this from colocated *.visual.ts files
// For now, empty object — kind defaults come from recipes until build step exists
let compiledBase: Record<string, Partial<StyleMacroProps>> = {};

try {
	// Dynamic import for the compiled base — graceful fallback if not yet generated
	// @ts-ignore — file may not exist yet
	const mod = import.meta.glob("./compiled-base.ts", { eager: true });
	const paths = Object.keys(mod);
	if (paths.length > 0) {
		compiledBase = (mod[paths[0]] as { compiledBase: Record<string, Partial<StyleMacroProps>> }).compiledBase;
	}
} catch {
	// Compiled base not yet generated — use empty defaults
}

interface StyleMacroProps_Component {
	/** Component kind — reads defaults from compiledBase[kind]. */
	kind?: string;
	/** Per-instance visual overrides. Highest priority. */
	localOverrides?: Partial<StyleMacroProps>;
	/** Override the active style ID for this subtree. */
	localStyleId?: string;
	/** Content to wrap. */
	children: Snippet;
	/** Additional CSS class on the wrapper. */
	class?: string;
}

let {
	kind,
	localOverrides,
	localStyleId,
	children,
	class: className,
}: StyleMacroProps_Component = $props();

// Cache the active ID — only updates if local or global ID changes
let activeId = $derived(localStyleId ?? platformBase.activeStyleId);

// The resolution engine — ONE $derived.by per macro instance
let resolved = $derived.by(() => {
	let cssString = "";
	let filterClasses = "";
	let encodingParts = "";

	// Alias to local variables — minimize property lookups in the loop
	const baseTokens = platformBase.globalTokens;
	const kindDefaults = kind ? (compiledBase[kind] ?? {}) : {};
	const local = localOverrides ?? {};

	for (let i = 0; i < macroKeys.length; i++) {
		const key = macroKeys[i];

		// Resolution order: local → kind → global
		const value = local[key] ?? kindDefaults[key] ?? baseTokens[key];

		if (value) {
			const mapping = propMappings[key];

			// CSS custom property
			cssString += `${mapping.varName}: var(--${mapping.category}-${activeId}-${value}); `;

			// SVG filter class
			if (mapping.svgFilter) {
				filterClasses += `filter-${mapping.category}-${value} `;
			}

			// Encoding for VPB persistence
			if (mapping.encodingCode) {
				encodingParts += `${mapping.encodingCode}-${value} `;
			}
		}
	}

	return {
		css: cssString.trimEnd(),
		filters: filterClasses.trimEnd(),
		encoding: encodingParts.trimEnd(),
	};
});
</script>

<div
	data-macro-id={activeId}
	data-macro-kind={kind}
	data-encoding={resolved.encoding || undefined}
	class={[resolved.filters, className].filter(Boolean).join(" ") || undefined}
	style={resolved.css || undefined}
>
	{@render children()}
</div>
