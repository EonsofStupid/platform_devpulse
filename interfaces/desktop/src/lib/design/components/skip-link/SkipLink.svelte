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
-->
<script lang="ts">
import { StyleMacro } from "$lib/design/style/index.js";
import { cn } from "$lib/design/utils/cn.js";
import type { SkipLinkComponentProps } from "./types.js";

let {
	href = "#main-content",
	label = "Skip to main content",
	children,
	class: className,
	...rest
}: SkipLinkComponentProps = $props();

const styleId = "skip-link-default";
</script>

<StyleMacro kind="skip-link" style={styleId}>
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
