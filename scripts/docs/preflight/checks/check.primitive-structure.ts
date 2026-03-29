import fs from "fs";
import path from "path";
import { registry } from "../engine/registry.js";
import type { Check, CheckContext, CheckResult } from "../types.js";

const REQUIRED_FILES = ["types.ts", "index.ts", "anatomy.ts"];
const EXCLUDED_DIRS = ["_archive", "tanstack", ".claude", "sprints"];

/** Layout primitives render directly — they MUST have a .svelte file */
const LAYOUT_PRIMITIVES = [
	"stack",
	"row",
	"separator",
	"dot",
	"icon-slot",
	"surface",
	"text",
	"heading",
	"label",
];

function getPrimitiveDirs(designRoot: string): string[] {
	const primitivesDir = path.join(designRoot, "lib/design/primitives");
	if (!fs.existsSync(primitivesDir)) return [];

	return fs
		.readdirSync(primitivesDir, { withFileTypes: true })
		.filter((d) => d.isDirectory() && !EXCLUDED_DIRS.includes(d.name))
		.map((d) => d.name);
}

const primitiveStructureCheck: Check = {
	id: "primitive-structure",
	name: "Primitive Folder Structure",
	description:
		"Every primitive must have types.ts, index.ts, and anatomy.ts. Layout primitives must also have a .svelte file.",

	async run(ctx: CheckContext): Promise<CheckResult[]> {
		const results: CheckResult[] = [];
		const dirs = getPrimitiveDirs(ctx.targetRoot);

		if (dirs.length === 0) {
			results.push({
				checkId: "primitive-structure",
				status: "skip",
				severity: "info",
				message: "No primitive directories found",
			});
			return results;
		}

		for (const dir of dirs) {
			const primDir = path.join(
				ctx.targetRoot,
				"lib/design/primitives",
				dir,
			);
			const files = fs.readdirSync(primDir);
			const isLayout = LAYOUT_PRIMITIVES.includes(dir);

			// Check required files: types.ts, index.ts, anatomy.ts
			for (const required of REQUIRED_FILES) {
				if (!files.includes(required)) {
					const hint =
						required === "anatomy.ts"
							? `Create it with: import { createAnatomy } from "../../schema/anatomy.schema.js";\nexport const ${dir.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())}Anatomy = createAnatomy("${dir}", ["root"] as const);`
							: required === "types.ts"
								? `Create it with the primitive's prop interface extending HTMLAttributes.`
								: `Create it with: export { ${dir.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())}Anatomy } from "./anatomy.js";`;

					results.push({
						checkId: "primitive-structure",
						status: "fail",
						severity: "error",
						message: `primitives/${dir}/ missing ${required}`,
						file: `lib/design/primitives/${dir}/${required}`,
						suggestion: hint,
					});
				}
			}

			// Layout primitives must have .svelte — they ARE the rendered output
			if (isLayout) {
				const hasSvelte = files.some((f) => f.endsWith(".svelte"));
				if (!hasSvelte) {
					results.push({
						checkId: "primitive-structure",
						status: "fail",
						severity: "error",
						message: `primitives/${dir}/ is a layout primitive — must have a .svelte file`,
						file: `lib/design/primitives/${dir}/`,
						suggestion: `Layout primitives (${LAYOUT_PRIMITIVES.join(", ")}) render directly. Add a .svelte component.`,
					});
				}
			}
		}

		if (!results.some((r) => r.status === "fail")) {
			results.push({
				checkId: "primitive-structure",
				status: "pass",
				severity: "info",
				message: `All ${dirs.length} primitive folders have required structure (types.ts + index.ts + anatomy.ts)`,
			});
		}

		return results;
	},
};

registry.registerCheck(primitiveStructureCheck);
export { primitiveStructureCheck };
