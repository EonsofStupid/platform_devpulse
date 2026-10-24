/**
 * @file VPB Visual State — Reactive ColdLight Resolution Bridge
 * @layer vpb
 * @package @devpulse/sys
 *
 * Bridges VPB document nodes to `renderForge` + the VPB axis registry.
 * When the user selects a node, this loads its visual props.
 * When controls change, this produces the live resolved output.
 * Changes flow back to vpbDocument.updateNodeProps().
 *
 * Refitted from the 8-axis `resolveVisual()` bridge (deleted in 0020c1f4):
 * presets come from ColdLight's preset library, axis options from its
 * token manifest.
 */

import type { BlockNode } from "@devpulse/coldlight/blocks";
import { ALL_PRESETS } from "@devpulse/coldlight/presets";
import {
	type AxisContext,
	EMPTY_CONTEXT,
	loadAxisContext,
	type NodeVisual,
	resolveNode,
	VPB_AXES,
	type VpbProps,
} from "../registry/vpb-axes.js";

/** A preset from ColdLight's library, typed from the library itself. */
export type LibraryPreset = (typeof ALL_PRESETS)[number];

const AXIS_KEYS = new Set<string>(VPB_AXES.map((a) => a.key));

/** Keep only the props a block node stores: the eight axes and `preset`. */
function toVpbProps(raw: BlockNode["props"]): VpbProps {
	const props: VpbProps = {};
	for (const [key, value] of Object.entries(raw)) {
		if (typeof value !== "string") continue;
		if (key === "preset" || AXIS_KEYS.has(key)) {
			(props as Record<string, string>)[key] = value;
		}
	}
	return props;
}

class VpbVisualState {
	/** Current visual props being edited */
	props = $state<VpbProps>({});

	/** Kind of the selected component */
	kind = $state<string>("");

	/** Recipe (base preset) of the selected component */
	recipe = $state<string>("");

	/** Active preset ID (if selected via preset picker) */
	activePresetId = $state<string | null>(null);

	/** Axis options + keyframes; empty until `init()` has read the token manifest. Raw: replaced whole, never mutated. */
	context = $state.raw<AxisContext>(EMPTY_CONTEXT);

	/** Why the axis options could not load, if they could not */
	contextError = $state<string | null>(null);

	/** Live resolved visual output — recalculated on every prop change */
	get resolved(): NodeVisual {
		return resolveNode({ kind: this.kind, recipe: this.recipe }, this.props, this.context);
	}

	/** Presets the picker offers — the whole library; every preset fits every kind */
	get availablePresets(): readonly LibraryPreset[] {
		return ALL_PRESETS;
	}

	/** The axis props currently set, as `axis=value` pairs */
	get encoding(): string {
		const set = VPB_AXES.filter((a) => this.props[a.key]).map(
			(a) => `${a.key}=${this.props[a.key]}`,
		);
		return set.length > 0 ? set.join(" ") : "(all defaults)";
	}

	/** Current CSS properties — the preset's canonical variables with overrides applied */
	get cssProperties(): Record<string, string> {
		const { macro, overrides } = this.resolved;
		return { ...macro.cssVars, ...overrides };
	}

	/** Read the axis options once per VPB session */
	async init(): Promise<void> {
		if (this.context !== EMPTY_CONTEXT) return;
		try {
			this.context = await loadAxisContext();
			this.contextError = null;
		} catch (e) {
			this.contextError = `Couldn't read the token manifest: ${(e as Error).message}`;
		}
	}

	// ─── Mutations ───────────────────────────────────────────

	/**
	 * Update a single visual prop (axis name + option id).
	 * E.g., setProp("surface", "glass-deep")
	 */
	setProp(key: string, value: string): void {
		this.props = { ...this.props, [key]: value };
		if (key !== "preset") this.activePresetId = null;
	}

	/**
	 * Apply a named preset — sets the preset prop.
	 * Radius is a structural choice and survives a preset change.
	 */
	applyPreset(presetId: string): void {
		this.props = { preset: presetId, radius: this.props.radius };
		this.activePresetId = presetId;
	}

	/** Reset all visual props to defaults */
	reset(): void {
		this.props = {};
		this.activePresetId = null;
	}

	/** Load from a BlockNode's kind, recipe and raw props. */
	loadFromNode(kind: string, recipe: string, nodeProps: BlockNode["props"]): void {
		this.kind = kind;
		this.recipe = recipe;
		// Read the preset from the incoming props, not `this.props`: callers run
		// this inside an effect, and reading state it writes would loop.
		const props = toVpbProps(nodeProps);
		this.props = props;
		this.activePresetId = props.preset ?? null;
	}

	/**
	 * Export current state as node props for vpbDocument.
	 * Only includes non-undefined values.
	 */
	toNodeProps(): VpbProps {
		const out: VpbProps = {};
		for (const [key, value] of Object.entries(this.props)) {
			if (value !== undefined) (out as Record<string, string>)[key] = value;
		}
		return out;
	}
}

export const vpbVisual = new VpbVisualState();
