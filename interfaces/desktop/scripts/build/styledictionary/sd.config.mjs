/**
 * @file sd.config.mjs
 * @package @devpulse/coldlight
 *
 * Style Dictionary v5 configuration — ColdLight token pipeline.
 * SSOT for all token transforms, formats, and platform outputs.
 *
 * Source: flat domain files (tokens/src/{domain}.json) — DTCG 1.0 format
 * Output: tier-aware CSS, per-domain Tailwind @theme, per-domain TypeScript types
 *
 * Every SD5 built-in is referenced via its enum.
 * Custom names (formats, transforms) are defined as constants.
 * NO shorthand transforms — expand:true does this.
 * NO TypeScript — SD5 reads .mjs natively.
 */

import StyleDictionary from 'style-dictionary';
import { fileHeader, createPropertyFormatter } from 'style-dictionary/utils';
import {
	transforms,
	transformTypes,
	propertyFormatNames,
	logVerbosityLevels,
	logWarningLevels,
	logBrokenReferenceLevels,
} from 'style-dictionary/enums';

// ═══════════════════════════════════════════════════════════════
// COLDLIGHT CUSTOM NAMES — constants, zero raw strings
// ═══════════════════════════════════════════════════════════════


/** Custom format names — ColdLight extensions to SD5 */
const clFormats = {
	css: 'coldlight/css',
	tailwindTheme: 'coldlight/tailwind-theme',
	types: 'coldlight/types',
	manifest: 'coldlight/manifest',
};

/** Custom transform names */
const clTransforms = {
	gradientCssShorthand: 'coldlight/gradient-css-shorthand',
	shadowCssShorthand: 'coldlight/shadow-css-shorthand',
};

/** Custom preprocessor names */
const clPreprocessors = {
	captureExtensions: 'coldlight/capture-extensions',
};

/** DTCG $extensions namespace */
const CL_EXT = 'com.coldlight';

/**
 * Group-level $extensions captured by preprocessor.
 * SD5 strips group-level $extensions from TransformedToken —
 * the preprocessor walks the raw tree first and stashes them here
 * so custom formats can read scale/control/default metadata.
 *
 * Key = dot-joined group path (e.g., "blur", "color.teal", "motion.duration")
 * Value = the $extensions[CL_EXT] object from that group
 */
const groupExtensions = new Map();

/** Token tier paths — determines which @layer a token lands in */
const tiers = {
	primitive: [
		'color', 'shadow', 'bevel', 'glow', 'glowSpread', 'blur',
		'glass', 'matte', 'radius', 'space', 'padding', 'size', 'breakpoint',
		'zIndex', 'font', 'fontFeatureSettings', 'fontVariationSettings',
		'textSize', 'leading', 'tracking',
		'motion', 'gradient',
	],
	semantic: [
		'elevation', 'surface', 'border', 'borderPreset', 'transition',
		'interaction', 'overlay', 'scrollbar', 'backdrop', 'textStyle',
		'text', 'signal',
	],
};

/** CSS @layer sublayer names */
const layers = {
	primitives: 'primitives',
	semantic: 'semantic',
	components: 'components',
};

/** Tailwind v4 @theme namespace remapping — full names, no shorthand */
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
};

/** Build paths (relative to CWD = interfaces/desktop/) */
const paths = {
	source: 'scripts/build/styledictionary/tokens/src',
	design: 'src/lib/design',
};

// ═══════════════════════════════════════════════════════════════
// PATH-BASED FILTERING
// ═══════════════════════════════════════════════════════════════

const pathFilter =
	(...names) =>
	(token) =>
		names.includes(token.path[0]);

const isPrimitive = pathFilter(...tiers.primitive);
const isSemantic = pathFilter(...tiers.semantic);
const isSvgPreset = pathFilter('svg-style');
const isComponent = (token) => !isPrimitive(token) && !isSemantic(token) && !isSvgPreset(token);

// ═══════════════════════════════════════════════════════════════
// $EXTENSIONS HELPERS
// ═══════════════════════════════════════════════════════════════

const isInsetShadow = (token) => token.$extensions?.[CL_EXT]?.inset === true;

// ═══════════════════════════════════════════════════════════════
// HELPER: px → rem conversion (matches SD5 sizePxToRem behavior)
// ═══════════════════════════════════════════════════════════════

const pxToRem = (val) => {
	if (typeof val !== 'string') return String(val);
	const match = val.match(/^(-?[\d.]+)px$/);
	if (!match) return val;
	const num = parseFloat(match[1]);
	if (num === 0) return '0';
	return `${num / 16}rem`;
};

// ═══════════════════════════════════════════════════════════════
// CUSTOM TRANSFORM: shadow/css/shorthand
//
// DTCG shadow: single object or array of { color, offsetX, offsetY, blur, spread }.
// SD5 has no built-in compositor — expand:true decomposes into useless sub-properties.
// This transform composes the full CSS box-shadow shorthand:
//   [inset] offsetX offsetY blur spread color
// Multi-layer shadows are comma-joined.
// Dimensional values are converted px → rem.
// Inset is read from $extensions.com.coldlight.inset.
// String-valued shadow tokens (already CSS shorthand) are skipped.
// ═══════════════════════════════════════════════════════════════

StyleDictionary.registerTransform({
	name: clTransforms.shadowCssShorthand,
	type: transformTypes.value,
	transitive: true,
	filter: (token) => {
		const type = token.$type ?? token.type;
		if (type !== 'shadow') return false;
		const val = token.$value ?? token.value;
		return val !== null && typeof val === 'object';
	},
	transform: (token) => {
		const val = token.$value ?? token.value;
		const inset = token.$extensions?.[CL_EXT]?.inset === true;
		const layers = Array.isArray(val) ? val : [val];

		return layers
			.map((layer) => {
				const parts = [];
				if (inset) parts.push('inset');
				parts.push(
					pxToRem(layer.offsetX),
					pxToRem(layer.offsetY),
					pxToRem(layer.blur),
					pxToRem(layer.spread),
					layer.color,
				);
				return parts.join(' ');
			})
			.join(', ');
	},
});

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
			.map((stop) => {
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

		function walk(obj, path = []) {
			if (!obj || typeof obj !== 'object') return;

			const ext = obj['$extensions'];
			if (ext?.[CL_EXT]) {
				groupExtensions.set(path.join('.'), ext[CL_EXT]);
			}

			for (const [key, val] of Object.entries(obj)) {
				if (key.startsWith('$')) continue;
				if (val && typeof val === 'object' && !Array.isArray(val)) {
					walk(val, [...path, key]);
				}
			}
		}

		walk(dictionary);
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
	clTransforms.shadowCssShorthand, // DTCG shadow objects → CSS shorthand (px→rem, inset, multi-layer)
	clTransforms.gradientCssShorthand, // DTCG gradient → linear-gradient() CSS shorthand
];

const TYPE_TRANSFORMS = [
	transforms.attributeCti,
	transforms.nameKebab,
];

// ═══════════════════════════════════════════════════════════════
// TW4 NAMESPACE REMAPPING
// ═══════════════════════════════════════════════════════════════

function toTw4VarName(token) {
	if (token.path.length >= 2) {
		const nested = `${token.path[0]}.${token.path[1]}`;
		const prefix = tw4Remap.nested[nested];
		if (prefix) {
			return `--${prefix}-${token.path.slice(2).join('-')}`;
		}
	}

	const prefix = tw4Remap.topLevel[token.path[0]];
	if (prefix) {
		return `--${prefix}-${token.path.slice(1).join('-')}`;
	}

	return `--${token.name}`;
}

// ═══════════════════════════════════════════════════════════════
// CUSTOM FORMAT: coldlight/css
//
// CSS custom properties wrapped in @layer tokens.{sublayer}.
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

		// Inset handling is done by coldlight/shadow-css-shorthand transform.
		// No format-level shadow mutation needed.
		const lines = dictionary.allTokens.map(formatter);

		const layer = options.sublayer
			? `@layer tokens.${options.sublayer}`
			: '@layer tokens';

		return `${header}${layer} {\n  :root {\n${lines.join('\n')}\n  }\n}\n`;
	},
});

// ═══════════════════════════════════════════════════════════════
// CUSTOM FORMAT: coldlight/tailwind-theme
//
// Per-domain @theme blocks for Tailwind v4.
// Namespace remapped (e.g., textSize → text, space → spacing).
// Full names — no shorthand, no abbreviations.
// ═══════════════════════════════════════════════════════════════

StyleDictionary.registerFormat({
	name: clFormats.tailwindTheme,
	format: async ({ dictionary, file, options }) => {
		const header = await fileHeader({ file });
		const lines = [];

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
//
// TypeScript .d.ts with enumerated union types — not `string`.
// Exports: {Pascal}Tokens (const array), {Pascal}Token (union),
//          {Pascal}CSSVar (union), {Pascal}Record (nested tree)
// ═══════════════════════════════════════════════════════════════

StyleDictionary.registerFormat({
	name: clFormats.types,
	format: async ({ dictionary, file }) => {
		const header = await fileHeader({ file });
		const out = [
			`${header}/** AUTO-GENERATED by Style Dictionary — DO NOT EDIT */\n`,
		];

		const groups = new Map();
		for (const token of dictionary.allTokens) {
			const g = token.path[0];
			if (!groups.has(g)) groups.set(g, []);
			groups.get(g).push(token);
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

			const tree = {};
			for (const t of tokens) {
				let node = tree;
				for (let i = 1; i < t.path.length - 1; i++) {
					if (!node[t.path[i]]) node[t.path[i]] = {};
					node = node[t.path[i]];
				}
				node[t.path[t.path.length - 1]] = 'string';
			}

			const serialize = (obj, depth) => {
				const pad = '\t'.repeat(depth);
				return Object.entries(obj)
					.map(([k, v]) => {
						const key = /^\d/.test(k) || k.includes('-') ? `'${k}'` : k;
						if (typeof v === 'string')
							return `${pad}\t${key}: string;`;
						return `${pad}\t${key}: {\n${serialize(v, depth + 1)}\n${pad}\t};`;
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
// JSON manifest of all token groups with their
// $extensions.com.coldlight metadata (control, scale, default, tier).
// VPB reads this to auto-generate sliders, knobs, selects, color pickers.
// ═══════════════════════════════════════════════════════════════

StyleDictionary.registerFormat({
	name: clFormats.manifest,
	format: ({ dictionary }) => {
		const manifest = {};

		for (const token of dictionary.allTokens) {
			const group = token.path[0];
			if (!manifest[group]) {
				const groupPath = token.path.slice(0, -1).join('.');
				const groupExt = groupExtensions.get(group)
					?? groupExtensions.get(groupPath)
					?? {};

				manifest[group] = {
					extensions: groupExt,
					tokens: [],
				};
			}

			manifest[group].tokens.push({
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

const cssFile = (dest, filter, sublayer, extraOpts = {}) => ({
	destination: dest,
	format: clFormats.css,
	filter,
	options: { outputReferences: true, sublayer, ...extraOpts },
});

const themeFile = (dest, filter, opts = {}) => ({
	destination: dest,
	format: clFormats.tailwindTheme,
	filter,
	options: { ...opts },
});

const typesFile = (dest, filter) => ({
	destination: dest,
	format: clFormats.types,
	filter,
});

// ═══════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════

const config = {
	source: [`${paths.source}/*.json`],
	usesDtcg: true,
	expand: (token) => {
		// Shadow tokens are composed to CSS shorthand by coldlight/shadow-css-shorthand.
		// All other composite types (border, transition, typography) still expand.
		const type = token.$type ?? token.type;
		if (type === 'shadow') return false;
		return true;
	},
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
				cssFile('typography.css', pathFilter('font', 'fontFeatureSettings', 'fontVariationSettings', 'textSize', 'leading', 'tracking'), layers.primitives),
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
			cssFile('text.css', pathFilter('text'), layers.semantic),
			cssFile('signal.css', pathFilter('signal'), layers.semantic),
			],
		},

		// ── CSS: Components ───────────────────────────────────────
		'css-components': {
			transformGroup: 'css',
			buildPath: `${paths.design}/styles/${layers.components}/`,
			files: [
				{
					destination: 'components.generated.css',
					format: 'css/variables',
					filter: isComponent,
					options: { outputReferences: false },
				},
			],
		},

		// ── CSS: SVG Presets ──────────────────────────────────────
		'css-svg-presets': {
			transformGroup: 'css',
			buildPath: `${paths.design}/svg/presets/`,
			files: [
				{
					destination: 'svg-presets.generated.css',
					format: 'css/variables',
					filter: isSvgPreset,
					options: { outputReferences: true },
				},
			],
		},

		// ── Theme: per-domain @theme files ────────────────────────
		'theme-color': { transforms: CSS_TRANSFORMS, buildPath: `${paths.design}/theme/`, files: [themeFile('color.css', pathFilter('color'))] },
		'theme-shadow': { transforms: CSS_TRANSFORMS, buildPath: `${paths.design}/theme/`, files: [themeFile('shadow.css', pathFilter('shadow'))] },
		'theme-elevation': { transforms: CSS_TRANSFORMS, buildPath: `${paths.design}/theme/`, files: [themeFile('elevation.css', pathFilter('elevation'))] },
		'theme-bevel': { transforms: CSS_TRANSFORMS, buildPath: `${paths.design}/theme/`, files: [themeFile('bevel.css', pathFilter('bevel'))] },
		'theme-glow': { transforms: CSS_TRANSFORMS, buildPath: `${paths.design}/theme/`, files: [themeFile('glow.css', pathFilter('glow', 'glowSpread'))] },
		'theme-blur': { transforms: CSS_TRANSFORMS, buildPath: `${paths.design}/theme/`, files: [themeFile('blur.css', pathFilter('blur'))] },
		'theme-surface': { transforms: CSS_TRANSFORMS, buildPath: `${paths.design}/theme/`, files: [themeFile('surface.css', pathFilter('glass', 'matte', 'surface'))] },
		'theme-radius': { transforms: CSS_TRANSFORMS, buildPath: `${paths.design}/theme/`, files: [themeFile('radius.css', pathFilter('radius'))] },
		'theme-spacing': { transforms: CSS_TRANSFORMS, buildPath: `${paths.design}/theme/`, files: [themeFile('spacing.css', pathFilter('space', 'padding', 'size', 'breakpoint', 'zIndex'))] },
		'theme-typography': { transforms: CSS_TRANSFORMS, buildPath: `${paths.design}/theme/`, files: [themeFile('typography.css', pathFilter('font', 'fontFeatureSettings', 'fontVariationSettings', 'textSize'))] },
		'theme-text-style': { transforms: CSS_TRANSFORMS, buildPath: `${paths.design}/theme/`, files: [themeFile('text-style.css', pathFilter('textStyle'))] },
		'theme-motion': { transforms: CSS_TRANSFORMS, buildPath: `${paths.design}/theme/`, files: [themeFile('motion.css', pathFilter('motion'))] },
		'theme-transition': { transforms: CSS_TRANSFORMS, buildPath: `${paths.design}/theme/`, files: [themeFile('transition.css', pathFilter('transition'))] },
		'theme-border': { transforms: CSS_TRANSFORMS, buildPath: `${paths.design}/theme/`, files: [themeFile('border.css', pathFilter('border', 'borderPreset'))] },
		'theme-interaction': { transforms: CSS_TRANSFORMS, buildPath: `${paths.design}/theme/`, files: [themeFile('interaction.css', pathFilter('interaction'))] },
		'theme-overlay': { transforms: CSS_TRANSFORMS, buildPath: `${paths.design}/theme/`, files: [themeFile('overlay.css', pathFilter('overlay'))] },
		'theme-scrollbar': { transforms: CSS_TRANSFORMS, buildPath: `${paths.design}/theme/`, files: [themeFile('scrollbar.css', pathFilter('scrollbar'))] },
		'theme-backdrop': { transforms: CSS_TRANSFORMS, buildPath: `${paths.design}/theme/`, files: [themeFile('backdrop.css', pathFilter('backdrop'))] },
		'theme-gradient': { transforms: CSS_TRANSFORMS, buildPath: `${paths.design}/theme/`, files: [themeFile('gradient.css', pathFilter('gradient'))] },
		'theme-text': { transforms: CSS_TRANSFORMS, buildPath: `${paths.design}/theme/`, files: [themeFile('text.css', pathFilter('text'))] },
		'theme-signal': { transforms: CSS_TRANSFORMS, buildPath: `${paths.design}/theme/`, files: [themeFile('signal.css', pathFilter('signal'))] },

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
				typesFile('text.d.ts', pathFilter('text')),
				typesFile('signal.d.ts', pathFilter('signal')),
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
