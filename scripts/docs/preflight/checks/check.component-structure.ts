/**
 * @file preflight/checks/check.component-structure.ts
 * @description Macro Law enforcement for ColdLight components.
 *
 * Structural checks:
 * - index.ts exists (public API barrel)
 * - types.ts OR {kind}.types.ts exists (prop interfaces)
 * - At least one .svelte file exists
 *
 * Macro Law checks (per .svelte file):
 * - Root component: must import renderForge + have data-kind
 * - Sub-component with context: exempt from renderForge (inherits from parent)
 * - Renderless root (no DOM output): exempt from data-kind
 * - No "intent" prop (use "preset" instead)
 */

import fs from "fs";
import path from "path";
import { registry } from "../engine/registry.js";
import type { Check, CheckContext, CheckResult } from "../types.js";

const EXCLUDED_DIRS = [".claude", "sprints", "_transport", "_base", "_internal", "tree"];

function getComponentDirs(designRoot: string): string[] {
	const componentsDir = path.join(designRoot, "components");
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

/** Convert kebab-case to PascalCase: "alert-dialog" → "AlertDialog" */
function toPascal(kind: string): string {
	return kind
		.split("-")
		.map((s) => s.charAt(0).toUpperCase() + s.slice(1))
		.join("");
}

/**
 * Classify a .svelte file within a component folder.
 *
 * - "root": The main component (Button.svelte, Dialog.svelte)
 * - "sub": A compound child (DialogContent.svelte, AccordionTrigger.svelte)
 */
function classifyFile(
	fileName: string,
	kind: string,
): "root" | "sub" {
	const rootName = `${toPascal(kind)}.svelte`;
	return fileName === rootName ? "root" : "sub";
}

/**
 * Detect if a .svelte file is renderless (no DOM output).
 * Renderless components are context providers that just render children.
 * They don't have a semantic root element, so data-kind doesn't apply.
 */
function isRenderless(content: string): boolean {
	// Extract everything after </script>
	const templateStart = content.lastIndexOf("</script>");
	if (templateStart === -1) return true;
	const template = content.slice(templateStart + 9).trim();

	// If the template is ONLY {@render children?.()} with optional whitespace/comments
	// it's renderless — no DOM element to put data-kind on
	const stripped = template
		.replace(/<!--[\s\S]*?-->/g, "")
		.replace(/\{@render\s+children\?\.\(\)\}/g, "")
		.trim();

	return stripped === "" || stripped === "{@render children?.()}";
}

function checkMacroLaw(
	content: string,
	filePath: string,
	kind: string,
	fileName: string,
): CheckResult[] {
	const results: CheckResult[] = [];
	const rel = filePath;
	const role = classifyFile(fileName, kind);
	const renderless = isRenderless(content);

	// Determine if renderForge is required for this file
	// Only ROOT components that render DOM need renderForge.
	// Sub-components either inherit from parent context OR are structural
	// wrappers (separators, groups, announce regions) — neither needs its own resolver.
	const needsResolveMacro = role === "root" && !renderless;

	// Law 1: renderForge import
	// Accept renderforge (HTML components) OR svg/index (SVG components)
	const hasStyleResolver =
		content.includes("renderforge") || content.includes("resolveSvgMacro");

	if (needsResolveMacro && !hasStyleResolver) {
		results.push({
			checkId: "component-structure",
			status: "fail",
			severity: "error",
			message: `${rel} — missing renderForge import`,
			file: rel,
			suggestion: [
				'Add: import { renderForge, cssVarString } from "#coldlight/renderforge";',
				`Then: const m = $derived(renderForge({ kind: "${kind}", preset }));`,
				"Then: spread {...m.dataAttrs} and style={cssVarString(m.cssVars)} on root element",
			].join("\n  "),
		});
	}

	// Law 2: data-kind on semantic root
	// Skip: renderless roots, ALL sub-components (they get data-kind from anatomy spreads
	// or manual attributes — the parent owns the kind, subs are slots)
	const needsDataKind = role === "root" && !renderless;

	if (
		needsDataKind &&
		!content.includes("data-kind") &&
		!content.includes("dataAttrs") &&
		!content.includes("Anatomy")
	) {
		results.push({
			checkId: "component-structure",
			status: "fail",
			severity: "error",
			message: `${rel} — missing data-kind on semantic root`,
			file: rel,
			suggestion: [
				"Spread anatomy attrs or m.dataAttrs on your root element",
				"This adds data-kind and data-cl-* family markers automatically",
			].join("\n  "),
		});
	}

	// Law 1 (preset check): Should NOT use intent as a prop in types
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
			suggestion: 'Replace intent prop with preset prop: preset?: string (default "primary")',
		});
	}

	return results;
}

const componentStructureCheck: Check = {
	id: "component-structure",
	name: "Component Structure + Macro Law",
	description:
		"Every component: types + index.ts + .svelte with renderForge + data-kind + preset",

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
				"components",
				dir,
			);
			const files = fs.readdirSync(compDir);

			// ── Structural: index.ts ────────────────────────────────
			if (!files.includes("index.ts")) {
				results.push({
					checkId: "component-structure",
					status: "fail",
					severity: "error",
					message: `components/${dir}/ missing index.ts`,
					file: `packages/coldlight/components/${dir}/index.ts`,
					suggestion: `Create index.ts: export { default as ${toPascal(dir)} } from "./${toPascal(dir)}.svelte";`,
				});
			}

			// ── Structural: types file (types.ts OR {kind}.types.ts) ─
			const hasTypes = files.some(
				(f) => f === "types.ts" || f.endsWith(".types.ts"),
			);
			if (!hasTypes) {
				results.push({
					checkId: "component-structure",
					status: "fail",
					severity: "error",
					message: `components/${dir}/ missing types (types.ts or ${dir}.types.ts)`,
					file: `packages/coldlight/components/${dir}/types.ts`,
					suggestion:
						"Create types.ts with your component's Props interface extending its PrimitiveProps.",
				});
			}

			// ── Structural: at least one .svelte file ────────────────
			const svelteFiles = files.filter(
				(f) => f.endsWith(".svelte") && !f.includes(".test."),
			);
			if (svelteFiles.length === 0) {
				results.push({
					checkId: "component-structure",
					status: "fail",
					severity: "error",
					message: `components/${dir}/ has no .svelte component file`,
					file: `packages/coldlight/components/${dir}/`,
				});
				continue;
			}

			// ── Macro Law checks per .svelte file ────────────────────
			for (const svelteFile of svelteFiles) {
				const filePath = path.join(compDir, svelteFile);
				const content = fs.readFileSync(filePath, "utf-8");
				const relPath = `packages/coldlight/components/${dir}/${svelteFile}`;
				const macroResults = checkMacroLaw(
					content,
					relPath,
					dir,
					svelteFile,
				);
				results.push(...macroResults);
			}
		}

		if (!results.some((r) => r.status === "fail")) {
			results.push({
				checkId: "component-structure",
				status: "pass",
				severity: "info",
				message: `All ${dirs.length} component folders pass structure + Macro Law checks`,
			});
		}

		return results;
	},
};

registry.registerCheck(componentStructureCheck);
export { componentStructureCheck };
