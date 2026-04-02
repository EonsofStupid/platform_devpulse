/**
 * @file Visual Axes — the 11 DTCG-typed styling dimensions + image layer
 * @package @devpulse/coldlight
 *
 * Every axis maps to a real DTCG $type. No invented types.
 * SD5 expands composites. renderForge assembles canonical vars.
 * VPB reads these to generate per-axis controls (color picker, slider, etc.).
 */

/** The 11 visual axes + background image */
export type VisualAxis =
	| "backgroundColor"
	| "backgroundBlur"
	| "shadow"
	| "border"
	| "animation"
	| "transition"
	| "typography"
	| "gradient"
	| "color"
	| "borderRadius"
	| "opacity"
	| "backgroundImage";

/** Runtime array for VPB axis enumeration */
export const VISUAL_AXES: readonly VisualAxis[] = [
	"backgroundColor",
	"backgroundBlur",
	"shadow",
	"border",
	"animation",
	"transition",
	"typography",
	"gradient",
	"color",
	"borderRadius",
	"opacity",
	"backgroundImage",
] as const;

/** DTCG $type for each axis — what SD5 expects */
export const AXIS_DTCG_TYPE: Record<VisualAxis, string> = {
	backgroundColor: "color",
	backgroundBlur: "dimension",
	shadow: "shadow",
	border: "border",
	animation: "duration",
	transition: "transition",
	typography: "typography",
	gradient: "gradient",
	color: "color",
	borderRadius: "dimension",
	opacity: "number",
	backgroundImage: "string",
} as const;

/** VPB control type for each axis */
export type AxisControl =
	| "color-picker"
	| "dimension-slider"
	| "shadow-editor"
	| "border-editor"
	| "duration-slider"
	| "transition-editor"
	| "typography-editor"
	| "gradient-editor"
	| "number-slider"
	| "image-picker";

/** Maps each axis to its VPB control type */
export const AXIS_CONTROLS: Record<VisualAxis, AxisControl> = {
	backgroundColor: "color-picker",
	backgroundBlur: "dimension-slider",
	shadow: "shadow-editor",
	border: "border-editor",
	animation: "duration-slider",
	transition: "transition-editor",
	typography: "typography-editor",
	gradient: "gradient-editor",
	color: "color-picker",
	borderRadius: "dimension-slider",
	opacity: "number-slider",
	backgroundImage: "image-picker",
} as const;

/** Human-readable axis labels for VPB */
export const AXIS_LABELS: Record<VisualAxis, string> = {
	backgroundColor: "Background Color",
	backgroundBlur: "Background Blur",
	shadow: "Shadow",
	border: "Border",
	animation: "Animation",
	transition: "Transition",
	typography: "Typography",
	gradient: "Gradient",
	color: "Text Color",
	borderRadius: "Border Radius",
	opacity: "Opacity",
	backgroundImage: "Background Image",
} as const;
