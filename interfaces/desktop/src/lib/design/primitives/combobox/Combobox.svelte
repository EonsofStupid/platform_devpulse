<!--
	@component Combobox
	@description Structural shell for combobox primitive.
	Contract: kind="combobox", slot="root", ariaStateProvider="meltui"
-->
<script lang="ts">
	import type { ComboboxProps } from "./types.js";
	import { setComboboxContext } from "./context.js";

	let { open = $bindable(false), value = $bindable(""), children }: ComboboxProps = $props();

	setComboboxContext({
		get open() {
			return open;
		},
		get value() {
			return value;
		},
	});
</script>

{@render children?.()}
