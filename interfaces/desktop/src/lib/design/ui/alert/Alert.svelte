<!--
	@component AlertUI
	@kind alert
	@layer ui

	Styled ColdLight Alert — COMPONENT + RECIPE = visual output.
	Wraps components/alert (ARIA) + applies recipe + ColdLight encoding.
	This is the PUBLIC API. Users import from ui/alert/.

	Usage:
	  <Alert intent="info" />
	  <Alert intent="error" closable />
	  <Alert preset="panel-glass" surface="glass-void" />
-->
<script lang="ts">
	import type { AlertUIProps } from "./types.js";
	import { ALERT_INTENT_PRESETS } from "./types.js";
	import Alert from "$lib/design/components/alert/Alert.svelte";
	import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
	import { alertRecipe } from "$lib/design/components/alert/recipe.js";
	import { cn } from "$lib/design/primitives/types.js";

	let {
		// Visual props (ui/ layer only)
		intent = "info",
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
		// Component props (forwarded)
		children,
		class: className,
		...rest
	}: AlertUIProps = $props();

	// Resolve ColdLight visual: intent → preset → individual props → encoding
	const visual = useColdLight(
		() => ({
			preset: preset ?? ALERT_INTENT_PRESETS[intent as keyof typeof ALERT_INTENT_PRESETS],
			surface: surface ?? "glass-void",
			material,
			depth: depth ?? "z1",
			bevel,
			glow,
			frame: frame ?? "soft",
			motion,
			transition,
			encoding,
			radius: radius ?? "lg",
		}),
	);

	// Compose: structural recipe + ColdLight visual + user classes
	const classes = $derived(
		cn(alertRecipe(), visual.segments, visual.radius, className),
	);
</script>

<Alert {...rest} class={classes} data-encoding={visual.encoding || undefined}>
	{@render children?.()}
</Alert>
