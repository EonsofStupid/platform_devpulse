import { readdirSync, readFileSync } from 'node:fs';
import { basename, dirname, join, relative, sep } from 'node:path';
import { readKindFile } from './kind-css.mjs';

/** Feature looks stay beside their UI adapter, never inside the base package. */
export function discoverFeatureTokens(root) {
	return readdirSync(root, { recursive: true, withFileTypes: true })
		.filter((entry) => entry.isFile() && entry.name.endsWith('.tokens.json'))
		.map((entry) => join(entry.parentPath ?? entry.path, entry.name))
		.filter((path) => relative(root, path).split(sep).includes('ui'))
		.sort()
		.map((path) => {
			const parts = relative(root, path).split(sep);
			const ui = parts.indexOf('ui');
			const name = basename(path, '.tokens.json');
			if (parts.length !== ui + 3 || basename(dirname(path)) !== name) {
				throw new Error(`${path}: expected ui/<name>/<name>.tokens.json`);
			}
			const kind = [...parts.slice(0, ui), name].join('-');
			if (!/^[a-z][a-z0-9-]*$/.test(kind)) throw new Error(`Invalid feature token namespace: ${kind}`);
			const groups = Object.keys(JSON.parse(readFileSync(path, 'utf8'))).filter((key) => !key.startsWith('$'));
			if (groups.length !== 1 || groups[0] !== kind) {
				throw new Error(`${path}: expected top-level group ${kind} only`);
			}
			const read = readKindFile(path, kind);
			if (!read) throw new Error(`${path}: expected top-level group ${kind}`);
			return { kind, path, ...read, meta: { ...read.meta, attribute: 'data-ui' } };
		});
}
