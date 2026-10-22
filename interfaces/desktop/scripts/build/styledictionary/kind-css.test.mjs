/**
 * Cases for the kind-file generator (plan 0006 §0s).
 * Run: node --test scripts/build/styledictionary/kind-css.test.mjs
 */

import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { kindCss, kindTokenFilter, kindTypes, readKindFile } from './kind-css.mjs';

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
	assert.match(css, /cursor: not-allowed;/);
	assert.match(css, /filter: var\(--hover-filter, brightness\(1\.1\)\);/);
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
});

test('kindTypes writes the unions and defaults', () => {
	const ts = kindTypes('icon-button', { variant: { primary: {}, ghost: {} }, size: { sm: {}, md: {} } }, { defaults: { variant: 'primary', size: 'md' } });
	assert.match(ts, /export const ICON_BUTTON_VARIANTS = \["primary", "ghost"\] as const;/);
	assert.match(ts, /export type IconButtonSize = \(typeof ICON_BUTTON_SIZES\)\[number\];/);
	assert.match(ts, /export const ICON_BUTTON_DEFAULTS = \{ variant: "primary", size: "md" \} as const;/);
	assert.doesNotMatch(ts, /TONE/);
});
