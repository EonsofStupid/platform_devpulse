/**
 * The subscription boundary (`sys/streams/README.md`): domains do not create
 * their own streams. Raw `listen()` belongs to the boundary modules below.
 * The files that still call it are named, so the list can only shrink: a new
 * caller fails, and so does a migrated one still on the list.
 */

import { readdirSync, readFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { describe, expect, it } from "vitest";

const SRC = join(__dirname, "../../src");

/** The boundary: what may call Tauri's `listen()`. */
const BOUNDARY = [
	"lib/sys/events/capability-channel.svelte.ts",
	"lib/sys/generated/bindings.ts",
	"lib/sys/runes/useTauriEvent.svelte.ts",
	"lib/sys/streams/tauri-event.svelte.ts",
];

/** Files that still subscribe for themselves, to move onto the boundary. */
const STILL_OUTSIDE = [
	"lib/devtools/clyffy/memory/intelligence/feature/IntelligenceMemoryStream.svelte",
	"lib/domains/app/models/data-access/download.service.ts",
	"lib/domains/app/models/data-access/inference.service.ts",
	"lib/domains/app/models/data-access/narration.state.svelte.ts",
	"lib/domains/app/models/data-access/swap.state.svelte.ts",
	"lib/domains/app/models/feature/components/ModelSearch.svelte",
	"lib/domains/app/models/feature/setup-wizard/download-bootstrap.ts",
	"lib/domains/app/updates/data-access/updates.state.svelte.ts",
	"lib/sys/activity-hud/download.state.svelte.ts",
	"lib/sys/activity-hud/install.state.svelte.ts",
	"lib/sys/bindings/window/navigation.ts",
	"lib/sys/data-access/rrd/rrd.state.svelte.ts",
	"lib/sys/data-access/rro/rro.state.svelte.ts",
	"lib/sys/data-access/rro/rroState.svc.ts",
];

function sourceFiles(dir: string, out: string[] = []): string[] {
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const full = join(dir, entry.name);
		if (entry.isDirectory()) sourceFiles(full, out);
		else if (/\.(ts|svelte)$/.test(entry.name) && !/\.test\.ts$/.test(entry.name)) out.push(full);
	}
	return out;
}

describe("subscription boundary", () => {
	it("holds: only the boundary and the named files import Tauri's listen", () => {
		const importsListen = /from\s+["']@tauri-apps\/api\/event["']/;
		const callers = sourceFiles(join(SRC, "lib"))
			.filter((file) => importsListen.test(readFileSync(file, "utf8")))
			.map((file) => relative(SRC, file).split(sep).join("/"))
			.filter((path) => !BOUNDARY.includes(path))
			.sort();
		expect(callers).toEqual([...STILL_OUTSIDE].sort());
	});
});
