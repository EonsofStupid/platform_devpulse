<!--
	@component HoverCard
	@description Structural shell for hover-card primitive.
	Contract: kind="hover-card", slot="root", ariaStateProvider="meltui"
-->
<script lang="ts">
	import type { HoverCardProps } from "./types.js";
	import { setHoverCardContext } from "./context.js";

	let { open = $bindable(false), children }: HoverCardProps = $props();

	setHoverCardContext({
		get open() {
			return open;
		},
	});
</script>

{@render children?.()}
