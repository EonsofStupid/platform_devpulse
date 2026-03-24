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
