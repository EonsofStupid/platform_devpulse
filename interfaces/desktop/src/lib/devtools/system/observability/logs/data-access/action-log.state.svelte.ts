/**
 * @file action-log.state.svelte.ts — the Action log's lines and filter.
 * @module @devpulse/devtools/system/observability/logs
 *
 * Today's lines, appended as the file grows: each read starts where the last
 * one ended (a byte offset), so nothing is read twice. One instance for the
 * app, so the lines already read survive leaving and reopening the devtool.
 * `PolledQuery` paces the reads (it pauses while the window is hidden).
 */

import type { ActionLogTail, CommandError, Result } from "#lib/sys/generated/bindings.js";
import { tailActionLog } from "./action-log.service.js";

/** How often the devtool reads new lines: the cadence the page has always tailed at. */
export const TAIL_INTERVAL_MS = 500;

class ActionLogState {
	/** Today's lines, oldest first, as the file holds them. */
	lines = $state<string[]>([]);
	/** The filter field's text. */
	filter = $state("");

	/** Where the next read starts in today's file. */
	private offset = 0;

	/** The lines that contain the filter, ignoring case; every line while it is empty. */
	readonly filtered = $derived.by(() => {
		const query = this.filter.trim().toLowerCase();
		return query ? this.lines.filter((line) => line.toLowerCase().includes(query)) : this.lines;
	});

	/** Read what was appended since the last read. */
	async pull(): Promise<Result<ActionLogTail, CommandError>> {
		const result = await tailActionLog(this.offset);
		if (result.status === "ok") {
			if (result.data.lines.length > 0) this.lines.push(...result.data.lines);
			this.offset = result.data.next_offset;
		}
		return result;
	}
}

export const actionLogState = new ActionLogState();
