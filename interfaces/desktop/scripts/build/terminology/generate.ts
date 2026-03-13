/**
 * @file scripts/build/terminology/generate.ts
 * @description Reads kernel_terms.toml (SSOT) and generates typed TypeScript
 * for the frontend terminology registry. Run via `pnpm generate:terminology`.
 *
 * Output: src/lib/sys/generated/terminology.ts
 *
 * This ensures Rust ip_term!() and frontend resolveLabel() are driven
 * by the SAME dictionary with zero hand-maintained duplicates.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "smol-toml";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Paths
const TOML_PATH = resolve(__dirname, "../../../../../systems/devpulse-engine/ip/kernel_terms.toml");
const OUTPUT_PATH = resolve(__dirname, "../../../src/lib/sys/generated/terminology.ts");

// ── Types matching the TOML schema ──────────────────────────

interface RawTerm {
	kernel: string;
	engine: string;
	prod: string;
	dev: string;
	category: string;
	context: string[];
	severity: string;
}

interface RawFeature {
	enabled: boolean;
	prod: string;
	dev: string;
}

interface RawPersonalityAction {
	messages: string[];
}

interface RawToml {
	terms: RawTerm[];
	features: Record<string, RawFeature>;
	personality: Record<string, Record<string, RawPersonalityAction>>;
}

// ── Codegen ─────────────────────────────────────────────────

function generate(): void {
	const raw = readFileSync(TOML_PATH, "utf-8");
	const toml = parse(raw) as unknown as RawToml;

	const terms = toml.terms ?? [];
	const features = toml.features ?? {};
	const personality = toml.personality ?? {};

	const lines: string[] = [];

	// Header
	lines.push("/**");
	lines.push(" * AUTO-GENERATED from kernel_terms.toml — DO NOT EDIT");
	lines.push(` * Generated: ${new Date().toISOString()}`);
	lines.push(" * Source: systems/devpulse-engine/ip/kernel_terms.toml");
	lines.push(" *");
	lines.push(" * Regenerate: pnpm generate:terminology");
	lines.push(" */");
	lines.push("");

	// ── Term interface + map ──

	lines.push("export interface Term {");
	lines.push("\tengine: string;");
	lines.push("\tprod: string;");
	lines.push("\tdev: string;");
	lines.push("\tcategory: string;");
	lines.push("\tcontext: string[];");
	lines.push("}");
	lines.push("");

	// Index by engine name (what the frontend receives from Tauri IPC)
	lines.push("/** Terms indexed by engine name (what crosses the IPC boundary) */");
	lines.push("export const TERMS: Record<string, Term> = {");
	for (const term of terms) {
		lines.push(`\t${JSON.stringify(term.engine)}: {`);
		lines.push(`\t\tengine: ${JSON.stringify(term.engine)},`);
		lines.push(`\t\tprod: ${JSON.stringify(term.prod)},`);
		lines.push(`\t\tdev: ${JSON.stringify(term.dev)},`);
		lines.push(`\t\tcategory: ${JSON.stringify(term.category)},`);
		lines.push(`\t\tcontext: ${JSON.stringify(term.context)},`);
		lines.push("\t},");
	}
	lines.push("};");
	lines.push("");

	// ── Categories (derived) ──

	const categories = [...new Set(terms.map((t) => t.category))];
	lines.push("/** All term categories */");
	lines.push(`export const CATEGORIES = ${JSON.stringify(categories)} as const;`);
	lines.push(`export type TermCategory = (typeof CATEGORIES)[number];`);
	lines.push("");

	// ── Store terms (subset for boot/status UI) ──

	const storeTerms = terms.filter((t) => t.category === "stores");
	lines.push("/** Store terms for boot/status display — indexed by engine step name */");
	lines.push("export const STORE_TERMS: Record<string, Term> = {");
	for (const term of storeTerms) {
		lines.push(`\t${JSON.stringify(term.engine)}: TERMS[${JSON.stringify(term.engine)}],`);
	}
	lines.push("};");
	lines.push("");

	// ── Features ──

	lines.push("export interface Feature {");
	lines.push("\tenabled: boolean;");
	lines.push("\tprod: string;");
	lines.push("\tdev: string;");
	lines.push("}");
	lines.push("");

	lines.push("export const FEATURES: Record<string, Feature> = {");
	for (const [name, feat] of Object.entries(features)) {
		lines.push(`\t${JSON.stringify(name)}: {`);
		lines.push(`\t\tenabled: ${feat.enabled},`);
		lines.push(`\t\tprod: ${JSON.stringify(feat.prod)},`);
		lines.push(`\t\tdev: ${JSON.stringify(feat.dev)},`);
		lines.push("\t},");
	}
	lines.push("};");
	lines.push("");

	// ── Personality ──

	lines.push("export const PERSONALITY: Record<string, Record<string, string[]>> = {");
	for (const [agent, actions] of Object.entries(personality)) {
		lines.push(`\t${JSON.stringify(agent)}: {`);
		for (const [action, data] of Object.entries(actions as Record<string, RawPersonalityAction>)) {
			lines.push(`\t\t${JSON.stringify(action)}: ${JSON.stringify(data.messages)},`);
		}
		lines.push("\t},");
	}
	lines.push("};");
	lines.push("");

	// ── Runtime functions ──

	lines.push("// ── Runtime functions ──────────────────────────────────────");
	lines.push("");

	lines.push("const IS_DEV = import.meta.env.DEV;");
	lines.push("");

	// resolveLabel
	lines.push("/** Resolve label: DEV_MODE returns dev label, PROD returns prod label */");
	lines.push("export function resolveLabel(engineTerm: string): string {");
	lines.push("\tconst term = TERMS[engineTerm];");
	lines.push("\tif (!term) return engineTerm;");
	lines.push("\treturn IS_DEV ? term.dev : term.prod;");
	lines.push("}");
	lines.push("");

	// devLabel
	lines.push("/** Get dev label for an engine term */");
	lines.push("export function devLabel(engineTerm: string): string {");
	lines.push("\treturn TERMS[engineTerm]?.dev ?? engineTerm;");
	lines.push("}");
	lines.push("");

	// prodLabel
	lines.push("/** Get prod label for an engine term */");
	lines.push("export function prodLabel(engineTerm: string): string {");
	lines.push("\treturn TERMS[engineTerm]?.prod ?? engineTerm;");
	lines.push("}");
	lines.push("");

	// minionStatus
	lines.push("/** Get a random minion flavor message for an action */");
	lines.push("export function minionStatus(action: string): string {");
	lines.push('\tconst messages = PERSONALITY["minion"]?.[action];');
	lines.push('\tif (!messages || messages.length === 0) return "Working...";');
	lines.push("\treturn messages[Math.floor(Math.random() * messages.length)];");
	lines.push("}");
	lines.push("");

	// sanitizeForProd — build a regex from all engine terms
	lines.push("/** Replace all engine terms in a string with prod labels */");
	lines.push("export function sanitizeForProd(message: string): string {");
	lines.push("\tlet result = message;");
	lines.push("\tfor (const [engine, term] of Object.entries(TERMS)) {");
	lines.push("\t\tif (result.includes(engine)) {");
	lines.push("\t\t\tresult = result.replaceAll(engine, term.prod);");
	lines.push("\t\t}");
	lines.push("\t}");
	lines.push("\treturn result;");
	lines.push("}");
	lines.push("");

	// isFeatureEnabled
	lines.push("/** Check if a feature is enabled */");
	lines.push("export function isFeatureEnabled(feature: string): boolean {");
	lines.push("\treturn FEATURES[feature]?.enabled ?? false;");
	lines.push("}");
	lines.push("");

	// DEV_MODE flag (replaces flags.ts DEV_MODE)
	lines.push("/** DEV_MODE flag — true in dev, false in prod (replaces flags.ts) */");
	lines.push("export const DEV_MODE = IS_DEV;");
	lines.push("");

	writeFileSync(OUTPUT_PATH, lines.join("\n") + "\n", "utf-8");

	const termCount = terms.length;
	const featureCount = Object.keys(features).length;
	const personalityCount = Object.values(personality).reduce(
		(sum, agent) => sum + Object.keys(agent as Record<string, unknown>).length,
		0,
	);

	console.log(
		`[terminology] Generated ${OUTPUT_PATH}\n` +
			`  ${termCount} terms, ${featureCount} features, ${personalityCount} personality actions`,
	);
}

generate();
