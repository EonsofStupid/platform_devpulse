<!--
	@file ChatAgentTurn.svelte
	@module @devpulse/domains/chat/feature

	The running turn of an agent thread: what it is doing (the tool it uses,
	in its own words), a permission it asks for with the choices it offers,
	and Stop. Text comes from the copy catalog.
-->
<script lang="ts">
import { Button } from "@devpulse/coldlight/components/button";
import { Spinner } from "@devpulse/coldlight/components/spinner";
import { Text } from "@devpulse/coldlight/components/text";
import { copyState, fill } from "$lib/sys/copy/index.js";
import { agentsState, type RunningTurn } from "../data-access/agents.state.svelte.js";

let { turn, agent }: { turn: RunningTurn; agent: string } = $props();

const copy = $derived(copyState.catalog?.chat.agents ?? null);
</script>

{#if copy}
	<div class="flex flex-col gap-2 px-3">
		{#if turn.permission}
			<Text size="sm" weight="semibold">{fill(copy.asks, { agent })} {turn.permission.title}</Text>
			<div class="flex flex-wrap items-center gap-2">
				{#each turn.permission.choices as choice (choice.id)}
					<Button
						size="sm"
						variant={choice.allows ? "primary" : "secondary"}
						onclick={() => void agentsState.answer(choice.id)}
					>
						{choice.label}
					</Button>
				{/each}
				<Button size="sm" variant="ghost" onclick={() => void agentsState.answer(null)}>{copy.refuse}</Button>
			</div>
		{:else}
			<div class="flex items-center gap-2">
				<Spinner size="xs" />
				<Text size="xs" color="muted">{turn.tool ? fill(copy.using_tool, { title: turn.tool }) : copy.working}</Text>
				<Button size="sm" variant="ghost" onclick={() => void agentsState.cancel()}>{copy.stop}</Button>
			</div>
		{/if}
	</div>
{/if}
