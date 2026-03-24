<!--
	@component Callout
	@kind callout
	@layer component
	@category feedback
	@description Highlighted block drawing attention to supplementary or important information
	@container true
	@containerSlots content
	@compound true
	@blockCategory feedback
	@defaultStyle callout-default
	@styleIds callout-default, callout-info, callout-success, callout-warning, callout-error
	@requiredAxes backgroundColor, border, borderRadius, color
	@slots root:all, icon:none, content:none
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
