<!--
	@component Contextual Help
	@kind contextual-help
	@layer component
	@category composite
	@description Inline help trigger that reveals explanatory content in a popover or tooltip
	@container true
	@containerSlots content
	@compound true
	@blockCategory content
	@defaultStyle contextual-help-default
	@styleIds contextual-help-default
	@requiredAxes backgroundColor, border, borderRadius, shadow, typography, color
	@slots root:all, trigger:none, content:none
	@defaults {
		"background-color": "var(--surface-base)",
		"border-radius": "0.75rem",
		"box-shadow": "0 0.0625rem 0.1875rem oklch(0 0 0 / 0.12), 0 0.0625rem 0.125rem oklch(0 0 0 / 0.24)",
		"color": "var(--text-primary)",
		"border-color": "var(--border-subtle)",
		"border-width": "0.0625rem"
}
-->
<script lang="ts">
import { createIds } from "$lib/design/behaviors/_internal/utils/uid.js";
import { cssVarString, renderForge } from "$lib/design/renderforge/index.js";
import { cn } from "$lib/design/utils/cn.js";
import { setContextualHelpContext } from "./context.js";
import type { ContextualHelpRootProps } from "./types.js";

let {
	ids: userIds,
	variant = "help",
	size = "xs",
	isOpen: controlledOpen,
	defaultOpen = false,
	onOpenChange,
	placement = "bottom start",
	shouldFlip = true,
	offset = 8,
	dir = "ltr",
	preset = "default",
	children,
	class: className,
	...rest
}: ContextualHelpRootProps = $props();

const autoIds = createIds("contextual-help", ["root", "trigger", "popover", "heading"] as const);
const resolvedIds = $derived({
	root: userIds?.root ?? autoIds.root,
	trigger: userIds?.trigger ?? autoIds.trigger,
	popover: userIds?.popover ?? autoIds.popover,
	heading: userIds?.heading ?? autoIds.heading,
});

let internalOpen = $state(false);

$effect(() => {
	if (controlledOpen !== undefined) {
		internalOpen = controlledOpen;
	} else if (!internalOpen && defaultOpen) {
		internalOpen = defaultOpen;
	}
});

const isOpen = $derived(controlledOpen !== undefined ? controlledOpen : internalOpen);

function toggle() {
	const next = !isOpen;
	internalOpen = next;
	onOpenChange?.({ open: next });
}

setContextualHelpContext({
	get isOpen() {
		return isOpen;
	},
	get ids() {
		return resolvedIds;
	},
	get dir() {
		return dir;
	},
	toggle,
});

const SIZE_CLASSES: Record<string, string> = {
	xs: "size-[var(--size-2xs)]",
	sm: "size-[var(--size-xs)]",
};

const m = $derived(renderForge({ kind: "contextual-help", preset }));
</script>

<div
	id={resolvedIds.root}
	{dir}
	{...m.dataAttrs}
	data-slot="root"
	data-variant={variant}
	style={cssVarString(m.cssVars)}
	class={cn("relative inline-flex", className)}
	{...rest}
>
	<button
		type="button"
		id={resolvedIds.trigger}
		aria-expanded={isOpen}
		aria-controls={resolvedIds.popover}
		aria-label={variant === "help" ? "Help" : "Information"}
		data-kind="contextual-help"
		data-slot="trigger"
		data-state={isOpen ? "open" : "closed"}
		class={cn(
			SIZE_CLASSES[size] ?? SIZE_CLASSES.xs,
			"inline-flex items-center justify-center rounded-full",
			"text-text-secondary hover:text-text-primary",
			"transition-colors")}
		onclick={toggle}
	>
		{#if variant === "info"}
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-3xs" aria-hidden="true">
				<circle cx="12" cy="12" r="10" />
				<path d="M12 16v-4" />
				<path d="M12 8h.01" />
			</svg>
		{:else}
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-3xs" aria-hidden="true">
				<circle cx="12" cy="12" r="10" />
				<path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
				<path d="M12 17h.01" />
			</svg>
		{/if}
	</button>

	{#if isOpen}
		<div
			id={resolvedIds.popover}
			role="dialog"
			aria-labelledby={resolvedIds.heading}
			data-kind="contextual-help"
			data-slot="popover"
			data-state="open"
			data-placement={placement}
			class={cn()}
		>
			{@render children?.()}
		</div>
	{/if}
</div>
