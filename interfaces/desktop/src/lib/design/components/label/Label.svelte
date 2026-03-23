<!--
	@component Label
	@kind label
	@layer components

	Accessible form label. Hook (ARIA) + StyleMacro (visual).
	Associates with form control via htmlFor.
-->
<script lang="ts">
import { useLabel } from "$lib/design/primitives/label/use-label.svelte.js";
import { StyleMacro } from "$lib/design/style/index.js";
import { cn } from "$lib/design/utils/cn.js";
import type { LabelProps, LabelSize } from "./types.js";

const SIZE: Record<LabelSize, string> = {
	sm: "text-xs",
	md: "text-sm",
	lg: "text-base",
};

let {
	size = "md",
	htmlFor,
	disabled = false,
	required = false,
	children,
	class: className,
	...rest
}: LabelProps = $props();

const label = $derived(useLabel({ htmlFor, disabled }));
const styleId = "label-default";
</script>

<StyleMacro kind="label" style={styleId}>
	<label
		{...label.root}
		for={htmlFor}
		data-kind="label"
		data-slot="root"
		data-disabled={disabled || undefined}
		class={cn(
			"font-medium",
			disabled && "opacity-60 pointer-events-none",
			SIZE[size] ?? SIZE.md,
			className)}
		{...rest}
	>
		{@render children?.()}
		{#if required}<span aria-hidden="true" class="text-red-500 ml-0.5">*</span>{/if}
	</label>
</StyleMacro>
