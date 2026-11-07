<!--
	@component HoverCard
	@description Structural shell for hover-card primitive.
	Contract: kind="hover-card", slot="root", ariaStateProvider="meltui"
-->
<script lang="ts">
import { setHoverCardContext } from "./context.js";
import type { HoverCardProps } from "./types.js";

let { open = $bindable(false), children }: HoverCardProps = $props();

setHoverCardContext({
	get open() {
		return open;
	},
});
</script>

{@render children?.()}
