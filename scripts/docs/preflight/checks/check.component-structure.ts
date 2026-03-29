/**
 * @file preflight/checks/check.component-structure.ts
 * @description Macro Law enforcement for ColdLight components.
 *
 * Every component folder must have:
 * - types.ts (prop interfaces)
 * - index.ts (public exports)
 * - At least one .svelte file
 *
 * Every component .svelte file must:
 * - Import resolveMacro from style-macro (Law 1)
 * - Have data-kind on semantic root (Law 2 — via m.dataAttrs spread)
 * - Use preset prop, NOT intent prop (Law 1)
 *
 * Error messages are instructive — they tell AI/vibers exactly what to do.
 * ColdLight teaches, not just blocks.
 */

import fs from "fs";
import path from "path";
import { registry } from "../engine/registry.js";
import type { Check, CheckContext, CheckResult } from "../types.js";

const REQUIRED_FILES = ["types.ts", "index.ts"];
const EXCLUDED_DIRS = [".claude", "sprints", "_transport", "_base"];

function getComponentDirs(designRoot: string): string[] {
	const componentsDir = path.join(designRoot, "lib/design/components");
	if (!fs.existsSync(componentsDir)) return [];

	return fs
		.readdirSync(componentsDir, { withFileTypes: true })
		.filter(
			(d) =>
				d.isDirectory() &&
				!EXCLUDED_DIRS.includes(d.name) &&
				!d.name.startsWith("."),
		)
		.map((d) => d.name);
}

function checkMacroLaw(
	content: string,
	filePath: string,
	kind: string,
): CheckResult[] {
	const results: CheckResult[] = [];
	const rel = filePath;

	// Law 1: Must import resolveMacro from style-macro
	if (!content.includes("style-macro")) {
		results.push({
			checkId: "component-structure",
			status: "fail",
			severity: "error",
			message: `${rel} — missing resolveMacro import`,
			file: rel,
			suggestion: [
				'Add: import { resolveMacro, cssVarString } from "$lib/design/style-macro";',
				`Then: const m = $derived(resolveMacro({ kind: "${kind}", preset }));`,
				"Then: spread {...m.dataAttrs} and style={cssVarString(m.cssVars)} on root element",
				"Docs: MACRO-LAW.md Law 1 — One public styling path",
			].join("\n  "),
		});
	}

	// Law 2: Must have data-kind (via dataAttrs spread or direct attribute)
	if (
		!content.includes("data-kind") &&
		!content.includes("m.dataAttrs") &&
		!content.includes("dataAttrs")
	) {
		results.push({
			checkId: "component-structure",
			status: "fail",
			severity: "error",
			message: `${rel} — missing data-kind on semantic root`,
			file: rel,
			suggestion: [
				"Spread m.dataAttrs on your root element: {...m.dataAttrs}",
				"This adds data-kind and data-cl-* family markers automatically",
				"The root element must be the SEMANTIC element (button, article, nav) — no wrapper divs",
				"Docs: MACRO-LAW.md Law 2 — No wrapper elements",
			].join("\n  "),
		});
	}

	// Law 1 (preset check): Should NOT use intent as a prop
	if (
		content.includes("intent:") &&
		content.includes("interface") &&
		!content.includes("resolveIntent")
	) {
		results.push({
			checkId: "component-structure",
			status: "fail",
			severity: "error",
			message: `${rel} — uses "intent" prop instead of "preset"`,
			file: rel,
			suggestion: [
				'Replace intent prop with preset prop: preset?: string (default "default")',
				"Presets are pre-composed visual recipes. Components don't decompose axes.",
				'Example: <Button preset="compact-teal-glass">Save</Button>',
				"Docs: MACRO-LAW.md Law 1 — Why no axis props on components",
			].join("\n  "),
		});
	}

	return results;
}

const componentStructureCheck: Check = {
	id: "component-structure",
	name: "Component Structure + Macro Law",
	description:
		"Every component: types.ts + index.ts + .svelte with resolveMacro + data-kind + preset (not intent)",

	async run(ctx: CheckContext): Promise<CheckResult[]> {
		const results: CheckResult[] = [];
		const dirs = getComponentDirs(ctx.targetRoot);

		if (dirs.length === 0) {
			results.push({
				checkId: "component-structure",
				status: "skip",
				severity: "info",
				message: "No component directories found",
			});
			return results;
		}

		for (const dir of dirs) {
			const compDir = path.join(
				ctx.targetRoot,
				"lib/design/components",
				dir,
			);
			const files = fs.readdirSync(compDir);

			// Required files: types.ts, index.ts
			for (const required of REQUIRED_FILES) {
				if (!files.includes(required)) {
					results.push({
						checkId: "component-structure",
						status: "fail",
						severity: "error",
						message: `components/${dir}/ missing ${required}`,
						file: `lib/design/components/${dir}/${required}`,
						suggestion:
							required === "types.ts"
								? `Create ${required} with your component's Props interface. Export it for consumers.`
								: `Create ${required} with: export { default as ${dir.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase()).replace(/^[a-z]/, (c) => c.toUpperCase())} } from "./${dir.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase()).replace(/^[a-z]/, (c) => c.toUpperCase())}.svelte";`,
					});
				}
			}

			// Must have at least one .svelte file
			const svelteFiles = files.filter(
				(f) => f.endsWith(".svelte") && !f.includes(".test."),
			);
			if (svelteFiles.length === 0) {
				results.push({
					checkId: "component-structure",
					status: "fail",
					severity: "error",
					message: `components/${dir}/ has no .svelte component file`,
					file: `lib/design/components/${dir}/`,
				});
				continue;
			}

			// Macro Law checks on each .svelte file
			for (const svelteFile of svelteFiles) {
				const filePath = path.join(compDir, svelteFile);
				const content = fs.readFileSync(filePath, "utf-8");
				const relPath = `lib/design/components/${dir}/${svelteFile}`;
				const macroResults = checkMacroLaw(content, relPath, dir);
				results.push(...macroResults);
			}
		}

		if (!results.some((r) => r.status === "fail")) {
			results.push({
				checkId: "component-structure",
				status: "pass",
				severity: "info",
				message: `All ${dirs.length} component folders pass Macro Law checks`,
			});
		}

		return results;
	},
};

registry.registerCheck(componentStructureCheck);
export { componentStructureCheck };
