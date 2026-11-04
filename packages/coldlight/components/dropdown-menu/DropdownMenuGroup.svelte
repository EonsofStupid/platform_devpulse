<!--
	@component DropdownMenuGroup
	@kind dropdown-menu
	@slot group
	@layer components

	Groups related menu items with optional label.
	ARIA: role="group".
-->
<script lang="ts">
import { dropdownMenuAnatomy } from "#coldlight/behaviors/navigation/dropdown-menu/index.js";
import { mergeProps } from "#coldlight/utils/merge-props.js";
import { getDropdownMenuContext } from "./context.js";
import type { DropdownMenuGroupProps } from "./types.js";

let { children, label, ...rest }: DropdownMenuGroupProps = $props();

const ctx = getDropdownMenuContext();
const attrs = $derived(
	mergeProps(ctx.hook.getGroup(label ?? ""), dropdownMenuAnatomy.attrs.group, rest),
);
</script>

<div {...attrs} aria-label={label}>
	{@render children?.()}
</div>
