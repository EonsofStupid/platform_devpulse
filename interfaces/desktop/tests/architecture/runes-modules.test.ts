/**
 * Runes compile only in `.svelte` and `.svelte.ts` modules. In a plain `.ts`
 * module `$state(...)` type-checks (the rune types are ambient), so
 * svelte-check passes — and the page that imports it fails at runtime with
 * `rune_outside_svelte`.
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { describe, expect, it } from "vitest";

const SRC = join(__dirname, "../../src");

function plainTsFiles(dir: string, out: string[] = []): string[] {
	for (const entry of readdirSync(dir)) {
		const full = join(dir, entry);
		if (statSync(full).isDirectory()) plainTsFiles(full, out);
		else if (entry.endsWith(".ts") && !entry.endsWith(".svelte.ts") && !entry.endsWith(".d.ts"))
			out.push(full);
	}
	return out;
}

/** Code without comments, so prose that names a rune is not a call. */
function withoutComments(text: string): string {
	return text.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'`])\/\/.*$/gm, "$1");
}

const RUNE_CALL =
	/(^|[^\w$.`'"])\$(state|derived|effect|props|bindable|inspect|host)(\.\w+)?\s*[<(]/m;

describe("runes", () => {
	it("are called only in .svelte / .svelte.ts modules", () => {
		const offenders = plainTsFiles(SRC)
			.filter((file) => RUNE_CALL.test(withoutComments(readFileSync(file, "utf8"))))
			.map((file) => relative(SRC, file).split(sep).join("/"));
		expect(offenders).toEqual([]);
	});
});
