<!--
	@component Button
	@kind button
	@layer component
	@category interactive
	@description Clickable control that triggers an action or submits a form
	@aria https://www.w3.org/WAI/ARIA/apg/patterns/button/
	@container false
	@compound false
	@blockCategory form
	@defaultStyle button-default
	@styleIds button-default, button-primary, button-secondary, button-ghost, button-destructive, button-outline
	@requiredAxes backgroundColor, color, borderRadius, border, shadow, typography
	@slots root:all, icon:none, label:none
-->
<script lang="ts">
import { useButton } from "$lib/design/primitives/button/index.js";
import { StyleMacro } from "$lib/design/style/index.js";
import { cn } from "$lib/design/utils/cn.js";
import type { ButtonProps, ButtonSize } from "./button.types.js";

const SIZE: Record<ButtonSize, string> = {
	sm: "h-8 px-3 text-sm gap-1.5",
	md: "h-10 px-4 text-sm gap-2",
	lg: "h-12 px-6 text-base gap-2.5",
};

let {
	intent = "primary",
	size = "md",
	disabled = false,
	loading = false,
	pressed,
	onPressedChange,
	expanded,
	type,
	children,
	class: className,
	...rest
}: ButtonProps = $props();

const button = $derived(useButton({ disabled, loading, pressed, onPressedChange, expanded, type }));
const styleId = $derived(`button-${intent}`);
</script>

<StyleMacro kind="button" style={styleId}>
	<button
		{...button.root}
		{...rest}
		class={cn(
			"inline-flex items-center justify-center font-medium cursor-pointer select-none",
			"focus-visible:outline-2 focus-visible:outline-offset-2",
			"disabled:pointer-events-none disabled:opacity-50",
			SIZE[size] ?? SIZE.md,
			className)}
	>
		{@render children?.()}
	</button>
</StyleMacro>
