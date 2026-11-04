<!--
	@file ChatNotes.svelte
	@module @devpulse/domains/chat/feature

	Wires the notes yes-or-no to the conversation on screen: an agent thread or an
	endpoint chat. Clyffy's own conversation has none to choose yet.
-->
<script lang="ts">
import { openMainPage } from "#lib/sys/bindings/window/index.js";
import { copyState } from "#lib/sys/copy/index.js";
import { routeAt } from "#lib/sys/routing/index.js";
import { agentsState } from "../data-access/agents.state.svelte.js";
import { chatState } from "../data-access/chat.state.svelte.js";
import { notesState } from "../data-access/notes.state.svelte.js";
import { NotesToggle } from "../ui/notes-toggle/index.js";

const copy = $derived(copyState.catalog?.chat.agents ?? null);
const memoryPage = routeAt("/devpulse/settings/memory");

const sessionId = $derived(chatState.activeSessionId);
const applies = $derived(
	sessionId !== null && (chatState.endpoint !== null || agentsState.thread(sessionId) !== null),
);
const running = $derived(agentsState.running(sessionId) !== null);

$effect(() => {
	void notesState.load(applies ? sessionId : null);
});

function choose(): void {
	if (memoryPage) void openMainPage(memoryPage, null);
}
</script>

{#if copy && applies && notesState.notes !== null}
	<NotesToggle
		{copy}
		notes={notesState.notes}
		disabled={running || notesState.busy}
		problem={notesState.problem}
		onChange={(on) => void notesState.set(on)}
		onChoose={choose}
	/>
{/if}
