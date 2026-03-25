<!--
	@component Form
	@kind form
	@layer component
	@category structural
	@description Semantic form container managing validation state and submission for grouped form fields
	@container true
	@containerSlots root
	@compound false
	@blockCategory form
	@defaultStyle form-default
	@styleIds form-default
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
import { useForm } from "$lib/design/primitives/form/index.js";
import { StyleMacro } from "$lib/design/style/index.js";
import { cn } from "$lib/design/utils/cn.js";
import type { FormComponentProps } from "./types.js";

let {
	size = "md",
	label,
	disabled = false,
	pending = false,
	onSubmit,
	onReset,
	children,
	class: className,
	...rest
}: FormComponentProps = $props();

const form = $derived(useForm({ label, disabled, pending }));
const styleId = "form-default";
</script>

<StyleMacro kind="form" style={styleId}>
	<form
		{...form.root}
		data-kind="form"
		data-slot="root"
		class={cn("flex flex-col gap-6", className)}
		onsubmit={(e) => { e.preventDefault(); onSubmit?.(e); }}
		onreset={() => onReset?.()}
		{...rest}
	>
		{@render children?.()}
	</form>
</StyleMacro>
