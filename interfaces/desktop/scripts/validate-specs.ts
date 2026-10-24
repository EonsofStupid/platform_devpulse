/**
 * Validate every ColdLight primitive spec and check it against its anatomy.
 *
 * A spec (`packages/coldlight/primitives/<kind>/<kind>.spec.ts`) is validated
 * by `definePrimitive` on import. Its a11y slots are then compared with the
 * anatomy's parts — the behavior's `<kind>.anatomy.ts`, or the primitive's own
 * `anatomy.ts` for kinds with no behavior — via `validateAnatomyAlignment`.
 * A failed spec or a slot mismatch fails the run.
 */

import { readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const root = resolve(import.meta.dirname, "..");
const coldlight = join(root, "../../packages/coldlight");
const base = join(coldlight, "primitives");
const dirs = readdirSync(base, { withFileTypes: true }).filter((d) => d.isDirectory());

interface AnatomyLike {
	kind: string;
	parts: readonly string[];
}

/** kind → anatomy module: the behavior's, else the primitive's own. */
function anatomyFiles(): Map<string, string> {
	const files = new Map<string, string>();
	for (const entry of readdirSync(join(coldlight, "behaviors"), {
		recursive: true,
		withFileTypes: true,
	})) {
		const match = entry.isFile() && /^([a-z][a-z0-9-]*)\.anatomy\.ts$/.exec(entry.name);
		if (match) files.set(match[1], join(entry.parentPath, entry.name));
	}
	for (const dir of dirs) {
		if (!files.has(dir.name)) files.set(dir.name, join(base, dir.name, "anatomy.ts"));
	}
	return files;
}

function isAnatomy(value: unknown): value is AnatomyLike {
	return (
		typeof value === "object" &&
		value !== null &&
		typeof (value as AnatomyLike).kind === "string" &&
		Array.isArray((value as AnatomyLike).parts)
	);
}

const { validateAnatomyAlignment } = await import(
	pathToFileURL(join(coldlight, "schema/index.ts")).href
);
const anatomies = anatomyFiles();

let pass = 0;
let fail = 0;
let drift = 0;

for (const dir of dirs) {
	const specPath = pathToFileURL(join(base, dir.name, `${dir.name}.spec.ts`)).href;
	try {
		const mod = await import(specPath);
		const specKey = Object.keys(mod).find((k) => k.endsWith("Spec"));
		if (!specKey) {
			console.log("SKIP:", dir.name, "(no spec export)");
			continue;
		}
		const spec = mod[specKey];
		const slots = Object.keys(spec.a11y.slots);
		console.log(
			"PASS:",
			spec.kind,
			"|",
			spec.category,
			"|",
			slots.length,
			"slots:",
			slots.join(", "),
		);
		pass++;

		const anatomyPath = anatomies.get(spec.kind);
		const anatomyMod = anatomyPath ? await import(pathToFileURL(anatomyPath).href) : {};
		const anatomy = Object.values(anatomyMod).find(
			(v): v is AnatomyLike => isAnatomy(v) && v.kind === spec.kind,
		);
		if (!anatomy) {
			console.log("  DRIFT:", spec.kind, "| no anatomy found");
			drift++;
			continue;
		}
		const aligned = validateAnatomyAlignment(spec, anatomy.parts);
		if (!aligned.valid) {
			for (const error of aligned.errors) console.log("  DRIFT:", spec.kind, "|", error);
			drift++;
		}
	} catch (e: unknown) {
		const msg = e instanceof Error ? e.message.slice(0, 120) : String(e);
		console.log("FAIL:", dir.name, "|", msg);
		fail++;
	}
}

console.log("");
console.log(
	`=== ${pass} passed, ${fail} failed, ${dirs.length} total; ${drift} out of line with their anatomy ===`,
);

if (fail > 0 || drift > 0) process.exit(1);
