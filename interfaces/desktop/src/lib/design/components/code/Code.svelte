<!--
	@component Code
	@kind code
	@layer components

	ColdLight Code — builder-driven, 8-axis visual system.
	Builder provides data attributes. useColdLight() resolves visual props.
	Block mode wraps <code> in <pre>. Inline mode renders bare <code>.
-->
<script lang="ts">
	import type { CodeComponentProps } from "./types.js";
	import { createCode } from "$lib/design/api/adapters/coldlight/_internal/code/index.js";
	import CodeRoot from "$lib/design/primitives/code/Code.svelte";
	import { cn } from "$lib/design/primitives/types.js";
	import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
	import { codeRecipe } from "./recipe.js";

	let {
		// Kind-specific props
		inline = true,
		language,
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
		// Rest spread
		...rest
	}: CodeComponentProps = $props();

	const builder = createCode();

	const visual = useColdLight(
		() => ({
			preset: preset ?? (inline ? "code-inline" : "code-block"),
			surface, material, depth, bevel, glow, frame, motion, transition,
			encoding, radius: radius ?? (inline ? "sm" : "md"), size,
		}),
	);

	const classes = $derived(
		cn(codeRecipe({ inline }), visual.segments, visual.radius, className),
	);
</script>

{#if inline}
	<CodeRoot
		{...builder.root}
		{...rest}
		class={classes}
		data-encoding={visual.encoding || undefined}
		data-language={language || undefined}
	>
		{@render children?.()}
	</CodeRoot>
{:else}
	<pre class={classes} data-encoding={visual.encoding || undefined}><CodeRoot
		{...builder.root}
		{...rest}
		data-language={language || undefined}
	>{@render children?.()}</CodeRoot></pre>
{/if}
