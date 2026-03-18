/**
 * @file VPB Visual State — Reactive ColdLight Resolution Bridge
 * @layer vpb
 * @package @devpulse/sys
 *
 * Bridges VPB document nodes to the resolveVisual() pipeline.
 * When the user selects a node, this loads its ColdLight props.
 * When controls change, this produces live ResolvedVisual output.
 * Changes flow back to vpbDocument.updateNodeProps().
 */

import {
	getPresetsForKind,
	getPresetValues,
	type PresetDefinition,
} from "$lib/design/registry/presets.js";
import {
	type ColdLightProps,
	type ResolvedVisual,
	resolveVisual,
} from "$lib/design/registry/resolve-visual.js";
import { CODE_TO_NAME, TOKEN_CATEGORY_REGISTRY } from "$lib/design/registry/token-categories.js";

// ═══════════════════════════════════════════════════════════════
// LEGACY MIGRATION — numeric indices → semantic IDs
// ═══════════════════════════════════════════════════════════════

/**
 * Convert legacy numeric DsSurfaceProps to ColdLightProps.
 * Old nodes may store { s: 0, z: 1, d: 2 } — translate to semantic IDs.
 */
function migrateNumericProps(raw: Record<string, unknown>): ColdLightProps {
	const props: ColdLightProps = {};
	for (const cat of TOKEN_CATEGORY_REGISTRY) {
		const code = cat.code;
		const name = CODE_TO_NAME[code] as keyof ColdLightProps;

		// Check for semantic ID first (new format)
		if (typeof raw[name] === "string") {
			(props as Record<string, unknown>)[name] = raw[name];
		}
		// Check for numeric index (legacy format)
		else if (typeof raw[code] === "number") {
			const idx = raw[code] as number;
			const value = cat.values[idx];
			if (value) {
				(props as Record<string, unknown>)[name] = value.id;
			}
		}
	}

	// Passthrough non-category props
	if (typeof raw.preset === "string") props.preset = raw.preset;
	if (typeof raw.encoding === "string") props.encoding = raw.encoding;
	if (typeof raw.radius === "string") props.radius = raw.radius as ColdLightProps["radius"];
	if (typeof raw.size === "string") props.size = raw.size as ColdLightProps["size"];

	return props;
}

// ═══════════════════════════════════════════════════════════════
// VPB VISUAL STATE
// ═══════════════════════════════════════════════════════════════

class VpbVisualState {
	/** Current ColdLight props being edited */
	props = $state<ColdLightProps>({});

	/** Kind of the selected component (for preset filtering) */
	kind = $state<string>("");

	/** Active preset ID (if selected via preset picker) */
	activePresetId = $state<string | null>(null);

	/** Live resolved visual output — recalculated on every prop change */
	get resolved(): ResolvedVisual {
		return resolveVisual(this.props);
	}

	/** Available presets for the current kind */
	get availablePresets(): PresetDefinition[] {
		if (!this.kind) return [];
		return getPresetsForKind(this.kind);
	}

	/** Current encoding string */
	get encoding(): string {
		return this.resolved.encoding || "(all defaults)";
	}

	/** Current segments string */
	get segments(): string {
		return this.resolved.segments || "(no segments)";
	}

	/** Current CSS properties */
	get cssProperties(): Record<string, string> {
		return this.resolved.cssProperties;
	}

	// ─── Mutations ───────────────────────────────────────────

	/**
	 * Update a single ColdLight prop (semantic field name + semantic ID value).
	 * E.g., setProp("surface", "glass-deep")
	 */
	setProp(key: string, value: string): void {
		this.props = { ...this.props, [key]: value };
		this.activePresetId = null; // Clear preset selection on manual change
	}

	/**
	 * Apply a named preset — sets the preset prop.
	 * Individual prop overrides are preserved.
	 */
	applyPreset(presetId: string): void {
		const values = getPresetValues(presetId);
		if (!values) return;
		// Merge preset values as individual props (not just preset name)
		// so the controls show the resolved values
		const newProps: ColdLightProps = {
			preset: presetId,
			radius: this.props.radius,
			size: this.props.size,
		};
		this.props = newProps;
		this.activePresetId = presetId;
	}

	/** Reset all visual props to defaults */
	reset(): void {
		this.props = {};
		this.activePresetId = null;
	}

	/**
	 * Load from a BlockNode's raw props.
	 * Handles both legacy numeric and new semantic formats.
	 */
	loadFromNode(kind: string, nodeProps: Record<string, unknown>): void {
		this.kind = kind;
		this.props = migrateNumericProps(nodeProps);
		this.activePresetId = (nodeProps.preset as string) ?? null;
	}

	/**
	 * Export current state as node props for vpbDocument.
	 * Only includes non-undefined values.
	 */
	toNodeProps(): Record<string, unknown> {
		const out: Record<string, unknown> = {};
		for (const [key, value] of Object.entries(this.props)) {
			if (value !== undefined) {
				out[key] = value;
			}
		}
		return out;
	}
}

export const vpbVisual = new VpbVisualState();
