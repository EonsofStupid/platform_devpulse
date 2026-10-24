<!--
	@file ChatAgentPicker.svelte
	@module @devpulse/domains/chat/feature

	"New thread with…" — the agents that can chat right now (installed, a way
	to talk to them, their connector in place, not signed out), as Rust's
	providers state reports them. Picking one starts a thread with it in the
	active project. An agent you are signed out of is listed but not
	pickable, with where to sign in (plan 0001 B3.6).
-->
<script lang="ts">
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
} from "@devpulse/coldlight/components/select";
import { Text } from "@devpulse/coldlight/components/text";
import { projectsState } from "$lib/domains/app/projects/index.js";
import { providersState } from "$lib/domains/app/providers/index.js";
import { copyState, fill } from "$lib/sys/copy/index.js";
import { agentsState } from "../data-access/agents.state.svelte.js";
import { chatState } from "../data-access/chat.state.svelte.js";
import { sessionsState } from "../data-access/sessions.state.svelte.js";

$effect(() => providersState.start());

const copy = $derived(copyState.catalog?.chat.agents ?? null);

const talkers = $derived(
	providersState.current?.report?.providers.filter(
		(p) =>
			p.kind === "subscription_agent" &&
			p.installed &&
			p.actions.includes("test") &&
			(p.connector?.installed ?? true),
	) ?? [],
);
const ready = $derived(talkers.filter((p) => p.signedIn !== "no"));
const signedOut = $derived(talkers.filter((p) => p.signedIn === "no"));

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

{#if copy}
	{#if ready.length > 0 || signedOut.length > 0}
		<Select value="" onValueChange={(v) => void pick(v)}>
			<SelectTrigger>{copy.new_thread}</SelectTrigger>
			<SelectContent>
				{#each ready as p (p.id)}
					<SelectItem value={p.id}>{p.name}</SelectItem>
				{/each}
				{#each signedOut as p (p.id)}
					<SelectItem value={p.id} disabled>{fill(copy.sign_in_first, { agent: p.name })}</SelectItem>
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
