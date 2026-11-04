<!-- @feature Endpoint chat actions use saved kernel connection identities. -->
<script lang="ts">
import { projectsState } from "#lib/domains/app/projects/index.js";
import { providersState } from "#lib/domains/app/providers/index.js";
import { copyState } from "#lib/sys/copy/index.js";
import { chatState } from "../data-access/chat.state.svelte.js";
import { EndpointPicker } from "../ui/endpoint-picker/index.js";

const copy = $derived(copyState.catalog?.chat.endpoints);
const connections = $derived(
	(providersState.current?.connections?.items ?? []).filter((connection) =>
		providersState.connectionOptions.some(
			(option) => option.provider === connection.provider && option.supportsTextTest,
		),
	),
);
</script>
{#if copy}
    <EndpointPicker {copy} {connections} busy={!projectsState.activeProjectId || providersState.busy || chatState.sending || chatState.isGenerating} onStart={(connection, model) => chatState.startEndpoint(connection, model)} />
{/if}
