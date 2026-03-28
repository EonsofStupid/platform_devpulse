import { readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const root = resolve(import.meta.dirname, "..");
const base = join(root, "src/lib/design/primitives");
const dirs = readdirSync(base, { withFileTypes: true }).filter((d) => d.isDirectory());

let pass = 0;
let fail = 0;

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
	} catch (e: unknown) {
		const msg = e instanceof Error ? e.message.slice(0, 120) : String(e);
		console.log("FAIL:", dir.name, "|", msg);
		fail++;
	}
}

console.log("");
console.log(`=== ${pass} passed, ${fail} failed, ${dirs.length} total ===`);

if (fail > 0) process.exit(1);
