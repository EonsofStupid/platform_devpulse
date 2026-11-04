<!--
	@component RoomSeats
	@module @devpulse/domains/chat/ui/room-seats

	Who is in a seated room: each place's role, agent and character, what it may do,
	and a plain yes or no on your notes that you can change between questions.
-->
<script lang="ts">
import { Button } from "@devpulse/coldlight/components/button";
import { Card } from "@devpulse/coldlight/components/card";
import { Text } from "@devpulse/coldlight/components/text";
import { NotesToggle } from "../notes-toggle/index.js";
import type { RoomSeatsProps } from "./room-seats.types.js";

let { title, seats, notesCopy, disabled, onNotes, onChoose }: RoomSeatsProps = $props();
</script>

<section aria-label={title} class="flex flex-col gap-2">
	<div class="flex flex-wrap items-center justify-between gap-2">
		<Text size="xs" weight="semibold">{title}</Text>
		<Button variant="ghost" size="sm" onclick={onChoose}>{notesCopy.notes_change}</Button>
	</div>
	<div class="flex flex-wrap gap-2">
		{#each seats as seat (seat.key)}
			<Card variant="minimal" class="min-w-0 flex-1 basis-56 gap-1 p-2" data-ui="chat-room-seat">
				<Text size="xs" weight="semibold" class="truncate">{seat.role}{seat.character ? ` · ${seat.character}` : ""}</Text>
				<Text size="xs" class="truncate">{seat.agent} · {seat.access}</Text>
				<NotesToggle copy={notesCopy} notes={seat.notes} {disabled} problem={null} onChange={(on) => onNotes(seat.key, on)} />
			</Card>
		{/each}
	</div>
</section>
