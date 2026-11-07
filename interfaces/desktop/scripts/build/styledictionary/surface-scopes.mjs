/**
 * @file surface-scopes.mjs
 * @package @devpulse/coldlight
 *
 * The family scope (plan 0006 §0s, D1). A family is a visual language
 * (neuro, glass, …); its file under `tokens/src/presets` defines one preset
 * per surface role. For each family this emits
 *
 *   [data-surface="<family>"] { --surface-role-<role>-<axis>: var(--preset-<family>-<role>-<axis>); … }
 *
 * and the default family on `:root` too. Custom properties inherit, so the
 * nearest scope wins; a kind's variant reads its role's properties and the
 * family in scope supplies the values. A preset file whose groups name no
 * surface role (chat) is not a family.
 */

import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { CONCERN_AXES, MOTION_AXES } from './kind-css.mjs';

const EXT = 'com.coldlight';
const SOURCES = join(import.meta.dirname, '../../../src/lib/design/tokens/src/presets');

/** The roles every family defines (today's six family variants). */
export const SURFACE_ROLES = ['elevated', 'deep', 'minimal', 'solid', 'glow', 'muted'];

/** The axes a role carries into its scope: what some concern or motion takes (not `background-alpha`). */
const ROLE_AXES = new Set([...Object.values(CONCERN_AXES).flat(), ...MOTION_AXES]);

/**
 * The families in the preset files, in file order:
 * `{ family, roles: { <role>: <preset id> }, axes: [<axis>…] }`.
 * A file that defines some surface roles must define all of them, for one
 * family, and every role of every family carries the same axes, so a nested
 * scope never lets an outer family's value through.
 * @param {string} [dir]
 */
export function readFamilies(dir = SOURCES) {
	const families = [];
	for (const file of readdirSync(dir).filter((f) => f.endsWith('.tokens.json')).sort()) {
		const { preset = {} } = JSON.parse(readFileSync(join(dir, file), 'utf-8'));
		const roles = {};
		const names = new Set();
		const axesOf = {};
		for (const [id, group] of Object.entries(preset)) {
			const meta = group?.$extensions?.[EXT];
			if (!meta || !SURFACE_ROLES.includes(meta.variant)) continue;
			roles[meta.variant] = id;
			names.add(meta.family);
			axesOf[id] = Object.keys(group).filter((k) => !k.startsWith('$') && ROLE_AXES.has(k));
		}
		if (names.size === 0) continue;
		if (names.size > 1) throw new Error(`${file}: one family per file, found ${[...names].join(', ')}`);
		const missing = SURFACE_ROLES.filter((role) => !(role in roles));
		if (missing.length > 0) throw new Error(`${file}: family ${[...names][0]} lacks the roles ${missing.join(', ')}`);
		families.push({ family: [...names][0], roles, axes: axesOf[roles[SURFACE_ROLES[0]]], axesOf });
	}
	const reference = families[0]?.axes ?? [];
	for (const { axesOf } of families) {
		for (const [id, axes] of Object.entries(axesOf)) {
			const differs = axes.length !== reference.length || axes.some((a) => !reference.includes(a));
			if (differs) throw new Error(`preset ${id}: role axes [${axes.join(', ')}] differ from [${reference.join(', ')}]`);
		}
	}
	return families.map(({ axesOf, ...family }) => family);
}

/** The family scope as kind files see it: the roles, and the axes each role defines. */
export const scopeOf = (families) => ({ roles: SURFACE_ROLES, axes: families[0]?.axes ?? [] });

/**
 * The scope CSS.
 * @param {{ allTokens: Array<Record<string, any>>, unfilteredAllTokens?: Array<Record<string, any>> }} dictionary
 * @param {Array<{ family: string, roles: Record<string, string> }>} families
 * @param {string} surfaceDefault the family on `:root`
 */
export function surfaceScopesCss(dictionary, families, surfaceDefault) {
	if (!families.some(({ family }) => family === surfaceDefault)) {
		throw new Error(`surfaceDefault "${surfaceDefault}" is not a family (${families.map((f) => f.family).join(', ')})`);
	}
	const everything = dictionary.unfilteredAllTokens ?? dictionary.allTokens;
	const nameByPath = new Map(everything.map((t) => [t.path.join('.'), t.name]));
	const ordered = [...families].sort((a, b) => (a.family === surfaceDefault ? -1 : b.family === surfaceDefault ? 1 : 0));
	const blocks = ordered.map(({ family, roles }) => {
		const decls = [];
		for (const role of SURFACE_ROLES) {
			const id = roles[role];
			const axes = everything.filter((t) => t.path.length === 3 && t.path[0] === 'preset' && t.path[1] === id);
			if (axes.length === 0) throw new Error(`${family}: preset ${id} has no tokens`);
			for (const token of axes) {
				const axis = token.path[2];
				if (!ROLE_AXES.has(axis)) continue;
				decls.push(`\t\t--surface-role-${role}-${axis}: var(--${nameByPath.get(token.path.join('.'))});`);
			}
		}
		const selector = family === surfaceDefault ? `:root,\n\t[data-surface="${family}"]` : `[data-surface="${family}"]`;
		return `\t${selector} {\n${decls.join('\n')}\n\t}`;
	});
	return `@layer tokens.scopes {\n${blocks.join('\n\n')}\n}`;
}

/** The scope's generated TypeScript: the families, the roles and the default. */
export function surfaceTypes(families, surfaceDefault) {
	const list = (values) => values.map((v) => JSON.stringify(v)).join(', ');
	return [
		'/* AUTO-GENERATED by scripts/build/styledictionary/build.mjs from tokens/src/presets — DO NOT EDIT */',
		'',
		`export const SURFACE_FAMILIES = [${list(families.map((f) => f.family))}] as const;`,
		'export type SurfaceFamily = (typeof SURFACE_FAMILIES)[number];',
		'',
		`export const SURFACE_ROLES = [${list(SURFACE_ROLES)}] as const;`,
		'export type SurfaceRole = (typeof SURFACE_ROLES)[number];',
		'',
		`export const SURFACE_DEFAULT: SurfaceFamily = ${JSON.stringify(surfaceDefault)};`,
		'',
	].join('\n');
}
