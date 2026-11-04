/**
 * @file Rooms: your library, the screen that seats one, and a seated room's run. The
 * kernel decides what is allowed and AgentHub owns what is running; this holds your
 * choices until they are saved.
 * @module @devpulse/domains/chat/data-access/rooms.state.svelte
 */

import { agenthubState } from "$lib/domains/agenthub/index.js";
import { projectsState } from "$lib/domains/app/projects/index.js";
import type {
	Issue,
	Library,
	LibraryKind,
	ProviderId,
	RoomSpec,
	RoomStreamed,
	RoomThread,
} from "$lib/sys/generated/bindings.js";
import { logError } from "$lib/sys/logger.js";
import {
	draftPlaces,
	type PlaceDraft,
	placeKey,
	resizeSeat,
	tailoredRoom,
	toAssignments,
	withAgents,
} from "../util/room-seating.js";
import * as service from "./rooms.service.js";

const LOG_TARGET = "domains.chat.rooms";
const message = (e: unknown): string => (e instanceof Error ? e.message : String(e));

class RoomsStore {
	library = $state<Library | null>(null);
	threads = $state<Record<string, RoomThread>>({});
	error = $state<string | null>(null);
	screen = $state<"closed" | "templates" | "seating">("closed");
	/** The room on the seating screen, with the places you set. */
	room = $state<RoomSpec | null>(null);
	drafts = $state<PlaceDraft[]>([]);
	issues = $state<Issue[]>([]);
	/** You changed how many sit somewhere, so it must be saved to run. */
	resized = $state(false);
	busy = $state(false);
	notice = $state<string | null>(null);
	/** Questions the engine accepted and has not finished. */
	private asking = $state<Record<string, true>>({});
	/** Bumps when a room saved something, so its conversation reloads. */
	revisions = $state<Record<string, number>>({});
	failures = $state<Record<string, string>>({});
	/** The Council a router opened, by the room that opened it. */
	escalations = $state<Record<string, RoomThread>>({});
	private listening = false;
	private checkGeneration = 0;
	private refreshGeneration = 0;

	/** Your library, and the events of any room answering. */
	async initialize(): Promise<void> {
		if (!this.listening) {
			this.listening = true;
			try {
				await service.onStreamed((streamed) => this.receive(streamed));
			} catch (e) {
				this.listening = false;
				this.error = message(e);
			}
		}
		await this.loadLibrary();
	}

	async loadLibrary(): Promise<void> {
		try {
			this.library = await service.library();
		} catch (e) {
			this.error = message(e);
		}
	}

	async refresh(projectId: string): Promise<void> {
		const generation = ++this.refreshGeneration;
		try {
			const threads = await service.threads(projectId);
			if (generation !== this.refreshGeneration || projectId !== projectsState.activeProjectId)
				return;
			this.threads = Object.fromEntries(threads.map((thread) => [thread.sessionId, thread]));
		} catch (e) {
			if (generation === this.refreshGeneration) this.error = message(e);
		}
	}

	/** The room a chat session is, if it is one. */
	thread(sessionId: string | null): RoomThread | null {
		const thread = sessionId ? this.threads[sessionId] : null;
		return thread?.projectId === projectsState.activeProjectId ? thread : null;
	}

	spec(roomId: string): RoomSpec | null {
		return this.library?.rooms.find((room) => room.id === roomId) ?? null;
	}

	private receive({ sessionId, event }: RoomStreamed): void {
		if (event.kind === "agent") return;
		if (event.kind === "escalated") {
			this.escalations = { ...this.escalations, [sessionId]: event.room };
			this.threads = { ...this.threads, [event.room.sessionId]: event.room };
		}
		if (event.kind === "failed") {
			this.failures = { ...this.failures, [sessionId]: event.message };
			logError(LOG_TARGET, `room failed — ${event.message}`);
		}
		if (event.kind !== "turn") {
			const { [sessionId]: _done, ...still } = this.asking;
			this.asking = still;
		}
		this.revisions = {
			...this.revisions,
			[sessionId]: (this.revisions[sessionId] ?? 0) + 1,
		};
	}

	/** It is answering: asked and not finished, or AgentHub says a place is at work. */
	answering(sessionId: string | null): boolean {
		if (!sessionId) return false;
		return !!this.asking[sessionId] || agenthubState.places(sessionId).length > 0;
	}

	// ── The seating screen ──

	open(): void {
		this.error = null;
		this.notice = null;
		this.screen = "templates";
		void this.loadLibrary();
	}

	close(): void {
		this.screen = "closed";
		this.room = null;
		this.drafts = [];
		this.issues = [];
		this.resized = false;
		this.notice = null;
	}

	backToTemplates(): void {
		this.screen = "templates";
		this.room = null;
		this.drafts = [];
		this.issues = [];
		this.resized = false;
	}

	pick(room: RoomSpec, ready: readonly ProviderId[]): void {
		this.notice = null;
		this.room = room;
		this.drafts = draftPlaces(room, ready);
		this.resized = false;
		this.screen = "seating";
		void this.check();
	}

	/** Your agents became known: fill the places still empty. */
	fillAgents(ready: readonly ProviderId[]): void {
		const room = this.room;
		if (!room || ready.length === 0 || this.drafts.every((draft) => draft.provider)) return;
		this.drafts = withAgents(room, this.drafts, ready);
		void this.check();
	}

	change(key: string, change: Partial<PlaceDraft>): void {
		this.drafts = this.drafts.map((draft) =>
			placeKey(draft.seat, draft.place) === key ? { ...draft, ...change } : draft,
		);
		void this.check();
	}

	setCount(seat: string, count: number): void {
		if (!this.room) return;
		const resized = resizeSeat(this.drafts, this.room, seat, count);
		this.room = resized.room;
		this.drafts = resized.drafts;
		const saved = this.spec(this.room.id);
		this.resized = this.room.seats.some(
			(candidate) =>
				candidate.count !== saved?.seats.find((other) => other.seat === candidate.seat)?.count,
		);
		void this.check();
	}

	/** Ask the kernel what stops this seating; the last answer wins. */
	private async check(): Promise<void> {
		const room = this.room;
		if (!room) return;
		const generation = ++this.checkGeneration;
		try {
			// A changed number of places is checked on saving, against the room it becomes.
			const issues = this.resized ? [] : await service.check(room.id, toAssignments(this.drafts));
			if (generation !== this.checkGeneration) return;
			this.issues = issues;
		} catch (e) {
			if (generation === this.checkGeneration) this.error = message(e);
		}
	}

	/** Save what is on screen as a room of yours, and keep seating it. */
	async saveAs(name: string): Promise<boolean> {
		const room = this.room;
		const library = this.library;
		if (!room || !library || !name.trim()) return false;
		this.busy = true;
		this.error = null;
		try {
			const taken = library.rooms.map((candidate) => candidate.id);
			const tailored = tailoredRoom(room, name, taken);
			const saved = await service.save("room", JSON.stringify(tailored));
			if ("problems" in saved) {
				this.issues = saved.problems;
				return false;
			}
			await this.loadLibrary();
			this.room = this.spec(saved.saved) ?? tailored;
			this.resized = false;
			this.notice = tailored.name;
			await this.check();
			return true;
		} catch (e) {
			this.error = message(e);
			return false;
		} finally {
			this.busy = false;
		}
	}

	/** Delete a room, role or character of yours. */
	async remove(kind: LibraryKind, id: string): Promise<void> {
		this.error = null;
		try {
			const problems = await service.remove(kind, id);
			if (problems.length > 0) this.error = problems.map((issue) => issue.problem).join("; ");
			await this.loadLibrary();
		} catch (e) {
			this.error = message(e);
		}
	}

	/** Open the room; resolves to its session id. */
	async start(projectId: string): Promise<string | null> {
		const room = this.room;
		if (!room || this.resized) return null;
		this.busy = true;
		this.error = null;
		try {
			const thread = await service.start(projectId, room.id, toAssignments(this.drafts));
			this.threads = { ...this.threads, [thread.sessionId]: thread };
			this.close();
			return thread.sessionId;
		} catch (e) {
			this.error = message(e);
			logError(LOG_TARGET, `roomStart failed — ${this.error}`);
			return null;
		} finally {
			this.busy = false;
		}
	}

	// ── A seated room ──

	/** Dispatch only: the events say how it goes. */
	async ask(sessionId: string, text: string): Promise<void> {
		this.error = null;
		const { [sessionId]: _old, ...failures } = this.failures;
		this.failures = failures;
		this.asking = { ...this.asking, [sessionId]: true };
		try {
			await agenthubState.connect();
			await service.ask(sessionId, text);
		} catch (e) {
			const { [sessionId]: _done, ...still } = this.asking;
			this.asking = still;
			this.failures = { ...this.failures, [sessionId]: message(e) };
		}
	}

	async cancel(sessionId: string): Promise<void> {
		try {
			await service.cancel(sessionId);
		} catch (e) {
			this.error = message(e);
		}
	}

	async answer(
		sessionId: string,
		place: string,
		request: string,
		choice: string | null,
	): Promise<void> {
		try {
			await service.answer(sessionId, place, request, choice);
		} catch (e) {
			this.error = message(e);
		}
		await agenthubState.refresh();
	}

	/** Whether one seated place gets your notes, from its next turn on. */
	async setPlaceNotes(sessionId: string, place: string, notes: boolean): Promise<void> {
		this.error = null;
		try {
			await service.setPlaceNotes(sessionId, place, notes);
			const thread = this.threads[sessionId];
			if (!thread) return;
			this.threads = {
				...this.threads,
				[sessionId]: {
					...thread,
					seating: thread.seating.map((assignment) =>
						placeKey(assignment.seat, assignment.place) === place
							? { ...assignment, notes }
							: assignment,
					),
				},
			};
		} catch (e) {
			this.error = message(e);
		}
	}
}

export const roomsState = new RoomsStore();
