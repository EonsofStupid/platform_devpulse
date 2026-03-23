<!--
	@component Textarea
	@kind textarea
	@layer components

	ColdLight Textarea — builder-driven, 8-axis visual system.
-->
<script lang="ts">
import { createTextarea } from "$lib/design/api/dsadapters/coldlight/_internal/textarea/index.js";
import TextareaRoot from "$lib/design/primitives/textarea/Textarea.svelte";
import { cn } from "$lib/design/utils/cn.js";
import { textareaRecipe } from "./recipe.js";
import type { TextareaProps } from "./types.js";

let {
	size = "md",
	disabled = false,
	readonly: readOnly = false,
	required = false,
	invalid = false,
	rows,
	onValueChange,
	class: className,
	...rest
}: TextareaProps = $props();

const builder = createTextarea({
	disabled: () => disabled,
	readonly: () => readOnly,
	required: () => required,
	invalid: () => invalid,
	rows: () => rows,
		onValueChange: (v: any) => onValueChange?.(v),
});

const classes = $derived(cn(textareaRecipe({ size }), className));
</script>

<TextareaRoot {...builder.root} {...rest} class={classes} />
