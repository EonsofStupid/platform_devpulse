<!--
	@component CapabilityHeader
	@kind sys.rro.ui
	@layer domain-ui
	@description Panel header with icon, title, subtitle. Dumb.
-->
<script lang="ts">
import type { Snippet } from "svelte";
import { Text } from "$lib/design/components/text/index.js";

interface Props {
	title: string;
	subtitle?: string;
	icon?: Snippet;
	actions?: Snippet;
}

let { title, subtitle, icon, actions }: Props = $props();
</script>

<div class="flex items-center justify-between gap-2">
	<div class="flex items-center gap-2 min-w-0">
		{#if icon}
			{@render icon()}
		{/if}
		<div class="min-w-0">
			<Text size="sm" weight="semibold">{title}</Text>
			{#if subtitle}
				<Text size="xs" preset="flat">{subtitle}</Text>
			{/if}
		</div>
	</div>
	{#if actions}
		{@render actions()}
	{/if}
</div>
