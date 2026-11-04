<!--
	@file ChatRoomSetup.svelte
	@module @devpulse/domains/chat/feature

	Start a room: pick a template, seat it, change whatever you like, start it or save
	it as your own (plan 0001 B4.5). What is allowed comes from the kernel, so a problem
	shows at the place it is in.
-->
<script lang="ts">
import { Button } from "@devpulse/coldlight/components/button";
import { Card } from "@devpulse/coldlight/components/card";
import { InlineMessage } from "@devpulse/coldlight/components/inline-message";
import { NumberField } from "@devpulse/coldlight/components/number-field";
import { Text } from "@devpulse/coldlight/components/text";
import { TextField } from "@devpulse/coldlight/components/text-field";
import { projectsState } from "#lib/domains/app/projects/index.js";
import { providersState } from "#lib/domains/app/providers/index.js";
import { openMainPage } from "#lib/sys/bindings/window/index.js";
import { copyState, fill } from "#lib/sys/copy/index.js";
import type { ConnectionReadiness, ProviderId } from "#lib/sys/generated/bindings.js";
import { routeAt } from "#lib/sys/routing/index.js";
import { chatState } from "../data-access/chat.state.svelte.js";
import { roomsState } from "../data-access/rooms.state.svelte.js";
import { sessionsState } from "../data-access/sessions.state.svelte.js";
import { CouncilConfig, type CouncilSeat } from "../ui/council-config/index.js";
import { RoomTemplates } from "../ui/room-templates/index.js";
import {
	accessLabel,
	costar,
	findRole,
	jobLabel,
	placeKey,
	placePersona,
	problemsAt,
	roleAccess,
	roleChoices,
	roleRef,
	roomProblems,
	seatJob,
} from "../util/room-seating.js";

const copy = $derived(copyState.catalog?.chat.rooms ?? null);
const agentCopy = $derived(copyState.catalog?.chat.agents ?? null);
const providerCopy = $derived(copyState.catalog?.onboarding.your_ai ?? null);
const library = $derived(roomsState.library);
const memoryPage = routeAt("/devpulse/settings/memory");

$effect(() => providersState.start());

const talkers = $derived(
	providersState.current?.report?.providers.filter((p) => p.kind === "subscription_agent") ?? [],
);
const ready = $derived(
	talkers.filter((p) => p.availability.chat === "readyToConnect").map((p) => p.id),
);

function prerequisite(status: ConnectionReadiness): string | undefined {
	if (!providerCopy || status === "readyToConnect") return undefined;
	const labels: Record<Exclude<ConnectionReadiness, "readyToConnect">, string> = {
		notInstalled: providerCopy.not_installed,
		signInRequired: providerCopy.signed_out,
		signInUnverified: providerCopy.signed_in_unknown,
		connectorRequired: providerCopy.connector_needed,
		unsupported: providerCopy.conversation_unsupported,
	};
	return labels[status];
}

$effect(() => {
	roomsState.fillAgents(ready);
});

const providerChoices = $derived(
	talkers.map((p) => ({
		id: p.id,
		label: p.name,
		unavailable: prerequisite(p.availability.chat),
	})),
);
const roleOptions = $derived(
	library?.roles.map((role) => ({ id: roleRef(role), label: role.name })) ?? [],
);
const personaOptions = $derived(
	library?.personas.map((persona) => ({ id: persona.id, label: persona.name })) ?? [],
);
const templates = $derived(
	library?.rooms.map((room) => ({
		id: room.id,
		name: room.name,
		summary: room.summary,
		seats: room.seats.reduce((sum, seat) => sum + seat.count, 0),
		yours: library.yours.rooms.includes(room.id),
	})) ?? [],
);

let saveName = $state("");

const seats = $derived.by((): CouncilSeat[] => {
	const room = roomsState.room;
	if (!room || !library || !copy) return [];
	return roomsState.drafts.flatMap((draft) => {
		const seat = room.seats.find((candidate) => candidate.seat === draft.seat);
		if (!seat) return [];
		const reference = draft.role ?? seat.role;
		const role = findRole(library.roles, reference);
		if (!role) return [];
		const persona = placePersona(draft, seat, library.personas);
		const key = placeKey(draft.seat, draft.place);
		const job = seatJob(room, seat);
		return [
			{
				id: key,
				label: seat.count > 1 ? `${role.name} ${draft.place + 1}` : role.name,
				role: reference,
				provider: draft.provider ?? "",
				kind: job === "selects" ? "selector" : "answerer",
				roleChoices: roleChoices(room, seat, library.roles).map((choice) => ({
					id: roleRef(choice),
					label: choice.name,
				})),
				persona: persona?.id ?? "",
				notes: draft.notes,
				job: jobLabel(copy, job),
				access: accessLabel(copy, roleAccess(role)),
				problems: problemsAt(roomsState.issues, key),
				values: (role.parameters ?? []).map((parameter) => ({
					name: parameter.name,
					label: fill(copy.value_needed, { name: parameter.name }),
					description: parameter.description,
					value: draft.parameters[parameter.name] ?? seat.parameters?.[parameter.name] ?? "",
				})),
				costar: costar(copy, room, seat, role, persona),
			} satisfies CouncilSeat,
		];
	});
});

const validation = $derived.by(() => {
	if (!copy) return null;
	if (roomsState.resized) return copy.save_first;
	if (roomsState.issues.length === 0) return null;
	const keys = roomsState.drafts.map((draft) => placeKey(draft.seat, draft.place));
	const whole = roomProblems(roomsState.issues, keys);
	return whole.length > 0 ? whole.join(" ") : copy.seats_have_problems;
});

function change(id: string, field: "role" | "provider" | "persona", value: string): void {
	if (field === "provider") {
		roomsState.change(id, { provider: value as ProviderId });
	} else if (field === "persona") {
		roomsState.change(id, { persona: value });
	} else {
		roomsState.change(id, { role: value });
	}
}

function setValue(id: string, name: string, value: string): void {
	const draft = roomsState.drafts.find((place) => placeKey(place.seat, place.place) === id);
	if (draft) roomsState.change(id, { parameters: { ...draft.parameters, [name]: value } });
}

function pick(id: string): void {
	const room = roomsState.spec(id);
	if (room) roomsState.pick(room, ready);
}

async function start(): Promise<void> {
	const project = projectsState.activeProjectId;
	if (!project) return;
	const session = await roomsState.start(project);
	if (!session) return;
	await sessionsState.refresh();
	chatState.setActiveSession(session);
	await chatState.loadActive();
}

async function save(): Promise<void> {
	if (await roomsState.saveAs(saveName)) saveName = "";
}
</script>

{#if copy && agentCopy}
	<div class="min-h-0 flex-1 overflow-y-auto p-3">
		{#if roomsState.screen === "templates"}
			<RoomTemplates {copy} rooms={templates} problem={roomsState.error}
				onPick={pick}
				onDelete={(id) => void roomsState.remove("room", id)}
				onBack={() => roomsState.close()} />
		{:else if roomsState.room}
			<CouncilConfig
				copy={{
					region: copy.seating_label,
					eyebrow: copy.seating_label,
					heading: roomsState.room.name,
					summary: roomsState.room.summary,
					back: copy.back,
					role: copy.role,
					role_aria: copy.role_aria,
					agent: copy.agent,
					agent_aria: copy.agent_aria,
					choose_agent: copy.choose_agent,
					character: copy.character,
					character_aria: copy.character_aria,
					no_character: copy.no_character,
					costar_title: copy.costar_title,
					start: copy.start,
				}}
				{seats}
				roles={roleOptions}
				providers={providerChoices}
				personas={personaOptions}
				notesCopy={agentCopy}
				{validation}
				busy={roomsState.busy}
				onChange={change}
				onValue={setValue}
				onNotes={(id, on) => roomsState.change(id, { notes: on })}
				onChooseNotes={() => { if (memoryPage) void openMainPage(memoryPage, null); }}
				onSave={() => void start()}
				onBack={() => roomsState.backToTemplates()}
			>
				<Card variant="deep" class="gap-3 p-4">
					<Text size="sm">{copy.places_help}</Text>
					<div class="flex flex-wrap items-end gap-4">
						{#each roomsState.room.seats as seat (seat.seat)}
							<div class="flex flex-col gap-1">
								<Text size="xs">{findRole(library?.roles ?? [], seat.role)?.name ?? seat.seat}</Text>
								<NumberField value={seat.count} min={1} max={12} aria-label={`${findRole(library?.roles ?? [], seat.role)?.name ?? seat.seat}: ${copy.places}`} onValueChange={(count: number) => roomsState.setCount(seat.seat, count)} />
							</div>
						{/each}
					</div>
					<div class="flex flex-wrap items-end gap-3">
						<TextField label={copy.save_name} value={saveName} onValueChange={(value: string) => { saveName = value; }} />
						<Button variant="secondary" disabled={!saveName.trim() || roomsState.busy} onclick={() => void save()}>{copy.save_as}</Button>
					</div>
					{#if roomsState.notice}<InlineMessage tone="success">{fill(copy.saved, { name: roomsState.notice })}</InlineMessage>{/if}
				</Card>
				{#if roomsState.error}<div role="alert"><Text size="sm">{roomsState.error}</Text></div>{/if}
			</CouncilConfig>
		{/if}
	</div>
{/if}
