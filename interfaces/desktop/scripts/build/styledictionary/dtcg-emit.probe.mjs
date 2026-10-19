#!/usr/bin/env node
/**
 * @file dtcg-emit.probe.mjs
 * @package @devpulse/coldlight
 *
 * Golden-pattern probe for dtcg-emit.mjs.
 *
 * This script exercises every helper in the DTCG emitter module with
 * real numeric inputs and prints the resulting JSON to stdout. It is
 * NOT part of the token build pipeline — it exists so the author can
 * eyeball the output against the DTCG 2025.10 spec before trusting
 * the helpers inside the real generator.
 *
 * Usage:
 *   node scripts/build/styledictionary/dtcg-emit.probe.mjs
 *
 * Expected every section to match the shapes in
 * packages/coldlight/docs/DTCG-REFERENCE.md.
 */

import {
	dtcgColor,
	dtcgCubicBezier,
	dtcgDimension,
	dtcgDuration,
	dtcgFluidDimensionToken,
	dtcgGradientStop,
	dtcgGradientToken,
	dtcgShadow,
	dtcgShadowLayer,
	oklchToHex,
} from './dtcg-emit.mjs';

function section(title) {
	console.log(`\n═══ ${title} ═══`);
}

function show(label, value) {
	console.log(`\n${label}:`);
	console.log(JSON.stringify(value, null, 2));
}

// ─────────────────────────────────────────────────────────────
// COLOR — DevPulse teal 500 (oklch 0.55 0.12 173)
// ─────────────────────────────────────────────────────────────
section('COLOR — teal 500');

const teal500Hex = oklchToHex(0.55, 0.12, 173);
show('oklchToHex(0.55, 0.12, 173)', teal500Hex);

const teal500Value = dtcgColor({
	colorSpace: 'oklch',
	components: [0.55, 0.12, 173],
	hex: teal500Hex,
});
show('dtcgColor teal 500 value', teal500Value);

const teal500Token = {
	$type: 'color',
	$value: teal500Value,
	$description: 'DevPulse primary brand — mid-lightness teal.',
};
show('Full teal 500 token', teal500Token);

// Round-trip check: every stop of the teal ramp.
section('COLOR — full teal ramp (11 stops)');
const stops = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];
const lightness = [0.97, 0.89, 0.81, 0.73, 0.65, 0.55, 0.46, 0.37, 0.28, 0.19, 0.12];
const tealRamp = {};
for (let i = 0; i < stops.length; i++) {
	const L = lightness[i];
	tealRamp[stops[i]] = {
		$value: dtcgColor({
			colorSpace: 'oklch',
			components: [L, 0.08, 173],
			hex: oklchToHex(L, 0.08, 173),
		}),
	};
}
show('teal ramp value', { teal: { $type: 'color', ...tealRamp } });

// ─────────────────────────────────────────────────────────────
// DIMENSION — static
// ─────────────────────────────────────────────────────────────
section('DIMENSION — static');
show('dtcgDimension(0.0625, "rem")', dtcgDimension(0.0625, 'rem'));
show('dtcgDimension(16, "px")', dtcgDimension(16, 'px'));

// ─────────────────────────────────────────────────────────────
// FLUID DIMENSION — full token with extensions
// ─────────────────────────────────────────────────────────────
section('FLUID DIMENSION — with clamp extension');
show(
	'dtcgFluidDimensionToken(16, 20, 320, 1440, 16, "Fluid medium space")',
	dtcgFluidDimensionToken(16, 20, 320, 1440, 16, 'Fluid medium space'),
);
show(
	'dtcgFluidDimensionToken(1, 1) — collapsed, no extension',
	dtcgFluidDimensionToken(1, 1),
);

// ─────────────────────────────────────────────────────────────
// DURATION — ms + s
// ─────────────────────────────────────────────────────────────
section('DURATION');
show('dtcgDuration(250, "ms")', dtcgDuration(250, 'ms'));
show('dtcgDuration(1.5, "s")', dtcgDuration(1.5, 's'));

// ─────────────────────────────────────────────────────────────
// CUBIC BEZIER — easing curves
// ─────────────────────────────────────────────────────────────
section('CUBIC BEZIER');
show('ease-out (0, 0, 0.2, 1)', dtcgCubicBezier(0, 0, 0.2, 1));
show('spring (0.34, 1.56, 0.64, 1)', dtcgCubicBezier(0.34, 1.56, 0.64, 1));

// ─────────────────────────────────────────────────────────────
// SHADOW — single layer + stacked multi-layer
// ─────────────────────────────────────────────────────────────
section('SHADOW — single layer');
const shadowHex = oklchToHex(0.2, 0.01, 224);
const singleLayer = dtcgShadowLayer({
	color: dtcgColor({ colorSpace: 'oklch', components: [0.2, 0.01, 224], alpha: 0.08, hex: shadowHex }),
	offsetX: dtcgDimension(0, 'rem'),
	offsetY: dtcgDimension(0.0625, 'rem'),
	blur: dtcgDimension(0.1875, 'rem'),
	spread: dtcgDimension(0, 'rem'),
});
show('single layer', dtcgShadow([singleLayer]));

section('SHADOW — two-layer z1');
const layerA = dtcgShadowLayer({
	color: dtcgColor({ colorSpace: 'oklch', components: [0.2, 0.01, 224], alpha: 0.08, hex: shadowHex }),
	offsetX: dtcgDimension(0, 'rem'),
	offsetY: dtcgDimension(0.0625, 'rem'),
	blur: dtcgDimension(0.1875, 'rem'),
});
const layerB = dtcgShadowLayer({
	color: dtcgColor({ colorSpace: 'oklch', components: [0.2, 0.01, 224], alpha: 0.05, hex: shadowHex }),
	offsetX: dtcgDimension(0, 'rem'),
	offsetY: dtcgDimension(0.0625, 'rem'),
	blur: dtcgDimension(0.125, 'rem'),
});
show('two layers', dtcgShadow([layerA, layerB]));

// ─────────────────────────────────────────────────────────────
// GRADIENT — linear surface depth shift
// ─────────────────────────────────────────────────────────────
section('GRADIENT — surface depth shift');
const tealTop = dtcgColor({
	colorSpace: 'oklch',
	components: [0.13, 0.02, 173],
	hex: oklchToHex(0.13, 0.02, 173),
});
const tealBottom = dtcgColor({
	colorSpace: 'oklch',
	components: [0.07, 0.02, 173],
	hex: oklchToHex(0.07, 0.02, 173),
});
show(
	'dtcgGradientToken — linear 180deg',
	dtcgGradientToken(
		[dtcgGradientStop(tealTop, 0), dtcgGradientStop(tealBottom, 1)],
		{ kind: 'linear', angle: 180 },
		'Teal surface depth shift top to bottom.',
	),
);

console.log('\n═══ probe complete ═══\n');
