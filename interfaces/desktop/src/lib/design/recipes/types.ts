/**
 * @file Recipe Types
 * @description Surface props and recipe definition for ColdLight styling.
 */

import type {
  AccentToken,
  SurfaceToken,
  GlassVariantToken,
  SizeToken,
  RadiusToken,
  DepthToken,
  GlowToken,
  BevelToken,
} from "$lib/design/tokens/types.js";

/** Surface props that recipes consume to compute per-slot classes */
export interface DsSurfaceProps {
  accent: AccentToken;
  surface: SurfaceToken;
  variant?: GlassVariantToken;
  size: SizeToken;
  radius: RadiusToken;
  depth: DepthToken;
  glow: GlowToken;
  bevel: BevelToken;
}

/** A recipe: props in, per-slot CSS class strings out */
export interface RecipeDefinition {
  id: string;
  kind: string;
  label: string;
  defaults: Partial<DsSurfaceProps>;
  classes: (props: DsSurfaceProps) => Record<string, string>;
}
