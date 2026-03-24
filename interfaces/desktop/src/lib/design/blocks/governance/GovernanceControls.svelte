<!--
	@component Governance Controls
	@kind governance-controls
	@layer block
	@category interactive
	@description Control panel with labeled sliders for AI governance parameters
	@container false
	@compound true
	@blockCategory data
	@defaultStyle card-default
	@styleIds card-default
	@requiredAxes backgroundColor, border, borderRadius, shadow
	@slots root:all
-->
<script lang="ts">
import Card from "$lib/design/components/card/Card.svelte";
import Heading from "$lib/design/components/heading/Heading.svelte";
import Slider from "$lib/design/components/slider/Slider.svelte";
import Label from "$lib/design/components/label/Label.svelte";
import { cn } from "$lib/design/utils/cn.js";
import type { GovernanceControlsProps } from "./types.js";

let {
	title = "GOVERNANCE CONTROLS",
	sliders,
	onSliderChange,
	class: className,
}: GovernanceControlsProps = $props();
</script>

<Card variant="default" class={cn("flex flex-col gap-4 p-4", className)}>
	<Heading level={4} size="xs" class="uppercase tracking-widest text-[var(--text-muted)]">
		{title}
	</Heading>

	{#each sliders as slider (slider.id)}
		<div class="flex flex-col gap-1">
			<Label>{slider.label}</Label>
			<Slider
				value={slider.value}
				min={slider.min ?? 0}
				max={slider.max ?? 100}
				step={slider.step ?? 1}
				onValueChange={(v) => onSliderChange?.(slider.id, v)}
			/>
		</div>
	{/each}
</Card>
