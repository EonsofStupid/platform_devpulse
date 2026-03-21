<!--
	@component Alert (Root)
	@kind alert
	@layer components

	Inline contextual feedback — role="alert", lives in document flow.
	NOT a dialog. Dismissible with controlled/uncontrolled open state.
-->
<script lang="ts">
import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
import { getRecipe } from "$lib/design/recipes/index.js";
import { cn } from "$lib/design/utils/cn.js";
import { setAlertContext } from "./context.js";
import type { AlertRootProps } from "./types.js";
import { ALERT_VARIANT_PRESETS } from "./types.js";

let {
	ids,
	variant = "info",
	open: controlledOpen,
	defaultOpen = true,
	onOpenChange,
	dismissible = false,
	dir = "ltr",
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
	children,
	class: className,
	...rest
}: AlertRootProps = $props();

let internalOpen = $state(defaultOpen);
const isOpen = $derived(controlledOpen !== undefined ? controlledOpen : internalOpen);

function handleDismiss() {
	internalOpen = false;
	onOpenChange?.({ open: false });
}

const recipe = getRecipe("alert.glass.void");
// biome-ignore lint/suspicious/noExplicitAny: recipe classes accept resolved props
const recipeClasses = recipe?.classes?.({} as any) ?? {};

setAlertContext({
	get classes() { return recipeClasses; },
	get ids() { return ids ?? {}; },
	get dir() { return dir; },
});

const visual = useColdLight(() => ({
	preset: preset ?? ALERT_VARIANT_PRESETS[variant as keyof typeof ALERT_VARIANT_PRESETS],
	surface,
	material,
	depth,
	bevel,
	glow,
	frame,
	motion,
	transition,
	encoding,
	radius: radius ?? "lg",
}));

const rootClasses = $derived(
	cn(recipeClasses.root, visual.segments, visual.radius, className),
);
</script>

{#if isOpen}
	<div
		id={ids?.root}
		role="alert"
		aria-live="assertive"
		{dir}
		data-kind="alert"
		data-slot="root"
		data-variant={variant}
		data-encoding={visual.encoding || undefined}
		class={rootClasses}
		{...rest}
	>
		{@render children?.()}
		{#if dismissible}
			<button
				type="button"
				data-kind="alert"
				data-slot="dismiss"
				class={cn(recipeClasses.dismiss, "shrink-0 cursor-pointer")}
				aria-label="Dismiss alert"
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
	</div>
{/if}
