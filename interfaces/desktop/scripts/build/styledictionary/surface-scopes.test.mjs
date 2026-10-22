/**
 * Cases for the family scope generator (plan 0006 §0s, 0s.5).
 * Run: node --test scripts/build/styledictionary/surface-scopes.test.mjs
 */

import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { readFamilies, SURFACE_ROLES, surfaceScopesCss, surfaceTypes } from './surface-scopes.mjs';

const role = (family, variant) => ({ $extensions: { 'com.coldlight': { family, variant, label: `${family} ${variant}` } } });
const familyFile = (family, roles = SURFACE_ROLES) =>
	({ preset: Object.fromEntries(roles.map((r) => [`${family}-${r}`, role(family, r)])) });

function presetsDir(files) {
	const dir = mkdtempSync(join(tmpdir(), 'surface-scopes-'));
	for (const [name, json] of Object.entries(files)) writeFileSync(join(dir, name), JSON.stringify(json));
	return dir;
}

/** Preset tokens as Style Dictionary names them: preset-<id>-<axis>. */
const presetTokens = (ids, axes) =>
	ids.flatMap((id) => axes.map((axis) => ({ path: ['preset', id, axis], name: `preset-${id}-${axis}` })));

test('families come from the preset files; a file naming no surface role is not one', () => {
	const dir = presetsDir({
		'glass.tokens.json': familyFile('glass'),
		'neuro.tokens.json': familyFile('neuro'),
		'chat.tokens.json': { preset: { 'chat-bubble-user': role('chat', 'bubble-user') } },
	});
	const families = readFamilies(dir);
	assert.deepEqual(families.map((f) => f.family), ['glass', 'neuro']);
	assert.equal(families[0].roles.deep, 'glass-deep');
});

test('a family must define every role, for one family', () => {
	assert.throws(() => readFamilies(presetsDir({ 'flat.tokens.json': familyFile('flat', ['elevated', 'deep']) })), /lacks the roles minimal/);
	const mixed = { preset: { ...familyFile('a').preset, 'b-deep': role('b', 'deep') } };
	assert.throws(() => readFamilies(presetsDir({ 'mixed.tokens.json': mixed })), /one family per file/);
});

test('each family sets --surface-role-* to its presets; the default is also :root and comes first', () => {
	const families = [
		{ family: 'glass', roles: Object.fromEntries(SURFACE_ROLES.map((r) => [r, `glass-${r}`])) },
		{ family: 'neuro', roles: Object.fromEntries(SURFACE_ROLES.map((r) => [r, `neuro-${r}`])) },
	];
	const ids = families.flatMap((f) => Object.values(f.roles));
	const tokens = presetTokens(ids, ['background-color', 'background-alpha', 'opacity']);
	const css = surfaceScopesCss({ allTokens: tokens, unfilteredAllTokens: tokens }, families, 'neuro');
	assert.match(css, /^@layer tokens\.scopes \{\n\t:root,\n\t\[data-surface="neuro"\] \{/);
	assert.ok(css.indexOf('[data-surface="glass"]') > css.indexOf(':root'), 'default first, so a glass root still wins');
	assert.match(css, /--surface-role-deep-background-color: var\(--preset-glass-deep-background-color\);/);
	assert.match(css, /--surface-role-muted-opacity: var\(--preset-neuro-muted-opacity\);/);
	assert.doesNotMatch(css, /background-alpha/, 'no concern takes it');
});

test('an unknown default or a role without tokens throws', () => {
	const families = [{ family: 'glass', roles: Object.fromEntries(SURFACE_ROLES.map((r) => [r, `glass-${r}`])) }];
	assert.throws(() => surfaceScopesCss({ allTokens: [] }, families, 'neuro'), /surfaceDefault "neuro" is not a family/);
	assert.throws(() => surfaceScopesCss({ allTokens: [] }, families, 'glass'), /preset glass-elevated has no tokens/);
});

test('surfaceTypes writes the families, roles and default', () => {
	const ts = surfaceTypes([{ family: 'glass' }, { family: 'neuro' }], 'neuro');
	assert.match(ts, /export const SURFACE_FAMILIES = \["glass", "neuro"\] as const;/);
	assert.match(ts, /export type SurfaceRole = \(typeof SURFACE_ROLES\)\[number\];/);
	assert.match(ts, /export const SURFACE_DEFAULT: SurfaceFamily = "neuro";/);
});
