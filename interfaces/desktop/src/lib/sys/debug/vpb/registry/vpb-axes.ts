/**
 * @file VPB axes — a block node's eight visual props, their options, their live effect
 * @layer vpb
 * @package @devpulse/sys
 *
 * A block node stores the eight visual props of `ComponentSurfaceProps`
 * (surface, depth, bevel, glow, frame, radius, motion, transition) plus a
 * `preset`. The options for each prop come from ColdLight's generated token
 * manifest — one or more token groups per prop — so nothing here lists a
 * token value. In the preview each prop overrides the canonical variable
 * `renderForge` emits for it (surface → background, depth/bevel/glow → one
 * composed shadow, frame → border, radius → radius, motion → animation,
 * transition → duration).
 *
 * Replaces the 8-axis encoding registry (`token-categories`, `resolve-visual`)
 * deleted in 0020c1f4.
 */

import type { BlockNode } from "@devpulse/coldlight/blocks";
import { cssVarString, type ResolvedMacro, renderForge } from "@devpulse/coldlight/renderforge";

/** The eight visual props a block node carries. */
export type AxisKey =
	| "surface"
	| "depth"
	| "bevel"
	| "glow"
	| "frame"
	| "radius"
	| "motion"
	| "transition";

/** How the Props tab edits an axis. */
export type AxisControlKind = "segmented" | "slider" | "swatch";

export interface VpbAxis {
	readonly key: AxisKey;
	readonly label: string;
	/** Token-manifest groups whose tokens are this prop's options. */
	readonly groups: readonly string[];
	/**
	 * Whether an option's id drops its group prefix (`depth-z2` → `z2`), as
	 * the prop's value type spells it. Surface spans two groups, so its ids
	 * keep the full token name (`glass-deep`, `matte-dark`).
	 */
	readonly stripGroup: boolean;
	readonly control: AxisControlKind;
}

export const VPB_AXES: readonly VpbAxis[] = [
	{
		key: "surface",
		label: "Surface",
		groups: ["glass", "matte"],
		stripGroup: false,
		control: "segmented",
	},
	{ key: "depth", label: "Depth", groups: ["depth"], stripGroup: true, control: "slider" },
	{ key: "bevel", label: "Bevel", groups: ["bevel"], stripGroup: true, control: "slider" },
	{ key: "glow", label: "Glow", groups: ["glow"], stripGroup: true, control: "swatch" },
	{ key: "frame", label: "Frame", groups: ["border"], stripGroup: true, control: "segmented" },
	{ key: "radius", label: "Radius", groups: ["radius"], stripGroup: true, control: "segmented" },
	{ key: "motion", label: "Motion", groups: ["animation"], stripGroup: true, control: "segmented" },
	{
		key: "transition",
		label: "Transition",
		groups: ["duration"],
		stripGroup: true,
		control: "slider",
	},
];

/** One option: the id stored on the node and the token variable behind it. */
export interface AxisOption {
	readonly id: string;
	readonly cssVar: string;
	/** The token's own value, for `var()` to fall back on (see `tokenRef`). */
	readonly fallback: string | null;
}

/** Everything the preview needs beyond the node itself. */
export interface AxisContext {
	readonly options: Readonly<Record<AxisKey, readonly AxisOption[]>>;
	/** The border width a frame draws with — the first `borderWidth` token, as a `var()`. */
	readonly frameWidth: string | null;
	/** The easing motion runs with — the `easing` group's `ease-in-out`, as a `var()`. */
	readonly motionEasing: string | null;
	/** `@keyframes` names the loaded stylesheets define. */
	readonly keyframes: ReadonlySet<string>;
}

/** The visual props the VPB edits: the eight axes plus `preset`. */
export type VpbProps = Partial<Record<AxisKey, string>> & { preset?: string };

interface ManifestToken {
	readonly name: string;
	readonly cssVar: string;
	readonly value: unknown;
}

type TokenManifest = Readonly<Record<string, { readonly tokens: readonly ManifestToken[] }>>;

const EMPTY_OPTIONS = Object.fromEntries(VPB_AXES.map((a) => [a.key, []])) as unknown as Record<
	AxisKey,
	readonly AxisOption[]
>;

/** A context with no options yet — the preview renders presets only. */
export const EMPTY_CONTEXT: AxisContext = {
	options: EMPTY_OPTIONS,
	frameWidth: null,
	motionEasing: null,
	keyframes: new Set(),
};

function groupTokens(manifest: TokenManifest, group: string): readonly ManifestToken[] {
	return manifest[group]?.tokens ?? [];
}

/** A token value as CSS, when it is a plain one (`4s`, `0.0625rem`, a string or number). */
function plainValue(value: unknown): string | null {
	if (typeof value === "string" || typeof value === "number") return String(value);
	if (value && typeof value === "object" && "value" in value && "unit" in value) {
		const v = value as { value: unknown; unit: unknown };
		if (typeof v.value === "number" && typeof v.unit === "string") return `${v.value}${v.unit}`;
	}
	return null;
}

/**
 * A `var()` for a token, falling back on the token's own value. Some token
 * groups (`animation`, `borderWidth`) are in the manifest but not emitted
 * as CSS variables, so the fallback is what makes them render.
 */
function tokenRef(token: Pick<AxisOption, "cssVar" | "fallback">): string {
	return token.fallback ? `var(${token.cssVar}, ${token.fallback})` : `var(${token.cssVar})`;
}

function optionOf(token: ManifestToken, id: string): AxisOption {
	return { id, cssVar: token.cssVar, fallback: plainValue(token.value) };
}

/** `@keyframes` names defined by the stylesheets the page has loaded. */
function loadedKeyframes(): Set<string> {
	const names = new Set<string>();
	for (const sheet of Array.from(document.styleSheets)) {
		let rules: CSSRuleList;
		try {
			rules = sheet.cssRules;
		} catch {
			// A cross-origin sheet hides its rules; it defines none of ours.
			continue;
		}
		for (const rule of Array.from(rules)) {
			if (rule instanceof CSSKeyframesRule) names.add(rule.name);
		}
	}
	return names;
}

/** Read the axis options from ColdLight's generated token manifest. */
export async function loadAxisContext(): Promise<AxisContext> {
	const manifest = (await import("@devpulse/coldlight/generated/token-manifest.json"))
		.default as unknown as TokenManifest;

	const keyframes = loadedKeyframes();
	const options = {} as Record<AxisKey, readonly AxisOption[]>;
	for (const axis of VPB_AXES) {
		options[axis.key] = axis.groups.flatMap((group) =>
			groupTokens(manifest, group).map((token) =>
				optionOf(token, axis.stripGroup ? token.name.replace(`${group}-`, "") : token.name),
			),
		);
	}
	// A motion token without a loaded keyframe would animate nothing.
	options.motion = options.motion.filter((o) => keyframeName(keyframes, o.id) !== null);

	const width = groupTokens(manifest, "borderWidth")[0];
	const easing = groupTokens(manifest, "easing").find((t) => t.name === "easing-ease-in-out");
	return {
		options,
		frameWidth: width ? tokenRef(optionOf(width, width.name)) : null,
		motionEasing: easing ? tokenRef(optionOf(easing, easing.name)) : null,
		keyframes,
	};
}

function optionVar(ctx: AxisContext, key: AxisKey, id: string | undefined): string | null {
	if (!id) return null;
	const option = ctx.options[key].find((o) => o.id === id);
	return option ? tokenRef(option) : null;
}

/** The keyframe an animation token drives: its own name, or ColdLight's `cl-` one. */
function keyframeName(keyframes: ReadonlySet<string>, id: string): string | null {
	if (keyframes.has(id)) return id;
	if (keyframes.has(`cl-${id}`)) return `cl-${id}`;
	return null;
}

/** The canonical variables a node's axis props override. */
export function axisOverrides(props: VpbProps, ctx: AxisContext): Record<string, string> {
	const out: Record<string, string> = {};

	const surface = optionVar(ctx, "surface", props.surface);
	if (surface) out["--background-color"] = surface;

	const shadows = [
		optionVar(ctx, "depth", props.depth),
		optionVar(ctx, "bevel", props.bevel),
		optionVar(ctx, "glow", props.glow),
	].filter((s): s is string => s !== null);
	if (shadows.length > 0) out["--box-shadow"] = shadows.join(", ");

	const frame = optionVar(ctx, "frame", props.frame);
	if (frame) {
		out["--border-color"] = frame;
		if (ctx.frameWidth) out["--border-width"] = ctx.frameWidth;
	}

	const radius = optionVar(ctx, "radius", props.radius);
	if (radius) out["--border-radius"] = radius;

	const motion = optionVar(ctx, "motion", props.motion);
	const keyframe = props.motion ? keyframeName(ctx.keyframes, props.motion) : null;
	if (motion && keyframe) {
		const easing = ctx.motionEasing ?? "ease-in-out";
		out["--animation"] = `${keyframe} ${motion} ${easing} infinite`;
	}

	const transition = optionVar(ctx, "transition", props.transition);
	if (transition) out["--transition-duration"] = transition;

	return out;
}

/** The preset a node renders with: its own, else its recipe's, else the kind default. */
export function nodePreset(node: Pick<BlockNode, "kind" | "recipe">, props: VpbProps): string {
	if (props.preset) return props.preset;
	return node.recipe === `${node.kind}-default` ? "default" : node.recipe;
}

/** A node's full visual: `renderForge` for its preset, its axis props on top. */
export interface NodeVisual {
	readonly preset: string;
	readonly macro: ResolvedMacro;
	readonly overrides: Record<string, string>;
	/** Data attributes for the preview element (families the overrides need added). */
	readonly dataAttrs: Record<string, string>;
	readonly style: string;
}

const SURFACE_VARS = ["--background-color", "--box-shadow", "--border-color"];
const FRAME_VARS = ["--border-width", "--border-radius"];

export function resolveNode(
	node: Pick<BlockNode, "kind" | "recipe">,
	props: VpbProps,
	ctx: AxisContext,
): NodeVisual {
	const preset = nodePreset(node, props);
	const macro = renderForge({ kind: node.kind, preset });
	const overrides = axisOverrides(props, ctx);
	const dataAttrs: Record<string, string> = { ...macro.dataAttrs };
	if (SURFACE_VARS.some((v) => v in overrides)) dataAttrs["data-cl-surface"] = "";
	if (FRAME_VARS.some((v) => v in overrides)) dataAttrs["data-cl-frame"] = "";
	return {
		preset,
		macro,
		overrides,
		dataAttrs,
		style: cssVarString({ ...macro.cssVars, ...overrides }),
	};
}
