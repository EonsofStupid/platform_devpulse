/**
 * @file sd.config.ts
 * @package @devpulse/coldlight
 *
 * Style Dictionary v5 configuration — ColdLight token pipeline.
 *
 * Source: flat domain files (tokens/src/{domain}.json)
 * Output: tier-aware CSS, per-domain Tailwind @theme, per-domain TypeScript types
 *
 * Every SD5 built-in is referenced via its enum.
 * Custom names (formats, transforms) are defined as typed constants.
 */

import StyleDictionary from 'style-dictionary';
import { fileHeader, createPropertyFormatter } from 'style-dictionary/utils';
import type { Config, TransformedToken } from 'style-dictionary/types';
import {
	transforms,
	transformTypes,
	propertyFormatNames,
	logVerbosityLevels,
	logWarningLevels,
	logBrokenReferenceLevels,
} from 'style-dictionary/enums';

// ═══════════════════════════════════════════════════════════════
// COLDLIGHT CUSTOM NAMES — typed constants, zero raw strings
// ═══════════════════════════════════════════════════════════════

/** Custom transform names — ColdLight extensions to SD5 */
const clTransforms = {
	gradientCssShorthand: 'gradient/css/shorthand',
} as const;

/** Custom format names — ColdLight extensions to SD5 */
const clFormats = {
	css: 'coldlight/css',
	tailwindTheme: 'coldlight/tailwind-theme',
	types: 'coldlight/types',
	manifest: 'coldlight/manifest',
} as const;

/** Custom preprocessor names */
const clPreprocessors = {
	captureExtensions: 'coldlight/capture-extensions',
} as const;

/** DTCG $extensions namespace */
const CL_EXT = 'com.coldlight' as const;

/**
 * Group-level $extensions captured by preprocessor.
 * SD5 strips group-level $extensions from TransformedToken —
 * the preprocessor walks the raw tree first and stashes them here
 * so custom formats can read scale/control/default metadata.
 *
 * Key = dot-joined group path (e.g., "blur", "color.teal", "motion.duration")
 * Value = the $extensions[CL_EXT] object from that group
 */
const groupExtensions = new Map<string, Record<string, unknown>>();

/** Token tier paths — determines which @layer a token lands in */
const tiers = {
	primitive: [
		'color', 'shadow', 'bevel', 'glow', 'glowSpread', 'blur',
		'glass', 'matte', 'radius', 'space', 'padding', 'size', 'breakpoint',
		'zIndex', 'font', 'textSize', 'leading', 'tracking',
		'motion', 'gradient',
	],
	semantic: [
		'elevation', 'surface', 'border', 'borderPreset', 'transition',
		'interaction', 'overlay', 'scrollbar', 'backdrop', 'textStyle',
	],
} as const;

/** CSS @layer sublayer names */
const layers = {
	primitives: 'primitives',
	semantic: 'semantic',
	components: 'components',
} as const;

/** Tailwind v4 @theme namespace remapping */
const tw4Remap = {
	topLevel: {
		bevel: 'inset-shadow',
		glow: 'drop-shadow',
		textSize: 'text',
		space: 'spacing',
		zIndex: 'z',
	},
	nested: {
		'motion.ease': 'ease',
		'motion.animation': 'animate',
	},
} as const;

/** Build paths (relative to CWD = interfaces/desktop/) */
const paths = {
	source: 'scripts/build/styledictionary/tokens/src',
	design: 'src/lib/design',
} as const;

// ═══════════════════════════════════════════════════════════════
// PATH-BASED FILTERING
// ═══════════════════════════════════════════════════════════════

const pathFilter =
	(...names: readonly string[]) =>
	(token: TransformedToken) =>
		names.includes(token.path[0]);

const isPrimitive = pathFilter(...tiers.primitive);
const isSemantic = pathFilter(...tiers.semantic);
const isComponent = (token: TransformedToken) =>
	!isPrimitive(token) && !isSemantic(token);

// ═══════════════════════════════════════════════════════════════
// $EXTENSIONS HELPERS
// ═══════════════════════════════════════════════════════════════

const isInsetShadow = (token: TransformedToken): boolean =>
	token.$extensions?.[CL_EXT]?.inset === true;

// ═══════════════════════════════════════════════════════════════
// CUSTOM TRANSFORM: gradient/css/shorthand
//
// DTCG gradient: array of { color, position } stops.
// SD5 has NO built-in CSS transform for gradients.
// This converts to linear-gradient() CSS shorthand.
// ═══════════════════════════════════════════════════════════════

StyleDictionary.registerTransform({
	name: clTransforms.gradientCssShorthand,
	type: transformTypes.value,
	transitive: true,
	filter: (token) => token.$type === 'gradient' || token.type === 'gradient',
	transform: (token) => {
		const val = token.$value ?? token.value;
		if (!Array.isArray(val)) return val;

		const stops = val
			.map((stop: { color: string; position: number }) => {
				const pos = typeof stop.position === 'number'
					? ` ${stop.position * 100}%`
					: '';
				return `${stop.color}${pos}`;
			})
			.join(', ');

		const angle = token.$extensions?.[CL_EXT]?.angle ?? '135deg';
		return `linear-gradient(${angle}, ${stops})`;
	},
});

// ═══════════════════════════════════════════════════════════════
// PREPROCESSOR: coldlight/capture-extensions
//
// SD5 strips group-level $extensions from TransformedToken.
// This preprocessor walks the raw token tree BEFORE transforms
// and captures group-level $extensions.com.coldlight metadata
// into the groupExtensions map so custom formats can read them.
// ═══════════════════════════════════════════════════════════════

StyleDictionary.registerPreprocessor({
	name: clPreprocessors.captureExtensions,
	preprocessor: (dictionary) => {
		groupExtensions.clear();

		function walk(obj: Record<string, unknown>, path: string[] = []) {
			if (!obj || typeof obj !== 'object') return;

			const ext = (obj as Record<string, unknown>)['$extensions'] as
				| Record<string, unknown>
				| undefined;
			if (ext?.[CL_EXT]) {
				groupExtensions.set(
					path.join('.'),
					ext[CL_EXT] as Record<string, unknown>,
				);
			}

			for (const [key, val] of Object.entries(obj)) {
				if (key.startsWith('$')) continue;
				if (val && typeof val === 'object' && !Array.isArray(val)) {
					walk(val as Record<string, unknown>, [...path, key]);
				}
			}
		}

		walk(dictionary as Record<string, unknown>);
		return dictionary;
	},
});

// ═══════════════════════════════════════════════════════════════
// TRANSFORM STACKS
// ═══════════════════════════════════════════════════════════════

const CSS_TRANSFORMS = [
	transforms.attributeCti,
	transforms.nameKebab,
	transforms.timeSeconds,
	transforms.sizePxToRem,
	transforms.colorOklch,
	transforms.fontFamilyCss,
	transforms.cubicBezierCss,
	transforms.borderCssShorthand,
	transforms.typographyCssShorthand,
	transforms.transitionCssShorthand,
	transforms.shadowCssShorthand,
	clTransforms.gradientCssShorthand,
];

const TYPE_TRANSFORMS = [
	transforms.attributeCti,
	transforms.nameKebab,
];

// ═══════════════════════════════════════════════════════════════
// TW4 NAMESPACE REMAPPING
// ═══════════════════════════════════════════════════════════════

function toTw4VarName(token: TransformedToken): string {
	if (token.path.length >= 2) {
		const nested = `${token.path[0]}.${token.path[1]}`;
		const prefix = tw4Remap.nested[nested as keyof typeof tw4Remap.nested];
		if (prefix) {
			return `--${prefix}-${token.path.slice(2).join('-')}`;
		}
	}

	const prefix = tw4Remap.topLevel[token.path[0] as keyof typeof tw4Remap.topLevel];
	if (prefix) {
		return `--${prefix}-${token.path.slice(1).join('-')}`;
	}

	return `--${token.name}`;
}

// ═══════════════════════════════════════════════════════════════
// CUSTOM FORMAT: coldlight/css
// ═══════════════════════════════════════════════════════════════

StyleDictionary.registerFormat({
	name: clFormats.css,
	format: async ({ dictionary, file, options }) => {
		const header = await fileHeader({ file });
		const formatter = createPropertyFormatter({
			format: propertyFormatNames.css,
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

// ═══════════════════════════════════════════════════════════════
// CUSTOM FORMAT: coldlight/tailwind-theme
// ═══════════════════════════════════════════════════════════════

StyleDictionary.registerFormat({
	name: clFormats.tailwindTheme,
	format: async ({ dictionary, file, options }) => {
		const header = await fileHeader({ file });
		const lines: string[] = [];

		for (const token of dictionary.allTokens) {
			if (isComponent(token)) continue;

			const name = toTw4VarName(token);
			const val = token.$value ?? token.value;
			lines.push(`  ${name}: ${val};`);
		}

		if (lines.length === 0) return '';

		return `${header}@theme {\n${lines.join('\n')}\n}\n`;
	},
});

// ═══════════════════════════════════════════════════════════════
// CUSTOM FORMAT: coldlight/types
// ═══════════════════════════════════════════════════════════════

StyleDictionary.registerFormat({
	name: clFormats.types,
	format: async ({ dictionary, file }) => {
		const header = await fileHeader({ file });
		const out: string[] = [
			`${header}/** AUTO-GENERATED by Style Dictionary — DO NOT EDIT */\n`,
		];

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

			const leafNames = [
				...new Set(tokens.map((t) => t.path.slice(1).join('-'))),
			];
			out.push(
				`export const ${pascal}Tokens = [${leafNames.map((v) => `'${v}'`).join(', ')}] as const;`,
				`export type ${pascal}Token = (typeof ${pascal}Tokens)[number];`,
				'',
			);

			const vars = tokens.map((t) => `'--${t.name}'`);
			out.push(
				`export type ${pascal}CSSVar = ${vars.join(' | ')};`,
				'',
			);

			const tree: Record<string, unknown> = {};
			for (const t of tokens) {
				let node: Record<string, unknown> = tree;
				for (let i = 1; i < t.path.length - 1; i++) {
					if (!node[t.path[i]]) node[t.path[i]] = {};
					node = node[t.path[i]] as Record<string, unknown>;
				}
				node[t.path[t.path.length - 1]] = 'string';
			}

			const serialize = (
				obj: Record<string, unknown>,
				depth: number,
			): string => {
				const pad = '\t'.repeat(depth);
				return Object.entries(obj)
					.map(([k, v]) => {
						const key =
							/^\d/.test(k) || k.includes('-') ? `'${k}'` : k;
						if (typeof v === 'string')
							return `${pad}\t${key}: string;`;
						return `${pad}\t${key}: {\n${serialize(v as Record<string, unknown>, depth + 1)}\n${pad}\t};`;
					})
					.join('\n');
			};

			out.push(
				`export type ${pascal}Record = {\n${serialize(tree, 0)}\n};`,
				'',
			);
		}

		return out.join('\n') + '\n';
	},
});

// ═══════════════════════════════════════════════════════════════
// CUSTOM FORMAT: coldlight/manifest
//
// Generates a JSON manifest of all token groups with their
// $extensions.com.coldlight metadata (control, scale, default, tier).
// VPB reads this to auto-generate sliders, knobs, selects, color pickers.
// ═══════════════════════════════════════════════════════════════

StyleDictionary.registerFormat({
	name: clFormats.manifest,
	format: ({ dictionary }) => {
		const manifest: Record<string, unknown> = {};

		for (const token of dictionary.allTokens) {
			const group = token.path[0];
			if (!manifest[group]) {
				// Attach group-level extensions captured by preprocessor
				const groupPath = token.path.slice(0, -1).join('.');
				const groupExt = groupExtensions.get(group)
					?? groupExtensions.get(groupPath)
					?? {};

				manifest[group] = {
					extensions: groupExt,
					tokens: [],
				};
			}

			(manifest[group] as { tokens: unknown[] }).tokens.push({
				name: token.name,
				path: token.path,
				cssVar: `--${token.name}`,
				value: token.$value ?? token.value,
				type: token.$type ?? token.type,
				extensions: token.$extensions?.[CL_EXT] ?? null,
			});
		}

		return JSON.stringify(manifest, null, '\t');
	},
});

// ═══════════════════════════════════════════════════════════════
// FILE DEFINITION HELPERS
// ═══════════════════════════════════════════════════════════════

const cssFile = (
	dest: string,
	filter: (token: TransformedToken) => boolean,
	sublayer: string,
) => ({
	destination: dest,
	format: clFormats.css,
	filter,
	options: { outputReferences: true, sublayer },
});

const themeFile = (
	dest: string,
	filter: (token: TransformedToken) => boolean,
	opts: Record<string, unknown> = {},
) => ({
	destination: dest,
	format: clFormats.tailwindTheme,
	filter,
	options: { ...opts },
});

const typesFile = (
	dest: string,
	filter: (token: TransformedToken) => boolean,
) => ({
	destination: dest,
	format: clFormats.types,
	filter,
});

// ═══════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════

const config: Config = {
	source: [`${paths.source}/*.json`],
	usesDtcg: true,
	preprocessors: [clPreprocessors.captureExtensions],
	log: {
		verbosity: logVerbosityLevels.verbose,
		warnings: logWarningLevels.warn,
		errors: {
			brokenReferences: logBrokenReferenceLevels.throw,
		},
	},

	platforms: {
		// ── CSS: Primitives ───────────────────────────────────────
		'css-primitives': {
			transforms: CSS_TRANSFORMS,
			buildPath: `${paths.design}/styles/${layers.primitives}/`,
			files: [
				cssFile('color.css', pathFilter('color'), layers.primitives),
				cssFile('shadow.css', pathFilter('shadow'), layers.primitives),
				cssFile('bevel.css', pathFilter('bevel'), layers.primitives),
				cssFile('glow.css', pathFilter('glow', 'glowSpread'), layers.primitives),
				cssFile('blur.css', pathFilter('blur'), layers.primitives),
				cssFile('surface.css', pathFilter('glass', 'matte'), layers.primitives),
				cssFile('radius.css', pathFilter('radius'), layers.primitives),
				cssFile('spacing.css', pathFilter('space', 'padding', 'size', 'breakpoint', 'zIndex'), layers.primitives),
				cssFile('typography.css', pathFilter('font', 'textSize', 'leading', 'tracking'), layers.primitives),
				cssFile('motion.css', pathFilter('motion'), layers.primitives),
				cssFile('gradient.css', pathFilter('gradient'), layers.primitives),
			],
		},

		// ── CSS: Semantic ─────────────────────────────────────────
		'css-semantic': {
			transforms: CSS_TRANSFORMS,
			buildPath: `${paths.design}/styles/${layers.semantic}/`,
			files: [
				cssFile('elevation.css', pathFilter('elevation'), layers.semantic),
				cssFile('surface.css', pathFilter('surface'), layers.semantic),
				cssFile('border.css', pathFilter('border', 'borderPreset'), layers.semantic),
				cssFile('transition.css', pathFilter('transition'), layers.semantic),
				cssFile('interaction.css', pathFilter('interaction'), layers.semantic),
				cssFile('overlay.css', pathFilter('overlay'), layers.semantic),
				cssFile('scrollbar.css', pathFilter('scrollbar'), layers.semantic),
				cssFile('backdrop.css', pathFilter('backdrop'), layers.semantic),
				cssFile('text-styles.css', pathFilter('textStyle'), layers.semantic),
			],
		},

		// ── CSS: Components ───────────────────────────────────────
		'css-components': {
			transforms: CSS_TRANSFORMS,
			buildPath: `${paths.design}/styles/${layers.components}/`,
			files: [
				cssFile('component.css', isComponent, layers.components),
			],
		},

		// ── Theme: per-domain @theme files ────────────────────────
		'theme-color': {
			transforms: CSS_TRANSFORMS,
			buildPath: `${paths.design}/theme/`,
			files: [themeFile('color.css', pathFilter('color'))],
		},
		'theme-shadow': {
			transforms: CSS_TRANSFORMS,
			buildPath: `${paths.design}/theme/`,
			files: [themeFile('shadow.css', pathFilter('shadow'))],
		},
		'theme-elevation': {
			transforms: CSS_TRANSFORMS,
			buildPath: `${paths.design}/theme/`,
			files: [themeFile('elevation.css', pathFilter('elevation'))],
		},
		'theme-bevel': {
			transforms: CSS_TRANSFORMS,
			buildPath: `${paths.design}/theme/`,
			files: [themeFile('bevel.css', pathFilter('bevel'))],
		},
		'theme-glow': {
			transforms: CSS_TRANSFORMS,
			buildPath: `${paths.design}/theme/`,
			files: [themeFile('glow.css', pathFilter('glow', 'glowSpread'))],
		},
		'theme-blur': {
			transforms: CSS_TRANSFORMS,
			buildPath: `${paths.design}/theme/`,
			files: [themeFile('blur.css', pathFilter('blur'))],
		},
		'theme-surface': {
			transforms: CSS_TRANSFORMS,
			buildPath: `${paths.design}/theme/`,
			files: [themeFile('surface.css', pathFilter('glass', 'matte', 'surface'))],
		},
		'theme-radius': {
			transforms: CSS_TRANSFORMS,
			buildPath: `${paths.design}/theme/`,
			files: [themeFile('radius.css', pathFilter('radius'))],
		},
		'theme-spacing': {
			transforms: CSS_TRANSFORMS,
			buildPath: `${paths.design}/theme/`,
			files: [themeFile('spacing.css', pathFilter('space', 'padding', 'size', 'breakpoint', 'zIndex'))],
		},
		'theme-typography': {
			transforms: CSS_TRANSFORMS,
			buildPath: `${paths.design}/theme/`,
			files: [themeFile('typography.css', pathFilter('font', 'textSize'))],
		},
		'theme-text-style': {
			transforms: CSS_TRANSFORMS,
			buildPath: `${paths.design}/theme/`,
			files: [themeFile('text-style.css', pathFilter('textStyle'))],
		},
		'theme-motion': {
			transforms: CSS_TRANSFORMS,
			buildPath: `${paths.design}/theme/`,
			files: [themeFile('motion.css', pathFilter('motion'))],
		},
		'theme-transition': {
			transforms: CSS_TRANSFORMS,
			buildPath: `${paths.design}/theme/`,
			files: [themeFile('transition.css', pathFilter('transition'))],
		},
		'theme-border': {
			transforms: CSS_TRANSFORMS,
			buildPath: `${paths.design}/theme/`,
			files: [themeFile('border.css', pathFilter('border', 'borderPreset'))],
		},
		'theme-interaction': {
			transforms: CSS_TRANSFORMS,
			buildPath: `${paths.design}/theme/`,
			files: [themeFile('interaction.css', pathFilter('interaction'))],
		},
		'theme-overlay': {
			transforms: CSS_TRANSFORMS,
			buildPath: `${paths.design}/theme/`,
			files: [themeFile('overlay.css', pathFilter('overlay'))],
		},
		'theme-scrollbar': {
			transforms: CSS_TRANSFORMS,
			buildPath: `${paths.design}/theme/`,
			files: [themeFile('scrollbar.css', pathFilter('scrollbar'))],
		},
		'theme-backdrop': {
			transforms: CSS_TRANSFORMS,
			buildPath: `${paths.design}/theme/`,
			files: [themeFile('backdrop.css', pathFilter('backdrop'))],
		},
		'theme-gradient': {
			transforms: CSS_TRANSFORMS,
			buildPath: `${paths.design}/theme/`,
			files: [themeFile('gradient.css', pathFilter('gradient'))],
		},

		// ── TypeScript Types ──────────────────────────────────────
		'types-primitives': {
			transforms: TYPE_TRANSFORMS,
			buildPath: `${paths.design}/types/`,
			files: [
				typesFile('color.d.ts', pathFilter('color')),
				typesFile('shadow.d.ts', pathFilter('shadow', 'bevel', 'glow', 'glowSpread')),
				typesFile('blur.d.ts', pathFilter('blur')),
				typesFile('surface.d.ts', pathFilter('glass', 'matte', 'surface')),
				typesFile('spacing.d.ts', pathFilter('radius', 'space', 'padding', 'size', 'breakpoint', 'zIndex')),
				typesFile('typography.d.ts', pathFilter('font', 'textSize', 'textStyle')),
				typesFile('motion.d.ts', pathFilter('motion', 'transition')),
				typesFile('gradient.d.ts', pathFilter('gradient')),
			],
		},
		'types-semantic': {
			transforms: TYPE_TRANSFORMS,
			buildPath: `${paths.design}/types/`,
			files: [
				typesFile('elevation.d.ts', pathFilter('elevation')),
				typesFile('border.d.ts', pathFilter('border', 'borderPreset')),
				typesFile('interaction.d.ts', pathFilter('interaction', 'overlay', 'scrollbar')),
				typesFile('backdrop.d.ts', pathFilter('backdrop')),
			],
		},
		'types-components': {
			transforms: TYPE_TRANSFORMS,
			buildPath: `${paths.design}/types/`,
			files: [typesFile('component.d.ts', isComponent)],
		},

		// ── Manifest: VPB token metadata ─────────────────────────
		manifest: {
			transforms: TYPE_TRANSFORMS,
			buildPath: `${paths.design}/generated/`,
			files: [{
				destination: 'token-manifest.json',
				format: clFormats.manifest,
			}],
		},
	},
};

export default config;
