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
		"background-color": "oklch(0.0901 0.017 224.61 / 0.8)",
		"border-radius": "0.75rem",
		"box-shadow": "0 0.0625rem 0.1875rem oklch(0 0 0 / 0.12), 0 0.0625rem 0.125rem oklch(0 0 0 / 0.24)",
		"color": "oklch(0.9319 0.015 224)",
		"border-color": "oklch(0.4234 0.081 173.37 / 0.22)",
		"border-width": "0.0625rem"
}
-->
<script lang="ts">
import { StyleMacro } from "$lib/design/styles/index.js";
import { cn } from "$lib/design/utils/cn.js";
import type { SkipLinkComponentProps } from "./types.js";

let {
	href = "#main-content",
	label = "Skip to main content",
	children,
	intent = "default",
	class: className,
	...rest
}: SkipLinkComponentProps = $props();

</script>

<StyleMacro kind="skip-link" intent={intent}>
	<a
		{href}
		data-kind="skip-link"
		data-slot="root"
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
</StyleMacro>
