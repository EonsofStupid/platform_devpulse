<!--
	@component Banner
	@kind banner
	@layer components

	ColdLight Banner — sticky/fixed layout container for site-wide
	announcements, marketing CTAs, cookie consent, and persistent notifications.

	API follows Ark UI / Zag conventions:
	  - Controlled (open) vs uncontrolled (defaultOpen)
	  - onOpenChange callback with details
	  - onExitComplete animation lifecycle
	  - ids for composition
	  - dir for RTL
	  - disabled state

	Token-backed utilities: z-sticky, gap-12, size-3xs, etc.
-->
<script lang="ts">
import { slide } from "svelte/transition";
import { cn } from "$lib/design/utils/cn.js";
import type { BannerProps } from "./types.js";

const POSITION_CLASSES: Record<string, string> = {
	top: "fixed top-0 inset-x-0 z-sticky",
	bottom: "fixed bottom-0 inset-x-0 z-sticky",
};

let {
	ids,
	open: controlledOpen,
	defaultOpen = true,
	onOpenChange,
	onExitComplete,
	position = "top",
	disabled = false,
	dir = "ltr",
	dismissible = true,
	children,
	dismiss,
	class: className,
	...rest
}: BannerProps = $props();

// Controlled vs uncontrolled state
let internalOpen = $state(defaultOpen);
const isOpen = $derived(controlledOpen !== undefined ? controlledOpen : internalOpen);

function handleDismiss(e: MouseEvent) {
	if (disabled) return;
	const next = false;
	internalOpen = next;
	onOpenChange?.({ open: next });
}

const rootClasses = $derived(
	cn(
		POSITION_CLASSES[position] ?? POSITION_CLASSES.top,
		disabled ? "pointer-events-none opacity-60" : undefined,
		className));
</script>

{#if isOpen}
	<div
		id={ids?.root}
		data-kind="banner"
		data-slot="root"
		data-state={isOpen ? "open" : "closed"}
		{dir}
		class={rootClasses}
		transition:slide={{ duration: 200 }}
		onoutroend={onExitComplete}
		{...rest}
	>
		<div class={cn("flex w-full items-center gap-12")}>
			<div class="flex min-w-0 flex-1 items-center gap-12">
				{@render children?.()}
			</div>
			{#if dismissible}
				{#if dismiss}
					{@render dismiss()}
				{:else}
					<button
						id={ids?.dismiss}
						type="button"
						data-kind="banner"
						data-slot="dismiss"
						class={cn("shrink-0 cursor-pointer")}
						aria-label="Close banner"
						{disabled}
						onclick={handleDismiss}
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
							class="size-3xs"
							aria-hidden="true"
						>
							<path d="M18 6 6 18" />
							<path d="m6 6 12 12" />
						</svg>
					</button>
				{/if}
			{/if}
		</div>
	</div>
{/if}
