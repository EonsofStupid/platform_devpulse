<!--
	@component Alert
	@kind alert
	@layer component
	@category feedback
	@description Inline message conveying important contextual information with severity level
	@aria https://www.w3.org/WAI/ARIA/apg/patterns/alert/
	@container true
	@containerSlots content
	@compound true
	@blockCategory feedback
	@defaultStyle alert-default
	@styleIds alert-default, alert-info, alert-success, alert-warning, alert-error
	@requiredAxes backgroundColor, border, borderRadius, color
	@slots root:all, icon:none, title:none, content:none, action:none
-->
<script lang="ts">
import { useAlert } from "$lib/design/primitives/alert/index.js";
import { StyleMacro } from "$lib/design/style/index.js";
import { cn } from "$lib/design/utils/cn.js";
import { setAlertContext } from "./context.js";
import { ALERT_VARIANT_PRESETS, type AlertRootProps } from "./types.js";

let {
	ids,
	variant = "info",
	open: controlledOpen,
	defaultOpen,
	onOpenChange,
	dismissible = false,
	dir = "ltr",
	children,
	class: className,
	...rest
}: AlertRootProps = $props();

// --- Behavior (from hook) ---
const alert = $derived(useAlert({ variant, dismissible }));

// --- Visual (variant → style ID → DTCG tokens) ---
const styleId = $derived(ALERT_VARIANT_PRESETS[variant] ?? "alert-default");

// --- State ---
let internalOpen = $state(defaultOpen ?? true);
const isOpen = $derived(controlledOpen !== undefined ? controlledOpen : internalOpen);

function handleDismiss() {
	internalOpen = false;
	onOpenChange?.({ open: false });
}

// --- Context for sub-components ---
setAlertContext({
	get ids() { return ids ?? {}; },
	get dir() { return dir; },
});
</script>

{#if isOpen}
	<StyleMacro kind="alert" style={styleId}>
		<div
			id={ids?.root}
			{...alert.root}
			{dir}
			data-kind="alert"
			data-slot="root"
			data-variant={variant}
			class={cn(className)}
			{...rest}
		>
			{@render children?.()}
			{#if dismissible}
				<button
					type="button"
					{...alert.dismiss}
					data-kind="alert"
					data-slot="dismiss"
					class={cn("shrink-0 cursor-pointer")}
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
	</StyleMacro>
{/if}
