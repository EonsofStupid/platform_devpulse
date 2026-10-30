/** @file Catalog and read-only paging over the single AgentHub runtime. */
import type { FoundEvent, FoundSession, FoundSessions } from "$lib/sys/generated/bindings.js";
import * as service from "./agenthub.service.js";

export const sessionKey = (session: Pick<FoundSession, "providerId" | "locator">) =>
	JSON.stringify([session.providerId, session.locator]);

export interface SessionGroup {
	session: FoundSession;
	children: SessionGroup[];
}

/** Preserve catalog order and artifact identity; unmatched children stay visible. */
export function sessionGroups(sessions: FoundSession[], query = ""): SessionGroup[] {
	const nodes = new Map(
		sessions.map((session) => [sessionKey(session), { session, children: [] as SessionGroup[] }]),
	);
	const roots: SessionGroup[] = [];
	for (const node of nodes.values()) {
		const parent =
			node.session.parentResolution === "resolved" && node.session.parentLocator
				? nodes.get(
						sessionKey({
							providerId: node.session.providerId,
							locator: node.session.parentLocator,
						}),
					)
				: undefined;
		if (parent && parent !== node) parent.children.push(node);
		else roots.push(node);
	}
	const needle = query.trim().toLocaleLowerCase();
	if (!needle) return roots;
	const matches = (node: SessionGroup): boolean =>
		`${node.session.title} ${node.session.workspace} ${node.session.providerId}`
			.toLocaleLowerCase()
			.includes(needle) || node.children.some(matches);
	// Keep the family together when a child matches so its context is not lost.
	return roots.filter(matches);
}

const message = (error: unknown) => (error instanceof Error ? error.message : String(error));

export class HistoryStore {
	catalog = $state<FoundSessions | null>(null);
	loading = $state(false);
	error = $state<string | null>(null);
	selected = $state<FoundSession | null>(null);
	events = $state<FoundEvent[]>([]);
	pageLoading = $state(false);
	pageError = $state<string | null>(null);
	nextCursor = $state<string | null>(null);
	truncatedBefore = $state(false);
	private generation = 0;
	private refreshing: Promise<void> | null = null;

	refresh(): Promise<void> {
		this.refreshing ??= this.loadCatalog().finally(() => {
			this.refreshing = null;
		});
		return this.refreshing;
	}

	private async loadCatalog(): Promise<void> {
		this.loading = true;
		this.error = null;
		try {
			this.catalog = await service.sessions();
		} catch (error) {
			this.error = message(error);
		} finally {
			this.loading = false;
		}
	}

	async select(session: FoundSession): Promise<void> {
		const generation = ++this.generation;
		this.selected = session;
		this.events = [];
		this.nextCursor = null;
		this.truncatedBefore = false;
		this.pageLoading = true;
		this.pageError = null;
		await this.loadPage(session, null, generation);
	}

	async older(): Promise<void> {
		if (!this.selected || !this.nextCursor || this.pageLoading) return;
		this.pageLoading = true;
		this.pageError = null;
		await this.loadPage(this.selected, this.nextCursor, this.generation);
	}

	private async loadPage(
		session: FoundSession,
		cursor: string | null,
		generation: number,
	): Promise<void> {
		try {
			const page = await service.transcript(session.providerId, session.locator, cursor);
			if (generation !== this.generation) return;
			if (page.providerId !== session.providerId || page.locator !== session.locator)
				throw new Error(
					"The transcript response belongs to another session. Select the session again.",
				);
			if (cursor && page.nextCursor === cursor)
				throw new Error("The transcript cursor did not advance. Select the session again.");
			this.events = cursor ? [...page.events, ...this.events] : page.events;
			this.nextCursor = page.nextCursor;
			this.truncatedBefore = page.truncatedBefore;
		} catch (error) {
			if (generation === this.generation) this.pageError = message(error);
		} finally {
			if (generation === this.generation) this.pageLoading = false;
		}
	}
}

export const historyState = new HistoryStore();
