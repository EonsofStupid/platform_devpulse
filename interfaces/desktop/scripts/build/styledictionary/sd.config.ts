/**
 * @file sd.config.ts
 * @package @devpulse/coldlight
 *
 * Style Dictionary v5 configuration.
 *
 * Source: flat domain files (tokens/src/{domain}.json)
 * Output: tier-aware CSS, per-domain theme files, per-domain type files
 *
 * Transforms: ALL BUILT-IN. Zero custom transforms.
 *   - color/oklch          (hex → oklch)
 *   - size/pxToRem         (px → rem, 16px base)
 *   - shadow/css/shorthand (DTCG shadow → CSS shorthand)
 *   - border/css/shorthand, typography/css/shorthand, transition/css/shorthand
 *   - cubicBezier/css, fontFamily/css
 *   - attribute/cti, name/kebab, time/seconds
 *
 * Custom formats (3 — genuinely necessary, no built-in equivalent):
 *   - coldlight/css             @layer wrapper + inset keyword for bevel shadows
 *   - coldlight/tailwind-theme  TW4 @theme with namespace remapping (per-domain)
 *   - coldlight/types           TypeScript union + record type shapes
 */

import StyleDictionary from 'style-dictionary';
import { fileHeader, createPropertyFormatter } from 'style-dictionary/utils';
import type { Config, TransformedToken } from 'style-dictionary/types';

// ─── Built-in transforms (explicit list, replaces transformGroup: 'css') ──

const CSS_TRANSFORMS = [
	'attribute/cti',
	'name/kebab',
	'time/seconds',
	'size/pxToRem',
	'color/oklch',
	'fontFamily/css',
	'cubicBezier/css',
	'border/css/shorthand',
	'typography/css/shorthand',
	'transition/css/shorthand',
	'shadow/css/shorthand',
];

const TYPE_TRANSFORMS = ['attribute/cti', 'name/kebab'];

// ─── Path-based filtering ────────────────────────────────────────────

const pathFilter =
	(...names: string[]) =>
	(token: TransformedToken) =>
		names.includes(token.path[0]);

// ─── Tier membership ─────────────────────────────────────────────────
//
// This is the ONLY place tier classification lives.
// Source files are flat by domain. Output is tier-aware.

const PRIMITIVE_PATHS = [
	'color',
	'shadow',
	'bevel',
	'glow',
	'glowSpread',
	'blur',
	'glass',
	'matte',
	'radius',
	'space',
	'padding',
	'size',
	'zIndex',
	'font',
	'textSize',
	'leading',
	'tracking',
	'motion',
];

const SEMANTIC_PATHS = [
	'elevation',
	'surface',
	'border',
	'borderPreset',
	'transition',
	'interaction',
	'overlay',
	'scrollbar',
	'backdrop',
	'textStyle',
];

const isPrimitive = pathFilter(...PRIMITIVE_PATHS);
const isSemantic = pathFilter(...SEMANTIC_PATHS);
const isComponent = (token: TransformedToken) => !isPrimitive(token) && !isSemantic(token);

// ─── Inset shadow detection ─────────────────────────────────────────

const isInsetShadow = (token: TransformedToken): boolean =>
	token.$extensions?.['com.coldlight']?.inset === true;

// ─── TW4 namespace remapping ─────────────────────────────────────────

const TW4_TOP_LEVEL: Record<string, string> = {
	bevel: 'inset-shadow',
	glow: 'drop-shadow',
	textSize: 'text',
};

const TW4_NESTED: Record<string, string> = {
	'motion.ease': 'ease',
	'motion.animation': 'animate',
};

function toTw4VarName(token: TransformedToken): string {
	if (token.path.length >= 2) {
		const nested = `${token.path[0]}.${token.path[1]}`;
		const prefix = TW4_NESTED[nested];
		if (prefix) {
			return `--${prefix}-${token.path.slice(2).join('-')}`;
		}
	}

	const prefix = TW4_TOP_LEVEL[token.path[0]];
	if (prefix) {
		return `--${prefix}-${token.path.slice(1).join('-')}`;
	}

	return `--${token.name}`;
}

// ─── Custom Format: coldlight/css ────────────────────────────────────

StyleDictionary.registerFormat({
	name: 'coldlight/css',
	format: async ({ dictionary, file, options }) => {
		const header = await fileHeader({ file });
		const formatter = createPropertyFormatter({
			format: 'css',
			dictionary,
			outputReferences: options.outputReferences ?? true,
			usesDtcg: true,
		});

		const lines = dictionary.allTokens.map((token) => {
			let line = formatter(token);

			if (isInsetShadow(token)) {
				line = line.replace(/:\s*(.+);/, (match, val: string) => {
					if (val === '0' || val === 'none') return match;
					const insetVal = val
						.split(', ')
						.map((s: string) => `inset ${s.trim()}`)
						.join(', ');
					return `: ${insetVal};`;
				});
			}

			return line;
		});

		const layer = options.sublayer
			? `@layer tokens.${options.sublayer}`
			: '@layer tokens';

		return `${header}${layer} {\n  :root {\n${lines.join('\n')}\n  }\n}\n`;
	},
});

// ─── Custom Format: coldlight/tailwind-theme ─────────────────────────

StyleDictionary.registerFormat({
	name: 'coldlight/tailwind-theme',
	format: async ({ dictionary, file, options }) => {
		const header = await fileHeader({ file });
		const lines: string[] = [];

		if (options.includeSpacingMultiplier) {
			lines.push('  --spacing: 0.25rem;');
		}

		for (const token of dictionary.allTokens) {
			if (isComponent(token)) continue;
			if (pathFilter('space', 'padding', 'size', 'zIndex')(token)) continue;

			const name = toTw4VarName(token);
			const val = token.$value ?? token.value;
			lines.push(`  ${name}: ${val};`);
		}

		if (lines.length === 0) return '';

		return `${header}@theme {\n${lines.join('\n')}\n}\n`;
	},
});

// ─── Custom Format: coldlight/types ──────────────────────────────────

StyleDictionary.registerFormat({
	name: 'coldlight/types',
	format: async ({ dictionary, file }) => {
		const header = await fileHeader({ file });
		const out: string[] = [`${header}/** AUTO-GENERATED by Style Dictionary — DO NOT EDIT */\n`];

		const groups = new Map<string, TransformedToken[]>();
		for (const token of dictionary.allTokens) {
			const g = token.path[0];
			if (!groups.has(g)) groups.set(g, []);
			groups.get(g)!.push(token);
		}

		for (const [group, tokens] of groups) {
			const pascal = group
				.split('-')
				.map((s) => s.charAt(0).toUpperCase() + s.slice(1))
				.join('');

			const leafNames = [...new Set(tokens.map((t) => t.path.slice(1).join('-')))];
			out.push(
				`export const ${pascal}Tokens = [${leafNames.map((v) => `'${v}'`).join(', ')}] as const;`,
				`export type ${pascal}Token = (typeof ${pascal}Tokens)[number];`,
				'',
			);

			const vars = tokens.map((t) => `'--${t.name}'`);
			out.push(`export type ${pascal}CSSVar = ${vars.join(' | ')};`, '');

			const tree: Record<string, unknown> = {};
			for (const t of tokens) {
				let node: Record<string, unknown> = tree;
				for (let i = 1; i < t.path.length - 1; i++) {
					if (!node[t.path[i]]) node[t.path[i]] = {};
					node = node[t.path[i]] as Record<string, unknown>;
				}
				node[t.path[t.path.length - 1]] = 'string';
			}

			const serialize = (obj: Record<string, unknown>, depth: number): string => {
				const pad = '\t'.repeat(depth);
				return Object.entries(obj)
					.map(([k, v]) => {
						const key = /^\d/.test(k) || k.includes('-') ? `'${k}'` : k;
						if (typeof v === 'string') return `${pad}\t${key}: string;`;
						return `${pad}\t${key}: {\n${serialize(v as Record<string, unknown>, depth + 1)}\n${pad}\t};`;
					})
					.join('\n');
			};

			out.push(`export type ${pascal}Record = {\n${serialize(tree, 0)}\n};`, '');
		}

		return out.join('\n') + '\n';
	},
});

// ─── File definition helpers ─────────────────────────────────────────

const cssFile = (
	dest: string,
	filter: (token: TransformedToken) => boolean,
	sublayer: string,
) => ({
	destination: dest,
	format: 'coldlight/css' as const,
	filter,
	options: { outputReferences: true, sublayer },
});

const themeFile = (
	dest: string,
	filter: (token: TransformedToken) => boolean,
	opts: Record<string, unknown> = {},
) => ({
	destination: dest,
	format: 'coldlight/tailwind-theme' as const,
	filter,
	options: { ...opts },
});

const typesFile = (dest: string, filter: (token: TransformedToken) => boolean) => ({
	destination: dest,
	format: 'coldlight/types' as const,
	filter,
});

// ─── Configuration ───────────────────────────────────────────────────

const SRC = 'tokens/src';

const config: Config = {
	source: [`${SRC}/*.json`],
	usesDtcg: true,
	log: { verbosity: 'verbose' },

	platforms: {
		// ── CSS: Primitives (tier-aware output) ───────────────────
		'css-primitives': {
			transforms: CSS_TRANSFORMS,
			buildPath: '../../../src/lib/design/styles/primitives/',
			files: [
				cssFile('color.css', pathFilter('color'), 'primitives'),
				cssFile('shadow.css', pathFilter('shadow'), 'primitives'),
				cssFile('bevel.css', pathFilter('bevel'), 'primitives'),
				cssFile('glow.css', pathFilter('glow', 'glowSpread'), 'primitives'),
				cssFile('blur.css', pathFilter('blur'), 'primitives'),
				cssFile('surface.css', pathFilter('glass', 'matte'), 'primitives'),
				cssFile('radius.css', pathFilter('radius'), 'primitives'),
				cssFile('spacing.css', pathFilter('space', 'padding', 'size', 'zIndex'), 'primitives'),
				cssFile('typography.css', pathFilter('font', 'textSize', 'leading', 'tracking'), 'primitives'),
				cssFile('motion.css', pathFilter('motion'), 'primitives'),
			],
		},

		// ── CSS: Semantic (tier-aware output) ─────────────────────
		'css-semantic': {
			transforms: CSS_TRANSFORMS,
			buildPath: '../../../src/lib/design/styles/semantic/',
			files: [
				cssFile('elevation.css', pathFilter('elevation'), 'semantic'),
				cssFile('surface.css', pathFilter('surface'), 'semantic'),
				cssFile('border.css', pathFilter('border', 'borderPreset'), 'semantic'),
				cssFile('transition.css', pathFilter('transition'), 'semantic'),
				cssFile('interaction.css', pathFilter('interaction'), 'semantic'),
				cssFile('overlay.css', pathFilter('overlay'), 'semantic'),
				cssFile('scrollbar.css', pathFilter('scrollbar'), 'semantic'),
				cssFile('backdrop.css', pathFilter('backdrop'), 'semantic'),
				cssFile('text-styles.css', pathFilter('textStyle'), 'semantic'),
			],
		},

		// ── CSS: Components (tier-aware output) ───────────────────
		'css-components': {
			transforms: CSS_TRANSFORMS,
			buildPath: '../../../src/lib/design/styles/components/',
			files: [cssFile('component.css', isComponent, 'components')],
		},

		// ── Theme: per-domain @theme files (1 domain = 1 file) ───
		'theme-color': {
			transforms: CSS_TRANSFORMS,
			buildPath: '../../../src/lib/design/theme/',
			files: [themeFile('color.css', pathFilter('color'))],
		},
		'theme-shadow': {
			transforms: CSS_TRANSFORMS,
			buildPath: '../../../src/lib/design/theme/',
			files: [themeFile('shadow.css', pathFilter('shadow'))],
		},
		'theme-elevation': {
			transforms: CSS_TRANSFORMS,
			buildPath: '../../../src/lib/design/theme/',
			files: [themeFile('elevation.css', pathFilter('elevation'))],
		},
		'theme-bevel': {
			transforms: CSS_TRANSFORMS,
			buildPath: '../../../src/lib/design/theme/',
			files: [themeFile('bevel.css', pathFilter('bevel'))],
		},
		'theme-glow': {
			transforms: CSS_TRANSFORMS,
			buildPath: '../../../src/lib/design/theme/',
			files: [themeFile('glow.css', pathFilter('glow', 'glowSpread'))],
		},
		'theme-blur': {
			transforms: CSS_TRANSFORMS,
			buildPath: '../../../src/lib/design/theme/',
			files: [themeFile('blur.css', pathFilter('blur'))],
		},
		'theme-surface': {
			transforms: CSS_TRANSFORMS,
			buildPath: '../../../src/lib/design/theme/',
			files: [themeFile('surface.css', pathFilter('glass', 'matte', 'surface'))],
		},
		'theme-radius': {
			transforms: CSS_TRANSFORMS,
			buildPath: '../../../src/lib/design/theme/',
			files: [themeFile('radius.css', pathFilter('radius'))],
		},
		'theme-spacing': {
			transforms: CSS_TRANSFORMS,
			buildPath: '../../../src/lib/design/theme/',
			files: [themeFile('spacing.css', pathFilter('space', 'padding', 'size', 'zIndex'), { includeSpacingMultiplier: true })],
		},
		'theme-typography': {
			transforms: CSS_TRANSFORMS,
			buildPath: '../../../src/lib/design/theme/',
			files: [themeFile('typography.css', pathFilter('font', 'textSize'))],
		},
		'theme-text-style': {
			transforms: CSS_TRANSFORMS,
			buildPath: '../../../src/lib/design/theme/',
			files: [themeFile('text-style.css', pathFilter('textStyle'))],
		},
		'theme-motion': {
			transforms: CSS_TRANSFORMS,
			buildPath: '../../../src/lib/design/theme/',
			files: [themeFile('motion.css', pathFilter('motion'))],
		},
		'theme-transition': {
			transforms: CSS_TRANSFORMS,
			buildPath: '../../../src/lib/design/theme/',
			files: [themeFile('transition.css', pathFilter('transition'))],
		},
		'theme-border': {
			transforms: CSS_TRANSFORMS,
			buildPath: '../../../src/lib/design/theme/',
			files: [themeFile('border.css', pathFilter('border', 'borderPreset'))],
		},
		'theme-interaction': {
			transforms: CSS_TRANSFORMS,
			buildPath: '../../../src/lib/design/theme/',
			files: [themeFile('interaction.css', pathFilter('interaction'))],
		},
		'theme-overlay': {
			transforms: CSS_TRANSFORMS,
			buildPath: '../../../src/lib/design/theme/',
			files: [themeFile('overlay.css', pathFilter('overlay'))],
		},
		'theme-scrollbar': {
			transforms: CSS_TRANSFORMS,
			buildPath: '../../../src/lib/design/theme/',
			files: [themeFile('scrollbar.css', pathFilter('scrollbar'))],
		},
		'theme-backdrop': {
			transforms: CSS_TRANSFORMS,
			buildPath: '../../../src/lib/design/theme/',
			files: [themeFile('backdrop.css', pathFilter('backdrop'))],
		},

		// ── TypeScript Types ──────────────────────────────────────
		'types-primitives': {
			transforms: TYPE_TRANSFORMS,
			buildPath: '../../../src/lib/design/types/',
			files: [
				typesFile('color.d.ts', pathFilter('color')),
				typesFile('shadow.d.ts', pathFilter('shadow', 'bevel', 'glow', 'glowSpread')),
				typesFile('blur.d.ts', pathFilter('blur')),
				typesFile('surface.d.ts', pathFilter('glass', 'matte', 'surface')),
				typesFile('spacing.d.ts', pathFilter('radius', 'space', 'padding', 'size', 'zIndex')),
				typesFile('typography.d.ts', pathFilter('font', 'textSize', 'textStyle')),
				typesFile('motion.d.ts', pathFilter('motion', 'transition')),
			],
		},
		'types-semantic': {
			transforms: TYPE_TRANSFORMS,
			buildPath: '../../../src/lib/design/types/',
			files: [
				typesFile('elevation.d.ts', pathFilter('elevation')),
				typesFile('border.d.ts', pathFilter('border', 'borderPreset')),
				typesFile('interaction.d.ts', pathFilter('interaction', 'overlay', 'scrollbar')),
				typesFile('backdrop.d.ts', pathFilter('backdrop')),
			],
		},
		'types-components': {
			transforms: TYPE_TRANSFORMS,
			buildPath: '../../../src/lib/design/types/',
			files: [typesFile('component.d.ts', isComponent)],
		},
	},
};

export default config;
