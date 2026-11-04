/**
 * @file The seating screen's logic, with nothing to do with how it looks. The kernel
 * decides what is allowed (`room_check`); this only offers sensible choices and turns
 * them into what the kernel reads.
 * @module @devpulse/domains/chat/util/room-seating
 */

import { fill } from "#lib/sys/copy/index.js";
import type {
	Assignment,
	Issue,
	Persona,
	ProviderId,
	RoleCard,
	RoomChatCopy,
	RoomSpec,
	Seat,
} from "#lib/sys/generated/bindings.js";

/** One place of a room, as you are choosing it. */
export interface PlaceDraft {
	seat: string;
	place: number;
	provider: ProviderId | null;
	/** Another role than the seat's own (`code-reviewer@1`). */
	role: string | null;
	/** A character, `""` for none, `null` for the one the seat brings. */
	persona: string | null;
	notes: boolean;
	parameters: Record<string, string>;
}

/** What a place may do, in the words of the copy catalog. */
export type RoleAccess = "talks" | "reads" | "readsWeb" | "web" | "changes";

/** What a seat is for in its room. */
export type SeatJob = "selects" | "routes" | "blind" | "open";

/** `answerer-1`: a seat and its place, counted from 1. */
export function placeKey(seat: string, place: number): string {
	return `${seat}-${place + 1}`;
}

/** The way a room names a role: `code-reviewer@1`. */
export function roleRef(role: RoleCard): string {
	return `${role.id}@${role.version.split(".")[0]}`;
}

export function findRole(roles: readonly RoleCard[], reference: string): RoleCard | null {
	return roles.find((role) => roleRef(role) === reference) ?? null;
}

/** The seat a router room routes from; mirrors the kernel's `routing_seat`. */
export function routingSeat(room: RoomSpec): string | null {
	return room.turn_policy === "router" ? (room.phases[0]?.seats[0] ?? null) : null;
}

export function seatJob(room: RoomSpec, seat: Seat): SeatJob {
	if (room.selection?.seat === seat.seat) return "selects";
	if (routingSeat(room) === seat.seat) return "routes";
	const blind = room.phases.some(
		(phase) => phase.visibility === "none" && phase.seats.includes(seat.seat),
	);
	return blind ? "blind" : "open";
}

export function roleAccess(role: RoleCard): RoleAccess {
	const { talk_only: talkOnly, tools_allowed: tools } = role.permissions;
	if (talkOnly) return "talks";
	if (tools.includes("write")) return "changes";
	if (tools.includes("read")) return tools.includes("web") ? "readsWeb" : "reads";
	return tools.includes("web") ? "web" : "talks";
}

export function accessLabel(copy: RoomChatCopy, access: RoleAccess): string {
	const labels: Record<RoleAccess, string> = {
		talks: copy.access_talks,
		reads: copy.access_reads,
		readsWeb: copy.access_reads_web,
		web: copy.access_web,
		changes: copy.access_changes,
	};
	return labels[access];
}

export function jobLabel(copy: RoomChatCopy, job: SeatJob): string {
	const labels: Record<SeatJob, string> = {
		selects: copy.selects,
		routes: copy.routes,
		blind: copy.blind,
		open: copy.open,
	};
	return labels[job];
}

function required(role: RoleCard): string[] {
	const contract = role.output_contract as { required?: unknown };
	return Array.isArray(contract.required)
		? contract.required.filter((field): field is string => typeof field === "string")
		: [];
}

/**
 * The roles a place can take. The kernel has the last word; this leaves out what it
 * would refuse, so a choice on screen is one that works: a seat that selects needs a
 * role that selects, a seat that routes one that names a place, and a seat that answers
 * blind cannot change things.
 */
export function roleChoices(
	room: RoomSpec,
	seat: Seat,
	roles: readonly RoleCard[],
): readonly RoleCard[] {
	const job = seatJob(room, seat);
	if (job === "selects") return roles.filter((role) => role.stance === "select");
	if (job === "routes") {
		return roles.filter((role) => {
			const fields = required(role);
			return fields.includes("place") && fields.includes("escalate");
		});
	}
	return roles.filter(
		(role) => role.stance !== "select" && !(job === "blind" && roleAccess(role) === "changes"),
	);
}

/** The persona a place speaks as: yours, or the one its seat brings. */
export function placePersona(
	draft: PlaceDraft,
	seat: Seat,
	personas: readonly Persona[],
): Persona | null {
	if (draft.persona === "") return null;
	const id = draft.persona ?? seat.personas?.[draft.place] ?? null;
	return personas.find((persona) => persona.id === id) ?? null;
}

/**
 * Every place of a room with a first choice filled in. A seat that picks the answer
 * starts on another agent where there is one, since it must judge blind.
 */
export function draftPlaces(room: RoomSpec, ready: readonly ProviderId[]): PlaceDraft[] {
	const first = ready[0] ?? null;
	const other = ready.find((id) => id !== first) ?? first;
	return room.seats.flatMap((seat) =>
		Array.from({ length: seat.count }, (_, place) => ({
			seat: seat.seat,
			place,
			provider: seatJob(room, seat) === "selects" ? other : first,
			role: null,
			persona: null,
			notes: seat.notes ?? true,
			parameters: {},
		})),
	);
}

/**
 * Empty places filled in now that your agents are known, which can be after the room
 * was picked. What you chose stays.
 */
export function withAgents(
	room: RoomSpec,
	drafts: readonly PlaceDraft[],
	ready: readonly ProviderId[],
): PlaceDraft[] {
	const first = draftPlaces(room, ready);
	return drafts.map((draft) => {
		if (draft.provider) return draft;
		const seat = first.find((place) => place.seat === draft.seat);
		return { ...draft, provider: seat?.provider ?? null };
	});
}

/**
 * The same seats with a new number of places: those you already chose stay as you left
 * them, and a new one starts like the seat's first.
 */
export function resizeSeat(
	drafts: readonly PlaceDraft[],
	room: RoomSpec,
	seatName: string,
	count: number,
): { room: RoomSpec; drafts: PlaceDraft[] } {
	const seat = room.seats.find((candidate) => candidate.seat === seatName);
	if (!seat || count < 1) return { room, drafts: [...drafts] };
	const resized: RoomSpec = {
		...room,
		seats: room.seats.map((candidate) =>
			candidate.seat === seatName ? { ...candidate, count } : candidate,
		),
	};
	const places = drafts.filter((draft) => draft.seat === seatName);
	const template = places[0];
	const next = Array.from({ length: count }, (_, place): PlaceDraft => {
		const existing = places[place];
		if (existing) return existing;
		return {
			seat: seatName,
			place,
			provider: template?.provider ?? null,
			role: null,
			persona: null,
			notes: seat.notes ?? true,
			parameters: {},
		};
	});
	const merged = room.seats.flatMap((candidate) =>
		candidate.seat === seatName ? next : drafts.filter((draft) => draft.seat === candidate.seat),
	);
	return { room: resized, drafts: merged };
}

/** What the kernel reads. A place with no agent chosen stays out, and it says so. */
export function toAssignments(drafts: readonly PlaceDraft[]): Assignment[] {
	return drafts.flatMap((draft) =>
		draft.provider
			? [
					{
						seat: draft.seat,
						place: draft.place,
						provider: draft.provider,
						persona: draft.persona,
						notes: draft.notes,
						role: draft.role,
						parameters: draft.parameters,
					},
				]
			: [],
	);
}

/** A kebab-case id from a name, which must not repeat one in the library. */
export function roomIdFrom(name: string, taken: readonly string[]): string {
	const base =
		name
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/^-+|-+$/g, "")
			.replace(/^[0-9-]+/, "") || "my-room";
	if (!taken.includes(base)) return base;
	let suffix = 2;
	while (taken.includes(`${base}-${suffix}`)) suffix += 1;
	return `${base}-${suffix}`;
}

/** Your own room, starting from the one on screen. */
export function tailoredRoom(room: RoomSpec, name: string, taken: readonly string[]): RoomSpec {
	return {
		...room,
		id: roomIdFrom(name, taken),
		version: "1.0.0",
		name: name.trim(),
		seats: room.seats.map((seat) => ({
			...seat,
			personas: seat.personas?.slice(0, seat.count) ?? [],
		})),
	};
}

/** One line of a seat's breakdown. */
export interface CostarLine {
	label: string;
	text: string;
}

/**
 * What a seat is told, as COSTAR (OVERMIND_SPEC §3C: "System displays the COSTAR
 * breakdown"): the role and character supply it; nothing here is invented for show.
 */
export function costar(
	copy: RoomChatCopy,
	room: RoomSpec,
	seat: Seat,
	role: RoleCard,
	persona: Persona | null,
): CostarLine[] {
	const job = seatJob(room, seat);
	const judge = room.selection?.seat ?? null;
	const fields = required(role);
	return [
		{
			label: copy.costar_context,
			text: job === "blind" ? copy.context_blind : copy.context_open,
		},
		{ label: copy.costar_objective, text: role.purpose },
		{ label: copy.costar_style, text: role.method.name },
		{ label: copy.costar_tone, text: persona ? persona.tone : copy.tone_own },
		{
			label: copy.costar_audience,
			text:
				judge && job === "blind"
					? fill(copy.audience_selector, { seat: judge })
					: copy.audience_you,
		},
		{ label: copy.costar_response, text: fields.join(", ") },
	];
}

/** Problems the kernel placed at this place. */
export function problemsAt(issues: readonly Issue[], key: string): string[] {
	return issues.filter((issue) => issue.at.endsWith(`· ${key}`)).map((issue) => issue.problem);
}

/** Problems of the whole room, not one place. */
export function roomProblems(issues: readonly Issue[], keys: readonly string[]): string[] {
	return issues
		.filter((issue) => !keys.some((key) => issue.at.endsWith(`· ${key}`)))
		.map((issue) => issue.problem);
}
