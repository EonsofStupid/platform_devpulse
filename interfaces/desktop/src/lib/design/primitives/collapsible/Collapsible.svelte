<!--
	@component Collapsible
	@description Root context provider for collapsible. No DOM element.
	Contract: kind="collapsible", slot="root"
-->
<script lang="ts">
import { setCollapsibleContext } from "./context.js";
import type { CollapsibleProps } from "./types.js";

let { open = $bindable(false), disabled = false, children }: CollapsibleProps = $props();

setCollapsibleContext({
	get open() {
		return open;
	},
	get disabled() {
		return disabled;
	},
});
</script>

{@render children?.()}
