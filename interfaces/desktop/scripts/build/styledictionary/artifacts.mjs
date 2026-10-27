import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';

/** Validate the entire build before writing. Check mode never mutates disk. */
export function publishArtifacts(root, manifestPath, artifacts, { check = false } = {}) {
	const base = resolve(root);
	const inside = (path) => {
		const rel = relative(base, resolve(path));
		if (!rel || rel === '..' || rel.startsWith(`..${sep}`) || isAbsolute(rel)) {
			throw new Error(`Generated output escapes workspace: ${path}`);
		}
		return rel.split(sep).join('/');
	};
	const manifest = resolve(manifestPath);
	inside(manifest);
	const outputs = new Map();
	for (const { destination, output } of artifacts) {
		if (typeof output !== 'string') throw new Error(`Non-text generated output: ${destination}`);
		if (!output.trim()) throw new Error(`Empty generated output: ${destination}`);
		const key = inside(destination);
		if (resolve(destination) === manifest) throw new Error('Output inventory cannot overwrite itself');
		if (outputs.has(key)) throw new Error(`Duplicate generated output: ${key}`);
		outputs.set(key, output.replace(/\r\n/g, '\n'));
	}
	const previous = existsSync(manifest) ? JSON.parse(readFileSync(manifest, 'utf8')) : [];
	if (!Array.isArray(previous) || previous.some((path) => typeof path !== 'string')) {
		throw new Error(`Invalid output inventory: ${manifest}`);
	}
	const orphans = previous.filter((path) => {
		inside(resolve(base, path));
		return !outputs.has(path) && existsSync(resolve(base, path));
	});
	if (orphans.length) {
		throw new Error(`Orphaned generated outputs; review their consumers before removal:\n${orphans.join('\n')}`);
	}
	outputs.set(inside(manifest), `${JSON.stringify([...outputs.keys()].sort(), null, '\t')}\n`);
	const changed = [...outputs].filter(([path, content]) => {
		const abs = resolve(base, path);
		return !existsSync(abs) || readFileSync(abs, 'utf8').replace(/\r\n/g, '\n') !== content;
	});
	if (check && changed.length) {
		throw new Error(`Stale generated outputs; run pnpm ds:tokens:build:\n${changed.map(([path]) => path).join('\n')}`);
	}
	if (!check) {
		for (const [path, content] of changed) {
			const abs = resolve(base, path);
			mkdirSync(dirname(abs), { recursive: true });
			writeFileSync(abs, content);
		}
	}
	return { total: outputs.size, changed: changed.length };
}
