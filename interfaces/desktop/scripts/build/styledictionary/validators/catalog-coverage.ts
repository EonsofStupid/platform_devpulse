#!/usr/bin/env node
/**
 * @file catalog-coverage.ts
 * @package @devpulse/coldlight
 *
 * Build-time validator: ensures every UI_CATALOG entry is fully backed
 * by real files and SD5 token output on disk.
 *
 * Validates:
 *   1. {kind}.def.json exists in components/{kind}/
 *   2. At least one .svelte file exists in components/{kind}/
 *   3. contract.ts exists in components/{kind}/ (soft — warns if missing)
 *   4. Style tokens exist — colocated tokens.ts or entries in component.json
 *   5. SD5 CSS output contains --{kind}-* custom properties
 *   6. requiredAxes have corresponding tokens/CSS vars
 *
 * Node 24 runs .ts natively. No compilation needed.
 *
 * Usage:
 *   node scripts/build/styledictionary/validators/catalog-coverage.ts
 */

import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

// ─── Paths ──────────────────────────────────────────────────────────────────

const ROOT = resolve(import.meta.dirname, '../../../..');
const COMPONENTS_DIR = join(ROOT, '../../packages/coldlight/components');
const CSS_OUTPUT = join(ROOT, '../../packages/coldlight/styles/components/component.css');
const COMPONENT_JSON = join(ROOT, 'scripts/build/styledictionary/tokens/src/component.json');
const MANIFEST = join(ROOT, '../../packages/coldlight/generated/token-manifest.json');

// ─── Types ──────────────────────────────────────────────────────────────────

interface CatalogEntry {
	kind: string;
	label: string;
	category: string;
	description: string;
	aria: string | null;
	container: boolean;
	containerSlots?: readonly string[];
	compound: boolean;
	blockCategory: string;
	requiredAxes: readonly string[];
	defaultStyleId: string;
	styleIds: readonly string[];
	slots: Record<string, string | Record<string, boolean>>;
}

interface CoverageError {
	kind: string;
	check: string;
	message: string;
	severity: 'error' | 'warn';
}

interface CoverageStats {
	totalEntries: number;
	withDef: number;
	withSvelte: number;
	withContract: number;
	withTokens: number;
	withCssOutput: number;
	axesCovered: number;
}

interface CoverageResult {
	valid: boolean;
	errors: CoverageError[];
	warnings: CoverageError[];
	stats: CoverageStats;
}

interface CoverageContext {
	componentsDir: string;
	cssOutputPath: string;
	componentJsonPath: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function loadDefJson(componentsDir: string, kind: string): CatalogEntry | null {
	const defPath = join(componentsDir, kind, `${kind}.def.json`);
	if (!existsSync(defPath)) return null;
	const raw = readFileSync(defPath, 'utf-8');
	return JSON.parse(raw) as CatalogEntry;
}

function hasSvelteFile(componentsDir: string, kind: string): boolean {
	const dir = join(componentsDir, kind);
	if (!existsSync(dir)) return false;
	return readdirSync(dir).some((f: string) => f.endsWith('.svelte'));
}

function hasContract(componentsDir: string, kind: string): boolean {
	return existsSync(join(componentsDir, kind, 'contract.ts'));
}

function hasColocatedTokens(componentsDir: string, kind: string): boolean {
	return existsSync(join(componentsDir, kind, 'tokens.ts'));
}

function loadComponentJson(path: string): Record<string, unknown> {
	if (!existsSync(path)) return {};
	const raw = readFileSync(path, 'utf-8');
	return JSON.parse(raw) as Record<string, unknown>;
}

function extractCssVarKinds(cssPath: string): Set<string> {
	const kinds = new Set<string>();
	if (!existsSync(cssPath)) return kinds;

	const css = readFileSync(cssPath, 'utf-8');
	const varPattern = /--([a-z][a-z0-9]*(?:-[a-z][a-z0-9]*)*)-(?:root|bg|border|color|font|shadow|radius|thumb|track|range|bar|overlay|content|header|body|footer|trigger|item|indicator|cell|nav|label|input|swatch|gradient|viewport|scrollbar|group|link|separator|close|arrow|description|title|action|dismiss|icon|empty|step|toggle|list|ellipsis|dropzone|fileList|prepend|append|error|control|term|detail|illustration|image)/;

	for (const line of css.split('\n')) {
		const trimmed = line.trim();
		if (!trimmed.startsWith('--')) continue;
		// Extract kind from --{kind}-{rest}: pattern
		const match = trimmed.match(/^--([a-z][a-z0-9]*(?:-[a-z][a-z0-9]*)?)-/);
		if (match) {
			kinds.add(match[1]);
		}
	}

	return kinds;
}

// ─── Axis → token prefix mapping ────────────────────────────────────────────

const AXIS_TOKEN_INDICATORS: Record<string, string[]> = {
	backgroundColor: ['background', 'bg', 'surface'],
	backgroundBlur: ['blur', 'backdrop'],
	shadow: ['shadow', 'depth', 'elevation'],
	border: ['border'],
	animation: ['animation', 'motion'],
	transition: ['transition'],
	typography: ['font', 'text', 'letter-spacing', 'line-height'],
	gradient: ['gradient'],
	color: ['color'],
	borderRadius: ['radius', 'border-radius'],
	opacity: ['opacity'],
};

function kindHasAxisCoverage(
	kind: string,
	axis: string,
	cssVars: string[],
	componentJsonKeys: string[],
): boolean {
	const indicators = AXIS_TOKEN_INDICATORS[axis];
	if (!indicators) return false;

	// Check CSS vars: --{kind}-*-{indicator}*
	for (const varName of cssVars) {
		if (!varName.startsWith(`--${kind}-`)) continue;
		const rest = varName.slice(kind.length + 3); // after --{kind}-
		for (const ind of indicators) {
			if (rest.includes(ind)) return true;
		}
	}

	// Check component.json keys: {kind}.{anything with indicator}
	for (const key of componentJsonKeys) {
		if (!key.startsWith(`${kind}.`)) continue;
		const rest = key.slice(kind.length + 1);
		for (const ind of indicators) {
			if (rest.includes(ind)) return true;
		}
	}

	return false;
}

// ─── Main validator ─────────────────────────────────────────────────────────

export function validateCatalog(ctx: CoverageContext): CoverageResult {
	const { componentsDir, cssOutputPath, componentJsonPath } = ctx;

	const errors: CoverageError[] = [];
	const warnings: CoverageError[] = [];

	// Discover all component folders
	const allKinds = readdirSync(componentsDir, { withFileTypes: true })
		.filter((d) => d.isDirectory() && !d.name.startsWith('_') && !d.name.startsWith('.'))
		.map((d) => d.name)
		.sort();

	// Load external data
	const componentJson = loadComponentJson(componentJsonPath);
	const componentJsonKeys = Object.keys(componentJson).flatMap((top) => {
		const nested = componentJson[top];
		if (typeof nested === 'object' && nested !== null && !('$type' in nested)) {
			return Object.keys(nested as Record<string, unknown>).map((k) => `${top}.${k}`);
		}
		return [top];
	});

	const cssVarKinds = extractCssVarKinds(cssOutputPath);

	// Read all CSS vars for axis coverage check
	let allCssVars: string[] = [];
	if (existsSync(cssOutputPath)) {
		const css = readFileSync(cssOutputPath, 'utf-8');
		allCssVars = css.split('\n')
			.map((l) => l.trim())
			.filter((l) => l.startsWith('--'))
			.map((l) => l.split(':')[0]);
	}

	let withDef = 0;
	let withSvelte = 0;
	let withContract = 0;
	let withTokens = 0;
	let withCssOutput = 0;
	let axesCovered = 0;

	for (const kind of allKinds) {
		// 1. def.json exists
		const def = loadDefJson(componentsDir, kind);
		if (!def) {
			errors.push({
				kind,
				check: 'def.json',
				message: `${kind}/${kind}.def.json not found`,
				severity: 'error',
			});
			continue; // Can't validate further without def
		}
		withDef++;

		// Kind mismatch
		if (def.kind !== kind) {
			errors.push({
				kind,
				check: 'def.kind',
				message: `def.kind="${def.kind}" but folder is "${kind}"`,
				severity: 'error',
			});
		}

		// 2. Svelte file exists
		if (hasSvelteFile(componentsDir, kind)) {
			withSvelte++;
		} else {
			errors.push({
				kind,
				check: 'svelte',
				message: `No .svelte file found in components/${kind}/`,
				severity: 'error',
			});
		}

		// 3. contract.ts (soft check)
		if (hasContract(componentsDir, kind)) {
			withContract++;
		} else {
			warnings.push({
				kind,
				check: 'contract',
				message: `No contract.ts — ARIA contract not declared`,
				severity: 'warn',
			});
		}

		// 4. Style tokens
		const hasColocated = hasColocatedTokens(componentsDir, kind);
		const hasJsonTokens = componentJsonKeys.some((k) => k.startsWith(`${kind}.`) || k.startsWith(kind));
		if (hasColocated || hasJsonTokens) {
			withTokens++;
		} else {
			warnings.push({
				kind,
				check: 'tokens',
				message: `No colocated tokens.ts or component.json entries`,
				severity: 'warn',
			});
		}

		// 5. SD5 CSS output
		if (cssVarKinds.has(kind)) {
			withCssOutput++;
		} else {
			warnings.push({
				kind,
				check: 'css-output',
				message: `No --${kind}-* vars in SD5 CSS output`,
				severity: 'warn',
			});
		}

		// 6. Required axes coverage
		const uncoveredAxes: string[] = [];
		for (const axis of def.requiredAxes) {
			if (!kindHasAxisCoverage(kind, axis, allCssVars, componentJsonKeys)) {
				uncoveredAxes.push(axis);
			}
		}
		if (uncoveredAxes.length === 0) {
			axesCovered++;
		} else {
			warnings.push({
				kind,
				check: 'axes',
				message: `Uncovered required axes: ${uncoveredAxes.join(', ')}`,
				severity: 'warn',
			});
		}
	}

	return {
		valid: errors.length === 0,
		errors,
		warnings,
		stats: {
			totalEntries: allKinds.length,
			withDef,
			withSvelte,
			withContract,
			withTokens,
			withCssOutput,
			axesCovered,
		},
	};
}

// ─── Reporter ───────────────────────────────────────────────────────────────

export function reportCatalog(result: CoverageResult): number {
	const { stats, errors, warnings } = result;

	console.log(`[catalog-coverage] Validating ${stats.totalEntries} catalog entries...`);
	console.log(`  Defs:       ${stats.withDef}/${stats.totalEntries}`);
	console.log(`  Svelte:     ${stats.withSvelte}/${stats.totalEntries}`);
	console.log(`  Contracts:  ${stats.withContract}/${stats.totalEntries}`);
	console.log(`  Tokens:     ${stats.withTokens}/${stats.totalEntries}`);
	console.log(`  CSS output: ${stats.withCssOutput}/${stats.totalEntries}`);
	console.log(`  Axes OK:    ${stats.axesCovered}/${stats.totalEntries}`);

	if (warnings.length > 0) {
		console.warn(`\n[catalog-coverage] ${warnings.length} warning(s):`);
		for (const w of warnings) {
			console.warn(`  [${w.kind}] ${w.check}: ${w.message}`);
		}
	}

	if (errors.length === 0) {
		console.log(`\n[catalog-coverage] PASS — all hard checks passed.`);
		return 0;
	}

	console.error(`\n[catalog-coverage] FAIL — ${errors.length} error(s):`);
	for (const err of errors) {
		console.error(`  [${err.kind}] ${err.check}: ${err.message}`);
	}

	return 1;
}

// ─── CLI entry ──────────────────────────────────────────────────────────────

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('catalog-coverage.ts')) {
	const result = validateCatalog({
		componentsDir: COMPONENTS_DIR,
		cssOutputPath: CSS_OUTPUT,
		componentJsonPath: COMPONENT_JSON,
	});
	const code = reportCatalog(result);
	process.exit(code);
}
