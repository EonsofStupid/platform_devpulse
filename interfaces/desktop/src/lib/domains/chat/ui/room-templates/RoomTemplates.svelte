<!--
	@component RoomTemplates
	@module @devpulse/domains/chat/ui/room-templates

	The rooms you can start from: what ships and what is yours.
-->
<script lang="ts">
import { Badge } from "@devpulse/coldlight/components/badge";
import { Button } from "@devpulse/coldlight/components/button";
import { Card } from "@devpulse/coldlight/components/card";
import { Heading } from "@devpulse/coldlight/components/heading";
import { Text } from "@devpulse/coldlight/components/text";
import { fill } from "#lib/sys/copy/index.js";
import type { RoomTemplatesProps } from "./room-templates.types.js";

let { copy, rooms, problem, onPick, onDelete, onBack }: RoomTemplatesProps = $props();
</script>

<section aria-label={copy.templates_title} class="flex flex-col gap-4">
	<header class="flex flex-wrap items-start justify-between gap-4">
		<div class="flex flex-col gap-2">
			<Heading level={2} size="xl">{copy.templates_title}</Heading>
			<Text size="sm">{copy.templates_help}</Text>
		</div>
		<Button variant="secondary" size="sm" onclick={onBack}>{copy.back}</Button>
	</header>
	{#if problem}<div role="alert"><Text size="sm">{problem}</Text></div>{/if}
	<div class="grid gap-3 md:grid-cols-2">
		{#each rooms as room (room.id)}
			<Card variant="elevated" class="gap-2 p-4">
				<div class="flex flex-wrap items-center justify-between gap-2">
					<Heading level={3} size="sm">{room.name}</Heading>
					<div class="flex flex-wrap items-center gap-2">
						{#if room.yours}<Badge size="sm" variant="positive">{copy.yours}</Badge>{/if}
						<Badge size="sm" variant="neutral">{fill(copy.places_count, { count: room.seats })}</Badge>
					</div>
				</div>
				<Text size="sm">{room.summary}</Text>
				<div class="flex flex-wrap items-center gap-2">
					<Button size="sm" onclick={() => onPick(room.id)} aria-label={room.name}>{copy.seating_label}</Button>
					{#if room.yours}
						<Button size="sm" variant="ghost" title={copy.delete_help} aria-label={`${copy.delete_yours} ${room.name}`} onclick={() => onDelete(room.id)}>{copy.delete_yours}</Button>
					{/if}
				</div>
			</Card>
		{/each}
	</div>
</section>
