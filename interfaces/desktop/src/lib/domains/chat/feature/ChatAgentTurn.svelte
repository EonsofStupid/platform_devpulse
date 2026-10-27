<!--
	@file ChatAgentTurn.svelte
	@module @devpulse/domains/chat/feature

	The running turn of an agent thread: what it is doing (the tool it uses,
	in its own words), a permission it asks for with the choices it offers,
	and Stop. Text comes from the copy catalog.
-->
<script lang="ts">
import { copyState, fill } from "$lib/sys/copy/index.js";
import { agentsState, type RunningTurn } from "../data-access/agents.state.svelte.js";
import { AgentTurn } from "../ui/agent-turn/index.js";

let { turn, agent }: { turn: RunningTurn; agent: string } = $props();

const copy = $derived(copyState.catalog?.chat.agents ?? null);
</script>

{#if copy}
	<AgentTurn
		message={turn.permission ? fill(copy.asks, { agent }) : turn.tool ? fill(copy.using_tool, { title: turn.tool }) : copy.working}
		permission={turn.permission}
		cancelLabel={copy.stop}
		refuseLabel={copy.refuse}
		onAnswer={(choice) => { if (turn.permission) void agentsState.answer(turn.sessionId, turn.permission.request, choice); }}
		onCancel={() => void agentsState.cancel(turn.sessionId)}
	/>
{/if}
