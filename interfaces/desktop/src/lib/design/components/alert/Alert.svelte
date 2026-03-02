<!--
	@component Alert
	@kind alert
	@layer components

	ColdLight Alert — builder-driven, 8-axis visual system.
	Builder owns ARIA. useColdLight() resolves visual props.
-->
<script lang="ts">
	import type { AlertComponentProps } from "./types.js";
	import { createAlert } from "$lib/design/api/adapters/coldlight/_internal/alert/index.js";
	import AlertRoot from "$lib/design/primitives/alert/Alert.svelte";
	import { cn } from "$lib/design/primitives/types.js";
	import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
	import { alertRecipe } from "./recipe.js";

	let {
		intent = "info",
		closable = false,
		onClose,
		children,
		class: className,
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
		...rest
	}: AlertComponentProps = $props();

	const builder = createAlert({
		onVisibleChange: (visible) => {
			if (!visible) onClose?.();
		},
	});

	const visual = useColdLight(
		() => ({
			preset: preset ?? "panel-glass",
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

	const classes = $derived(
		cn(alertRecipe(), visual.segments, visual.radius, className),
	);
</script>

<AlertRoot
	{...builder.root}
	{...rest}
	class={classes}
	data-encoding={visual.encoding || undefined}
>
	{@render children?.()}
	{#if closable}
		<button
			{...builder.action}
			type="button"
			class="absolute top-2 right-2 inline-flex items-center justify-center rounded-sm p-1 opacity-70 hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current"
			aria-label="Close alert"
			data-slot="action"
		>
			<span aria-hidden="true">&times;</span>
		</button>
	{/if}
</AlertRoot>
