#!/usr/bin/env node
/**
 * @file pipeline/lint-plan.ts
 * @description Validates plan files against the /planning skill's schema.yml SSOT.
 *
 * Modes:
 *   tsx pipeline/lint-plan.ts <file.md> [<file.md> ...]   # validate listed plans
 *   tsx pipeline/lint-plan.ts --self                       # lint skill's own examples
 *
 * Exit codes (matches scripts/hooks/no-raw-values.mjs convention):
 *   0  clean (or warnings only)
 *   1  errors found
 *   2  internal / harness failure
 */

import { readFileSync, existsSync, statSync } from "node:fs";
import { resolve, isAbsolute, dirname } from "node:path";
import { homedir } from "node:os";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";
import { unified } from "unified";
import remarkParse from "remark-parse";
import { visit } from "unist-util-visit";
import chalk from "chalk";
import type { Root, Heading, Text } from "mdast";

// ─── Schema types (mirror schema.yml) ─────────────────────────────────

interface SeverityDef {
	id: string;
	emoji: string;
	meaning: string;
}

type CheckKind =
	| "must_contain"
	| "must_contain_pattern"
	| "must_contain_any"
	| "count_pattern"
	| "every_q_id_terminal"
	| "every_step_cites"
	| "presence_only";

type WhenStatus = "ready" | "always";

interface SectionRule {
	id: string;
	check: CheckKind;
	pattern?: string;
	pattern_ref?: string;
	patterns?: string[];
	min?: number;
	max?: number;
	when?: WhenStatus;
	message: string;
}

interface SectionDef {
	id: string;
	number: number;
	title: string;
	rules: SectionRule[];
}

interface Schema {
	schema_version: number;
	governs: string[];
	frontmatter: {
		required_keys: string[];
		status_values: string[];
		schema_version_value: number;
		slug_pattern: string;
		opened_pattern: string;
	};
	strictness: Record<string, "presence_only" | "full" | "skip">;
	severities: SeverityDef[];
	citation_patterns: Record<string, string>;
	sections: SectionDef[];
	extension_policy: { min_extension_number: number; lint_mode: "skip" | "enforce" };
}

interface Violation {
	rule: string;
	section?: string;
	line?: number;
	message: string;
	severity: "error" | "warning";
}

interface ValidationResult {
	file: string;
	valid: boolean;
	violations: Violation[];
}

// ─── Schema location ─────────────────────────────────────────────────

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SCHEMA_PATH = resolve(
	__dirname,
	"..",   // pipeline/ → docs/
	"..",   // docs/ → scripts/
	"..",   // scripts/ → repo root
	".claude/skills/planning/references/schema.yml",
);

// ─── Plan parsing ────────────────────────────────────────────────────

interface ParsedPlan {
	raw: string;
	frontmatter: Record<string, unknown> | null;
	sections: Map<number, { title: string; body: string; startLine: number }>;
}

/**
 * Plans use a fenced ```yaml block near the top, NOT YAML between `---`
 * delimiters. We accept any preamble between the H1 title and the first
 * ```yaml fence (e.g. a blockquote on the anti-pattern example) — only
 * the FIRST ```yaml fence in the file is treated as frontmatter.
 */
function parseFrontmatter(raw: string): Record<string, unknown> | null {
	if (!raw.startsWith("# ")) return null;
	const match = raw.match(/```yaml\n([\s\S]*?)\n```/);
	if (!match) return null;
	try {
		const fm = parseYaml(match[1]) as Record<string, unknown>;
		return fm ?? null;
	} catch {
		return null;
	}
}

/**
 * Walk the mdast, slice the body by H2 headings whose text starts with
 * "N. " — these are the schema sections. Sections numbered ≥10 are
 * tolerated extensions; sections 1–9 are the spine.
 */
function sliceBySections(raw: string): Map<number, { title: string; body: string; startLine: number }> {
	const out = new Map<number, { title: string; body: string; startLine: number }>();
	const tree = unified().use(remarkParse).parse(raw) as Root;

	const headings: Array<{ text: string; line: number; offset: number }> = [];
	visit(tree, "heading", (node: Heading) => {
		if (node.depth !== 2) return;
		const text = node.children
			.filter((c): c is Text => c.type === "text")
			.map((c) => c.value)
			.join("");
		const line = node.position?.start?.line ?? 0;
		const offset = node.position?.start?.offset ?? 0;
		headings.push({ text, line, offset });
	});

	for (let i = 0; i < headings.length; i++) {
		const h = headings[i];
		const m = h.text.match(/^(\d+)\.\s+/);
		if (!m) continue;
		const number = Number(m[1]);
		const next = headings[i + 1];
		const bodyStart = h.offset;
		const bodyEnd = next?.offset ?? raw.length;
		const body = raw.slice(bodyStart, bodyEnd);
		out.set(number, { title: h.text, body, startLine: h.line });
	}

	return out;
}

function parsePlan(filePath: string): ParsedPlan {
	const raw = readFileSync(filePath, "utf8");
	return {
		raw,
		frontmatter: parseFrontmatter(raw),
		sections: sliceBySections(raw),
	};
}

// ─── Rule checks ─────────────────────────────────────────────────────

function checkMustContain(body: string, pattern: string): boolean {
	return new RegExp(pattern).test(body);
}

function checkMustContainAny(body: string, patterns: string[]): boolean {
	return patterns.some((p) => new RegExp(p).test(body));
}

function countMatches(body: string, pattern: string): number {
	const re = new RegExp(pattern, "gm");
	return (body.match(re) ?? []).length;
}

/**
 * Every Q-ID line ("- **Qn:**") in §6 must be followed (on its own
 * line or a continuation) by a "resolved:" or "deferred:" marker
 * before the next Q-ID begins.
 */
function checkEveryQIdTerminal(body: string): { ok: boolean; orphans: string[] } {
	const lines = body.split(/\r?\n/);
	const qIdRe = /^- \*\*Q(\d+):/;
	// Accept "resolved", "deferred", "**resolved:**", "resolved —", etc.
	// A Q-ID is terminal if its line (or a continuation) contains the word.
	const terminalRe = /\b(resolved|deferred)\b/i;

	const orphans: string[] = [];
	let currentQ: string | null = null;
	let currentTerminal = false;

	const flush = (): void => {
		if (currentQ && !currentTerminal) orphans.push(currentQ);
	};

	for (const line of lines) {
		const m = qIdRe.exec(line);
		if (m) {
			flush();
			currentQ = `Q${m[1]}`;
			currentTerminal = terminalRe.test(line);
			continue;
		}
		if (currentQ && !currentTerminal && terminalRe.test(line)) {
			currentTerminal = true;
		}
	}
	flush();
	return { ok: orphans.length === 0, orphans };
}

/**
 * Every numbered step in §8 must include a citation. We accept either
 * an explicit "cites:" clause or any inline `path:line` backtick
 * citation as evidence the step is grounded.
 */
function checkEveryStepCites(body: string): { ok: boolean; uncited: number[] } {
	const lines = body.split(/\r?\n/);
	const stepRe = /^(\d+)\.\s/;
	const uncited: number[] = [];

	let currentStep: number | null = null;
	let currentBuffer = "";

	const hasCitation = (text: string): boolean =>
		/cites?:/.test(text) || /`[^`]+:\d+/.test(text);

	const flush = (): void => {
		if (currentStep === null) return;
		if (!hasCitation(currentBuffer)) uncited.push(currentStep);
	};

	for (const line of lines) {
		const m = stepRe.exec(line);
		if (m) {
			flush();
			currentStep = Number(m[1]);
			currentBuffer = line;
			continue;
		}
		if (currentStep !== null) currentBuffer += `\n${line}`;
	}
	flush();
	return { ok: uncited.length === 0, uncited };
}

// ─── Validation engine ───────────────────────────────────────────────

function applyRule(rule: SectionRule, body: string, schema: Schema): boolean {
	// Returns TRUE iff the rule was VIOLATED (caller pushes to `violations`).
	switch (rule.check) {
		case "must_contain":
			return !checkMustContain(body, rule.pattern ?? "");
		case "must_contain_pattern": {
			const pat = schema.citation_patterns[rule.pattern_ref ?? ""] ?? rule.pattern_ref ?? "";
			return !checkMustContain(body, pat);
		}
		case "must_contain_any":
			return !checkMustContainAny(body, rule.patterns ?? []);
		case "count_pattern": {
			const n = countMatches(body, rule.pattern ?? "");
			if (rule.min !== undefined && n < rule.min) return true;
			if (rule.max !== undefined && n > rule.max) return true;
			return false;
		}
		case "every_q_id_terminal":
			return !checkEveryQIdTerminal(body).ok;
		case "every_step_cites":
			return !checkEveryStepCites(body).ok;
		case "presence_only":
			return false;
		default:
			return false;
	}
}

function validate(schema: Schema, plan: ParsedPlan, filePath: string): ValidationResult {
	const violations: Violation[] = [];

	// ── Frontmatter shape ──
	if (!plan.frontmatter) {
		violations.push({
			rule: "frontmatter_missing",
			message: "Plan must start with `# Title` then a fenced ```yaml block declaring frontmatter.",
			severity: "error",
		});
		return { file: filePath, valid: false, violations };
	}

	for (const key of schema.frontmatter.required_keys) {
		if (plan.frontmatter[key] === undefined) {
			violations.push({
				rule: "frontmatter_missing_key",
				message: `Frontmatter missing required key: ${key}`,
				severity: "error",
			});
		}
	}

	const status = String(plan.frontmatter.status ?? "");
	if (!schema.frontmatter.status_values.includes(status)) {
		violations.push({
			rule: "frontmatter_bad_status",
			message: `Frontmatter status='${status}' not in ${JSON.stringify(schema.frontmatter.status_values)}`,
			severity: "error",
		});
	}

	if (plan.frontmatter.schema_version !== schema.frontmatter.schema_version_value) {
		violations.push({
			rule: "frontmatter_schema_version",
			message: `schema_version=${String(plan.frontmatter.schema_version)}, expected ${schema.frontmatter.schema_version_value}.`,
			severity: "error",
		});
	}

	const slug = String(plan.frontmatter.slug ?? "");
	if (!new RegExp(schema.frontmatter.slug_pattern).test(slug)) {
		violations.push({
			rule: "frontmatter_bad_slug",
			message: `Slug '${slug}' does not match pattern ${schema.frontmatter.slug_pattern} (3+ kebab words, lowercase).`,
			severity: "warning",
		});
	}

	const opened = String(plan.frontmatter.opened ?? "");
	if (!new RegExp(schema.frontmatter.opened_pattern).test(opened)) {
		violations.push({
			rule: "frontmatter_bad_opened",
			message: `opened='${opened}' is not YYYY-MM-DD.`,
			severity: "warning",
		});
	}

	// ── Strictness gate ──
	const mode = schema.strictness[status] ?? "full";
	if (mode === "skip") {
		return {
			file: filePath,
			valid: violations.filter((v) => v.severity === "error").length === 0,
			violations,
		};
	}

	// ── Section presence (always for non-skip) ──
	for (const section of schema.sections) {
		if (!plan.sections.has(section.number)) {
			violations.push({
				rule: "section_missing",
				section: section.id,
				message: `Missing required section: "${section.title}"`,
				severity: "error",
			});
		}
	}

	// ── Section ordering (1..9 must appear in order; ≥10 ignored) ──
	const presentSpine = [...plan.sections.keys()].filter((n) => n <= 9).sort((a, b) => a - b);
	const expectedSpine = schema.sections.map((s) => s.number);
	for (let i = 0; i < expectedSpine.length; i++) {
		if (presentSpine[i] !== expectedSpine[i]) {
			violations.push({
				rule: "section_order",
				message: `Section ordering broken at position ${i}: expected §${expectedSpine[i]}, found §${presentSpine[i] ?? "<missing>"}.`,
				severity: "error",
			});
			break;
		}
	}

	// ── Body rules (only in 'full' strictness) ──
	if (mode !== "full") {
		return {
			file: filePath,
			valid: violations.filter((v) => v.severity === "error").length === 0,
			violations,
		};
	}

	for (const section of schema.sections) {
		const sec = plan.sections.get(section.number);
		if (!sec) continue;
		for (const rule of section.rules) {
			// `when: ready` rules only fire when the plan is `ready`.
			if (rule.when && rule.when !== "always" && status !== rule.when) continue;
			const violated = applyRule(rule, sec.body, schema);
			if (violated) {
				violations.push({
					rule: rule.id,
					section: section.id,
					line: sec.startLine,
					message: rule.message,
					severity: "error",
				});
			}
		}
	}

	return {
		file: filePath,
		valid: violations.filter((v) => v.severity === "error").length === 0,
		violations,
	};
}

// ─── Reporting ───────────────────────────────────────────────────────

function report(result: ValidationResult): void {
	const e = process.stderr;
	if (result.valid && result.violations.length === 0) {
		e.write(`  ${chalk.green("✓")} ${result.file}\n`);
		return;
	}
	const symbol = result.valid ? chalk.yellow("⚠") : chalk.red("✖");
	e.write(`  ${symbol} ${result.file}\n`);
	for (const v of result.violations) {
		const tag = v.severity === "error" ? chalk.red("error") : chalk.yellow("warn ");
		const where = v.section ? ` [§${v.section}]` : "";
		e.write(`    ${tag}${where}: ${v.message}\n`);
		if (v.line) e.write(`      ${chalk.dim(`at line ${v.line}`)}\n`);
	}
}

// ─── CLI ─────────────────────────────────────────────────────────────

function expandHome(p: string): string {
	if (p.startsWith("~/") || p === "~") return resolve(homedir(), p.slice(2));
	return p;
}

function loadSchema(): Schema {
	if (!existsSync(SCHEMA_PATH)) {
		process.stderr.write(chalk.red(`schema.yml not found at ${SCHEMA_PATH}\n`));
		process.exit(2);
	}
	const raw = readFileSync(SCHEMA_PATH, "utf8");
	return parseYaml(raw) as Schema;
}

async function main(): Promise<void> {
	const args = process.argv.slice(2);
	const isSelf = args.includes("--self");
	const fileArgs = args.filter((a) => !a.startsWith("--"));

	const e = process.stderr;
	e.write(`\n${chalk.bold.cyan("lint-plan v1")}\n`);

	let schema: Schema;
	try {
		schema = loadSchema();
	} catch (err) {
		e.write(chalk.red(`Failed to load schema: ${(err as Error).message}\n`));
		process.exit(2);
	}

	const targets: string[] = [];
	if (isSelf) {
		// Lint only the canonical example. lazy.md is the documented anti-
		// pattern and is INTENDED to fail every rule — it lives as
		// reference documentation, not as a validation target.
		const skillRoot = resolve(SCHEMA_PATH, "..", "..");
		targets.push(resolve(skillRoot, "examples/good.md"));
	} else if (fileArgs.length > 0) {
		for (const a of fileArgs) {
			const expanded = expandHome(a);
			targets.push(isAbsolute(expanded) ? expanded : resolve(expanded));
		}
	} else {
		e.write(chalk.dim("Usage: tsx pipeline/lint-plan.ts <file.md> [<file.md> ...]\n"));
		e.write(chalk.dim("       tsx pipeline/lint-plan.ts --self\n"));
		process.exit(2);
	}

	let totalErrors = 0;
	let totalWarnings = 0;

	for (const target of targets) {
		if (!existsSync(target)) {
			e.write(`  ${chalk.red("✖")} ${target} (file not found)\n`);
			totalErrors++;
			continue;
		}
		if (!statSync(target).isFile()) continue;

		let plan: ParsedPlan;
		try {
			plan = parsePlan(target);
		} catch (err) {
			e.write(`  ${chalk.red("✖")} ${target}: parse error — ${(err as Error).message}\n`);
			totalErrors++;
			continue;
		}

		const result = validate(schema, plan, target);
		report(result);
		totalErrors += result.violations.filter((v) => v.severity === "error").length;
		totalWarnings += result.violations.filter((v) => v.severity === "warning").length;
	}

	e.write("\n");
	if (totalErrors > 0) {
		e.write(chalk.red.bold(`✖ ${totalErrors} error(s), ${totalWarnings} warning(s)\n`));
		process.exit(1);
	}
	if (totalWarnings > 0) {
		e.write(chalk.yellow.bold(`⚠ Clean (${totalWarnings} warning(s))\n`));
		process.exit(0);
	}
	e.write(chalk.green.bold("✓ All plans pass schema validation\n"));
	process.exit(0);
}

main().catch((err: Error) => {
	process.stderr.write(chalk.red(`internal error: ${err.message}\n${err.stack ?? ""}\n`));
	process.exit(2);
});
