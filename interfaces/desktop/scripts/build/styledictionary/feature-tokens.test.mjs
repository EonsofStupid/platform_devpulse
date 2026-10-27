import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { discoverFeatureTokens } from './feature-tokens.mjs';
import { kindCss } from './kind-css.mjs';

test('discovers a colocated feature and keeps its selectors distinct from the base component', (t) => {
	const root = mkdtempSync(join(tmpdir(), 'coldlight-features-'));
	t.after(() => rmSync(root, { recursive: true, force: true }));
	const dir = join(root, 'chat', 'ui', 'session-row');
	mkdirSync(dir, { recursive: true });
	const file = join(dir, 'session-row.tokens.json');
	const group = { base: { opacity: { $value: 1, $type: 'number' } } };
	writeFileSync(file, JSON.stringify({ 'chat-session-row': group }));
	const [feature] = discoverFeatureTokens(root);
	assert.equal(feature.kind, 'chat-session-row');
	const css = kindCss({ allTokens: [{ path: ['chat-session-row', 'base', 'opacity'], $value: 1 }] }, feature.kind, feature.meta, group);
	assert.match(css, /\[data-ui="chat-session-row"\]/);
	assert.doesNotMatch(css, /data-kind/);
	writeFileSync(file, JSON.stringify({ 'chat-session-row': group, surface: group }));
	assert.throws(() => discoverFeatureTokens(root), /expected top-level group chat-session-row only/);
	writeFileSync(file, JSON.stringify({ wrong: group }));
	assert.throws(() => discoverFeatureTokens(root), /expected top-level group chat-session-row/);
});
