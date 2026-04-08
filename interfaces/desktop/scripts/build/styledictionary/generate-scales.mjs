#!/usr/bin/env node
/**
 * @file generate-scales.mjs
 * @package @devpulse/coldlight
 *
 * Formula-based token scale generator.
 * Replaces hand-authored individual values with formulas:
 *   base × ratio^step → full scale
 *
 * ONE script. Runs before SD5. Outputs DTCG JSON that SD5 reads directly.
 *
 * Usage:
 *   node scripts/build/styledictionary/generate-scales.mjs
 */

import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT = resolve(__dirname, 'tokens/src/generated-scales.tokens.json');

// ─── Scale Generators ───────────────────────────────────────────────

/** Geometric scale: base × ratio^step */
function geometricScale(base, ratio, steps) {
	const values = [];
	for (let i = -Math.floor(steps / 3); i < steps - Math.floor(steps / 3); i++) {
		values.push(round(base * Math.pow(ratio, i)));
	}
	return values;
}

/** Linear scale: start to end in N steps */
function linearScale(start, end, steps) {
	const values = [];
	const step = (end - start) / (steps - 1);
	for (let i = 0; i < steps; i++) {
		values.push(round(start + step * i));
	}
	return values;
}

/** Shadow scale: each z-level multiplies base offset + blur */
function shadowScale(levels, baseOffsetY, baseBlur, color) {
	const multipliers = [0, 1, 3, 10, 15];
	const result = {};
	for (let z = 0; z < levels; z++) {
		const m = multipliers[z] ?? z * 5;
		if (z === 0) {
			result[`z${z}`] = { $value: 'none', $type: 'shadow' };
		} else {
			const oy = round(baseOffsetY * m);
			const bl = round(baseBlur * m);
			const oy2 = round(baseOffsetY * m * 0.3);
			const bl2 = round(baseBlur * m * 0.5);
			result[`z${z}`] = {
				$value: `0 ${oy}rem ${bl}rem ${color} / 0.15), 0 ${oy2}rem ${bl2}rem ${color} / 0.1)`,
				$type: 'shadow',
			};
		}
	}
	return result;
}

/** Color ramp: oklch lightness sweep for a given hue + chroma */
function colorRamp(hue, chroma, stops = 11) {
	const lightness = linearScale(0.97, 0.12, stops);
	const names = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];
	const result = {};
	for (let i = 0; i < stops; i++) {
		result[names[i]] = {
			$value: `oklch(${lightness[i]} ${chroma} ${hue})`,
			$type: 'color',
		};
	}
	return result;
}

/** Void color ramp: ultra-low chroma dark scale with a base anchor */
function voidRamp(hue, chroma) {
	const ramp = colorRamp(hue, chroma);
	ramp.base = {
		$value: `oklch(0.08 ${chroma} ${hue})`,
		$type: 'color',
		$description: 'Void base — deepest app background',
	};
	return ramp;
}

/** Gradient pairs: lightness-shifted for surface depth */
function gradientPairs(hues) {
	const result = {};
	for (const [name, { hue, chroma, baseL }] of Object.entries(hues)) {
		const topL = round(baseL + 0.04);
		const botL = round(baseL - 0.02);
		result[`surface-${name}`] = {
			$value: `linear-gradient(180deg, oklch(${topL} ${chroma} ${hue}), oklch(${botL} ${chroma} ${hue}))`,
			$type: 'gradient',
			$description: `${name} surface depth gradient`,
		};
		result[`glow-${name}`] = {
			$value: `radial-gradient(oklch(${round(baseL + 0.15)} ${round(chroma * 3)} ${hue} / 0.4), transparent)`,
			$type: 'gradient',
			$description: `${name} glow radial`,
		};
		result[`accent-${name}`] = {
			$value: `linear-gradient(135deg, oklch(${round(baseL + 0.15)} ${round(chroma * 4)} ${hue}), oklch(${round(baseL - 0.05)} ${round(chroma * 2)} ${hue}))`,
			$type: 'gradient',
			$description: `${name} accent dramatic gradient`,
		};
	}
	return result;
}

function round(n) {
	return Math.round(n * 10000) / 10000;
}

// ─── Fluid Clamp ────────────────────────────────────────────────────

/** Fluid clamp: linear interpolation between two viewport-size pairs */
function computeFluid(minPx, maxPx, minVP = 320, maxVP = 1440, base = 16) {
	const slope = (maxPx - minPx) / (maxVP - minVP);
	const intercept = minPx - slope * minVP;
	const slopeVw = round(slope * 100);
	const interceptRem = round(intercept / base);
	const minRem = round(minPx / base);
	const maxRem = round(maxPx / base);
	const sign = interceptRem >= 0 ? ' + ' : ' - ';
	const absIntercept = round(Math.abs(interceptRem));
	return `clamp(${minRem}rem, ${slopeVw}vw${sign}${absIntercept}rem, ${maxRem}rem)`;
}

/** Fluid dimension token — threshold gate: sub-2px delta → static */
function fluidDim(minPx, maxPx, threshold = 2) {
	if (Math.abs(maxPx - minPx) < threshold) {
		return { $value: `${round(minPx / 16)}rem`, $type: 'dimension' };
	}
	return { $value: computeFluid(minPx, maxPx), $type: 'dimension' };
}

// ─── Scale Definitions (formulas) ───────────────────────────────────

const SCALES = {
	// Space scale: fluid clamp — threshold gate collapses sub-2px deltas to static
	space: (() => {
		return {
			'0':   { $value: '0', $type: 'dimension' },
			'1':   fluidDim(1, 1),
			'2':   fluidDim(2, 2),
			'3':   fluidDim(3, 3),
			'4':   fluidDim(4, 5),
			'5':   fluidDim(5, 6),
			'6':   fluidDim(6, 7),
			'7':   fluidDim(7, 8),
			'8':   fluidDim(8, 10),
			'9':   fluidDim(9, 11),
			'10':  fluidDim(10, 12),
			'11':  fluidDim(11, 13),
			'12':  fluidDim(12, 14),
			'14':  fluidDim(14, 16),
			'16':  fluidDim(16, 20),
			'18':  fluidDim(18, 22),
			'20':  fluidDim(20, 26),
			'24':  fluidDim(24, 32),
			'28':  fluidDim(28, 36),
			'32':  fluidDim(32, 44),
			'36':  fluidDim(36, 48),
			'40':  fluidDim(40, 56),
			'44':  fluidDim(44, 60),
			'48':  fluidDim(48, 64),
			'56':  fluidDim(56, 76),
			'64':  fluidDim(64, 88),
			'72':  fluidDim(72, 100),
			'80':  fluidDim(80, 112),
			'96':  fluidDim(96, 124),
			'112': fluidDim(112, 144),
			'128': fluidDim(128, 164),
		};
	})(),

	// Padding: fluid clamp
	padding: (() => {
		return {
			'xs-y': fluidDim(4, 5),    'xs-x': fluidDim(8, 10),
			'sm-y': fluidDim(6, 8),    'sm-x': fluidDim(12, 16),
			'md-y': fluidDim(8, 12),   'md-x': fluidDim(16, 22),
			'lg-y': fluidDim(12, 16),  'lg-x': fluidDim(24, 32),
			'xl-y': fluidDim(16, 22),  'xl-x': fluidDim(32, 44),
			'2xl-y': fluidDim(24, 32), '2xl-x': fluidDim(48, 64),
		};
	})(),

	// Size scale: fluid clamp — component/container sizes
	size: (() => {
		return {
			'3xs':  fluidDim(16, 18),
			'2xs':  fluidDim(20, 24),
			'xs':   fluidDim(24, 28),
			'sm':   fluidDim(32, 38),
			'md':   fluidDim(40, 48),
			'lg':   fluidDim(48, 58),
			'xl':   fluidDim(56, 68),
			'2xl':  fluidDim(64, 80),
			'3xl':  fluidDim(80, 100),
			'4xl':  fluidDim(96, 120),
			'5xl':  fluidDim(128, 160),
			'container-xs':  fluidDim(320, 320),   // static — min container
			'container-sm':  fluidDim(640, 640),   // static
			'container-md':  fluidDim(768, 768),   // static
			'container-lg':  fluidDim(1024, 1024), // static
			'container-xl':  fluidDim(1280, 1280), // static
			'container-2xl': fluidDim(1536, 1536), // static
		};
	})(),

	// Breakpoints: matches --breakpoint-* in spacing.css
	breakpoint: (() => {
		const entries = {
			'xs': '20rem', 'sm': '40rem', 'md': '48rem',
			'lg': '64rem', 'xl': '80rem', '2xl': '96rem',
		};
		const result = {};
		for (const [name, val] of Object.entries(entries)) {
			result[name] = { $value: val, $type: 'dimension' };
		}
		return result;
	})(),

	// Z-index scale: matches --z-index-* in spacing.css
	zIndex: (() => {
		const entries = {
			'base': '0', 'raised': '10', 'dropdown': '100',
			'sticky': '200', 'overlay': '300', 'modal': '400',
			'popover': '500', 'toast': '600', 'tooltip': '700',
		};
		const result = {};
		for (const [name, val] of Object.entries(entries)) {
			result[name] = { $value: val, $type: 'number' };
		}
		return result;
	})(),

	// Typography: fluid compounding scale (minor third at mobile → perfect fourth at desktop)
	// Key is "textSize" to match SD5 pathFilter — SD5 remaps to --text-size-* in CSS
	textSize: (() => {
		const baseMin = 16;
		const baseMax = 18;
		const ratioMin = 1.2;
		const ratioMax = 1.333;
		const names = ['3xs', '2xs', 'xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl'];
		const steps = [-4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6];
		const result = {};
		for (let i = 0; i < names.length; i++) {
			let minPx = baseMin * Math.pow(ratioMin, steps[i]);
			let maxPx = baseMax * Math.pow(ratioMax, steps[i]);
			// Fix inversion at negative steps where steeper desktop ratio
			// makes small sizes smaller than mobile small sizes
			if (minPx > maxPx) [minPx, maxPx] = [maxPx, minPx];
			result[names[i]] = fluidDim(minPx, maxPx);
		}
		return result;
	})(),

	// Border radius: fluid (gentle scaling)
	radius: (() => {
		return {
			none: { $value: '0', $type: 'dimension' },
			xs:   fluidDim(2, 2),
			sm:   fluidDim(4, 5),
			md:   fluidDim(8, 10),
			lg:   fluidDim(12, 14),
			xl:   fluidDim(16, 20),
			'2xl': fluidDim(24, 28),
			full: { $value: '9999px', $type: 'dimension' },
		};
	})(),

	// Blur: geometric
	blur: (() => {
		const entries = { off: '0', sm: '0.25rem', md: '0.5rem', lg: '0.75rem', xl: '1rem', '2xl': '1.5rem' };
		const result = {};
		for (const [name, val] of Object.entries(entries)) {
			result[name] = { $value: val, $type: 'dimension' };
		}
		return result;
	})(),

	// Opacity: linear 10 steps
	opacity: (() => {
		const steps = linearScale(0.1, 1.0, 10);
		const names = ['10', '20', '30', '40', '50', '60', '70', '80', '90', '100'];
		const result = {};
		for (let i = 0; i < names.length; i++) {
			result[names[i]] = { $value: steps[i], $type: 'number' };
		}
		return result;
	})(),

	// Shadows: depth z0-z4
	shadow: shadowScale(5, 0.0625, 0.1875, 'oklch(0 0 0'),

	// Color ramps: brand hues + full spectrum + neutrals
	color: {
		$type: 'color',

		// ── Brand hues (6 primaries) ──────────────────────────
		teal: colorRamp(173, 0.08),
		purple: colorRamp(280, 0.12),
		magenta: colorRamp(330, 0.14),
		ember: colorRamp(25, 0.12),
		frost: colorRamp(220, 0.06),
		cyber: colorRamp(160, 0.1),

		// ── Brand accent hues (7 named brand colors) ─────────
		'brand-cyan': colorRamp(195, 0.14),       // #17deef
		'brand-green': colorRamp(155, 0.17),      // #29b468
		'brand-hotpink': colorRamp(355, 0.22),    // #f8397a
		'brand-coral': colorRamp(10, 0.16),       // #fc6b83
		'brand-blue': colorRamp(240, 0.14),       // #3ea4ea
		'brand-salmon': colorRamp(15, 0.18),      // #f16971
		'brand-gold': colorRamp(100, 0.16),       // #d6d232

		// ── App background ────────────────────────────────────
		void: voidRamp(220, 0.01),

		// ── Full spectrum (30° hue wheel) ─────────────────────
		red: colorRamp(17, 0.16),
		'red-orange': colorRamp(38, 0.14),
		orange: colorRamp(58, 0.13),
		amber: colorRamp(87, 0.13),
		yellow: colorRamp(110, 0.15),
		chartreuse: colorRamp(124, 0.16),
		lime: colorRamp(134, 0.17),
		'green-yellow': colorRamp(140, 0.18),
		green: colorRamp(143, 0.18),
		'green-cyan': colorRamp(150, 0.16),
		spring: colorRamp(155, 0.14),
		mint: colorRamp(170, 0.12),
		cyan: colorRamp(195, 0.11),
		sky: colorRamp(225, 0.1),
		azure: colorRamp(250, 0.13),
		royal: colorRamp(265, 0.16),
		blue: colorRamp(270, 0.18),
		indigo: colorRamp(285, 0.17),
		violet: colorRamp(300, 0.17),
		rose: colorRamp(340, 0.16),
		pink: colorRamp(350, 0.15),
		crimson: colorRamp(10, 0.16),

		// ── Achromatic ────────────────────────────────────────
		neutral: colorRamp(0, 0),
		white: { $value: 'oklch(1 0 0)', $type: 'color' },
		black: { $value: 'oklch(0 0 0)', $type: 'color' },
	},

	// Gradients: formula-generated from hue definitions
	gradient: gradientPairs({
		teal: { hue: 173, chroma: 0.02, baseL: 0.09 },
		purple: { hue: 280, chroma: 0.03, baseL: 0.09 },
		ember: { hue: 25, chroma: 0.02, baseL: 0.09 },
		frost: { hue: 220, chroma: 0.015, baseL: 0.09 },
		cyber: { hue: 160, chroma: 0.02, baseL: 0.09 },
		magenta: { hue: 330, chroma: 0.03, baseL: 0.09 },
		'brand-cyan': { hue: 195, chroma: 0.03, baseL: 0.09 },
		'brand-green': { hue: 155, chroma: 0.03, baseL: 0.09 },
		'brand-hotpink': { hue: 355, chroma: 0.04, baseL: 0.09 },
		'brand-coral': { hue: 10, chroma: 0.03, baseL: 0.09 },
		'brand-blue': { hue: 240, chroma: 0.03, baseL: 0.09 },
		'brand-salmon': { hue: 15, chroma: 0.03, baseL: 0.09 },
		'brand-gold': { hue: 100, chroma: 0.03, baseL: 0.09 },
	}),

	// Effects: easing (hand-authored design decisions)
	easing: {
		linear: { $value: 'cubic-bezier(0, 0, 1, 1)', $type: 'cubicBezier' },
		'ease-in': { $value: 'cubic-bezier(0.4, 0, 1, 1)', $type: 'cubicBezier' },
		'ease-out': { $value: 'cubic-bezier(0, 0, 0.2, 1)', $type: 'cubicBezier' },
		'ease-in-out': { $value: 'cubic-bezier(0.4, 0, 0.2, 1)', $type: 'cubicBezier' },
		spring: { $value: 'cubic-bezier(0.34, 1.56, 0.64, 1)', $type: 'cubicBezier' },
		bounce: { $value: 'cubic-bezier(0.68, -0.55, 0.27, 1.55)', $type: 'cubicBezier' },
	},

	// Effects: duration scale (formula: base 50ms × ~3 ratio)
	duration: {
		snap: { $value: '50ms', $type: 'duration' },
		fast: { $value: '150ms', $type: 'duration' },
		normal: { $value: '250ms', $type: 'duration' },
		smooth: { $value: '400ms', $type: 'duration' },
		glacial: { $value: '700ms', $type: 'duration' },
		moderate: { $value: '3000ms', $type: 'duration' },
	},

	// Mesh gradients (multi-stop)
	meshGradient: {
		aurora: {
			$value: 'linear-gradient(135deg, oklch(0.55 0.08 173), oklch(0.5 0.1 200), oklch(0.45 0.12 280))',
			$type: 'gradient',
			$description: 'Aurora — teal to cyan to purple',
		},
		sunset: {
			$value: 'linear-gradient(135deg, oklch(0.55 0.12 25), oklch(0.5 0.14 330), oklch(0.45 0.12 280))',
			$type: 'gradient',
			$description: 'Sunset — ember to magenta to purple',
		},
		frost: {
			$value: 'linear-gradient(135deg, oklch(0.55 0.06 220), oklch(0.5 0.08 173), oklch(0.45 0.1 160))',
			$type: 'gradient',
			$description: 'Frost — frost to teal to cyber',
		},
		void: {
			$value: 'linear-gradient(180deg, oklch(0.12 0.01 224), oklch(0.06 0.005 224))',
			$type: 'gradient',
			$description: 'Void — deep dark descent',
		},
	},
};

// ─── Output ─────────────────────────────────────────────────────────

const output = {
	$description: 'Auto-generated from formulas. Do not hand-edit. Modify generate-scales.mjs instead.',
	...SCALES,
};

writeFileSync(OUTPUT, JSON.stringify(output, null, '\t') + '\n');

const tokenCount = JSON.stringify(output).match(/"\$value"/g)?.length ?? 0;
console.log(`[generate-scales] Wrote ${tokenCount} tokens to generated-scales.tokens.json`);
