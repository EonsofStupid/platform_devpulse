<!--
	@component Form
	@kind form
	@layer components

	Form container. Hook (ARIA) + StyleMacro (visual).
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
