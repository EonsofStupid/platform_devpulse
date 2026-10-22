/**
 * DTCG 2025.10 §6.4 cases for `resolveExtends`.
 * Run: node --test scripts/build/styledictionary/preprocess-extends.test.mjs
 */

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { resolveExtends } from './preprocess-extends.mjs';

const color = (v) => ({ $value: v, $type: 'color' });

test('inherits every parent token and adds local ones', () => {
	const tree = resolveExtends({
		preset: { base: { bg: color('a'), fg: color('b') } },
		button: { primary: { $extends: '{preset.base}', ring: color('c') } },
	});
	assert.deepEqual(tree.button.primary, { bg: color('a'), fg: color('b'), ring: color('c') });
});

test('a local token replaces the inherited one at the same path', () => {
	const tree = resolveExtends({
		preset: { base: { bg: color('a'), fg: color('b') } },
		card: { glass: { $extends: '{preset.base}', bg: color('z') } },
	});
	assert.deepEqual(tree.card.glass, { bg: color('z'), fg: color('b') });
});

test('nested groups merge deeply; group properties are inherited unless local', () => {
	const tree = resolveExtends({
		preset: { base: { $type: 'color', border: { color: color('a'), width: { $value: '1px', $type: 'dimension' } } } },
		card: { x: { $extends: '{preset.base}', border: { color: color('q') } } },
	});
	assert.equal(tree.card.x.$type, 'color');
	assert.deepEqual(tree.card.x.border, { color: color('q'), width: { $value: '1px', $type: 'dimension' } });
});

test('chains resolve in order and the parent is left untouched', () => {
	const tree = resolveExtends({
		a: { bg: color('1'), fg: color('2') },
		b: { $extends: '{a}', fg: color('3') },
		c: { $extends: '{b}', ring: color('4') },
	});
	assert.deepEqual(tree.c, { bg: color('1'), fg: color('3'), ring: color('4') });
	assert.deepEqual(tree.a, { bg: color('1'), fg: color('2') });
});

test('referencing a token, a missing group, or a cycle fails', () => {
	assert.throws(() => resolveExtends({ t: color('a'), g: { $extends: '{t}' } }), /must name a group/);
	assert.throws(() => resolveExtends({ g: { $extends: '{nope}' } }), /does not exist/);
	assert.throws(() => resolveExtends({ a: { $extends: '{b}' }, b: { $extends: '{a}' } }), /cycle/);
	assert.throws(() => resolveExtends({ g: { $extends: 'preset.base' } }), /group reference/);
});
