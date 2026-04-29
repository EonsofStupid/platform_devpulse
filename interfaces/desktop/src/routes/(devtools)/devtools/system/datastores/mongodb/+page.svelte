<!--
	@file /devtools/system/datastores/mongodb — MongoDB document store devtool
	@route /devtools/system/datastores/mongodb
	@window DevTools (Ctrl+Shift+Q)

	Document store for large documentation sets and images via GridFS.
	Not yet integrated — this page exists so the route slug is stable
	and the Planned section of the dashboard has somewhere to link.
-->
<script lang="ts">
import { FileText } from "lucide-svelte";
import { Text } from "$lib/design/components/text/index.js";
import { type HealthBadge, ServiceDevtoolShell } from "$lib/domains/platform/_shared/index.js";

const badge: HealthBadge = {
	state: "stopped",
	label: "Planned — not yet integrated",
};
</script>

<ServiceDevtoolShell
	title="MongoDB"
	description="Document store · GridFS for docs + images"
	icon={FileText}
	axis="stores"
	accent="green"
	health={badge}
>
	{#snippet status()}
		<div class="space-y-3">
			<Text size="sm" color="muted">
				MongoDB will handle large documentation sets and image blobs via
				GridFS. It will ship after the core platform services are stable so
				its schema can be informed by what the platform actually needs to
				store.
			</Text>
			<Text size="xs" color="muted">
				There is no live state yet — Status, Config, Logs, and Actions all
				unlock when the adapter lands.
			</Text>
		</div>
	{/snippet}
</ServiceDevtoolShell>
