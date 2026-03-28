<!--
  @component Button
  @kind button
  @layer primitive
  @category interactive
  @description Interactive button with ARIA APG compliance. Supports standard, toggle, and menu trigger modes.
  @element button
  @slots root
  @spec button.spec.ts
  @hook useButton
-->
<script lang="ts">
import { useButton } from "$lib/design/behaviors/button/use-button.svelte.js";
import { cn } from "$lib/design/utils/cn.js";
import { enforceSlot } from "$lib/design/schema/enforce.js";
import { buttonSpec } from "./button.spec.js";
import type { ButtonPrimitiveProps } from "./types.js";

let {
	children,
	class: className,
	// Behavior props
	disabled,
	loading,
	pressed,
	onPressedChange,
	expanded,
	type,
	// Rest goes to DOM
	...rest
}: ButtonPrimitiveProps = $props();

const hook = useButton({
	get disabled() { return disabled; },
	get loading() { return loading; },
	get pressed() { return pressed; },
	get onPressedChange() { return onPressedChange; },
	get expanded() { return expanded; },
	get type() { return type ?? undefined; },
});

let rootEl: HTMLButtonElement | undefined = $state();

$effect(() => {
	if (import.meta.env.DEV && rootEl) {
		enforceSlot(rootEl, buttonSpec, "root");
	}
});
</script>

<button
	bind:this={rootEl}
	{...hook.root}
	{...rest}
	class={cn(className)}
>
	{@render children?.()}
</button>
