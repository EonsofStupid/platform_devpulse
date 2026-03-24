<!--
	@component Spinner
	@kind spinner
	@layer component
	@category content
	@description Animated circular indicator for indeterminate loading states
	@container false
	@compound false
	@blockCategory feedback
	@defaultStyle spinner-default
	@styleIds spinner-default
	@requiredAxes color, animation
	@slots root:all
-->
<script lang="ts">
import { useSpinner } from "$lib/design/primitives/spinner/index.js";
import { StyleMacro } from "$lib/design/style/index.js";
import { cn } from "$lib/design/utils/cn.js";
import type { SpinnerProps, SpinnerSize } from "./types.js";

const SIZE: Record<SpinnerSize, string> = {
	sm: "size-4",
	md: "size-6",
	lg: "size-8",
};

let {
	active = true,
	size = "md",
	class: className,
	...rest
}: SpinnerProps = $props();

const spinner = $derived(useSpinner({ active }));
const styleId = "spinner-default";
</script>

{#if active}
	<StyleMacro kind="spinner" style={styleId}>
		<div
			{...spinner.root}
			data-kind="spinner"
			data-slot="root"
			data-state={active ? "active" : "idle"}
			class={cn("inline-flex items-center justify-center animate-spin", SIZE[size] ?? SIZE.md, className)}
			{...rest}
		>
			<svg
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2.5"
				class="size-full"
				aria-hidden="true"
			>
				<circle cx="12" cy="12" r="10" stroke-opacity="0.25" />
				<path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round" />
			</svg>
		</div>
	</StyleMacro>
{/if}
