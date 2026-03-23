<!--
	@component StyleMacro
	@package @devpulse/coldlight

	Visual resolution provider.
	Reads component def from catalog.
	Constructs --cl-* CSS vars from expanded DTCG style tokens.
	Glue CSS on [data-kind] consumes --cl-* → browser paints.
-->
<script lang="ts">
import type { Snippet } from "svelte";
// StyleMacro resolves style IDs to DTCG token CSS vars directly.
// No catalog dependency. Style ID + axis name → var() reference.

interface Props {
	kind: string;
	style?: string;
	children: Snippet;
	class?: string;
}

let {
	kind,
	style: styleId,
	children,
	class: className,
}: Props = $props();

let resolved = $derived.by(() => {
	const id = styleId;
	if (!id) return { css: "", encoding: "" };

	const p = `--style-${id}`;
	const parts: string[] = [];

	// Simple axes
	parts.push(`--cl-bg: var(${p}-background-color, transparent)`);
	parts.push(`--cl-blur: var(${p}-background-blur, 0)`);
	parts.push(`--cl-animation: var(${p}-animation, none)`);
	parts.push(`--cl-color: var(${p}-color, inherit)`);
	parts.push(`--cl-radius: var(${p}-border-radius, 0)`);
	parts.push(`--cl-opacity: var(${p}-opacity, 1)`);

	// Border (assembled from expanded)
	parts.push(`--cl-border: var(${p}-border-width, 0) var(${p}-border-style, none) var(${p}-border-color, transparent)`);

	// Transition (assembled from expanded)
	parts.push(`--cl-transition: all var(${p}-transition-duration, 0ms) var(${p}-transition-timing-function, ease) var(${p}-transition-delay, 0ms)`);

	// Shadow (layer 1, fallback to single)
	parts.push(`--cl-shadow: var(${p}-shadow-1-offset-x, var(${p}-shadow-offset-x, 0)) var(${p}-shadow-1-offset-y, var(${p}-shadow-offset-y, 0)) var(${p}-shadow-1-blur, var(${p}-shadow-blur, 0)) var(${p}-shadow-1-spread, var(${p}-shadow-spread, 0)) var(${p}-shadow-1-color, var(${p}-shadow-color, transparent))`);

	// Typography (individual props)
	parts.push(`--cl-font-family: var(${p}-typography-font-family, inherit)`);
	parts.push(`--cl-font-size: var(${p}-typography-font-size, inherit)`);
	parts.push(`--cl-font-weight: var(${p}-typography-font-weight, inherit)`);
	parts.push(`--cl-letter-spacing: var(${p}-typography-letter-spacing, 0)`);
	parts.push(`--cl-line-height: var(${p}-typography-line-height, inherit)`);

	// Gradient
	parts.push(`--cl-gradient: var(${p}-gradient, none)`);

	return {
		css: parts.join("; "),
		encoding: id,
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
