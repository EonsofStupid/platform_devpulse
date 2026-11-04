<!--
	@component CouncilConfig
	@module @devpulse/domains/chat/ui/council-config

	Seats a room: for each place its agent, role and character, whether it gets your
	notes, what it may do, and what stops it. Everything shown comes in by props.
-->
<script lang="ts">
import { Badge } from "@devpulse/coldlight/components/badge";
import { Button } from "@devpulse/coldlight/components/button";
import { Card } from "@devpulse/coldlight/components/card";
import * as Collapsible from "@devpulse/coldlight/components/collapsible";
import { Heading } from "@devpulse/coldlight/components/heading";
import { InlineMessage } from "@devpulse/coldlight/components/inline-message";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
} from "@devpulse/coldlight/components/select";
import { Text } from "@devpulse/coldlight/components/text";
import { TextField } from "@devpulse/coldlight/components/text-field";
import { fill } from "#lib/sys/copy/index.js";
import { NotesToggle } from "../notes-toggle/index.js";
import type { CouncilChoice, CouncilConfigProps, CouncilSeat } from "./council-config.types.js";

let {
	copy,
	seats,
	roles,
	providers,
	personas,
	notesCopy,
	preset,
	validation,
	busy = false,
	onChange,
	onValue,
	onNotes,
	onChooseNotes,
	onSave,
	onBack,
	children,
}: CouncilConfigProps = $props();

const labelOf = (choices: readonly CouncilChoice[], id: string) =>
	choices.find((choice) => choice.id === id)?.label;
const seatRoles = (seat: CouncilSeat) => seat.roleChoices ?? roles;
const badge = (seat: CouncilSeat) =>
	seat.job ?? (seat.kind === "selector" ? copy.selector_badge : copy.answerer_badge);
</script>

<section aria-label={copy.region} class="flex flex-col gap-6">
	<header class="flex flex-wrap items-start justify-between gap-4">
		<div class="flex flex-col gap-2">
			<Text size="sm">{copy.eyebrow}</Text>
			<Heading level={2} size="xl">{copy.heading}</Heading>
			<Text size="sm">{copy.summary}</Text>
		</div>
		<Button variant="secondary" size="sm" onclick={onBack}>{copy.back}</Button>
	</header>
	{#if preset}
		<Card variant="deep" class="gap-3 p-5">
			<Badge variant="informative">{preset.badge}</Badge>
			{#each preset.lines as line (line)}<Text size="sm">{line}</Text>{/each}
		</Card>
	{/if}
	<div class="grid gap-4 md:grid-cols-2">
		{#each seats as seat (seat.id)}
			<Card variant={seat.kind === "selector" ? "glow" : "elevated"} class="gap-4 p-5">
				<div class="flex flex-wrap items-center justify-between gap-2">
					<Heading level={3} size="sm">{seat.label}</Heading>
					{#if badge(seat)}<Badge size="sm" variant={seat.kind === "selector" ? "notice" : "neutral"}>{badge(seat)}</Badge>{/if}
				</div>
				<div class="flex flex-col gap-2">
					<Text size="sm">{copy.agent}</Text>
					<Select value={seat.provider} onValueChange={(value) => onChange(seat.id, "provider", value)} aria-label={fill(copy.agent_aria, { seat: seat.label })}>
						<SelectTrigger>{labelOf(providers, seat.provider) ?? copy.choose_agent}</SelectTrigger>
						<SelectContent>
							{#each providers as provider (provider.id)}
								<SelectItem value={provider.id} disabled={!!provider.unavailable}>{provider.unavailable ? `${provider.label} — ${provider.unavailable}` : provider.label}</SelectItem>
							{/each}
						</SelectContent>
					</Select>
				</div>
				<div class="flex flex-col gap-2">
					<Text size="sm">{copy.role}</Text>
					<Select value={seat.role} onValueChange={(value) => onChange(seat.id, "role", value)} disabled={seatRoles(seat).length < 2} aria-label={fill(copy.role_aria, { seat: seat.label })}>
						<SelectTrigger>{labelOf(seatRoles(seat), seat.role) ?? seat.role}</SelectTrigger>
						<SelectContent>
							{#each seatRoles(seat) as role (role.id)}<SelectItem value={role.id}>{role.label}</SelectItem>{/each}
						</SelectContent>
					</Select>
				</div>
				{#if personas && seat.persona !== undefined && copy.character && copy.character_aria}
					<div class="flex flex-col gap-2">
						<Text size="sm">{copy.character}</Text>
						<Select value={seat.persona} onValueChange={(value) => onChange(seat.id, "persona", value)} aria-label={fill(copy.character_aria, { seat: seat.label })}>
							<SelectTrigger>{labelOf(personas, seat.persona) ?? copy.no_character}</SelectTrigger>
							<SelectContent>
								<SelectItem value="">{copy.no_character}</SelectItem>
								{#each personas as persona (persona.id)}<SelectItem value={persona.id}>{persona.label}</SelectItem>{/each}
							</SelectContent>
						</Select>
					</div>
				{/if}
				{#each seat.values ?? [] as needed (needed.name)}
					<TextField label={needed.label} description={needed.description} value={needed.value} onValueChange={(value: string) => onValue?.(seat.id, needed.name, value)} />
				{/each}
				{#if seat.access}<Text size="xs">{seat.access}</Text>{/if}
				{#if seat.notes !== undefined && notesCopy}
					<NotesToggle copy={notesCopy} notes={seat.notes} disabled={busy} problem={null} onChange={(on) => onNotes?.(seat.id, on)} />
				{/if}
				{#each seat.problems ?? [] as problem (problem)}
					<InlineMessage tone="error">{problem}</InlineMessage>
				{/each}
				{#if seat.costar && copy.costar_title}
					<Collapsible.Root>
						<Collapsible.Trigger>{copy.costar_title}</Collapsible.Trigger>
						<Collapsible.Content>
							<dl class="flex flex-col gap-2 pt-2">
								{#each seat.costar as line (line.label)}
									<div class="flex flex-col gap-0.5">
										<dt><Text size="xs" weight="semibold">{line.label}</Text></dt>
										<dd><Text size="xs">{line.text}</Text></dd>
									</div>
								{/each}
							</dl>
						</Collapsible.Content>
					</Collapsible.Root>
				{/if}
			</Card>
		{/each}
	</div>
	{#if notesCopy && onChooseNotes}
		<div><Button variant="ghost" size="sm" onclick={onChooseNotes}>{notesCopy.notes_change}</Button></div>
	{/if}
	{#if children}{@render children()}{/if}
	{#if validation}<div role="alert"><Text>{validation}</Text></div>{/if}
	<div class="flex flex-wrap items-center gap-4">
		<Button disabled={validation !== null || busy} onclick={onSave}>{copy.start}</Button>
		{#if copy.start_note}<Text size="sm">{copy.start_note}</Text>{/if}
	</div>
</section>
