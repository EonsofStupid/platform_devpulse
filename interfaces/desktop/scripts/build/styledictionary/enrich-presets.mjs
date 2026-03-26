/**
 * @file enrich-presets.mjs
 * @description Adds the 9 missing StyleMacro axes to every style preset in style-presets.json.
 *
 * StyleMacro expects 15 axes per preset. The presets currently define 8:
 *   background-color, border-radius, box-shadow, color, border-color,
 *   border-width, backdrop-filter, opacity
 *
 * This script adds the missing 9:
 *   font-family, font-size, font-weight, letter-spacing, line-height,
 *   animation, transition-duration, transition-timing-function, gradient
 *
 * Typography values are derived from the textStyle definitions in typography.json.
 * Each component type maps to a textStyle (e.g., button → body, stat → stat).
 *
 * Usage: node scripts/build/styledictionary/enrich-presets.mjs
 * Run BEFORE pnpm ds:tokens:build
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PRESETS_PATH = resolve(__dirname, 'tokens/src/style-presets.json');
const TYPOGRAPHY_PATH = resolve(__dirname, 'tokens/src/typography.json');

// ═══════════════════════════════════════════════════════════════
// LOAD SOURCE FILES
// ═══════════════════════════════════════════════════════════════

const presets = JSON.parse(readFileSync(PRESETS_PATH, 'utf-8'));
const typography = JSON.parse(readFileSync(TYPOGRAPHY_PATH, 'utf-8'));

// ═══════════════════════════════════════════════════════════════
// FONT STACKS (from typography.json)
// ═══════════════════════════════════════════════════════════════

const fontStacks = {
	display: typography.font.display.$value.join(', '),
	sans: typography.font.sans.$value.join(', '),
	mono: typography.font.mono.$value.join(', '),
};

// ═══════════════════════════════════════════════════════════════
// TEXT STYLE MAPPING → Component Types
// ═══════════════════════════════════════════════════════════════

/**
 * Maps component type → typography profile.
 * Values reference textStyle definitions from typography.json.
 * Missing types fall through to DEFAULT_TYPOGRAPHY.
 */
const TYPOGRAPHY_MAP = {
	// Interactive controls
	'button':          { fontFamily: 'sans', fontSize: '0.875rem', fontWeight: '600', letterSpacing: '0.01em',  lineHeight: '1.4' },
	'badge':           { fontFamily: 'sans', fontSize: '0.75rem',  fontWeight: '600', letterSpacing: '0.02em',  lineHeight: '1' },
	'checkbox':        { fontFamily: 'sans', fontSize: '0.875rem', fontWeight: '400', letterSpacing: '0em',     lineHeight: '1.4' },
	'radio-group':     { fontFamily: 'sans', fontSize: '0.875rem', fontWeight: '400', letterSpacing: '0em',     lineHeight: '1.4' },
	'switch':          { fontFamily: 'sans', fontSize: '0.875rem', fontWeight: '400', letterSpacing: '0em',     lineHeight: '1.4' },
	'toggle-button':   { fontFamily: 'sans', fontSize: '0.875rem', fontWeight: '500', letterSpacing: '0em',     lineHeight: '1.4' },
	'link':            { fontFamily: 'sans', fontSize: 'inherit',  fontWeight: 'inherit', letterSpacing: 'inherit', lineHeight: 'inherit' },

	// Text display
	'heading':         { fontFamily: 'sans', fontSize: '1rem',     fontWeight: '600', letterSpacing: '-0.005em', lineHeight: '1.4' },
	'text':            { fontFamily: 'sans', fontSize: '0.875rem', fontWeight: '400', letterSpacing: '0em',     lineHeight: '1.5' },
	'code':            { fontFamily: 'mono', fontSize: '0.8125rem',fontWeight: '400', letterSpacing: '0em',     lineHeight: '1.6' },

	// Data display
	'stat':            { fontFamily: 'display', fontSize: '1.5rem', fontWeight: '700', letterSpacing: '0.02em', lineHeight: '1.1' },
	'status-dot':      { fontFamily: 'sans', fontSize: 'inherit',  fontWeight: 'inherit', letterSpacing: 'inherit', lineHeight: 'inherit' },
	'meter':           { fontFamily: 'sans', fontSize: '0.75rem',  fontWeight: '500', letterSpacing: '0.01em',  lineHeight: '1.3' },
	'progress-bar':    { fontFamily: 'sans', fontSize: '0.75rem',  fontWeight: '500', letterSpacing: '0.01em',  lineHeight: '1.3' },
	'tag-group':       { fontFamily: 'sans', fontSize: '0.75rem',  fontWeight: '500', letterSpacing: '0.01em',  lineHeight: '1.3' },

	// Layout containers
	'card':            { fontFamily: 'sans', fontSize: '0.875rem', fontWeight: '400', letterSpacing: '0em',     lineHeight: '1.5' },
	'accordion':       { fontFamily: 'sans', fontSize: '0.875rem', fontWeight: '500', letterSpacing: '0em',     lineHeight: '1.5' },
	'collapsible':     { fontFamily: 'sans', fontSize: '0.875rem', fontWeight: '400', letterSpacing: '0em',     lineHeight: '1.5' },
	'tabs':            { fontFamily: 'sans', fontSize: '0.875rem', fontWeight: '500', letterSpacing: '0em',     lineHeight: '1.4' },
	'table':           { fontFamily: 'sans', fontSize: '0.8125rem',fontWeight: '400', letterSpacing: '0em',     lineHeight: '1.4' },
	'data-table':      { fontFamily: 'sans', fontSize: '0.8125rem',fontWeight: '400', letterSpacing: '0em',     lineHeight: '1.4' },

	// Input fields
	'text-field':      { fontFamily: 'sans', fontSize: '0.875rem', fontWeight: '400', letterSpacing: '0em',     lineHeight: '1.5' },
	'text-area':       { fontFamily: 'sans', fontSize: '0.875rem', fontWeight: '400', letterSpacing: '0em',     lineHeight: '1.5' },
	'number-field':    { fontFamily: 'mono', fontSize: '0.875rem', fontWeight: '400', letterSpacing: '0em',     lineHeight: '1.5' },
	'search-field':    { fontFamily: 'sans', fontSize: '0.875rem', fontWeight: '400', letterSpacing: '0em',     lineHeight: '1.5' },
	'date-field':      { fontFamily: 'sans', fontSize: '0.875rem', fontWeight: '400', letterSpacing: '0em',     lineHeight: '1.5' },
	'date-picker':     { fontFamily: 'sans', fontSize: '0.875rem', fontWeight: '400', letterSpacing: '0em',     lineHeight: '1.5' },
	'date-range-picker': { fontFamily: 'sans', fontSize: '0.875rem', fontWeight: '400', letterSpacing: '0em',   lineHeight: '1.5' },
	'time-field':      { fontFamily: 'sans', fontSize: '0.875rem', fontWeight: '400', letterSpacing: '0em',     lineHeight: '1.5' },
	'select':          { fontFamily: 'sans', fontSize: '0.875rem', fontWeight: '400', letterSpacing: '0em',     lineHeight: '1.5' },
	'combobox':        { fontFamily: 'sans', fontSize: '0.875rem', fontWeight: '400', letterSpacing: '0em',     lineHeight: '1.5' },
	'slider':          { fontFamily: 'sans', fontSize: '0.75rem',  fontWeight: '500', letterSpacing: '0em',     lineHeight: '1.3' },
	'range-slider':    { fontFamily: 'sans', fontSize: '0.75rem',  fontWeight: '500', letterSpacing: '0em',     lineHeight: '1.3' },

	// Color inputs
	'color-area':      { fontFamily: 'sans', fontSize: '0.75rem',  fontWeight: '400', letterSpacing: '0em',     lineHeight: '1.3' },
	'color-field':     { fontFamily: 'mono', fontSize: '0.8125rem',fontWeight: '400', letterSpacing: '0.02em',  lineHeight: '1.4' },
	'color-slider':    { fontFamily: 'sans', fontSize: '0.75rem',  fontWeight: '400', letterSpacing: '0em',     lineHeight: '1.3' },
	'color-swatch-picker': { fontFamily: 'sans', fontSize: '0.75rem', fontWeight: '400', letterSpacing: '0em',  lineHeight: '1.3' },
	'color-swatch':    { fontFamily: 'sans', fontSize: '0.75rem',  fontWeight: '400', letterSpacing: '0em',     lineHeight: '1.3' },
	'color-wheel':     { fontFamily: 'sans', fontSize: '0.75rem',  fontWeight: '400', letterSpacing: '0em',     lineHeight: '1.3' },

	// Overlays / feedback
	'alert':           { fontFamily: 'sans', fontSize: '0.875rem', fontWeight: '400', letterSpacing: '0em',     lineHeight: '1.5' },
	'alert-dialog':    { fontFamily: 'sans', fontSize: '0.875rem', fontWeight: '400', letterSpacing: '0em',     lineHeight: '1.5' },
	'dialog':          { fontFamily: 'sans', fontSize: '0.875rem', fontWeight: '400', letterSpacing: '0em',     lineHeight: '1.5' },
	'banner':          { fontFamily: 'sans', fontSize: '0.875rem', fontWeight: '500', letterSpacing: '0em',     lineHeight: '1.5' },
	'callout':         { fontFamily: 'sans', fontSize: '0.8125rem',fontWeight: '400', letterSpacing: '0em',     lineHeight: '1.45' },
	'tooltip':         { fontFamily: 'sans', fontSize: '0.8125rem',fontWeight: '400', letterSpacing: '0em',     lineHeight: '1.4' },
	'popover':         { fontFamily: 'sans', fontSize: '0.875rem', fontWeight: '400', letterSpacing: '0em',     lineHeight: '1.5' },
	'toast':           { fontFamily: 'sans', fontSize: '0.875rem', fontWeight: '400', letterSpacing: '0em',     lineHeight: '1.5' },
	'contextual-help': { fontFamily: 'sans', fontSize: '0.8125rem',fontWeight: '400', letterSpacing: '0em',     lineHeight: '1.45' },
	'inline-alert':    { fontFamily: 'sans', fontSize: '0.8125rem',fontWeight: '400', letterSpacing: '0em',     lineHeight: '1.45' },

	// Navigation
	'breadcrumbs':     { fontFamily: 'sans', fontSize: '0.8125rem',fontWeight: '400', letterSpacing: '0em',     lineHeight: '1.4' },
	'menu':            { fontFamily: 'sans', fontSize: '0.875rem', fontWeight: '400', letterSpacing: '0em',     lineHeight: '1.4' },
	'menu-trigger':    { fontFamily: 'sans', fontSize: '0.875rem', fontWeight: '500', letterSpacing: '0em',     lineHeight: '1.4' },
	'submenu-trigger': { fontFamily: 'sans', fontSize: '0.875rem', fontWeight: '500', letterSpacing: '0em',     lineHeight: '1.4' },

	// Avatars
	'avatar':          { fontFamily: 'sans', fontSize: '0.75rem',  fontWeight: '600', letterSpacing: '0em',     lineHeight: '1' },
	'avatar-group':    { fontFamily: 'sans', fontSize: '0.75rem',  fontWeight: '600', letterSpacing: '0em',     lineHeight: '1' },

	// Chat layout
	'chat-bubble':     { fontFamily: 'sans', fontSize: '0.8125rem',fontWeight: '400', letterSpacing: '0em',     lineHeight: '1.45' },
	'chat-context-panel': { fontFamily: 'sans', fontSize: '0.8125rem',fontWeight: '400', letterSpacing: '0em',  lineHeight: '1.45' },
	'chat-dashboard':  { fontFamily: 'sans', fontSize: '0.875rem', fontWeight: '400', letterSpacing: '0em',     lineHeight: '1.5' },
	'chat-footer':     { fontFamily: 'sans', fontSize: '0.875rem', fontWeight: '400', letterSpacing: '0em',     lineHeight: '1.5' },
	'chat-frame':      { fontFamily: 'sans', fontSize: '0.875rem', fontWeight: '400', letterSpacing: '0em',     lineHeight: '1.5' },
	'chat-sidebar':    { fontFamily: 'sans', fontSize: '0.8125rem',fontWeight: '400', letterSpacing: '0em',     lineHeight: '1.45' },
	'chat-topbar':     { fontFamily: 'sans', fontSize: '0.875rem', fontWeight: '500', letterSpacing: '0em',     lineHeight: '1.4' },

	// Calendar
	'calendar':        { fontFamily: 'sans', fontSize: '0.75rem',  fontWeight: '400', letterSpacing: '0em',     lineHeight: '1.3' },
	'range-calendar':  { fontFamily: 'sans', fontSize: '0.75rem',  fontWeight: '400', letterSpacing: '0em',     lineHeight: '1.3' },

	// Dynamic backgrounds
	'dynamic-background': { fontFamily: 'inherit', fontSize: 'inherit', fontWeight: 'inherit', letterSpacing: 'inherit', lineHeight: 'inherit' },
};

/** Fallback for any component type not in the map */
const DEFAULT_TYPOGRAPHY = {
	fontFamily: 'sans', fontSize: '0.875rem', fontWeight: '400',
	letterSpacing: '0em', lineHeight: '1.5',
};

// ═══════════════════════════════════════════════════════════════
// MOTION DEFAULTS (same across all presets unless overridden)
// ═══════════════════════════════════════════════════════════════

const DEFAULT_MOTION = {
	animation: 'none',
	transitionDuration: '150ms',
	transitionTimingFunction: 'ease-out',
	gradient: 'none',
};

// ═══════════════════════════════════════════════════════════════
// ENRICHMENT
// ═══════════════════════════════════════════════════════════════

/**
 * Extract the component type from a preset key.
 * "button-primary" → "button"
 * "chat-bubble-glass" → "chat-bubble"
 * "dynamic-background-boot" → "dynamic-background"
 */
function extractComponentType(key) {
	// Known multi-word component types (order: longest first)
	const multiWord = [
		'dynamic-background', 'alert-dialog', 'avatar-group', 'chat-bubble',
		'chat-context-panel', 'chat-dashboard', 'chat-footer', 'chat-frame',
		'chat-sidebar', 'chat-topbar', 'color-area', 'color-field',
		'color-slider', 'color-swatch-picker', 'color-swatch', 'color-wheel',
		'contextual-help', 'data-table', 'date-field', 'date-picker',
		'date-range-picker', 'inline-alert', 'menu-trigger', 'number-field',
		'progress-bar', 'radio-group', 'range-calendar', 'range-slider',
		'search-field', 'status-dot', 'submenu-trigger', 'tag-group',
		'text-area', 'text-field', 'time-field', 'toggle-button',
	];

	for (const prefix of multiWord) {
		if (key.startsWith(prefix + '-')) return prefix;
	}

	// Single-word: everything before the last hyphen-separated variant
	const parts = key.split('-');
	if (parts.length >= 2) {
		return parts.slice(0, -1).join('-');
	}
	return key;
}

const AXES_TO_ADD = [
	'font-family', 'font-size', 'font-weight', 'letter-spacing', 'line-height',
	'animation', 'transition-duration', 'transition-timing-function', 'gradient',
];

let enrichedCount = 0;
let alreadyCompleteCount = 0;

// Walk top-level groups to find preset containers
function walkPresets(obj, parentPath = []) {
	for (const [key, val] of Object.entries(obj)) {
		if (key.startsWith('$')) continue;
		if (typeof val !== 'object' || val === null) continue;

		const path = [...parentPath, key];

		// Is this a preset? Check if it has background-color or color sub-keys
		if (val['background-color'] || val['color'] || val['opacity']) {
			enrichPreset(val, path.join('-'));
		} else {
			// Recurse into groups
			walkPresets(val, path);
		}
	}
}

function enrichPreset(preset, presetKey) {
	const componentType = extractComponentType(presetKey);
	const typo = TYPOGRAPHY_MAP[componentType] || DEFAULT_TYPOGRAPHY;

	const existingAxes = Object.keys(preset).filter(k => !k.startsWith('$'));
	const missingAxes = AXES_TO_ADD.filter(a => !existingAxes.includes(a));

	if (missingAxes.length === 0) {
		alreadyCompleteCount++;
		return;
	}

	// Resolve font family: name → stack string
	function resolveFamily(familyKey) {
		if (familyKey === 'inherit') return 'inherit';
		return fontStacks[familyKey] || fontStacks.sans;
	}

	const values = {
		'font-family':                { $value: resolveFamily(typo.fontFamily), $type: 'fontFamily' },
		'font-size':                  { $value: typo.fontSize,                 $type: 'dimension' },
		'font-weight':                { $value: typo.fontWeight,               $type: 'number' },
		'letter-spacing':             { $value: typo.letterSpacing,            $type: 'dimension' },
		'line-height':                { $value: typo.lineHeight,               $type: 'number' },
		'animation':                  { $value: DEFAULT_MOTION.animation },
		'transition-duration':        { $value: DEFAULT_MOTION.transitionDuration, $type: 'duration' },
		'transition-timing-function': { $value: DEFAULT_MOTION.transitionTimingFunction },
		'gradient':                   { $value: DEFAULT_MOTION.gradient },
	};

	for (const axis of missingAxes) {
		preset[axis] = values[axis];
	}

	enrichedCount++;
}

// Start enrichment — skip the top-level "style" namespace wrapper
if (presets.style) {
	for (const [key, preset] of Object.entries(presets.style)) {
		if (key.startsWith('$') || typeof preset !== 'object' || preset === null) continue;
		if (preset['background-color'] || preset['color'] || preset['opacity']) {
			enrichPreset(preset, key);
		}
	}
} else {
	walkPresets(presets);
}

// Write back
const output = JSON.stringify(presets, null, '\t');
writeFileSync(PRESETS_PATH, output + '\n', 'utf-8');

console.log(`✓ Enriched ${enrichedCount} presets with missing StyleMacro axes`);
console.log(`  ${alreadyCompleteCount} presets were already complete`);
console.log(`  Axes added: ${AXES_TO_ADD.join(', ')}`);
console.log(`  Written to: ${PRESETS_PATH}`);
