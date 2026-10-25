<script lang="ts">
import type { AccentToken, RadiusToken } from "$lib/design/tokens/types.js";
import * as Panel from "./index.js";

import "$lib/design/recipes/components/panel/index.js";
import "$lib/design/blueprints/components/panel/index.js";

interface Props {
	padding?: "none" | "sm" | "md" | "lg";
	recipe?: string;
	accent?: AccentToken;
	radius?: RadiusToken;
	showHeader?: boolean;
	showFooter?: boolean;
	rootClass?: string;
}

let {
	padding,
	recipe,
	accent,
	radius,
	showHeader = true,
	showFooter = true,
	rootClass,
}: Props = $props();
</script>

<Panel.Root {padding} {recipe} {accent} {radius} class={rootClass}>
	{#if showHeader}
		<Panel.Header>Dashboard</Panel.Header>
	{/if}
	<Panel.Body>
		<p>Panel content goes here</p>
	</Panel.Body>
	{#if showFooter}
		<Panel.Footer>
			<button>Save</button>
		</Panel.Footer>
	{/if}
</Panel.Root>
