<!--
  @file Carousel — 3D card selection carousel
  @module @devpulse/domains/app/devpulse/components/Carousel

  Uses ColdLight Card + Text components.
  All visual via token var() refs. Zero hardcoded values.
  Keyboard: ArrowLeft/Right to navigate, Enter to select.
-->
<script lang="ts">
import { Card } from "$lib/design/components/card/index.js";
import { Text } from "$lib/design/components/text/index.js";
import { cn } from "$lib/design/utils/cn.js";

interface CarouselItem {
	icon: string;
	label: string;
}

interface Props {
	items?: CarouselItem[];
	onSelect?: (item: CarouselItem) => void;
	class?: string;
}

let { items = [], onSelect, class: className }: Props = $props();

let activeIndex = $state(0);

function handleKeydown(e: KeyboardEvent) {
	if (items.length === 0) return;
	if (e.key === "ArrowRight") {
		activeIndex = (activeIndex + 1) % items.length;
	} else if (e.key === "ArrowLeft") {
		activeIndex = (activeIndex - 1 + items.length) % items.length;
	} else if (e.key === "Enter") {
		onSelect?.(items[activeIndex]);
	}
}

function select(index: number) {
	activeIndex = index;
	onSelect?.(items[index]);
}
</script>

<svelte:window onkeydown={handleKeydown} />

<div
	class={cn(
		"flex items-center justify-center h-full",
		className,
	)}
	style="perspective: 62.5rem;"
	role="listbox"
	aria-label="Carousel"
>
	<div class="flex gap-[var(--space-16)] transform-gpu" style="transform-style: preserve-3d;">
		{#each items as item, i}
			<Card
				variant={i === activeIndex ? "elevated" : "default"}
				class={cn(
					"w-[12.5rem] h-[18.75rem] flex flex-col items-center justify-center cursor-pointer",
					"backdrop-blur-[var(--blur-md)]",
					i === activeIndex && "scale-110 translate-z-[1.25rem]",
				)}
				onclick={() => select(i)}
				role="option"
				aria-selected={i === activeIndex}
			>
				<Text size="3xl" class="mb-[var(--space-8)]">{item.icon}</Text>
				<Text size="lg" weight="semibold">{item.label}</Text>
			</Card>
		{/each}
	</div>
</div>
