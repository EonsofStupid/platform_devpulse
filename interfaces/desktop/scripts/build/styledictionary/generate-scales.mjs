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

// ─── Scale Definitions (formulas) ───────────────────────────────────

const SCALES = {
	// Spacing: base 0.25rem, ratio 2
	spacing: (() => {
		const names = ['1', '2', '3', '4', '5', '6', '8', '10', '12', '16', '20', '24', '32'];
		const values = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 2.5, 3, 4, 5, 6, 8];
		const result = {};
		for (let i = 0; i < names.length; i++) {
			result[names[i]] = { $value: `${values[i]}rem`, $type: 'dimension' };
		}
		return result;
	})(),

	// Typography: modular scale, major third (1.25)
	fontSize: (() => {
		const base = 1;
		const ratio = 1.25;
		const names = ['xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl'];
		const steps = [-2, -1, 0, 1, 2, 3, 4, 5, 6];
		const result = {};
		for (let i = 0; i < names.length; i++) {
			result[names[i]] = {
				$value: `${round(base * Math.pow(ratio, steps[i]))}rem`,
				$type: 'dimension',
			};
		}
		return result;
	})(),

	// Border radius: geometric
	radius: (() => {
		const entries = {
			none: '0',
			xs: '0.125rem',
			sm: '0.25rem',
			md: '0.5rem',
			lg: '0.75rem',
			xl: '1rem',
			'2xl': '1.5rem',
			full: '9999px',
		};
		const result = {};
		for (const [name, val] of Object.entries(entries)) {
			result[name] = { $value: val, $type: 'dimension' };
		}
		return result;
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

	// Color ramps: 6 brand hues
	color: {
		$type: 'color',
		teal: colorRamp(173, 0.08),
		purple: colorRamp(280, 0.12),
		magenta: colorRamp(330, 0.14),
		ember: colorRamp(25, 0.12),
		frost: colorRamp(220, 0.06),
		cyber: colorRamp(160, 0.1),
	},

	// Gradients: formula-generated from hue definitions
	gradient: gradientPairs({
		teal: { hue: 173, chroma: 0.02, baseL: 0.09 },
		purple: { hue: 280, chroma: 0.03, baseL: 0.09 },
		ember: { hue: 25, chroma: 0.02, baseL: 0.09 },
		frost: { hue: 220, chroma: 0.015, baseL: 0.09 },
		cyber: { hue: 160, chroma: 0.02, baseL: 0.09 },
		magenta: { hue: 330, chroma: 0.03, baseL: 0.09 },
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
