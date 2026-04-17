/**
 * @file generate-style-presets.ts
 * @package @devpulse/coldlight
 *
 * Transforms typed PresetDefinition objects from visual/presets/
 * into DTCG JSON consumed by SD5.
 *
 * Architecture:
 *   SHARED presets: `preset.{family}-{variant}.{axis}` → `--preset-{family}-{variant}-{axis}`
 *   SHARED states:  `preset.{family}-{variant}-{state}.{axis}` → `--preset-{family}-{variant}-{state}-{axis}`
 *   PER-KIND overrides: `style.{kind}-{preset}.{axis}` → `--style-{kind}-{preset}-{axis}` (VPB custom only)
 *
 * Default: shared presets (1,332 vars). Per-kind overrides only when VPB saves custom values.
 * renderForge reads: var(--style-{kind}-{preset}-{axis}, var(--preset-{preset}-{axis}))
 *
 * Run: npx tsx scripts/build/styledictionary/generate-style-presets.ts
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

import { ALL_PRESETS } from "../../../src/lib/design/visual/presets/index.js";
import type { AnimationValue, BackgroundImageValue, PresetDefinition, ShadowLayer, StateOverrides } from "../../../src/lib/design/visual/preset-definition.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT = path.join(__dirname, "tokens", "src", "style-presets.json");

/** SD5 / VPB metadata — always emitted so coldlight-style-presets-v1 stays valid */
const DEFAULT_STYLE_PRESET_EXTENSIONS = {
	"com.coldlight": {
		semanticFamilies: ["surface", "elevation", "frame", "motion"],
		format: "coldlight-style-presets-v1",
		note: "Composite preset leaves — elevation uses DTCG shadow; surface uses color/dimension; keep render glue out of token values.",
	},
} as const;

function shadowToString(layers: readonly ShadowLayer[]): string {
	if (layers.length === 0) return "none";
	return layers
		.map((l) => {
			const inset = l.inset ? "inset " : "";
			return `${inset}${l.offsetX} ${l.offsetY} ${l.blur} ${l.spread} ${l.color}`;
		})
		.join(", ");
}

function animationToString(anim: AnimationValue | "none"): string {
	if (anim === "none") return "none";
	const fill = anim.fillMode ? ` ${anim.fillMode}` : "";
	return `${anim.name} ${anim.duration} ${anim.timingFunction} ${anim.iterationCount}${fill}`;
}

type TokenEntry = { $value: string; $type: string } | string;

function backgroundImageToString(bg: BackgroundImageValue | undefined): string {
	if (!bg) return "none";
	return bg.url;
}

function backgroundAlphaToString(bg: BackgroundImageValue | undefined): string {
	if (!bg) return "1";
	return String(bg.alpha);
}

function axesToTokenGroup(preset: PresetDefinition): Record<string, TokenEntry> {
	const { axes } = preset;
	return {
		"background-color": { $value: axes.backgroundColor, $type: "color" },
		"border-radius": { $value: axes.borderRadius, $type: "dimension" },
		"box-shadow": { $value: shadowToString(axes.shadow), $type: "shadow" },
		"color": { $value: axes.color, $type: "color" },
		"border-color": { $value: axes.border.color, $type: "color" },
		"border-width": { $value: axes.border.width, $type: "dimension" },
		"backdrop-filter": { $value: axes.backgroundBlur === "0" ? "none" : `blur(${axes.backgroundBlur})`, $type: "dimension" },
		"opacity": { $value: String(axes.opacity), $type: "number" },
		"animation": { $value: animationToString(axes.animation), $type: "string" },
		"transition-duration": { $value: axes.transition.duration, $type: "duration" },
		"transition-timing-function": { $value: axes.transition.timingFunction, $type: "cubicBezier" },
		"gradient": { $value: axes.gradient, $type: "gradient" },
		"font-family": { $value: axes.typography.fontFamily, $type: "fontFamily" },
		"font-size": { $value: axes.typography.fontSize, $type: "dimension" },
		"font-weight": { $value: String(axes.typography.fontWeight), $type: "fontWeight" },
		"letter-spacing": { $value: axes.typography.letterSpacing, $type: "dimension" },
		"line-height": { $value: String(axes.typography.lineHeight), $type: "number" },
		"background-image": { $value: backgroundImageToString(axes.backgroundImage), $type: "string" },
		"background-alpha": { $value: backgroundAlphaToString(axes.backgroundImage), $type: "number" },
		$description: `${preset.family}-${preset.variant}: ${preset.description}`,
	};
}

function stateToTokenGroup(state: StateOverrides, presetId: string, stateName: string): Record<string, TokenEntry> {
	const group: Record<string, TokenEntry> = {
		$description: `${presetId} ${stateName} overrides`,
	};
	if (state.backgroundColor) group["background-color"] = { $value: state.backgroundColor, $type: "color" };
	if (state.color) group["color"] = { $value: state.color, $type: "color" };
	if (state.opacity !== undefined) group["opacity"] = { $value: String(state.opacity), $type: "number" };
	if (state.gradient) group["gradient"] = { $value: state.gradient, $type: "gradient" };
	if (state.shadow) group["box-shadow"] = { $value: shadowToString(state.shadow), $type: "shadow" };
	if (state.border?.color) group["border-color"] = { $value: state.border.color, $type: "color" };
	if (state.border?.width) group["border-width"] = { $value: state.border.width, $type: "dimension" };
	if (state.animation !== undefined) group["animation"] = { $value: animationToString(state.animation), $type: "string" };
	if (state.backgroundImage) {
		group["background-image"] = { $value: backgroundImageToString(state.backgroundImage), $type: "string" };
		group["background-alpha"] = { $value: backgroundAlphaToString(state.backgroundImage), $type: "number" };
	}
	return group;
}

// ═══════════════════════════════════════════════════════════════
// GENERATE — SHARED presets (default for ALL kinds)
// ═══════════════════════════════════════════════════════════════

const preset: Record<string, Record<string, TokenEntry>> = {};
let stateCount = 0;

ALL_PRESETS.forEach((p) => {
	// Default state
	preset[p.id] = axesToTokenGroup(p);

	// State overrides
	if (p.states) {
		const states = p.states;
		if (states.hover) { preset[`${p.id}-hover`] = stateToTokenGroup(states.hover, p.id, "hover"); stateCount++; }
		if (states.active) { preset[`${p.id}-active`] = stateToTokenGroup(states.active, p.id, "active"); stateCount++; }
		if (states.focus) { preset[`${p.id}-focus`] = stateToTokenGroup(states.focus, p.id, "focus"); stateCount++; }
		if (states.disabled) { preset[`${p.id}-disabled`] = stateToTokenGroup(states.disabled, p.id, "disabled"); stateCount++; }
	}
});

	let extensions: Record<string, unknown> = JSON.parse(
		JSON.stringify(DEFAULT_STYLE_PRESET_EXTENSIONS),
	) as Record<string, unknown>;
	try {
		const existing = fs.readFileSync(OUTPUT, "utf-8");
		const parsed = JSON.parse(existing) as { $extensions?: Record<string, unknown> };
		if (parsed.$extensions) extensions = parsed.$extensions;
	} catch {
		// no prior file or invalid JSON — use DEFAULT_STYLE_PRESET_EXTENSIONS
	}

	const output: Record<string, unknown> = { $extensions: extensions, preset };

	fs.writeFileSync(OUTPUT, JSON.stringify(output, null, "\t") + "\n", "utf-8");

const presetCount = ALL_PRESETS.length;
const entryCount = Object.keys(preset).length;

console.log(`Generated ${entryCount} shared entries (${presetCount} presets + ${stateCount} state overrides) → ${OUTPUT}`);
console.log(`CSS vars: ~${entryCount * 19} (${entryCount} entries × 19 axes)`);
