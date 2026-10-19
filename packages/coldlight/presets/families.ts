/**
 * @file Preset Families — canonical preset taxonomy
 * @package @devpulse/coldlight
 *
 * Preset families are the top-level visual languages available to the
 * platform preset catalog.
 */

export type PresetFamily = "neuro" | "glass" | "retro" | "chrome" | "flat" | "stark";

export const PRESET_FAMILIES: readonly PresetFamily[] = [
	"neuro",
	"glass",
	"retro",
	"chrome",
	"flat",
	"stark",
] as const;

export const FAMILY_LABELS: Record<PresetFamily, string> = {
	neuro: "Neumorphic",
	glass: "Glass",
	retro: "Retro Pixel",
	chrome: "Chrome Metal",
	flat: "Flat Minimal",
	stark: "Stark Bold",
} as const;

export const FAMILY_DESCRIPTIONS: Record<PresetFamily, string> = {
	neuro: "Carved surfaces, inset shadows, neumorphic depth with highlight rims",
	glass: "Frosted glass panels, real backdrop blur, multi-layer opacity",
	retro: "Thick borders, stepped corners, bold saturated colors, CRT glow",
	chrome: "Liquid metal, specular highlights, mercury reflections, cool-toned",
	flat: "Zero depth, solid backgrounds, clean geometry, fastest rendering",
	stark: "Maximum contrast, bold shadows, thick borders, commanding presence",
} as const;
