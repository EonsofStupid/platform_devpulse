<!--
	@component StyleMacro
	@package @devpulse/coldlight

	THE visual resolution component for ColdLight.

	11-axis visual system (each = 1 real DTCG $type):
	  backgroundColor, backgroundBlur, shadow, border, animation, transition,
	  typography, gradient, color, borderRadius, opacity

	Resolution: local → kind → global. ONE $derived.by per instance.
	Output: --cl-* CSS custom properties + data-encoding for VPB.

	For composite types (shadow, border, transition, typography, gradient):
	  StyleMacro assembles the CSS shorthand from expanded DTCG sub-values.
	  Sets BOTH the assembled shorthand AND individual sub-vars.
	  Glue CSS consumes the assembled shorthand.
	  VPB controls individual sub-values.
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

// Style token map — built at SD5 build time from DTCG token groups.
// Maps style ID → axis → resolved CSS value.
// e.g. compiledStyles["button-primary"].backgroundColor → "var(--color-teal-600)"
let compiledStyles: Record<string, Partial<StyleMacroProps>> = {};

interface Props {
	/** Component kind — for VPB identification. */
	kind?: string;
	/** Style ID — references a DTCG token group (e.g. "button-primary"). */
	style?: string;
	/** Per-instance axis overrides. Highest priority. */
	localOverrides?: Partial<StyleMacroProps>;
	/** Content to wrap. */
	children: Snippet;
	/** Additional CSS class on the wrapper (structural layout only). */
	class?: string;
}

let {
	kind,
	style: styleId,
	localOverrides,
	children,
	class: className,
}: Props = $props();

let resolved = $derived.by(() => {
	let cssString = "";
	let encoding = "";

	const globalDefaults = platformBase.globalTokens;
	const styleDefaults = styleId ? (compiledStyles[styleId] ?? {}) : {};
	const local = localOverrides ?? {};

	for (let i = 0; i < macroKeys.length; i++) {
		const key = macroKeys[i];
		const value = local[key] ?? styleDefaults[key] ?? globalDefaults[key];

		if (value) {
			const mapping = propMappings[key];
			// Simple axes: set --cl-{name}: {value}
			// The value IS the resolved CSS value (e.g. "var(--color-teal-600)")
			cssString += `${mapping.varName}: ${value}; `;
		}
	}

	// 11-axis encoding for VPB persistence
	for (let i = 0; i < visualAxisKeys.length; i++) {
		const key = visualAxisKeys[i];
		const value = local[key] ?? styleDefaults[key] ?? globalDefaults[key];
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
	data-macro-id={styleId}
	data-macro-kind={kind}
	data-encoding={resolved.encoding || undefined}
	class={className || undefined}
	style={resolved.css || undefined}
>
	{@render children()}
</div>
