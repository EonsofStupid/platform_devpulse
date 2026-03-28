<!--
  @component Checkbox
  @kind checkbox
  @layer primitive
  @category interactive
  @description Tri-state checkbox: checked, unchecked, indeterminate. ARIA APG compliant.
  @element button
  @slots root, indicator, label
  @spec checkbox.spec.ts
  @hook useCheckbox
-->
<script lang="ts">
import { useCheckbox } from "$lib/design/behaviors/checkbox/use-checkbox.svelte.js";
import { cn } from "$lib/design/utils/cn.js";
import { enforceSlot } from "$lib/design/schema/enforce.js";
import { checkboxSpec } from "./checkbox.spec.js";
import type { CheckboxRootProps } from "./types.js";

let {
	children,
	indicator,
	label,
	class: className,
	// Behavior props
	checked,
	onCheckedChange,
	indeterminate,
	onIndeterminateChange,
	disabled,
	required,
	"aria-label": ariaLabel,
	"aria-labelledby": ariaLabelledby,
	"aria-describedby": ariaDescribedby,
	// Rest goes to root DOM
	...rest
}: CheckboxRootProps = $props();

const hook = useCheckbox({
	get checked() { return checked; },
	get onCheckedChange() { return onCheckedChange; },
	get indeterminate() { return indeterminate; },
	get onIndeterminateChange() { return onIndeterminateChange; },
	get disabled() { return disabled ?? undefined; },
	get required() { return required ?? undefined; },
	get "aria-label"() { return ariaLabel ?? undefined; },
	get "aria-labelledby"() { return ariaLabelledby ?? undefined; },
	get "aria-describedby"() { return ariaDescribedby ?? undefined; },
});

let rootEl: HTMLButtonElement | undefined = $state();

$effect(() => {
	if (import.meta.env.DEV && rootEl) {
		enforceSlot(rootEl, checkboxSpec, "root");
	}
});
</script>

<button
	bind:this={rootEl}
	{...hook.root}
	{...rest}
	class={cn(className)}
>
	<span {...hook.indicator}>
		{@render indicator?.()}
	</span>
	{@render children?.()}
</button>

{#if label}
	<label {...hook.label}>
		{@render label()}
	</label>
{/if}
