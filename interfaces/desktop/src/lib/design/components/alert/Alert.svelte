<!--
	@component Alert (Root)
	@kind alert
	@layer components

	Inline contextual feedback — role="alert", lives in document flow.
	NOT a dialog. Dismissible with controlled/uncontrolled open state.
-->
<script lang="ts">
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

const recipeClasses = $derived(recipe?.classes?.({} as any) ?? {});

setAlertContext({
	get ids() { return ids ?? {}; },
	get dir() { return dir; },
});

const rootClasses = $derived(
	cn(className));
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
		class={rootClasses}
		{...rest}
	>
		{@render children?.()}
		{#if dismissible}
			<button
				type="button"
				data-kind="alert"
				data-slot="dismiss"
				class={cn("shrink-0 cursor-pointer")}
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
