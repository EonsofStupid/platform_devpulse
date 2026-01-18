/**
 * @fileoverview Token Schema Validators
 * @file src/lib/design/tokens/schema.ts
 * @module @devpulse/design/tokens/schema
 * @layer tokens
 *
 * @description
 * Zod schemas for runtime validation of token inputs.
 * Use at BOUNDARIES (VPB load, API payloads, saved layouts).
 * Do NOT use in hot paths (every render, every hover).
 *
 * @since 1.0.0
 */

import { z } from "zod";
import {
  SurfaceTokens,
  ToneTokens,
  GlowTokens,
  RadiusTokens,
  AccentTokens,
  SpaceTokens,
  BlurTokens,
  DepthTokens,
  TextTokens,
} from "./types";

// ===========================================
// INDIVIDUAL TOKEN SCHEMAS
// ===========================================
export const SurfaceSchema = z.enum(SurfaceTokens);
export const ToneSchema = z.enum(ToneTokens);
export const GlowSchema = z.enum(GlowTokens);
export const RadiusSchema = z.enum(RadiusTokens);
export const AccentSchema = z.enum(AccentTokens);
export const SpaceSchema = z.enum(SpaceTokens);
export const BlurSchema = z.enum(BlurTokens);
export const DepthSchema = z.enum(DepthTokens);
export const TextSchema = z.enum(TextTokens);

// ===========================================
// COMPOSITE SCHEMAS (for component props)
// ===========================================

/**
 * Standard visual props for any surface-based component
 */
export const SurfacePropsSchema = z.object({
  surface: SurfaceSchema.optional().default("solid"),
  tone: ToneSchema.optional().default("cold"),
  glow: GlowSchema.optional().default("off"),
  radius: RadiusSchema.optional().default("r2"),
  accent: AccentSchema.optional().default("teal"),
});

/**
 * Layout props
 */
export const LayoutPropsSchema = z.object({
  padding: SpaceSchema.optional(),
  gap: SpaceSchema.optional(),
});

/**
 * Complete component props (union of all)
 */
export const ComponentPropsSchema = SurfacePropsSchema.merge(LayoutPropsSchema);

// ===========================================
// VALIDATION HELPERS
// ===========================================

/**
 * Validate props at boundary (VPB load, saved layout)
 * @throws ZodError if invalid
 */
export function validateSurfaceProps(input: unknown) {
  return SurfacePropsSchema.parse(input);
}

/**
 * Safe parse - returns success/error instead of throwing
 */
export function safeParseSurfaceProps(input: unknown) {
  return SurfacePropsSchema.safeParse(input);
}
