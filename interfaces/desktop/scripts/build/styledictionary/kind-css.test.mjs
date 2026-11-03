/**
 * Cases for the kind-file generator (plan 0006 §0s).
 * Run: node --test scripts/build/styledictionary/kind-css.test.mjs
 */

import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { STATE_SELECTORS, kindCss, kindTokenFilter, kindTypes, readKindFile } from './kind-css.mjs';

test('checked reads the state a control writes, on the kind that holds it', () => {
	assert.equal(STATE_SELECTORS.checked, '[data-state="checked"]');
});

/** A transformed token as Style Dictionary hands it to a format. */
const token = (path, value, original = value) => ({
	path: path.split('.'),
	name: path.replace(/\./g, '-'),
	$value: value,
	original: { $value: original },
});

const dictionary = (tokens) => ({ allTokens: tokens, unfilteredAllTokens: tokens });

test('each property becomes --<kind>-<property>, read once on the kind', () => {
	const css = kindCss(
		dictionary([token('chip.base.border-style', 'solid'), token('chip.variant.bold.background-color', 'red')]),
		'chip',
		{ accepts: ['surface', 'frame'] },
		{ base: { 'border-style': { $value: 'solid' } }, variant: { bold: { 'background-color': { $value: 'red' } } } },
	);
	assert.match(css, /\[data-kind="chip"\] \{\n\t--chip-border-style: solid;\n\tborder-style: var\(--chip-border-style\);\n\tbackground-color: var\(--chip-background-color\);\n\}/);
	assert.match(css, /\[data-kind="chip"\]\[data-variant="bold"\] \{\n\t--chip-background-color: red;\n\}/);
});

test('a variant keeps what it inherits only within the accepted concerns; its own tokens always apply', () => {
	const css = kindCss(
		dictionary([
			token('chip.variant.glass.background-color', 'blue'),
			token('chip.variant.glass.backdrop-filter', 'blur(1rem)'),
			token('chip.variant.glass.background-alpha', '1'),
			token('chip.variant.glass.opacity', '1'),
			token('chip.variant.glass.height', '2rem'),
		]),
		'chip',
		{ accepts: ['surface'] },
		// Only `height` is the file's own; the rest came through `$extends`.
		{ variant: { glass: { $extends: '{preset.glass-deep}', height: { $value: '2rem' } } } },
	);
	assert.match(css, /--chip-background-color: blue;/);
	assert.match(css, /--chip-opacity: 1;/, 'motion is universal');
	assert.match(css, /--chip-height: 2rem;/, 'own tokens apply outside the concerns');
	assert.doesNotMatch(css, /backdrop-filter/, 'overlay is not accepted');
	assert.doesNotMatch(css, /background-alpha/, 'no concern takes it');
});

test('references become var(); gradient reads into background-image', () => {
	const css = kindCss(
		dictionary([token('primary.main', 'oklch(0.5 0.1 240)'), token('chip.base.gradient', 'x', 'linear-gradient({primary.main}, transparent)')]),
		'chip',
		{ accepts: ['surface'] },
		{ base: { gradient: { $value: 'linear-gradient({primary.main}, transparent)' } } },
	);
	assert.match(css, /--chip-gradient: linear-gradient\(var\(--primary-main\), transparent\);/);
	assert.match(css, /background-image: var\(--chip-gradient\);/);
});

test('states come last and match the behavior attributes; interactive adds its rules', () => {
	const css = kindCss(
		dictionary([token('chip.variant.bold.opacity', '1'), token('chip.state.disabled.opacity', '0.5')]),
		'chip',
		{ accepts: ['interactive'] },
		{ variant: { bold: { opacity: { $value: '1' } } }, state: { disabled: { opacity: { $value: '0.5' } } } },
	);
	const disabled = css.indexOf('[data-kind="chip"]:is(:disabled, [data-disabled], [aria-disabled="true"]) {\n\t--chip-opacity');
	assert.ok(disabled > css.indexOf('[data-variant="bold"]'), 'state after variant');
	assert.match(css, /\[data-kind="chip"\] \{\n\tcursor: pointer;\n\toutline-offset: var\(--focus-offset, 2px\);/);
	assert.match(css, /cursor: not-allowed;/);
	assert.match(css, /filter: var\(--hover-filter, brightness\(1\.1\)\);/);
});

test('a property only states set is read only in those states', () => {
	const group = {
		variant: { bold: { opacity: { $value: '1' } } },
		state: { 'focus-visible': { 'outline-style': { $value: 'solid' } }, disabled: { opacity: { $value: '0.5' } } },
	};
	const css = kindCss(
		dictionary([token('chip.variant.bold.opacity', '1'), token('chip.state.focus-visible.outline-style', 'solid'), token('chip.state.disabled.opacity', '0.5')]),
		'chip',
		{},
		group,
	);
	const base = css.slice(0, css.indexOf('}'));
	assert.match(base, /opacity: var\(--chip-opacity\);/);
	assert.doesNotMatch(base, /outline-style/);
	assert.match(css, /\[data-kind="chip"\]:focus-visible \{\n\t--chip-outline-style: solid;\n\toutline-style: var\(--chip-outline-style\);\n\}/);
	assert.match(css, /:is\(:disabled, \[data-disabled\], \[aria-disabled="true"\]\) \{\n\t--chip-opacity: 0\.5;\n\}/, 'opacity is read on the kind already');
});

test('a token at the wrong depth or an unknown reference throws', () => {
	const group = { variant: { 'background-color': { $value: 'red' } } };
	assert.throws(() => kindCss(dictionary([token('chip.variant.background-color', 'red')]), 'chip', {}, group), /a variant token sits at/);
	assert.throws(
		() => kindCss(dictionary([token('chip.base.color', 'x', '{nope.gone}')]), 'chip', {}, { base: { color: { $value: '{nope.gone}' } } }),
		/unknown reference \{nope\.gone\}/,
	);
	assert.throws(() => kindCss(dictionary([]), 'chip', { accepts: ['sparkle'] }, {}), /unknown concern "sparkle"/);
});

test('a variant naming a role reads the family scope, except what the kind declares itself', () => {
	const group = {
		base: { 'border-radius': { $value: '0.375rem' } },
		size: { md: { 'font-size': { $value: '0.875rem' } } },
		variant: {
			deep: { $extensions: { 'com.coldlight': { role: 'deep' } }, color: { $value: 'white' } },
			plain: { 'background-color': { $value: 'red' } },
		},
	};
	const tokens = [
		token('chip.base.border-radius', '0.375rem'),
		token('chip.size.md.font-size', '0.875rem'),
		token('chip.variant.deep.color', 'white'),
		token('chip.variant.plain.background-color', 'red'),
	];
	const scope = { roles: ['deep', 'glow'], axes: ['background-color', 'border-radius', 'color', 'font-size', 'backdrop-filter', 'opacity'] };
	const css = kindCss(dictionary(tokens), 'chip', { accepts: ['surface', 'text', 'frame'] }, group, scope);
	const deep = css.slice(css.indexOf('[data-variant="deep"]'), css.indexOf('[data-variant="plain"]'));
	assert.match(deep, /--chip-background-color: var\(--surface-role-deep-background-color\);/);
	assert.match(deep, /--chip-opacity: var\(--surface-role-deep-opacity\);/, 'motion is universal');
	assert.doesNotMatch(deep, /border-radius|font-size/, 'base and size own these');
	assert.doesNotMatch(deep, /backdrop-filter/, 'overlay is not accepted');
	assert.match(deep, /--chip-color: white;/, "the variant's own token wins");
	assert.doesNotMatch(deep, /surface-role-deep-color/);
	assert.throws(
		() => kindCss(dictionary([]), 'chip', {}, { variant: { x: { $extensions: { 'com.coldlight': { role: 'shiny' } } } } }, scope),
		/unknown role "shiny"/,
	);
});

test('a slot scopes every rule to that part', () => {
	const group = { base: { color: { $value: 'red' } }, state: { hover: { color: { $value: 'blue' } } } };
	const css = kindCss(
		dictionary([token('menu.base.color', 'red'), token('menu.state.hover.color', 'blue')]),
		'menu',
		{ slot: 'content', accepts: ['interactive'] },
		group,
	);
	assert.match(css, /^\[data-kind="menu"\]\[data-slot="content"\] \{\n\t--menu-color: red;/);
	assert.match(css, /\[data-kind="menu"\]\[data-slot="content"\]:hover \{\n\t--menu-color: blue;/);
	assert.match(css, /\[data-kind="menu"\]\[data-slot="content"\]:focus-visible \{/);
	assert.doesNotMatch(css, /\[data-kind="menu"\] \{/);
});

test('a part section styles another part with its own custom properties', () => {
	const group = { base: { color: { $value: 'red' } }, part: { overlay: { 'background-color': { $value: 'transparent' } } } };
	const css = kindCss(
		dictionary([token('sheet.base.color', 'red'), token('sheet.part.overlay.background-color', 'transparent')]),
		'sheet',
		{ slot: 'content' },
		group,
	);
	assert.match(css, /\[data-kind="sheet"\]\[data-slot="overlay"\] \{\n\t--sheet-overlay-background-color: transparent;\n\tbackground-color: var\(--sheet-overlay-background-color\);\n\}/);
	const content = css.slice(0, css.indexOf('}'));
	assert.doesNotMatch(content, /overlay/, 'the main part does not read it');
	const keyword = kindCss(dictionary([token('sheet.part.overlay.color', 'inherit')]), 'sheet', {}, { part: { overlay: { color: { $value: 'inherit' } } } });
	assert.match(keyword, /\[data-slot="overlay"\] \{\n\tcolor: inherit;\n\}/, 'a CSS-wide keyword goes straight to the property');
});

test('a part takes tones: each sets the custom properties of that part under [data-tone]', () => {
	const group = {
		part: { level: { color: { $value: 'gray' }, tone: { error: { color: { $value: 'red' } }, warning: { color: { $value: 'orange' } } } } },
	};
	const css = kindCss(
		dictionary([
			token('log.part.level.color', 'gray'),
			token('log.part.level.tone.error.color', 'red'),
			token('log.part.level.tone.warning.color', 'orange'),
		]),
		'log',
		{},
		group,
	);
	assert.match(css, /\[data-kind="log"\]\[data-slot="level"\] \{\n\t--log-level-color: gray;\n\tcolor: var\(--log-level-color\);\n\}/);
	assert.match(css, /\[data-kind="log"\]\[data-slot="level"\]\[data-tone="error"\] \{\n\t--log-level-color: red;\n\tcolor: var\(--log-level-color\);\n\}/);
	assert.match(css, /\[data-kind="log"\]\[data-slot="level"\]\[data-tone="warning"\] \{\n\t--log-level-color: orange;\n\tcolor: var\(--log-level-color\);\n\}/);
	assert.ok(css.indexOf('[data-tone="error"]') > css.indexOf('[data-slot="level"] {'), 'tones come after the part they refine');
	const toneOnly = kindCss(
		dictionary([token('log.part.level.tone.muted.opacity', '0.7')]),
		'log',
		{},
		{ part: { level: { tone: { muted: { opacity: { $value: '0.7' } } } } } },
	);
	assert.match(toneOnly, /\[data-slot="level"\]\[data-tone="muted"\] \{\n\t--log-level-opacity: 0\.7;\n\topacity: var\(--log-level-opacity\);\n\}/, 'a property only a tone sets is read in that tone');
});

test('a part token at any other depth throws', () => {
	const group = { part: { level: { state: { hover: { color: { $value: 'red' } } } } } };
	assert.throws(
		() => kindCss(dictionary([token('log.part.level.state.hover.color', 'red')]), 'log', {}, group),
		/a part token sits at <kind>\.part\.<slot>\.<property> or <kind>\.part\.<slot>\.tone\.<name>\.<property>/,
	);
});

test('kind tokens are found by path, not by file', () => {
	const isKind = kindTokenFilter(new Set(['button']));
	assert.equal(isKind(token('button.variant.primary.color', 'x')), true);
	assert.equal(isKind(token('button.root.color', 'x')), false, 'collected component tokens are not kind tokens');
	assert.equal(isKind(token('preset.button-primary.color', 'x')), false);
});

test('readKindFile reads the kind group and rejects unknown sections and states', () => {
	const dir = mkdtempSync(join(tmpdir(), 'kind-css-'));
	const write = (name, json) => {
		const path = join(dir, name);
		writeFileSync(path, JSON.stringify(json));
		return path;
	};
	const meta = { accepts: ['surface'], defaults: { variant: 'bold' } };
	assert.deepEqual(readKindFile(write('ok.json', { chip: { $extensions: { 'com.coldlight': meta }, base: {} } }), 'chip').meta, meta);
	assert.equal(readKindFile(write('legacy.json', { preset: {} }), 'chip'), null);
	assert.throws(() => readKindFile(write('typo.json', { chip: { varient: {} } }), 'chip'), /unknown section "varient"/);
	assert.throws(() => readKindFile(write('state.json', { chip: { state: { hovered: {} } } }), 'chip'), /unknown state "hovered"/);
	assert.throws(
		() => readKindFile(write('part.json', { log: { part: { level: { tones: { error: {} } } } } }), 'log'),
		/part "level": unknown group "tones" \(a part holds properties and "tone"\)/,
	);
});

test('kindTypes writes the unions and defaults', () => {
	const ts = kindTypes('icon-button', { variant: { primary: {}, ghost: {} }, size: { sm: {}, md: {} } }, { defaults: { variant: 'primary', size: 'md' } });
	assert.match(ts, /export const ICON_BUTTON_VARIANTS = \["primary", "ghost"\] as const;/);
	assert.match(ts, /export type IconButtonSize = \(typeof ICON_BUTTON_SIZES\)\[number\];/);
	assert.match(ts, /export const ICON_BUTTON_DEFAULTS = \{ variant: "primary", size: "md" \} as const;/);
	assert.doesNotMatch(ts, /TONE/);
});

test('kindTypes writes the tones of each part', () => {
	const ts = kindTypes('log', { part: { line: {}, level: { color: {}, tone: { error: {}, warning: {}, muted: {} } } } }, {});
	assert.match(ts, /export const LOG_LEVEL_TONES = \["error", "warning", "muted"\] as const;/);
	assert.match(ts, /export type LogLevelTone = \(typeof LOG_LEVEL_TONES\)\[number\];/);
	assert.doesNotMatch(ts, /LOG_LINE_TONES/, 'a part without tones has no union');
});
