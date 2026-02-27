<!--
	@component NeuGauge
	@file design/svg/surfaces/NeuGauge.svelte
	@layer svg
	@package @devpulse/coldlight

	Neumorphic circular gauge surface. Renders a circle SVG blank with
	bevel + noise filters for dashboard gauge widgets.

	@example
	<NeuGauge size={200} bevel="medium">
		<GaugeContent value={75} />
	</NeuGauge>
-->
<script lang="ts">
	import type { Snippet } from "svelte";
	import SvgBlank from "../blanks/SvgBlank.svelte";

	type BevelLevel = "soft" | "medium" | "strong";

	interface Props {
		/** Gauge diameter in px */
		size?: number;
		/** Bevel strength */
		bevel?: BevelLevel;
		/** Whether to apply grain texture */
		noise?: boolean;
		/** Fill color */
		fill?: string;
		/** Additional CSS classes */
		class?: string;
		/** Content */
		children?: Snippet;
	}

	let {
		size = 200,
		bevel = "medium",
		noise = true,
		fill = "oklch(0.10 0.01 250 / 0.90)",
		class: className = "",
		children,
	}: Props = $props();

	const filters = $derived.by(() => {
		const list: string[] = [`bevel-${bevel}`];
		if (noise) list.push("noise-subtle");
		return list;
	});
</script>

<SvgBlank
	shape="circle"
	width={size}
	height={size}
	radius={0}
	{filters}
	{fill}
	class="neu-gauge {className}"
>
	{@render children?.()}
</SvgBlank>
