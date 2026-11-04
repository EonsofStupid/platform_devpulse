import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { PanelPrimitiveProps } from "#coldlight/primitives/panel/types.js";
import type { SurfaceFamily } from "#coldlight/renderforge/generated/surfaces.js";
import type { PanelTone, PanelVariant } from "./panel.generated.js";

export type { PanelTone, PanelVariant } from "./panel.generated.js";

export type PanelPadding = "none" | "sm" | "md" | "lg";

export interface PanelProps extends PanelPrimitiveProps {
	/** Glass or matte fill, from panel.tokens.json. Default: "void" */
	variant?: PanelVariant;
	/** Outer glow colour; none by default */
	glow?: PanelTone;
	/** Family for what the panel holds; unset, it takes the family in scope. */
	surface?: SurfaceFamily;
	/** Padding of the header, body and footer */
	padding?: PanelPadding;
}

export interface PanelHeaderProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
	children?: Snippet;
	class?: string;
}

export interface PanelBodyProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
	children?: Snippet;
	class?: string;
}

export interface PanelFooterProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
	children?: Snippet;
	class?: string;
}
