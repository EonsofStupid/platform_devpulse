<!--
	@file PlannedDevtool
	@domain devtools/_shared

	The page of a devtool that is planned and not built yet — its folder's
	`_devtool.status` is `planned`. The shell shows the route's own name,
	line, icon and accent (plan 0008); the body says it is planned (copy).
-->
<script lang="ts">
import { EmptyState } from "@devpulse/coldlight/components/empty-state";
import { Text } from "@devpulse/coldlight/components/text";
import { copyState } from "$lib/sys/copy/index.js";
import ServiceDevtoolShell from "./ServiceDevtoolShell.svelte";

const text = $derived(copyState.catalog?.devtools);
</script>

<ServiceDevtoolShell health={{ state: "unknown", label: text?.planned ?? "" }}>
	{#snippet status()}
		<EmptyState>
			<div class="flex flex-col items-center gap-[var(--space-2)] text-center">
				<Text size="sm" weight="semibold">{text?.planned}</Text>
				<Text size="xs" color="muted">{text?.planned_body}</Text>
			</div>
		</EmptyState>
	{/snippet}
</ServiceDevtoolShell>
