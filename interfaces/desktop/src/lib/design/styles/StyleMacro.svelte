<!--
	@component StyleMacro
	@package @devpulse/coldlight

	Visual resolution provider — the SOLE authority for element styling.

	Components pass `kind` + `intent`. StyleMacro resolves intent to a
	visual preset name, constructs --cl-* CSS vars from the DTCG preset
	tokens, and the glue CSS on [data-kind] paints the element.

	Intent → Visual Preset mapping (configurable per project):
	  primary   → glass
	  secondary → matte
	  ghost     → flat
	  danger    → stark
	  default   → default

	Pipeline:
	  Component: intent="primary"
	  → StyleMacro: resolves to "button-glass"
	  → reads --style-button-glass-* from SD5 output
	  → sets --cl-bg, --cl-shadow, etc. on wrapper div
	  → macro-base.css: [data-kind] { background-color: var(--cl-bg); ... }
	  → browser paints
-->
<script lang="ts">
import type { Snippet } from "svelte";

/**
 * Intent → visual preset mapping.
 * ONE map. Per-project configurable.
 * Components speak intent. Tokens speak visual. This translates.
 */
/**
 * Intent → visual preset mapping.
 * Semantic intents resolve to visual names.
 * Visual names pass through unchanged (they ARE the preset).
 */
const INTENT_MAP: Record<string, string> = {
	primary: "glass",
	secondary: "matte",
	ghost: "flat",
	danger: "stark",
	default: "default",
	// Visual names pass through — they ARE presets
	glass: "glass",
	matte: "matte",
	flat: "flat",
	stark: "stark",
};

interface Props {
	/** Component kind identifier (e.g., "button", "card", "widget") */
	kind: string;
	/** Semantic intent — resolved to visual preset via INTENT_MAP */
	intent?: string;
	/** Direct style ID override — bypasses intent resolution. Use for custom presets. */
	style?: string;
	children: Snippet;
	class?: string;
}

let {
	kind,
	intent = "default",
	style: styleOverride,
	children,
	class: className,
}: Props = $props();

let resolved = $derived.by(() => {
	// Style override takes precedence (for custom/domain-specific presets)
	// Otherwise resolve intent → visual preset name
	const visual = styleOverride ?? `${kind}-${INTENT_MAP[intent] ?? INTENT_MAP.default}`;
	const p = `--style-${visual}`;
	const parts: string[] = [];

	// Direct mapping — each --cl-* reads the --style-* var directly.
	// No assembly. No expanded sub-properties. The preset value IS the final value.
	parts.push(`--cl-bg: var(${p}-background-color, transparent)`);
	parts.push(`--cl-blur: var(${p}-backdrop-filter, 0)`);
	parts.push(`--cl-shadow: var(${p}-box-shadow, none)`);
	parts.push(`--cl-border: var(${p}-border-width, 0) solid var(${p}-border-color, transparent)`);
	parts.push(`--cl-animation: var(${p}-animation, none)`);
	parts.push(`--cl-transition: all var(${p}-transition-duration, 150ms) var(${p}-transition-timing-function, ease-out)`);
	parts.push(`--cl-color: var(${p}-color, inherit)`);
	parts.push(`--cl-radius: var(${p}-border-radius, 0)`);
	parts.push(`--cl-opacity: var(${p}-opacity, 1)`);
	parts.push(`--cl-gradient: var(${p}-gradient, none)`);
	parts.push(`--cl-font-family: var(${p}-font-family, inherit)`);
	parts.push(`--cl-font-size: var(${p}-font-size, inherit)`);
	parts.push(`--cl-font-weight: var(${p}-font-weight, inherit)`);
	parts.push(`--cl-letter-spacing: var(${p}-letter-spacing, 0)`);
	parts.push(`--cl-line-height: var(${p}-line-height, inherit)`);

	return {
		css: parts.join("; "),
		styleId: visual,
	};
});
</script>

<div
	data-kind={kind}
	data-style={resolved.styleId || undefined}
	class={className || undefined}
	style={resolved.css || undefined}
>
	{@render children()}
</div>
