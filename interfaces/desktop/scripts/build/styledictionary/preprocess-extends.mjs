/**
 * @file preprocess-extends.mjs
 * @package @devpulse/coldlight
 *
 * Resolves DTCG group inheritance (`$extends`) before Style Dictionary sees
 * the tokens. Design Tokens Format Module 2025.10 §6.4:
 *
 * - A group MAY carry `$extends` to inherit the tokens and properties of
 *   another group. It MUST NOT reference a token.
 * - Inheritance is a deep merge: local tokens and properties replace
 *   inherited ones at the same path; paths only the parent has are
 *   inherited; new local paths are added.
 *
 * A kind's variant is then a family preset plus only what differs
 * (plan 0006 step 0s). Style Dictionary 5.3.1 does not resolve `$extends`;
 * this goes away when it does.
 */

/** A token is any object holding `$value`; everything else is a group. */
const isToken = (node) => node !== null && typeof node === 'object' && '$value' in node;
const isGroup = (node) => node !== null && typeof node === 'object' && !Array.isArray(node) && !isToken(node);

/** `"{preset.neuro-elevated}"` → `["preset", "neuro-elevated"]`. */
function referencePath(ref, at) {
	const match = typeof ref === 'string' ? /^\{([^{}]+)\}$/.exec(ref) : null;
	if (!match) {
		throw new Error(`$extends at "${at}" must be a group reference like "{group.path}", got ${JSON.stringify(ref)}`);
	}
	return match[1].split('.');
}

function lookup(tree, path) {
	let node = tree;
	for (const key of path) {
		if (!isGroup(node) || !(key in node)) return undefined;
		node = node[key];
	}
	return node;
}

/** Deep copy of plain JSON data (token trees hold nothing else). */
const clone = (value) => (value === null || typeof value !== 'object' ? value : structuredClone(value));

/** The parent's tokens and properties under the local ones; local wins at every path. */
function merge(parent, local) {
	const out = {};
	for (const [key, value] of Object.entries(parent)) {
		if (key === '$extends') continue;
		out[key] = clone(value);
	}
	for (const [key, value] of Object.entries(local)) {
		if (key === '$extends') continue;
		out[key] = isGroup(out[key]) && isGroup(value) ? merge(out[key], value) : clone(value);
	}
	return out;
}

/**
 * Resolve every `$extends` in a DTCG token tree, in place.
 * Throws on a reference to a token, a missing group, or a cycle.
 * @param {Record<string, unknown>} tree
 * @returns {Record<string, unknown>} the same tree, resolved
 */
export function resolveExtends(tree) {
	const done = new Set();

	/** Resolve the group at `path` (and whatever it extends) once. */
	function resolveGroup(path, stack) {
		const key = path.join('.');
		if (done.has(key)) return;
		if (stack.includes(key)) {
			throw new Error(`$extends cycle: ${[...stack, key].join(' → ')}`);
		}
		const group = lookup(tree, path);
		if (!isGroup(group)) return;
		if ('$extends' in group) {
			const targetPath = referencePath(group.$extends, key);
			const target = lookup(tree, targetPath);
			if (target === undefined) {
				throw new Error(`$extends at "${key}" names "${targetPath.join('.')}", which does not exist`);
			}
			if (!isGroup(target)) {
				throw new Error(`$extends at "${key}" names the token "${targetPath.join('.')}"; it must name a group`);
			}
			resolveGroup(targetPath, [...stack, key]);
			const resolved = merge(lookup(tree, targetPath), group);
			for (const k of Object.keys(group)) delete group[k];
			Object.assign(group, resolved);
		}
		done.add(key);
		for (const [child, value] of Object.entries(group)) {
			if (!child.startsWith('$') && isGroup(value)) resolveGroup([...path, child], stack);
		}
	}

	for (const [key, value] of Object.entries(tree)) {
		if (!key.startsWith('$') && isGroup(value)) resolveGroup([key], []);
	}
	return tree;
}
