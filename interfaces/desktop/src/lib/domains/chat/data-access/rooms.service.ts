/**
 * @file Rooms IPC boundary: the only place this domain talks to the room commands.
 * @module @devpulse/domains/chat/data-access/rooms.service
 */

import {
	type Assignment,
	commands,
	events,
	type Issue,
	type Library,
	type LibraryKind,
	type RoomStreamed,
	type RoomThread,
} from "#lib/sys/generated/bindings.js";

function ok<T>(result: { status: "ok"; data: T } | { status: "error"; error: string }): T {
	if (result.status === "error") throw new Error(result.error);
	return result.data;
}

export async function library(): Promise<Library> {
	return ok(await commands.roomLibrary());
}

export async function threads(projectId: string): Promise<RoomThread[]> {
	return ok(await commands.roomThreads(projectId));
}

/** What stops this seating, at the place it is in. */
export async function check(roomId: string, seating: Assignment[]): Promise<Issue[]> {
	return ok(await commands.roomCheck(roomId, seating));
}

export async function start(
	projectId: string,
	roomId: string,
	seating: Assignment[],
): Promise<RoomThread> {
	return ok(await commands.roomStart(projectId, roomId, seating));
}

export async function ask(sessionId: string, text: string): Promise<void> {
	ok(await commands.roomAsk(sessionId, text));
}

export async function cancel(sessionId: string): Promise<void> {
	ok(await commands.roomCancel(sessionId));
}

export async function answer(
	sessionId: string,
	place: string,
	request: string,
	choice: string | null,
): Promise<void> {
	ok(await commands.roomAnswer(sessionId, place, request, choice));
}

export async function setPlaceNotes(
	sessionId: string,
	place: string,
	notes: boolean,
): Promise<void> {
	ok(await commands.roomSetPlaceNotes(sessionId, place, notes));
}

/** Everything wrong with a file comes back at the field it is in. */
export type SaveResult = { saved: string } | { problems: Issue[] };

export async function save(kind: LibraryKind, text: string): Promise<SaveResult> {
	const result = await commands.roomLibrarySave(kind, text);
	return result.status === "ok" ? { saved: result.data } : { problems: result.error };
}

export async function remove(kind: LibraryKind, id: string): Promise<Issue[]> {
	const result = await commands.roomLibraryRemove(kind, id);
	return result.status === "ok" ? [] : result.error;
}

export function onStreamed(receive: (streamed: RoomStreamed) => void) {
	return events.roomStreamed.listen((event) => receive(event.payload));
}
