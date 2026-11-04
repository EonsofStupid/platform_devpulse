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
import { readdirSync, existsSync } from 'node:fs';
import { dirname, basename } from 'node:path';
import { discoverFeatureTokens } from './feature-tokens.mjs';
import { kindCss, kindTokenFilter, readKindFile } from './kind-css.mjs';
import { resolveExtends } from './preprocess-extends.mjs';
import { readFamilies, scopeOf, surfaceScopesCss } from './surface-scopes.mjs';

// ═══════════════════════════════════════════════════════════════
// COLDLIGHT CUSTOM NAMES — constants, zero raw strings
// ═══════════════════════════════════════════════════════════════


/** Custom format names — ColdLight extensions to SD5 */
const clFormats = {
	kindCss: 'coldlight/kind-css',
	surfaceScopes: 'coldlight/surface-scopes',
	css: 'coldlight/css',
	tailwindTheme: 'coldlight/tailwind-theme',
	types: 'coldlight/types',
	manifest: 'coldlight/manifest',
};

/** Custom transform names */
const clTransforms = {
	gradientCssShorthand: 'coldlight/gradient-css-shorthand',
	shadowCssShorthand: 'coldlight/shadow-css-shorthand',
	dimensionToCss: 'coldlight/dimension-to-css',
	dtcgColorToHex: 'coldlight/dtcg-color-to-hex',
	dtcgDimensionFlatten: 'coldlight/dtcg-dimension-flatten',
	dtcgDurationFlatten: 'coldlight/dtcg-duration-flatten',
	dtcgCubicBezierFlatten: 'coldlight/dtcg-cubic-bezier-flatten',
	fluidDimensionToClamp: 'coldlight/fluid-dimension-to-clamp',
};

/** DevPulse ColdLight extension key (new DTCG tree) */
const DP_EXT = 'com.devpulse.coldlight';

/** Custom preprocessor names */
const clPreprocessors = {
	resolveExtends: 'coldlight/resolve-extends',
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

/**
 * Top-level roots introduced by the new DTCG 2025.10 tree
 * (tokens/src/primitives/**, tokens/src/semantic/**).
 * Brand hues + wheel hues + achromatics are hoisted to root in the new tree.
 */
const brandHues = ['teal', 'purple', 'magenta', 'ember', 'frost', 'cyber'];
const brandAccentHues = [
	'brand-blue', 'brand-coral', 'brand-cyan', 'brand-gold',
	'brand-green', 'brand-hotpink', 'brand-salmon', 'brand-violet',
];
const wheelHues = [
	'amber', 'azure', 'blue', 'chartreuse', 'crimson', 'cyan',
	'green', 'green-cyan', 'green-yellow', 'indigo', 'lime', 'mint',
	'orange', 'pink', 'red', 'red-orange', 'rose', 'royal',
	'sky', 'sunset', 'violet', 'yellow',
	'aurora', 'spring',
];
const achromatics = ['neutral', 'void', 'white', 'black'];

/** Token tier paths — determines which @layer a token lands in */
const tiers = {
	primitive: [
		'color', 'shadow', 'bevel', 'glow', 'glow-dot', 'glowSpread', 'blur',
		'glass', 'matte', 'radius', 'space', 'padding', 'size', 'breakpoint',
		'zIndex', 'font', 'fontFeatureSettings', 'fontVariationSettings',
		'textSize', 'leading', 'tracking',
		'motion', 'gradient', 'layout',
		'font-size', 'depth', 'duration', 'easing', 'animation',
		'opacity', 'outlineOffset', 'borderWidth', 'borderRise',
		'z-index',
	],
	semantic: [
		'elevation', 'surface', 'border', 'borderPreset', 'transition',
		'interaction', 'overlay', 'scrollbar', 'backdrop', 'textStyle',
		'text', 'signal', 'accent',
		// Tier-2 role bindings (intent layer — primary/secondary/state/muted)
		'primary', 'secondary', 'danger', 'success', 'warning', 'info', 'muted',
		// New DTCG semantic roots
		'glass-blur', 'backdrop-glow', 'backdrop-grid',
		'backdrop-grid-line', 'backdrop-grid-size',
		'gradient-duration', 'scrollbar-size', 'chat', 'wizard', 'claude',
		'iconSize',
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
		// Icon box sizes are layout: Tailwind's spacing namespace gives `size-icon-*`.
		iconSize: 'spacing-icon',
	},
	nested: {
		'motion.ease': 'ease',
		'motion.animation': 'animate',
	},
};

/**
 * Build paths (relative to CWD = interfaces/desktop/).
 * Token CSS only → design/styles + design/theme + design/types + generated/token-manifest.json.
 * SVG preset vars → design/svg/presets. Do not emit non-token glue here.
 */
const paths = {
	source: 'scripts/build/styledictionary/tokens/src',
	design: '../../packages/coldlight',
};

/** Every component folder with a `<kind>.tokens.json` whose top group is the kind (plan 0006 §0s). */
export const KIND_FILES = readdirSync(`${paths.design}/components`, { withFileTypes: true })
	.filter((d) => d.isDirectory() && existsSync(`${paths.design}/components/${d.name}/${d.name}.tokens.json`))
	.sort((a, b) => a.name.localeCompare(b.name, 'en'))
	.flatMap((d) => {
		const path = `${paths.design}/components/${d.name}/${d.name}.tokens.json`;
		const read = readKindFile(path, d.name);
		return read ? [{ kind: d.name, path, ...read }] : [];
	});

/** A token of a kind file's own group; path-based, since inherited tokens keep their family file's path. */
export const FEATURE_FILES = discoverFeatureTokens('src/lib/domains');
const allKinds = [...KIND_FILES, ...FEATURE_FILES].map(({ kind }) => kind);
if (new Set(allKinds).size !== allKinds.length) throw new Error('Duplicate component/feature token namespace');
const isKindToken = kindTokenFilter(new Set(allKinds));

/** The families (plan 0006 §0s, D1), from the preset files. */
export const SURFACE_FAMILIES = readFamilies();

/** The roles and axes a kind's variant can read from the family in scope. */
const SURFACE_SCOPE = scopeOf(SURFACE_FAMILIES);

/** The family at the root until the Provider writes `data-surface` (today's `default` → neuro-elevated). */
export const SURFACE_DEFAULT = 'neuro';

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
// A kind file's own group becomes that kind's CSS (css-kinds), not :root variables.
const isComponent = (token) =>
	!isPrimitive(token) && !isSemantic(token) && !isSvgPreset(token) && !isKindToken(token);

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
// DTCG 2025.10 NORMALIZERS
//
// The new tokens/src/**/*.tokens.json tree emits DTCG Color Module
// objects (`{ colorSpace, components, alpha?, hex }`), dimension
// objects (`{ value, unit }`), duration objects, and cubic-bezier
// arrays. SD5 built-ins (colorOklch, etc.) expect string inputs.
//
// These transforms run EARLY and flatten DTCG object values to the
// string form the downstream built-ins expect. Legacy string values
// pass through untouched.
// ═══════════════════════════════════════════════════════════════

const isPlainObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

StyleDictionary.registerTransform({
	name: clTransforms.dtcgColorToHex,
	type: transformTypes.value,
	transitive: true,
	filter: (token) => {
		const type = token.$type ?? token.type;
		return type === 'color' && isPlainObj(token.$value ?? token.value);
	},
	transform: (token) => {
		const val = token.$value ?? token.value;
		// oklch colourspace: emit native oklch() so gamut info survives.
		if (val.colorSpace === 'oklch' && Array.isArray(val.components)) {
			const [L, C, H] = val.components;
			const alpha = typeof val.alpha === 'number' && val.alpha < 1 ? ` / ${val.alpha}` : '';
			return `oklch(${L} ${C} ${H}${alpha})`;
		}
		// srgb w/ hex: the fast path — generators always emit hex alongside components.
		if (typeof val.hex === 'string') {
			if (typeof val.alpha === 'number' && val.alpha < 1) {
				const a = Math.round(val.alpha * 255);
				return `${val.hex}${a.toString(16).padStart(2, '0')}`;
			}
			return val.hex;
		}
		if (val.colorSpace === 'srgb' && Array.isArray(val.components)) {
			const [r, g, b] = val.components;
			const hex = (n) => Math.round(Math.max(0, Math.min(1, n)) * 255).toString(16).padStart(2, '0');
			return `#${hex(r)}${hex(g)}${hex(b)}`;
		}
		return val;
	},
});

StyleDictionary.registerTransform({
	name: clTransforms.dtcgDimensionFlatten,
	type: transformTypes.value,
	transitive: true,
	filter: (token) => {
		const type = token.$type ?? token.type;
		if (type !== 'dimension') return false;
		const v = token.$value ?? token.value;
		return isPlainObj(v) && typeof v.value === 'number' && typeof v.unit === 'string';
	},
	transform: (token) => {
		const v = token.$value ?? token.value;
		return `${v.value}${v.unit}`;
	},
});

StyleDictionary.registerTransform({
	name: clTransforms.dtcgDurationFlatten,
	type: transformTypes.value,
	transitive: true,
	filter: (token) => {
		const type = token.$type ?? token.type;
		if (type !== 'duration') return false;
		const v = token.$value ?? token.value;
		return isPlainObj(v) && typeof v.value === 'number' && typeof v.unit === 'string';
	},
	transform: (token) => {
		const v = token.$value ?? token.value;
		return `${v.value}${v.unit}`;
	},
});

StyleDictionary.registerTransform({
	name: clTransforms.dtcgCubicBezierFlatten,
	type: transformTypes.value,
	transitive: true,
	filter: (token) => {
		const type = token.$type ?? token.type;
		if (type !== 'cubicBezier') return false;
		const v = token.$value ?? token.value;
		return Array.isArray(v) && v.length === 4;
	},
	transform: (token) => {
		const v = token.$value ?? token.value;
		return `cubic-bezier(${v.join(', ')})`;
	},
});

// ═══════════════════════════════════════════════════════════════
// FLUID DIMENSION TRANSFORM
//
// New DTCG primitives carry $extensions.com.devpulse.coldlight.fluid
// with { minPx, maxPx, minViewportPx, maxViewportPx }. When present,
// emit a clamp() expression — the VPB and CSS both consume the final
// clamp string. If no fluid extension, pass through (handled by the
// regular dimension transform).
// ═══════════════════════════════════════════════════════════════

/**
 * Normalize a DTCG dimension leaf to a pixel number.
 * Accepts either `{ value, unit }` (rem|px) or a raw number (assumed px).
 * Rem is converted against a 16 px root. Returns `NaN` for unresolvable
 * inputs, which the caller must handle rather than emit as CSS.
 */
function dtcgDimensionToPx(leaf) {
	if (leaf == null) return NaN;
	if (typeof leaf === 'number') return leaf;
	const { value, unit } = leaf;
	if (typeof value !== 'number') return NaN;
	if (unit === 'rem') return value * 16;
	if (unit === 'px' || unit == null) return value;
	return NaN;
}

StyleDictionary.registerTransform({
	name: clTransforms.fluidDimensionToClamp,
	type: transformTypes.value,
	transitive: true,
	filter: (token) => {
		const type = token.$type ?? token.type;
		if (type !== 'dimension') return false;
		return !!token.$extensions?.[DP_EXT]?.fluid;
	},
	transform: (token) => {
		const f = token.$extensions[DP_EXT].fluid;
		// Source JSON uses DTCG leaf shape: { min: { value, unit }, max: { value, unit },
		// minViewport: { value, unit }, maxViewport: { value, unit } }.
		// Legacy { minPx, maxPx, minViewportPx, maxViewportPx } flat shape is also
		// tolerated so older tokens don't break during the source migration.
		const minPx = dtcgDimensionToPx(f.min) || f.minPx;
		const maxPx = dtcgDimensionToPx(f.max) || f.maxPx;
		const minVwPx =
			dtcgDimensionToPx(f.minViewport) || f.minViewportPx || 360;
		const maxVwPx =
			dtcgDimensionToPx(f.maxViewport) || f.maxViewportPx || 1440;

		if (
			!Number.isFinite(minPx) ||
			!Number.isFinite(maxPx) ||
			!Number.isFinite(minVwPx) ||
			!Number.isFinite(maxVwPx) ||
			maxVwPx === minVwPx
		) {
			// Missing or unresolvable extension data — fall back to the
			// token's own $value so we never emit NaN.
			const v = token.$value ?? token.value;
			if (v && typeof v === 'object' && typeof v.value === 'number') {
				const u = v.unit === 'px' ? 'px' : 'rem';
				return `${v.value}${u}`;
			}
			return typeof v === 'string' ? v : '';
		}

		const minRem = minPx / 16;
		const maxRem = maxPx / 16;
		const slope = (maxPx - minPx) / (maxVwPx - minVwPx);
		const intercept = (minPx - slope * minVwPx) / 16;
		const vw = (slope * 100).toFixed(4);
		const base = intercept.toFixed(4);
		return `clamp(${minRem}rem, ${base}rem + ${vw}vw, ${maxRem}rem)`;
	},
});

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

		// DTCG dimension object { value, unit } or legacy string → rem
		const dim = (d) => {
			if (isPlainObj(d) && typeof d.value === 'number') {
				if (d.unit === 'rem') return `${d.value}rem`;
				if (d.unit === 'px') return `${d.value / 16}rem`;
				return `${d.value}${d.unit ?? ''}`;
			}
			return pxToRem(d);
		};
		// DTCG color object → hex(+alpha)
		const col = (c) => {
			if (isPlainObj(c)) {
				if (typeof c.hex === 'string') {
					if (typeof c.alpha === 'number' && c.alpha < 1) {
						const a = Math.round(c.alpha * 255);
						return `${c.hex}${a.toString(16).padStart(2, '0')}`;
					}
					return c.hex;
				}
				if (c.colorSpace === 'srgb' && Array.isArray(c.components)) {
					const [r, g, b] = c.components;
					const h = (n) => Math.round(Math.max(0, Math.min(1, n)) * 255).toString(16).padStart(2, '0');
					return `#${h(r)}${h(g)}${h(b)}`;
				}
			}
			return c;
		};

		return layers
			.map((layer) => {
				const parts = [];
				if (inset || layer.inset === true) parts.push('inset');
				parts.push(
					dim(layer.offsetX),
					dim(layer.offsetY),
					dim(layer.blur),
					dim(layer.spread),
					col(layer.color),
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

		const colorOf = (c) => {
			if (isPlainObj(c)) {
				if (typeof c.hex === 'string') {
					if (typeof c.alpha === 'number' && c.alpha < 1) {
						const a = Math.round(c.alpha * 255);
						return `${c.hex}${a.toString(16).padStart(2, '0')}`;
					}
					return c.hex;
				}
				if (c.colorSpace === 'srgb' && Array.isArray(c.components)) {
					const [r, g, b] = c.components;
					const h = (n) => Math.round(Math.max(0, Math.min(1, n)) * 255).toString(16).padStart(2, '0');
					return `#${h(r)}${h(g)}${h(b)}`;
				}
			}
			return c;
		};

		const stops = val
			.map((stop) => {
				const pos = typeof stop.position === 'number'
					? ` ${stop.position * 100}%`
					: '';
				return `${colorOf(stop.color)}${pos}`;
			})
			.join(', ');

		const angle =
			token.$extensions?.[DP_EXT]?.gradient?.angle
			?? token.$extensions?.[CL_EXT]?.angle
			?? '135deg';
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

// DTCG 2025.10 §6.4 group inheritance (`$extends`), resolved before any
// other step so inherited groups carry their metadata too (plan 0006 0s.3).
StyleDictionary.registerPreprocessor({
	name: clPreprocessors.resolveExtends,
	preprocessor: (dictionary) => resolveExtends(dictionary),
});

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
// CUSTOM TRANSFORM: coldlight/dimension-to-css
//
// Replaces SD5 built-in sizePxToRem for ColdLight's fluid token pipeline.
//
// ColdLight tokens are a mix of:
//   - Static px values → convert to rem (same as sizePxToRem)
//   - Fluid clamp() strings → already in final rem+vw format, pass through
//   - Static rem values → already final, pass through
//   - Keyword values (inherit, none, 0) → pass through
//
// SD5's built-in sizePxToRem fails on clamp() because it tries to
// parseFloat a complex CSS function. This transform handles all cases.
// ═══════════════════════════════════════════════════════════════

StyleDictionary.registerTransform({
	name: clTransforms.dimensionToCss,
	type: transformTypes.value,
	filter: (token) => {
		const type = token.$type ?? token.type;
		return type === 'dimension';
	},
	transform: (token) => {
		const val = String(token.$value ?? token.value ?? '');

		// Already final: clamp(), rem, keywords
		if (val.startsWith('clamp(')) return val;
		if (val.endsWith('rem')) return val;
		if (val === 'inherit' || val === 'none' || val === '0' || val === 'unset') return val;

		// px → rem conversion
		if (val.endsWith('px')) {
			const px = parseFloat(val);
			if (!Number.isNaN(px)) return `${px / 16}rem`;
		}

		// Bare number → assume px, convert to rem. Any other unit (em, %, vh) is
		// already final: Style Dictionary 5.8 hands composite leaves here as `0.02em`.
		if (/^-?[\d.]+$/.test(val)) {
			const num = parseFloat(val);
			if (num !== 0) return `${num / 16}rem`;
		}

		// Fallback — return as-is
		return val;
	},
});

// ═══════════════════════════════════════════════════════════════
// TRANSFORM STACKS
// ═══════════════════════════════════════════════════════════════

const CSS_TRANSFORMS = [
	transforms.attributeCti,
	transforms.nameKebab,
	// DTCG 2025.10 normalizers run BEFORE built-ins so downstream
	// transforms (colorOklch, dimensionToCss) see flat strings.
	clTransforms.fluidDimensionToClamp,
	clTransforms.dtcgDimensionFlatten,
	clTransforms.dtcgDurationFlatten,
	clTransforms.dtcgCubicBezierFlatten,
	clTransforms.dtcgColorToHex,
	transforms.timeSeconds,
	clTransforms.dimensionToCss,
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

// One kind's CSS from its colocated tokens file (plan 0006 §0s; see kind-css.mjs).
StyleDictionary.registerFormat({
	name: clFormats.kindCss,
	format: async ({ dictionary, file, options }) => {
		const header = await fileHeader({ file });
		return `${header}${kindCss(dictionary, options.kind, options.meta, options.group, options.scope)}\n`;
	},
});

// The family scope: each family's roles as --surface-role-* under [data-surface] (see surface-scopes.mjs).
StyleDictionary.registerFormat({
	name: clFormats.surfaceScopes,
	format: async ({ dictionary, file, options }) => {
		const header = await fileHeader({ file });
		return `${header}${surfaceScopesCss(dictionary, options.families, options.surfaceDefault)}\n`;
	},
});

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
			const tokenItems = leafNames.map((v) => `\t"${v}"`).join(',\n');
			const inlineTokens = `export const ${pascal}Tokens = [${leafNames.map((v) => `"${v}"`).join(', ')}] as const;`;
			out.push(
				inlineTokens.length <= 100 ? inlineTokens : `export const ${pascal}Tokens = [\n${tokenItems},\n] as const;`,
				`export type ${pascal}Token = (typeof ${pascal}Tokens)[number];`,
				'',
			);

			const vars = tokens.map((t) => `"--${t.name}"`);
			const varLines = vars.map((v) => `\t| ${v}`).join('\n');
			const inlineVars = `export type ${pascal}CSSVar = ${vars.join(' | ')};`;
			out.push(
				inlineVars.length <= 100 ? inlineVars : `export type ${pascal}CSSVar =\n${varLines};`,
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
						const key = /^\d/.test(k) || k.includes('-') ? `"${k}"` : k;
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
// CUSTOM FORMAT: coldlight/tailwind-typography
//
// Composed text style @utility blocks for Tailwind v4.
// text-display-lg → applies all 5 properties in one class.
// Also registers @theme vars for individual access.
// ═══════════════════════════════════════════════════════════════

StyleDictionary.registerFormat({
	name: 'coldlight/tailwind-typography',
	format: async ({ dictionary, file }) => {
		const header = await fileHeader({ file });
		const groups = new Map();

		// Group expanded textStyle tokens by style name
		// SD5 expands typography composites: path = ['textStyle', 'display-lg', 'fontSize']
		// The last path segment is the camelCase property name from DTCG
		for (const token of dictionary.allTokens) {
			if (token.path[0] !== 'textStyle') continue;
			const styleName = token.path[1];
			const prop = token.path[token.path.length - 1]; // camelCase: fontSize, fontWeight, etc.
			if (!groups.has(styleName)) groups.set(styleName, {});
			groups.get(styleName)[prop] = token.$value ?? token.value;
		}

		const themeLines = [];
		const utilityBlocks = [];

		for (const [name, props] of groups) {
			// @theme vars for individual access + intellisense
			if (props.fontSize) themeLines.push(`  --font-size-${name}: ${props.fontSize};`);
			if (props.lineHeight) themeLines.push(`  --leading-${name}: ${props.lineHeight};`);
			if (props.fontWeight) themeLines.push(`  --font-weight-${name}: ${props.fontWeight};`);
			if (props.letterSpacing) themeLines.push(`  --tracking-${name}: ${props.letterSpacing};`);
			if (props.fontFamily) themeLines.push(`  --font-${name}: ${props.fontFamily};`);

			// @utility block — applies all properties in one class
			const utilLines = [];
			if (props.fontSize) utilLines.push(`\tfont-size: var(--font-size-${name});`);
			if (props.lineHeight) utilLines.push(`\tline-height: var(--leading-${name});`);
			if (props.fontWeight) utilLines.push(`\tfont-weight: var(--font-weight-${name});`);
			if (props.letterSpacing) utilLines.push(`\tletter-spacing: var(--tracking-${name});`);
			if (props.fontFamily) utilLines.push(`\tfont-family: var(--font-${name});`);

			if (utilLines.length > 0) {
				utilityBlocks.push(`@utility text-${name} {\n${utilLines.join('\n')}\n}`);
			}
		}

		const parts = [header];
		if (themeLines.length > 0) {
			parts.push(`@theme {\n${themeLines.join('\n')}\n}\n`);
		}
		if (utilityBlocks.length > 0) {
			parts.push(utilityBlocks.join('\n\n'));
		}

		return parts.join('\n');
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
	source: [
		// style-presets.json is no longer read: the family files below are the one
		// preset source (plan 0006 0s.2). svg-presets.json splits per SVG kind in 0s.6.
		`${paths.source}/svg-presets.json`,
		`${paths.source}/primitives/**/*.tokens.json`,
		`${paths.source}/semantic/**/*.tokens.json`,
		`${paths.source}/presets/**/*.tokens.json`,
		// Colocated: each component's and SVG kind's own tokens file (plan 0006 0s).
		`${paths.design}/components/*/*.tokens.json`,
		`${paths.design}/svg/*/*.tokens.json`,
		...FEATURE_FILES.map(({ path }) => path.replaceAll('\\', '/')),
	],
	usesDtcg: true,
	expand: (token) => {
		// DTCG 2025.10 composite types that must stay as object leaves —
		// they are flattened to strings by our own transforms. Expanding them
		// would split `{value, unit}` or `{colorSpace, components}` into
		// sibling sub-tokens and explode the type unions downstream.
		const type = token.$type ?? token.type;
		if (type === 'shadow') return false;
		if (type === 'dimension') return false;
		if (type === 'duration') return false;
		if (type === 'color') return false;
		if (type === 'cubicBezier') return false;
		if (type === 'gradient') return false;
		// typography, transition, border still expand into sub-properties.
		return true;
	},
	preprocessors: [clPreprocessors.resolveExtends, clPreprocessors.captureExtensions],
	log: {
		verbosity: logVerbosityLevels.verbose,
		warnings: logWarningLevels.warn,
		errors: {
			brokenReferences: logBrokenReferenceLevels.throw,
		},
	},

	platforms: {
		...Object.fromEntries(FEATURE_FILES.map(({ kind, path, meta, group }) => [`feature-${kind}`, {
			transforms: CSS_TRANSFORMS,
			buildPath: `${dirname(path).replaceAll('\\', '/')}/`,
			files: [{
				destination: `${basename(path, '.tokens.json')}.generated.css`,
				format: clFormats.kindCss,
				filter: (token) => token.path[0] === kind && isKindToken(token),
				options: { kind, meta, group, scope: SURFACE_SCOPE },
			}],
		}])),
		// ── CSS: Primitives ───────────────────────────────────────
		'css-primitives': {
			transforms: CSS_TRANSFORMS,
			buildPath: `${paths.design}/styles/${layers.primitives}/`,
			files: [
				cssFile('color.css', pathFilter('color'), layers.primitives),
				cssFile('shadow.css', pathFilter('shadow', 'depth'), layers.primitives),
				cssFile('bevel.css', pathFilter('bevel'), layers.primitives),
				cssFile('glow.css', pathFilter('glow', 'glow-dot', 'glowSpread'), layers.primitives),
				cssFile('blur.css', pathFilter('blur'), layers.primitives),
				cssFile('surface.css', pathFilter('glass', 'matte'), layers.primitives),
				cssFile('radius.css', pathFilter('radius'), layers.primitives),
				// borderWidth/outlineOffset were classified in tiers.primitive but
				// emitted NOWHERE (silent drop) while 11+ components consumed the
				// vars — reconciled 2026-07-07. Do not remove without re-checking
				// `var(--border-width-` / `var(--outline-offset-` consumers.
				cssFile('border-width.css', pathFilter('borderWidth', 'outlineOffset'), layers.primitives),
				cssFile('spacing.css', pathFilter('space', 'padding', 'size', 'breakpoint', 'zIndex', 'z-index'), layers.primitives),
				cssFile('typography.css', pathFilter('font', 'fontFeatureSettings', 'fontVariationSettings', 'textSize', 'font-size', 'leading', 'tracking'), layers.primitives),
				cssFile('motion.css', pathFilter('motion', 'duration', 'easing', 'animation'), layers.primitives),
				cssFile('gradient.css', pathFilter('gradient'), layers.primitives),
				cssFile('layout.css', pathFilter('layout'), layers.primitives),
				// Every primitive-tier group lands in a file (`tiers.primitive`); this was in none.
				cssFile('opacity.css', pathFilter('opacity'), layers.primitives),
			],
		},

		// ── CSS: Semantic ─────────────────────────────────────────
		'css-semantic': {
			transforms: CSS_TRANSFORMS,
			buildPath: `${paths.design}/styles/${layers.semantic}/`,
			files: [
				cssFile('elevation.css', pathFilter('elevation'), layers.semantic),
				cssFile('surface.css', pathFilter('surface', 'glass-blur'), layers.semantic),
				cssFile('border.css', pathFilter('border', 'borderPreset'), layers.semantic),
				cssFile('transition.css', pathFilter('transition', 'gradient-duration'), layers.semantic),
				cssFile('interaction.css', pathFilter('interaction'), layers.semantic),
				cssFile('overlay.css', pathFilter('overlay'), layers.semantic),
				cssFile('scrollbar.css', pathFilter('scrollbar', 'scrollbar-size'), layers.semantic),
				cssFile('backdrop.css', pathFilter('backdrop-glow', 'backdrop-grid', 'backdrop-grid-size', 'backdrop-grid-line'), layers.semantic),
				cssFile('text-styles.css', pathFilter('textStyle'), layers.semantic),
			cssFile('text.css', pathFilter('text'), layers.semantic),
			cssFile('signal.css', pathFilter('signal'), layers.semantic),
			cssFile('accent.css', pathFilter('accent'), layers.semantic),
			cssFile('role.css', pathFilter('primary', 'secondary', 'danger', 'success', 'warning', 'info', 'muted'), layers.semantic),
			cssFile('claude.css', pathFilter('claude'), layers.semantic),
			cssFile('icon.css', pathFilter('iconSize'), layers.semantic),
			// Every semantic-tier group lands in a file (`tiers.semantic`); these were in none.
			cssFile('chat.css', pathFilter('chat'), layers.semantic),
			cssFile('wizard.css', pathFilter('wizard'), layers.semantic),
			],
		},

		// ── CSS: Components ───────────────────────────────────────
		'css-components': {
			transforms: CSS_TRANSFORMS,
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

		// ── CSS: Kinds (one file per colocated kind tokens file) ──
		'css-kinds': {
			transforms: CSS_TRANSFORMS,
			buildPath: `${paths.design}/styles/components/kinds/`,
			files: KIND_FILES.map(({ kind, meta, group }) => ({
				destination: `${kind}.css`,
				format: clFormats.kindCss,
				filter: (token) => token.path[0] === kind && isKindToken(token),
				options: { kind, meta, group, scope: SURFACE_SCOPE },
			})),
		},

		// ── CSS: Scopes (the family scope, plan 0006 §0s) ──
		'css-scopes': {
			transforms: CSS_TRANSFORMS,
			buildPath: `${paths.design}/styles/scopes/`,
			files: [{
				destination: 'surface.css',
				format: clFormats.surfaceScopes,
				filter: (token) => token.path[0] === 'preset',
				options: { families: SURFACE_FAMILIES, surfaceDefault: SURFACE_DEFAULT },
			}],
		},

		// ── CSS: SVG Presets ──────────────────────────────────────
		'css-svg-presets': {
			transforms: CSS_TRANSFORMS,
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
		// Color: brand hues + brand-accent hues + achromatics for Tailwind @theme.
		'theme-color': {
			transforms: CSS_TRANSFORMS,
			buildPath: `${paths.design}/theme/`,
			files: [themeFile('color.css', (token) => {
				if (token.path[0] !== 'color') return false;
				const THEME_HUES = new Set([...brandHues, ...brandAccentHues, ...achromatics]);
				// white/black are path length 3 now: ['color', 'white']
				if (token.path.length === 2) return true;
				// Brand + accent hues: ['color', 'teal', '500']
				return THEME_HUES.has(token.path[1]);
			})],
		},
		'theme-shadow': { transforms: CSS_TRANSFORMS, buildPath: `${paths.design}/theme/`, files: [themeFile('shadow.css', pathFilter('shadow', 'depth'))] },
		'theme-elevation': { transforms: CSS_TRANSFORMS, buildPath: `${paths.design}/theme/`, files: [themeFile('elevation.css', pathFilter('elevation'))] },
		'theme-bevel': { transforms: CSS_TRANSFORMS, buildPath: `${paths.design}/theme/`, files: [themeFile('bevel.css', pathFilter('bevel'))] },
		'theme-glow': { transforms: CSS_TRANSFORMS, buildPath: `${paths.design}/theme/`, files: [themeFile('glow.css', pathFilter('glow', 'glowSpread'))] },
		'theme-blur': { transforms: CSS_TRANSFORMS, buildPath: `${paths.design}/theme/`, files: [themeFile('blur.css', pathFilter('blur'))] },
		'theme-surface': { transforms: CSS_TRANSFORMS, buildPath: `${paths.design}/theme/`, files: [themeFile('surface.css', pathFilter('glass', 'matte', 'surface'))] },
		'theme-radius': { transforms: CSS_TRANSFORMS, buildPath: `${paths.design}/theme/`, files: [themeFile('radius.css', pathFilter('radius'))] },
		'theme-spacing': { transforms: CSS_TRANSFORMS, buildPath: `${paths.design}/theme/`, files: [themeFile('spacing.css', pathFilter('space', 'padding', 'size', 'breakpoint', 'zIndex'))] },
		'theme-typography': { transforms: CSS_TRANSFORMS, buildPath: `${paths.design}/theme/`, files: [themeFile('typography.css', pathFilter('font', 'fontFeatureSettings', 'fontVariationSettings', 'textSize', 'font-size'))] },
		'theme-text-style': { transforms: CSS_TRANSFORMS, buildPath: `${paths.design}/theme/`, files: [themeFile('text-style.css', pathFilter('textStyle'))] },
		'theme-text-composed': {
			transforms: CSS_TRANSFORMS,
			buildPath: `${paths.design}/theme/`,
			files: [{
				destination: 'text-composed.css',
				format: 'coldlight/tailwind-typography',
				filter: pathFilter('textStyle'),
			}],
		},
		'theme-motion': { transforms: CSS_TRANSFORMS, buildPath: `${paths.design}/theme/`, files: [themeFile('motion.css', pathFilter('motion', 'duration', 'easing'))] },
		'theme-transition': { transforms: CSS_TRANSFORMS, buildPath: `${paths.design}/theme/`, files: [themeFile('transition.css', pathFilter('transition'))] },
		'theme-border': { transforms: CSS_TRANSFORMS, buildPath: `${paths.design}/theme/`, files: [themeFile('border.css', pathFilter('border', 'borderPreset'))] },
		'theme-interaction': { transforms: CSS_TRANSFORMS, buildPath: `${paths.design}/theme/`, files: [themeFile('interaction.css', pathFilter('interaction'))] },
		'theme-overlay': { transforms: CSS_TRANSFORMS, buildPath: `${paths.design}/theme/`, files: [themeFile('overlay.css', pathFilter('overlay'))] },
		'theme-scrollbar': { transforms: CSS_TRANSFORMS, buildPath: `${paths.design}/theme/`, files: [themeFile('scrollbar.css', pathFilter('scrollbar'))] },
		'theme-backdrop': { transforms: CSS_TRANSFORMS, buildPath: `${paths.design}/theme/`, files: [themeFile('backdrop.css', pathFilter('backdrop-glow', 'backdrop-grid', 'backdrop-grid-size', 'backdrop-grid-line'))] },
		'theme-gradient': { transforms: CSS_TRANSFORMS, buildPath: `${paths.design}/theme/`, files: [themeFile('gradient.css', pathFilter('gradient'))] },
		'theme-text': { transforms: CSS_TRANSFORMS, buildPath: `${paths.design}/theme/`, files: [themeFile('text.css', pathFilter('text'))] },
		'theme-signal': { transforms: CSS_TRANSFORMS, buildPath: `${paths.design}/theme/`, files: [themeFile('signal.css', pathFilter('signal'))] },
		'theme-accent': { transforms: CSS_TRANSFORMS, buildPath: `${paths.design}/theme/`, files: [themeFile('accent.css', pathFilter('accent'))] },
		'theme-role':   { transforms: CSS_TRANSFORMS, buildPath: `${paths.design}/theme/`, files: [themeFile('role.css',   pathFilter('primary', 'secondary', 'danger', 'success', 'warning', 'info', 'muted'))] },
		'theme-icon':   { transforms: CSS_TRANSFORMS, buildPath: `${paths.design}/theme/`, files: [themeFile('icon.css',   pathFilter('iconSize'))] },

		// ── TypeScript Types ──────────────────────────────────────
		'types-primitives': {
			transforms: TYPE_TRANSFORMS,
			buildPath: `${paths.design}/types/`,
			files: [
				typesFile('color.d.ts', pathFilter('color')),
				typesFile('shadow.d.ts', pathFilter('shadow', 'bevel', 'glow', 'glowSpread')),
				typesFile('blur.d.ts', pathFilter('blur')),
				typesFile('surface.d.ts', pathFilter('glass', 'matte', 'surface')),
				typesFile('spacing.d.ts', pathFilter('radius', 'space', 'padding', 'size', 'breakpoint', 'zIndex', 'z-index', 'borderWidth', 'outlineOffset')),
				typesFile('typography.d.ts', pathFilter('font', 'textSize', 'font-size', 'textStyle')),
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
				typesFile('backdrop.d.ts', pathFilter('backdrop-glow', 'backdrop-grid', 'backdrop-grid-size', 'backdrop-grid-line')),
				typesFile('text.d.ts', pathFilter('text')),
				typesFile('signal.d.ts', pathFilter('signal')),
				typesFile('accent.d.ts', pathFilter('accent')),
				typesFile('role.d.ts', pathFilter('primary', 'secondary', 'danger', 'success', 'warning', 'info', 'muted')),
				typesFile('icon.d.ts', pathFilter('iconSize')),
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
				// Kind tokens are not :root variables; they set `--<kind>-*` per selector (css-kinds).
				filter: (token) => !isKindToken(token),
			}],
		},
	},
};

export default config;
