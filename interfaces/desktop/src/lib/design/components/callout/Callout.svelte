<!--
	@component Callout
	@kind callout
	@layer components

	Highlighted information block. Variant-driven.
	StyleMacro (visual). No complex ARIA needed — just a div with data attrs.
-->
<script lang="ts">
import { StyleMacro } from "$lib/design/style/index.js";
import { cn } from "$lib/design/utils/cn.js";
import type { CalloutProps, CalloutVariant } from "./types.js";

const VARIANT_PRESETS: Record<CalloutVariant, string> = {
	info: "callout-info",
	success: "callout-success",
	warning: "callout-warning",
	error: "callout-error",
	tip: "callout-default",
};

let {
	variant = "info",
	children,
	class: className,
	...rest
}: CalloutProps = $props();

const styleId = $derived(VARIANT_PRESETS[variant] ?? "callout-default");
</script>

<StyleMacro kind="callout" style={styleId}>
	<div
		data-kind="callout"
		data-slot="root"
		data-variant={variant}
		class={cn(className)}
		{...rest}
	>
		{@render children?.()}
	</div>
</StyleMacro>
