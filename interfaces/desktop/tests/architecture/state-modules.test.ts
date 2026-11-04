/**
 * The state pattern: a domain's state lives in `data-access/`, in a
 * `<name>.state.svelte.ts` that exports `<name>State`. The registry lists every
 * such file on disk. Modules that break the pattern today are named, so the
 * lists can only shrink: a new offender fails, and so does a fixed one still
 * on the list.
 */

import { readdirSync, readFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { describe, expect, it } from "vitest";
import { stateRegistry } from "#lib/sys/registries/state/state.registry.js";

const SRC = join(__dirname, "../../src");

function stateFiles(dir: string, out: string[] = []): string[] {
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const full = join(dir, entry.name);
		if (entry.isDirectory()) stateFiles(full, out);
		else if (entry.name.endsWith(".state.svelte.ts")) out.push(full);
	}
	return out;
}

const toPath = (file: string): string => relative(SRC, file).split(sep).join("/");

/** Domain state outside `data-access/`. */
const OUTSIDE_DATA_ACCESS = [
	"lib/domains/app/models/feature/setup-wizard/wizard.state.svelte.ts",
	"lib/domains/clyffy/learning/learning.state.svelte.ts",
	"lib/domains/clyffy/status/clyffy.state.svelte.ts",
];

/** State modules whose export does not follow from their file name. */
const OTHER_EXPORT_NAME = [
	"lib/domains/app/minions/data-access/overlay.state.svelte.ts",
	"lib/domains/app/models/feature/downloader/data-access/downloader.state.svelte.ts",
	"lib/domains/app/onboarding/data-access/repo-scan.state.svelte.ts",
	"lib/domains/app/onboarding/data-access/you-form.state.svelte.ts",
	"lib/domains/app/voice/data-access/voice-config.state.svelte.ts",
	"lib/domains/clyffy/learning/learning.state.svelte.ts",
	"lib/domains/clyffy/status/clyffy.state.svelte.ts",
	"lib/domains/infra/ollama/data-access/sidecar.state.svelte.ts",
	"lib/domains/infra/surreal/data-access/sidecar.state.svelte.ts",
];

describe("state modules", () => {
	const files = stateFiles(join(SRC, "lib"));
	const paths = files.map(toPath).sort();

	it("are all in the registry, under distinct ids", () => {
		const registered = [...stateRegistry.getAll().values()].map((m) => m.path).sort();
		expect(registered).toEqual(paths);
	});

	it("live in data-access/ when they belong to a domain", () => {
		const outside = paths.filter(
			(p) => p.startsWith("lib/domains/") && !p.includes("/data-access/"),
		);
		expect(outside).toEqual([...OUTSIDE_DATA_ACCESS].sort());
	});

	it("export <name>State", () => {
		const others = files
			.filter((file) => {
				const name = (file.split(sep).pop() ?? "")
					.replace(".state.svelte.ts", "")
					.replace(/-(.)/g, (_, letter: string) => letter.toUpperCase());
				return !new RegExp(`export const ${name}State\\b`).test(readFileSync(file, "utf8"));
			})
			.map(toPath)
			.sort();
		expect(others).toEqual([...OTHER_EXPORT_NAME].sort());
	});
});
