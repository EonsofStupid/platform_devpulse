/**
 * @file kind-css.mjs
 * @package @devpulse/coldlight
 *
 * Generates a ColdLight kind's CSS and its typed variant/size/tone unions
 * from the kind's colocated tokens file, `components/<kind>/<kind>.tokens.json`
 * (plan 0006 §0s). The file's top group is the kind:
 *
 *   <kind>.$extensions["com.coldlight"]  { accepts: [concern…], defaults: { variant, size, tone } }
 *   <kind>.base.<css-property>           every element of the kind
 *   <kind>.variant.<name>.<css-property> [data-variant="<name>"]
 *   <kind>.size.<name>.<css-property>    [data-size="<name>"]
 *   <kind>.tone.<name>.<css-property>    [data-tone="<name>"]
 *   <kind>.state.<state>.<css-property>  hover, active, focus-visible, pressed, selected, open, disabled
 *
 * Later sections win: base < variant < size < tone < state. Token names are
 * CSS property names; `gradient` means `background-image`. A value that
 * references another token becomes `var(--that-token)`, so semantic and
 * theme layers keep flowing through.
 */

import { readFileSync } from 'node:fs';

const EXT = 'com.coldlight';
const SECTIONS = ['base', 'variant', 'size', 'tone', 'state'];
const PROPERTY_ALIAS = { gradient: 'background-image' };

/** CSS for each state a kind's tokens may give. */
export const STATE_SELECTORS = {
	hover: ':hover',
	active: ':active',
	'focus-visible': ':focus-visible',
	pressed: '[data-pressed]',
	selected: '[data-selected]',
	open: '[data-open]',
	disabled: ':is(:disabled, [data-disabled], [aria-disabled="true"])',
};

/** Rules a kind gets for accepting the interactive concern (render-base's former `[data-cl-interactive]`). */
function interactiveRules(sel) {
	return [
		`${sel} {\n\tcursor: pointer;\n\t-webkit-tap-highlight-color: transparent;\n}`,
		`${sel}:focus-visible {\n\toutline: 2px solid var(--focus-ring, currentColor);\n\toutline-offset: var(--focus-offset, 2px);\n}`,
		`${sel}${STATE_SELECTORS.disabled} {\n\tcursor: not-allowed;\n\tpointer-events: none;\n}`,
		`${sel}:hover {\n\tfilter: var(--hover-filter, brightness(1.1));\n}`,
		`${sel}:active {\n\tfilter: var(--active-filter, brightness(0.9));\n}`,
	];
}

/** `<root>/components/<kind>/<kind>.tokens.json` for a token's file, else null. */
export function kindOfFile(filePath) {
	const m = /\/components\/([a-z][a-z0-9-]*)\/([a-z][a-z0-9-]*)\.tokens\.json$/.exec(String(filePath ?? '').replace(/\\/g, '/'));
	return m && m[1] === m[2] ? m[1] : null;
}

/** Whether a token belongs to its kind file's own group (not legacy entries the file still carries). */
export const isKindToken = (token) => {
	const kind = kindOfFile(token.filePath);
	return kind !== null && token.path[0] === kind;
};

/** The CSS value of a token: references become `var(--…)`, literals keep their transformed value. */
function cssValue(token, nameByPath) {
	const original = token.original?.$value;
	if (typeof original === 'string' && original.includes('{')) {
		return original.replace(/\{([^{}]+)\}/g, (match, ref) => {
			const name = nameByPath.get(ref);
			if (!name) throw new Error(`${token.path.join('.')}: unknown reference ${match}`);
			return `var(--${name})`;
		});
	}
	return String(token.$value);
}

/**
 * The CSS for one kind.
 * @param {{ allTokens: Array<Record<string, any>> }} dictionary Style Dictionary's dictionary
 * @param {string} kind
 * @param {{ accepts?: string[] }} meta the kind's `$extensions["com.coldlight"]`
 */
export function kindCss(dictionary, kind, meta) {
	// A file's filter narrows `allTokens`; references may point anywhere.
	const everything = dictionary.unfilteredAllTokens ?? dictionary.allTokens;
	const nameByPath = new Map(everything.map((t) => [t.path.join('.'), t.name]));
	const sel = `[data-kind="${kind}"]`;
	/** selector → [property, value][] in source order */
	const blocks = new Map();
	const add = (selector, property, value) => {
		if (!blocks.has(selector)) blocks.set(selector, []);
		blocks.get(selector).push([PROPERTY_ALIAS[property] ?? property, value]);
	};

	const tokens = dictionary.allTokens.filter((t) => t.path[0] === kind && isKindToken(t));
	for (const section of SECTIONS) {
		for (const token of tokens.filter((t) => t.path[1] === section)) {
			const value = cssValue(token, nameByPath);
			if (section === 'base') {
				add(sel, token.path[2], value);
			} else if (section === 'state') {
				const state = token.path[2];
				if (!(state in STATE_SELECTORS)) throw new Error(`${kind}: unknown state "${state}"`);
				add(`${sel}${STATE_SELECTORS[state]}`, token.path[3], value);
			} else {
				add(`${sel}[data-${section}="${token.path[2]}"]`, token.path[3], value);
			}
		}
	}
	for (const token of tokens) {
		if (!SECTIONS.includes(token.path[1])) {
			throw new Error(`${kind}: unknown section "${token.path[1]}" (${token.path.join('.')})`);
		}
	}

	const rules = [];
	const base = blocks.get(sel);
	if (base) rules.push(`${sel} {\n${base.map(([p, v]) => `\t${p}: ${v};`).join('\n')}\n}`);
	if (meta?.accepts?.includes('interactive')) rules.push(...interactiveRules(sel));
	for (const [selector, decls] of blocks) {
		if (selector === sel) continue;
		rules.push(`${selector} {\n${decls.map(([p, v]) => `\t${p}: ${v};`).join('\n')}\n}`);
	}
	return rules.join('\n\n');
}

/**
 * A kind file's group and metadata, read straight from the source; null when
 * the file has no top group named after its kind (not in the kind-file shape).
 * Invalid JSON throws.
 */
export function readKindFile(path, kind) {
	const json = JSON.parse(readFileSync(path, 'utf-8'));
	const group = json[kind];
	return group ? { group, meta: group.$extensions?.[EXT] ?? {} } : null;
}

const pascal = (s) => s.replace(/(^|-)([a-z0-9])/g, (_, __, c) => c.toUpperCase());
const constant = (s) => s.replace(/-/g, '_').toUpperCase();
const keys = (node) => Object.keys(node ?? {}).filter((k) => !k.startsWith('$'));

/** One `as const` array, wrapped the way Biome formats it past 100 columns. */
function constArray(name, values) {
	const inline = `export const ${name} = [${values.map((v) => JSON.stringify(v)).join(', ')}] as const;`;
	if (inline.length <= 100) return inline;
	return `export const ${name} = [\n${values.map((v) => `\t${JSON.stringify(v)},`).join('\n')}\n] as const;`;
}

/** The kind's generated TypeScript: its variant, size and tone unions and defaults. */
export function kindTypes(kind, group, meta) {
	const K = constant(kind);
	const P = pascal(kind);
	const lines = [
		`/* AUTO-GENERATED by scripts/build/styledictionary/build.mjs from ${kind}.tokens.json — DO NOT EDIT */`,
		'',
	];
	for (const [section, label] of [
		['variant', 'Variant'],
		['size', 'Size'],
		['tone', 'Tone'],
	]) {
		const values = keys(group[section]);
		if (values.length === 0) continue;
		lines.push(constArray(`${K}_${constant(section)}S`, values));
		lines.push(`export type ${P}${label} = (typeof ${K}_${constant(section)}S)[number];`, '');
	}
	const defaults = meta.defaults ?? {};
	const entries = Object.entries(defaults).map(([k, v]) => `${k}: ${JSON.stringify(v)}`);
	lines.push(`export const ${K}_DEFAULTS = { ${entries.join(', ')} } as const;`, '');
	return lines.join('\n');
}
