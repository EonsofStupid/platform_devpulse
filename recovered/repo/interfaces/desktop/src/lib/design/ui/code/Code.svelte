<!--
	@component CodeUI
	@kind code
	@layer ui

	Styled ColdLight Code — COMPONENT + RECIPE = visual output.
	Wraps components/code (ARIA) + applies recipe + ColdLight encoding.
	This is the PUBLIC API. Users import from ui/code/.

	Usage:
	  <Code inline>const x = 1</Code>
	  <Code inline={false} language="typescript" surface="glass-deep" />
-->
<script lang="ts">
	import type { CodeUIProps } from "./types.js";
	import Code from "$lib/design/components/code/Code.svelte";
	import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
	import { codeRecipe } from "$lib/design/components/code/recipe.js";
	import { cn } from "$lib/design/primitives/types.js";

	let {
		// Kind-specific props (forwarded)
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
	}: CodeUIProps = $props();

	// Resolve ColdLight visual: inline/block preset → individual props → encoding
	const visual = useColdLight(
		() => ({
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
			size,
		}),
	);

	// Compose: structural recipe + ColdLight visual + user classes
	const classes = $derived(
		cn(codeRecipe({ inline }), visual.segments, visual.radius, className),
	);
</script>

<Code {inline} {language} {...rest} class={classes} data-encoding={visual.encoding || undefined}>
	{@render children?.()}
</Code>
