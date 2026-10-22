/**
 * @file kind-css.mjs
 * @package @devpulse/coldlight
 *
 * Generates a ColdLight kind's CSS and its typed variant/size/tone unions
 * from the kind's colocated tokens file, `components/<kind>/<kind>.tokens.json`
 * (plan 0006 §0s). The file's top group is the kind:
 *
 *   <kind>.$extensions["com.coldlight"]  { accepts: [concern…], defaults: { variant, size, tone } }
 *   <kind>.base.<property>               every element of the kind
 *   <kind>.variant.<name>.<property>     [data-variant="<name>"]; may `$extends` a family role
 *   <kind>.size.<name>.<property>        [data-size="<name>"]
 *   <kind>.tone.<name>.<property>        [data-tone="<name>"]
 *   <kind>.state.<state>.<property>      hover, active, focus-visible, pressed, selected, open, disabled
 *
 * Token names are CSS property names; `gradient` means `background-image`.
 * Each becomes the kind's custom property `--<kind>-<property>`, set by its
 * section's selector, and one rule on the kind reads them into the CSS
 * properties. Later sections win: base < variant < size < tone < state. A
 * value that references another token becomes `var(--that-token)`, so
 * semantic and theme layers keep flowing through.
 *
 * A family role carries every preset axis. What a variant inherits from one
 * through `$extends` is filtered by the kind's `accepts` (render-base.css's
 * concerns; motion is universal); what the kind file declares itself always
 * applies.
 */

import { readFileSync } from 'node:fs';

const EXT = 'com.coldlight';
const SECTIONS = ['base', 'variant', 'size', 'tone', 'state'];
const PROPERTY_ALIAS = { gradient: 'background-image' };

/** The preset axes each concern takes from a family role (render-base.css's family split). */
export const CONCERN_AXES = {
	surface: ['background-color', 'border-color', 'box-shadow', 'gradient'],
	text: ['color', 'font-family', 'font-size', 'font-weight', 'letter-spacing', 'line-height'],
	frame: ['border-radius', 'border-width', 'border-style'],
	overlay: ['backdrop-filter'],
	layout: ['gap'],
	interactive: [],
};

/** Motion axes apply to every kind (render-base.css's universal `[data-kind]` rule). */
const MOTION_AXES = ['opacity', 'animation', 'transition-duration', 'transition-timing-function'];

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

const keys = (node) => Object.keys(node ?? {}).filter((k) => !k.startsWith('$'));

/**
 * A predicate for the tokens of the kind files' own groups. Path-based: a
 * variant's tokens inherited through `$extends` keep their family file's path.
 * @param {Set<string>} kinds the kinds that have a kind file
 */
export const kindTokenFilter = (kinds) => (token) => kinds.has(token.path[0]) && SECTIONS.includes(token.path[1]);

/** The preset axes a kind takes from a family role. */
function acceptedAxes(kind, meta) {
	const accepts = meta?.accepts ?? [];
	for (const concern of accepts) {
		if (!(concern in CONCERN_AXES)) throw new Error(`${kind}: unknown concern "${concern}" in accepts`);
	}
	return new Set([...MOTION_AXES, ...accepts.flatMap((concern) => CONCERN_AXES[concern])]);
}

/** Whether the kind file itself declares the token at `path` (not inherited through `$extends`). */
function declares(group, path) {
	let node = group;
	for (const key of path) {
		if (node === null || typeof node !== 'object' || !(key in node)) return false;
		node = node[key];
	}
	return node !== null && typeof node === 'object' && '$value' in node;
}

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

/** The selector a section's token is set under. */
function selectorOf(kind, token) {
	const sel = `[data-kind="${kind}"]`;
	const [, section, name] = token.path;
	const expected = section === 'base' ? 3 : 4;
	if (token.path.length !== expected) {
		throw new Error(`${token.path.join('.')}: a ${section} token sits at <kind>.${section}${section === 'base' ? '' : '.<name>'}.<property>`);
	}
	if (section === 'base') return sel;
	if (section === 'state') {
		if (!(name in STATE_SELECTORS)) throw new Error(`${kind}: unknown state "${name}"`);
		return `${sel}${STATE_SELECTORS[name]}`;
	}
	return `${sel}[data-${section}="${name}"]`;
}

/**
 * The CSS for one kind.
 * @param {{ allTokens: Array<Record<string, any>>, unfilteredAllTokens?: Array<Record<string, any>> }} dictionary Style Dictionary's dictionary
 * @param {string} kind
 * @param {{ accepts?: string[] }} meta the kind's `$extensions["com.coldlight"]`
 * @param {Record<string, unknown>} group the kind's group as its file declares it (before `$extends`)
 */
export function kindCss(dictionary, kind, meta, group) {
	// A file's filter narrows `allTokens`; references may point anywhere.
	const everything = dictionary.unfilteredAllTokens ?? dictionary.allTokens;
	const nameByPath = new Map(everything.map((t) => [t.path.join('.'), t.name]));
	const accepted = acceptedAxes(kind, meta);
	const sel = `[data-kind="${kind}"]`;
	/** selector → [custom property, value][] in source order */
	const blocks = new Map([[sel, []]]);
	/** properties the kind sets anywhere, in first-seen order */
	const consumed = [];

	const tokens = dictionary.allTokens.filter((t) => t.path[0] === kind && SECTIONS.includes(t.path[1]));
	for (const section of SECTIONS) {
		for (const token of tokens.filter((t) => t.path[1] === section)) {
			const property = token.path.at(-1);
			// Inherited from a family role and outside the kind's concerns.
			if (!accepted.has(property) && !declares(group, token.path.slice(1))) continue;
			const selector = selectorOf(kind, token);
			if (!blocks.has(selector)) blocks.set(selector, []);
			blocks.get(selector).push([`--${kind}-${property}`, cssValue(token, nameByPath)]);
			if (!consumed.includes(property)) consumed.push(property);
		}
	}

	const block = (selector, decls) => `${selector} {\n${decls.map(([p, v]) => `\t${p}: ${v};`).join('\n')}\n}`;
	const reads = consumed.map((property) => [PROPERTY_ALIAS[property] ?? property, `var(--${kind}-${property})`]);
	const rules = [block(sel, [...blocks.get(sel), ...reads])];
	if (meta?.accepts?.includes('interactive')) rules.push(...interactiveRules(sel));
	for (const [selector, decls] of blocks) {
		if (selector !== sel) rules.push(block(selector, decls));
	}
	return rules.join('\n\n');
}

/**
 * A kind file's group and metadata, read straight from the source; null when
 * the file has no top group named after its kind (not in the kind-file shape).
 * Invalid JSON, an unknown section and an unknown state throw.
 */
export function readKindFile(path, kind) {
	const json = JSON.parse(readFileSync(path, 'utf-8'));
	const group = json[kind];
	if (!group) return null;
	for (const section of keys(group)) {
		if (!SECTIONS.includes(section)) {
			throw new Error(`${path}: unknown section "${section}" (sections: ${SECTIONS.join(', ')})`);
		}
	}
	for (const state of keys(group.state)) {
		if (!(state in STATE_SELECTORS)) throw new Error(`${path}: unknown state "${state}"`);
	}
	return { group, meta: group.$extensions?.[EXT] ?? {} };
}

const pascal = (s) => s.replace(/(^|-)([a-z0-9])/g, (_, __, c) => c.toUpperCase());
const constant = (s) => s.replace(/-/g, '_').toUpperCase();

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
