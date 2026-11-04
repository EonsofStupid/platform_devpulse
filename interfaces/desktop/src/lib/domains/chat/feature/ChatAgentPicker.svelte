<!--
	@file ChatAgentPicker.svelte
	@module @devpulse/domains/chat/feature

	"New thread with…" — Rust's operation availability decides which agents
	can be selected. Unavailable agents show their prerequisite using the
	existing copy catalog; Chat does not infer readiness from installed/login
	flags (plan 0001 B3.6, R7).
-->
<script lang="ts">
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
} from "@devpulse/coldlight/components/select";
import { Text } from "@devpulse/coldlight/components/text";
import { projectsState } from "#lib/domains/app/projects/index.js";
import { providersState } from "#lib/domains/app/providers/index.js";
import { copyState } from "#lib/sys/copy/index.js";
import type { ConnectionReadiness } from "#lib/sys/generated/bindings.js";
import { agentsState } from "../data-access/agents.state.svelte.js";
import { chatState } from "../data-access/chat.state.svelte.js";
import { sessionsState } from "../data-access/sessions.state.svelte.js";

$effect(() => providersState.start());

const copy = $derived(copyState.catalog?.chat.agents ?? null);
const providerCopy = $derived(copyState.catalog?.onboarding.your_ai ?? null);

const talkers = $derived(
	providersState.current?.report?.providers.filter((p) => p.kind === "subscription_agent") ?? [],
);
const ready = $derived(talkers.filter((p) => p.availability.chat === "readyToConnect"));
const unavailable = $derived(talkers.filter((p) => p.availability.chat !== "readyToConnect"));

function prerequisite(status: ConnectionReadiness): string {
	if (!providerCopy) return "";
	const labels: Record<ConnectionReadiness, string> = {
		readyToConnect: providerCopy.ready_to_connect,
		notInstalled: providerCopy.not_installed,
		signInRequired: providerCopy.signed_out,
		signInUnverified: providerCopy.signed_in_unknown,
		connectorRequired: providerCopy.connector_needed,
		unsupported: providerCopy.conversation_unsupported,
	};
	return labels[status];
}

async function pick(id: string): Promise<void> {
	const project = projectsState.activeProjectId;
	const provider = ready.find((p) => p.id === id);
	if (!project || !provider) return;
	const sessionId = await agentsState.start(project, provider.id);
	if (!sessionId) return;
	await sessionsState.refresh();
	chatState.setActiveSession(sessionId);
	await chatState.loadActive();
}
</script>

{#if copy && providerCopy}
	{#if talkers.length > 0}
		<Select value="" onValueChange={(v) => void pick(v)}>
			<SelectTrigger>{copy.new_thread}</SelectTrigger>
			<SelectContent>
				{#each ready as p (p.id)}
					<SelectItem value={p.id}>{p.name}</SelectItem>
				{/each}
				{#each unavailable as p (p.id)}
					<SelectItem value={p.id} disabled>{p.name} — {prerequisite(p.availability.chat)}</SelectItem>
				{/each}
			</SelectContent>
		</Select>
	{:else}
		<Text size="xs" color="muted">{copy.none_ready}</Text>
	{/if}
	{#if agentsState.error}
		<Text size="xs" color="muted">{agentsState.error}</Text>
	{/if}
{/if}
