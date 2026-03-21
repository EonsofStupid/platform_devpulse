<!--
	@component StyleMacro
	@package @devpulse/coldlight

	THE visual resolution component for ColdLight.

	6-axis visual system:
	  backgroundColor, backgroundBlur, shadow, border, animation, transition

	Resolution: local → kind → global. ONE $derived.by per instance.
	Output: CSS custom properties + data attributes for VPB.
-->
<script lang="ts">
import type { Snippet } from "svelte";
import { platformBase } from "./base-state.svelte.js";
import {
	propMappings,
	macroKeys,
	visualAxisKeys,
	type StyleMacroProps,
} from "./macro-mappings.js";

// Compiled base — generated at build from DTCG composite tokens
// Graceful fallback when not yet generated
let compiledBase: Record<string, Partial<StyleMacroProps>> = {};

interface Props {
	/** Component kind — reads defaults from compiledBase[kind]. */
	kind?: string;
	/** Style ID — references a DTCG composite token directly. */
	style?: string;
	/** Per-instance visual overrides. Highest priority. */
	localOverrides?: Partial<StyleMacroProps>;
	/** Override the active style ID for this subtree. */
	localStyleId?: string;
	/** Content to wrap. */
	children: Snippet;
	/** Additional CSS class on the wrapper (structural layout only). */
	class?: string;
}

let {
	kind,
	style: styleRef,
	localOverrides,
	localStyleId,
	children,
	class: className,
}: Props = $props();

let activeId = $derived(localStyleId ?? platformBase.activeStyleId);

let resolved = $derived.by(() => {
	let cssString = "";
	let encoding = "";

	const baseTokens = platformBase.globalTokens;
	const kindDefaults = kind ? (compiledBase[kind] ?? {}) : {};
	const local = localOverrides ?? {};

	for (let i = 0; i < macroKeys.length; i++) {
		const key = macroKeys[i];
		const value = local[key] ?? kindDefaults[key] ?? baseTokens[key];

		if (value) {
			const mapping = propMappings[key];
			cssString += `${mapping.varName}: var(--${mapping.category}-${activeId}-${value}); `;
		}
	}

	// 6-axis encoding for VPB persistence
	for (let i = 0; i < visualAxisKeys.length; i++) {
		const key = visualAxisKeys[i];
		const value = local[key] ?? kindDefaults[key] ?? baseTokens[key];
		if (value) {
			encoding += `${key}:${value} `;
		}
	}

	return {
		css: cssString.trimEnd(),
		encoding: encoding.trimEnd(),
	};
});
</script>

<div
	data-macro-id={activeId}
	data-macro-kind={kind}
	data-macro-style={styleRef}
	data-encoding={resolved.encoding || undefined}
	class={className || undefined}
	style={resolved.css || undefined}
>
	{@render children()}
</div>
