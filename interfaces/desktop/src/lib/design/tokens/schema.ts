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
	AccentTokens,
	BevelTokens,
	BlurTokens,
	GlassVariantTokens,
	GlowTokens,
	ImprintTokens,
	PaddingTokens,
	RadiusTokens,
	ShellDepthTokens,
	SizeTokens,
	SurfaceTokens,
	ToneTokens,
} from "./types";

// Token Schemas
export const AccentSchema = z.enum(AccentTokens);
export const GlowSchema = z.enum(GlowTokens);
export const SurfaceSchema = z.enum(SurfaceTokens);
export const GlassVariantSchema = z.enum(GlassVariantTokens);
export const SizeSchema = z.enum(SizeTokens);
export const RadiusSchema = z.enum(RadiusTokens);
export const BlurSchema = z.enum(BlurTokens);
export const DepthSchema = z.union([
	z.literal(0),
	z.literal(1),
	z.literal(2),
	z.literal(3),
	z.literal(4),
]);
export const BevelSchema = z.enum(BevelTokens);
export const ImprintSchema = z.enum(ImprintTokens);
export const ShellDepthSchema = z.enum(ShellDepthTokens);
export const PaddingSchema = z.enum(PaddingTokens);
export const ToneSchema = z.enum(ToneTokens);

// Inferred types
export type AccentInput = z.infer<typeof AccentSchema>;
export type GlowInput = z.infer<typeof GlowSchema>;
export type SurfaceInput = z.infer<typeof SurfaceSchema>;
export type GlassVariantInput = z.infer<typeof GlassVariantSchema>;
export type SizeInput = z.infer<typeof SizeSchema>;
export type RadiusInput = z.infer<typeof RadiusSchema>;
export type BlurInput = z.infer<typeof BlurSchema>;
export type DepthInput = z.infer<typeof DepthSchema>;
export type BevelInput = z.infer<typeof BevelSchema>;
export type ImprintInput = z.infer<typeof ImprintSchema>;
export type ShellDepthInput = z.infer<typeof ShellDepthSchema>;
export type PaddingInput = z.infer<typeof PaddingSchema>;
export type ToneInput = z.infer<typeof ToneSchema>;

// Tier 2: Semantic tokens must reference Tier 1 values
export const SemanticTokenSchema = z.object({
	surface: z.record(z.string(), z.string()),
	border: z.record(z.string(), z.string()),
	depth: z.record(z.string(), z.string()),
	transition: z.record(z.string(), z.string()),
});

// Tier 3: Component tokens must reference Tier 1 or Tier 2
export const ComponentTokenSchema = z.record(
	z.string(),
	z.record(
		z.string(),
		z.string().startsWith("var(--", { message: "Tier 3 values must be var() references" }),
	),
);
