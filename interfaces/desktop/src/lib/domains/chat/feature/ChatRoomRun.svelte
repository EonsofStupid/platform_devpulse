<!--
	@file ChatRoomRun.svelte
	@module @devpulse/domains/chat/feature

	A seated room above its conversation: who is in it, with notes yes or no on each
	seat. While it answers, each place at work, with what it is doing and what it asks.
-->
<script lang="ts">
import { Button } from "@devpulse/coldlight/components/button";
import { agenthubState } from "$lib/domains/agenthub/index.js";
import { providersState } from "$lib/domains/app/providers/index.js";
import { openMainPage } from "$lib/sys/bindings/window/index.js";
import { copyState, fill } from "$lib/sys/copy/index.js";
import { routeAt } from "$lib/sys/routing/index.js";
import { chatState } from "../data-access/chat.state.svelte.js";
import { roomsState } from "../data-access/rooms.state.svelte.js";
import { AgentTurn } from "../ui/agent-turn/index.js";
import { MessageBubble } from "../ui/index.js";
import { RoomSeats, type RoomSeatView } from "../ui/room-seats/index.js";
import { splitContractBlock } from "../util/format.js";
import { accessLabel, findRole, placeKey, roleAccess } from "../util/room-seating.js";

const copy = $derived(copyState.catalog?.chat.rooms ?? null);
const agentCopy = $derived(copyState.catalog?.chat.agents ?? null);
const memoryPage = routeAt("/devpulse/settings/memory");

const sessionId = $derived(chatState.activeSessionId);
const thread = $derived(roomsState.thread(sessionId));
const room = $derived(thread ? roomsState.spec(thread.roomId) : null);
const answering = $derived(roomsState.answering(sessionId));
const working = $derived(sessionId ? agenthubState.places(sessionId) : []);

function agentName(id: string | null): string {
	return providersState.current?.report?.providers.find((p) => p.id === id)?.name ?? id ?? "";
}

const seats = $derived.by((): RoomSeatView[] => {
	const library = roomsState.library;
	if (!thread || !room || !library || !copy) return [];
	return thread.seating.flatMap((assignment) => {
		const seat = room.seats.find((candidate) => candidate.seat === assignment.seat);
		const role = seat ? findRole(library.roles, assignment.role ?? seat.role) : null;
		if (!seat || !role) return [];
		const personaId =
			assignment.persona === "" ? null : (assignment.persona ?? seat.personas?.[assignment.place]);
		return [
			{
				key: placeKey(assignment.seat, assignment.place),
				role: role.name,
				agent: agentName(assignment.provider),
				character: library.personas.find((p) => p.id === personaId)?.name ?? null,
				access: accessLabel(copy, roleAccess(role)),
				notes: assignment.notes ?? seat.notes ?? true,
			},
		];
	});
});

function label(place: string | null): string {
	const seat = seats.find((candidate) => candidate.key === place);
	return seat ? `${seat.role} · ${seat.agent}` : (place ?? "");
}
</script>

{#if copy && agentCopy && thread}
	<RoomSeats
		title={copy.seats_title}
		{seats}
		notesCopy={agentCopy}
		disabled={answering}
		onNotes={(key, on) => { if (sessionId) void roomsState.setPlaceNotes(sessionId, key, on); }}
		onChoose={() => { if (memoryPage) void openMainPage(memoryPage, null); }}
	/>
{/if}

{#snippet stopButton()}
	{#if copy && sessionId}
		<Button size="sm" variant="secondary" onclick={() => void roomsState.cancel(sessionId)}>{copy.stop}</Button>
	{/if}
{/snippet}

{#if copy && agentCopy && thread && answering}
	<div class="flex flex-col gap-2" role="status">
		{#each working as turn (turn.place)}
			{#if turn.text}
				<MessageBubble message={{ id: `streaming-${turn.place}`, variant: "ai", author: label(turn.place), content: splitContractBlock(turn.text).prose }} mode={chatState.mode} />
			{/if}
			<AgentTurn
				message={turn.permissions[0]
					? fill(agentCopy.asks, { agent: label(turn.place) })
					: turn.tools.at(-1)
						? fill(agentCopy.using_tool, { title: turn.tools.at(-1)?.title ?? "" })
						: fill(copy.answering, { place: label(turn.place) })}
				permission={turn.permissions[0] ?? null}
				cancelLabel={copy.stop}
				refuseLabel={agentCopy.refuse}
				onAnswer={(choice) => {
					const asked = turn.permissions[0];
					if (sessionId && turn.place && asked) void roomsState.answer(sessionId, turn.place, asked.request, choice);
				}}
				onCancel={() => { if (sessionId) void roomsState.cancel(sessionId); }}
			/>
		{:else}
			{@render stopButton()}
		{/each}
	</div>
{/if}
