<!--
	@component Alert
	@kind alert
	@layer components

	ColdLight Alert — builder-driven, 8-axis visual system.
-->
<script lang="ts">
	import type { AlertProps } from "./types.js";
	import { ALERT_INTENT_PRESETS } from "./types.js";
	import { createAlert } from "$lib/design/api/adapters/coldlight/_internal/alert/index.js";
	import AlertRoot from "$lib/design/primitives/alert/Alert.svelte";
	import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
	import { alertRecipe } from "./recipe.js";
	import { cn } from "$lib/design/primitives/types.js";

	let {
		intent = "info",
		closable = false,
		onClose,
		preset,
		surface, material, depth, bevel, glow, frame, motion, transition,
		encoding, radius,
		children,
		class: className,
		...rest
	}: AlertProps = $props();

	const builder = createAlert({
		visible: true,
		onVisibleChange: (v: boolean) => { if (!v) onClose?.(); },
	});

	const visual = useColdLight(
		() => ({
			preset: preset ?? ALERT_INTENT_PRESETS[intent as keyof typeof ALERT_INTENT_PRESETS],
			surface: surface ?? "glass-void",
			material, depth: depth ?? "z1", bevel, glow,
			frame: frame ?? "soft", motion, transition,
			encoding, radius: radius ?? "lg",
		}),
	);

	const classes = $derived(
		cn(alertRecipe(), visual.segments, visual.radius, className),
	);
</script>

<AlertRoot {...builder.root} {...rest} class={classes} data-encoding={visual.encoding || undefined}>
	{@render children?.()}
</AlertRoot>
