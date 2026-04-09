<!--
	@component Banner
	@kind banner
	@layer component
	@category feedback
	@description Full-width notification strip for site-wide announcements or system status
	@container true
	@containerSlots content
	@compound true
	@blockCategory feedback
	@defaultStyle banner-default
	@styleIds banner-default, banner-stark, banner-glass, banner-flat, banner-matte, banner-info, banner-success, banner-warning, banner-error
	@requiredAxes backgroundColor, color, border
	@slots root:all, icon:none, content:none, action:none, dismiss:none
	@defaults {
		"background-color": "oklch(0.0901 0.017 224.61 / 0.8)",
		"border-radius": "0.75rem",
		"box-shadow": "0 0.0625rem 0.1875rem oklch(0 0 0 / 0.12), 0 0.0625rem 0.125rem oklch(0 0 0 / 0.24)",
		"color": "oklch(0.9319 0.015 224)",
		"border-color": "oklch(0.4234 0.081 173.37 / 0.22)",
		"border-width": "0.0625rem"
}
-->
<script lang="ts">
import { untrack } from "svelte";
import { slide } from "svelte/transition";
import { useBanner } from "$lib/design/behaviors/display/banner/index.js";
import { cssVarString, renderForge } from "$lib/design/renderforge/index.js";
import { cn } from "$lib/design/utils/cn.js";
import type { BannerProps } from "./types.js";

const POSITION_CLASSES: Record<string, string> = {
	top: "fixed top-0 inset-x-0 z-sticky",
	bottom: "fixed bottom-0 inset-x-0 z-sticky",
};

let {
	ids,
	open: controlledOpen,
	defaultOpen,
	onOpenChange,
	onExitComplete,
	position = "top",
	disabled = false,
	dir = "ltr",
	dismissible = true,
	preset = "default",
	children,
	dismiss,
	class: className,
	...rest
}: BannerProps = $props();

// --- Behavior (from hook) ---
const banner = $derived(useBanner({ disabled }));

// --- Visual ---

// --- State ---
let internalOpen = $state(untrack(() => defaultOpen ?? true));
const isOpen = $derived(controlledOpen !== undefined ? controlledOpen : internalOpen);

function handleDismiss(_e: MouseEvent) {
	if (disabled) return;
	internalOpen = false;
	onOpenChange?.({ open: false });
}

const m = $derived(renderForge({ kind: "banner", preset }));
</script>

{#if isOpen}
	<div
		id={ids?.root}
		{...banner.root}
		{dir}
		{...m.dataAttrs}
		data-slot="root"
		data-state={isOpen ? "open" : "closed"}
		style={cssVarString(m.cssVars)}
		class={cn(
			POSITION_CLASSES[position] ?? POSITION_CLASSES.top,
			disabled ? "pointer-events-none opacity-60" : undefined,
			className)}
		transition:slide={{ duration: 200 }}
		onoutroend={onExitComplete}
		{...rest}
	>
		<div class="flex w-full items-center gap-12">
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
						{...banner.dismiss}
						data-kind="banner"
						data-slot="dismiss"
						class={cn("shrink-0 cursor-pointer")}
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
