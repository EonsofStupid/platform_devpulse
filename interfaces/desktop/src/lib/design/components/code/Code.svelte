<!--
	@component Code
	@kind code
	@layer components

	ColdLight Code — builder-driven, 8-axis visual system.
-->
<script lang="ts">
import { createCode } from "$lib/design/api/dsadapters/coldlight/_internal/code/index.js";
import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
import CodeRoot from "$lib/design/primitives/code/Code.svelte";
import { cn } from "$lib/design/primitives/types.js";
import { codeRecipe } from "./recipe.js";
import type { CodeProps } from "./types.js";

let {
	inline = true,
	language,
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
	children,
	class: className,
	...rest
}: CodeProps = $props();

const builder = createCode();

const visual = useColdLight(() => ({
	preset: preset ?? (inline ? "code-inline" : "code-block"),
	surface,
	material,
	depth,
	bevel,
	glow,
	frame,
	motion,
	transition,
	encoding,
	radius: radius ?? (inline ? "sm" : "md"),
}));

const classes = $derived(cn(codeRecipe({ inline }), visual.segments, visual.radius, className));
</script>

<CodeRoot {...builder.root} {...rest} class={classes} data-encoding={visual.encoding || undefined}>
	{@render children?.()}
</CodeRoot>
