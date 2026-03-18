<!--
	@component Select
	@kind select
	@layer components

	ColdLight Select — compound component root.
	Creates MeltUI select transport and sets root context.
	Renderless root — children are the trigger and content.

	MeltUI transport adapter provides ARIA.
	ColdLight adds data-kind, data-slot, data-state.

	WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/listbox/
-->
<script lang="ts">
import { createSelectTransport } from "$lib/design/api/dsadapters/meltui/_internal/select/index.js";
import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
import { cn } from "$lib/design/primitives/types.js";
import { setSelectContext } from "./context.js";
import type { SelectProps } from "./types.js";

let {
	value,
	onValueChange,
	open,
	onOpenChange,
	placeholder,
	children,
	class: className,
	// ColdLight 8-axis props
	preset,
	surface,
	material,
	depth,
	bevel,
	glow,
	frame,
	motion,
	transition,
	encoding,
	radius,
	size,
	...rest
}: SelectProps = $props();

const transport = createSelectTransport({
	get value() {
		return value;
	},
	// biome-ignore lint/suspicious/noExplicitAny: callback value type from transport
	onValueChange: (v: any) => onValueChange?.(v),
	get open() {
		return open;
	},
	// biome-ignore lint/suspicious/noExplicitAny: callback value type from transport
	onOpenChange: (v: any) => onOpenChange?.(v),
});

setSelectContext(transport);

const visual = useColdLight(() => ({
	preset,
	surface,
	material,
	depth,
	bevel,
	glow,
	frame,
	motion,
	transition,
	encoding,
	radius,
	size,
}));
</script>

<div
	data-kind="select"
	data-slot="root"
	class={cn(visual.segments, visual.radius, className)}
	data-encoding={visual.encoding || undefined}
	{...rest}
>
	{@render children?.()}
</div>
