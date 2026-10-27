import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { publishArtifacts } from './artifacts.mjs';

function fixture(t) {
	const root = mkdtempSync(join(tmpdir(), 'coldlight-artifacts-'));
	t.after(() => rmSync(root, { recursive: true, force: true }));
	const manifest = join(root, 'outputs.json');
	const file = join(root, 'styles', 'card.css');
	return { root, manifest, file, artifacts: [{ destination: file, output: 'card {}\n' }] };
}

test('build is idempotent and check does not rewrite files', (t) => {
	const { root, manifest, file, artifacts } = fixture(t);
	assert.equal(publishArtifacts(root, manifest, artifacts).changed, 2);
	const before = statSync(file).mtimeMs;
	assert.equal(publishArtifacts(root, manifest, artifacts).changed, 0);
	assert.equal(publishArtifacts(root, manifest, artifacts, { check: true }).changed, 0);
	assert.equal(statSync(file).mtimeMs, before);
});

test('stale check fails without repairing changed output', (t) => {
	const { root, manifest, file, artifacts } = fixture(t);
	publishArtifacts(root, manifest, artifacts);
	writeFileSync(file, 'changed');
	assert.throws(() => publishArtifacts(root, manifest, artifacts, { check: true }), /Stale generated/);
	assert.equal(readFileSync(file, 'utf8'), 'changed');
});

test('removed or renamed inputs report orphan output before writing anything', (t) => {
	const { root, manifest, file, artifacts } = fixture(t);
	publishArtifacts(root, manifest, artifacts);
	assert.throws(() => publishArtifacts(root, manifest, []), /Orphaned/);
	assert.throws(() => publishArtifacts(root, manifest, [{ destination: join(root, 'renamed.css'), output: 'renamed {}' }]), /Orphaned/);
	assert.equal(readFileSync(file, 'utf8'), 'card {}\n');
});

test('rejects escaped paths, duplicate destinations and non-text output', (t) => {
	const { root, manifest, artifacts } = fixture(t);
	assert.throws(() => publishArtifacts(root, manifest, [{ destination: join(root, '..', 'escape.css'), output: 'escape {}' }]), /escapes/);
	assert.throws(() => publishArtifacts(root, manifest, [...artifacts, ...artifacts]), /Duplicate/);
	assert.throws(() => publishArtifacts(root, manifest, [{ ...artifacts[0], output: {} }]), /Non-text/);
	assert.throws(() => publishArtifacts(root, manifest, [{ ...artifacts[0], output: '' }]), /Empty generated/);
});
