<!--
	@component RadioGroup
	@kind radio-group
	@layer components

	ColdLight RadioGroup — compound component root.
	Creates MeltUI radio group transport and sets root context.

	WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/radio/
-->
<script lang="ts">
import { createRadioGroupTransport } from "$lib/design/api/dsadapters/meltui/_internal/radio-group/index.js";
import { cn } from "$lib/design/utils/cn.js";
import { setRadioGroupContext } from "./context.js";
import { radioGroupRecipe } from "./recipe.js";
import type { RadioGroupProps } from "./types.js";

let {
	value,
	onValueChange,
	disabled = false,
	required = false,
	loop = true,
	orientation = "vertical",
	children,
	class: className,
	size,
	...rest
}: RadioGroupProps = $props();

const transport = createRadioGroupTransport({
	get value() {
		return value;
	},
	// biome-ignore lint/suspicious/noExplicitAny: callback value type from transport
	onValueChange: (v: any) => onValueChange?.(v),
	get disabled() {
		return disabled;
	},
	get required() {
		return required;
	},
	get loop() {
		return loop;
	},
	get orientation() {
		return orientation;
	},
});

setRadioGroupContext(transport);

const recipe = radioGroupRecipe();
</script>

<div
	{...transport.slots.root}
	class={cn(recipe.root, orientation === "horizontal" ? "flex-row" : "flex-col", className)}
	data-kind="radio-group"
	data-slot="root"
	data-orientation={orientation}
	{...rest}
>
	{@render children?.()}
</div>
