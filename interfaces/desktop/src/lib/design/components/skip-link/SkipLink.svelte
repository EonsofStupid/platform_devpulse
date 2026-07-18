<!--
	@component Skip Link
	@kind skip-link
	@layer component
	@category navigation
	@description Visually hidden link that becomes visible on focus for keyboard users to skip to main content
	@aria https://www.w3.org/WAI/ARIA/apg/patterns/link/
	@container false
	@compound false
	@blockCategory navigation
	@defaultStyle skip-link-default
	@styleIds skip-link-default
	@requiredAxes backgroundColor, color, typography
	@slots root:all
	@defaults {
		"background-color": "var(--surface-base)",
		"border-radius": "0.75rem",
		"box-shadow": "0 0.0625rem 0.1875rem oklch(0 0 0 / 0.12), 0 0.0625rem 0.125rem oklch(0 0 0 / 0.24)",
		"color": "var(--text-primary)",
		"border-color": "var(--border-subtle)",
		"border-width": "0.0625rem"
}
-->
<script lang="ts">
import { skipLinkAnatomy } from "$lib/design/behaviors/navigation/skip-link/index.js";
import { cssVarString, renderForge } from "$lib/design/renderforge/index.js";
import { cn } from "$lib/design/utils/cn.js";
import type { SkipLinkComponentProps } from "./types.js";

let {
	href = "#main-content",
	label = "Skip to main content",
	children,
	preset = "default",
	class: className,
	...rest
}: SkipLinkComponentProps = $props();
const m = $derived(renderForge({ kind: "skip-link", preset }));
</script>

<a
		{...skipLinkAnatomy.attrs.root}
		{href}
		{...m.dataAttrs}
		style={cssVarString(m.cssVars)}
		class={cn(
			"sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999]",
			"focus:px-4 focus:py-2 focus:rounded focus:font-medium focus:text-sm",
			className)}
		{...rest}
	>
		{#if children}
			{@render children()}
		{:else}
			{label}
		{/if}
	</a>
