/**
 * @fileoverview Blocks - VPB Compositions & Inspector Controls
 * @file src/lib/design/blocks/index.ts
 * @module @devpulse/design/blocks
 * @layer blocks
 *
 * @description
 * TIER 8: VPB block definitions, compositions, inspector controls.
 * Blocks are validated on load, not on every render.
 *
 * @since 1.0.0
 */

import { z } from "zod";
import {
  SurfaceSchema,
  ToneSchema,
  GlowSchema,
  RadiusSchema,
  AccentSchema,
  SpaceSchema,
} from "../tokens/schema";

// ===========================================
// BLOCK SCHEMA
// ===========================================

/**
 * Schema for a VPB block definition
 */
export const BlockSchema = z.object({
  id: z.string(),
  type: z.string(),
  props: z.object({
    surface: SurfaceSchema.optional(),
    tone: ToneSchema.optional(),
    glow: GlowSchema.optional(),
    radius: RadiusSchema.optional(),
    accent: AccentSchema.optional(),
    padding: SpaceSchema.optional(),
    gap: SpaceSchema.optional(),
  }).passthrough(), // Allow additional props
  children: z.array(z.lazy(() => BlockSchema)).optional(),
});

export type Block = z.infer<typeof BlockSchema>;

// ===========================================
// LAYOUT SCHEMA
// ===========================================

/**
 * Schema for a saved VPB layout
 */
export const LayoutSchema = z.object({
  version: z.string(),
  name: z.string(),
  root: BlockSchema,
  metadata: z.object({
    createdAt: z.string(),
    updatedAt: z.string(),
    author: z.string().optional(),
  }).optional(),
});

export type Layout = z.infer<typeof LayoutSchema>;

// ===========================================
// VALIDATION AT BOUNDARIES
// ===========================================

/**
 * Validate a layout when loading from disk/API
 * This is the BOUNDARY validation - not called on every render
 */
export function validateLayout(input: unknown): Layout {
  return LayoutSchema.parse(input);
}

/**
 * Safe parse for graceful error handling
 */
export function safeParseLayout(input: unknown) {
  return LayoutSchema.safeParse(input);
}

// ===========================================
// INSPECTOR CONTROL DEFINITIONS
// ===========================================

/**
 * Define what controls appear in VPB inspector for each prop type
 */
export const InspectorControls = {
  surface: {
    type: "dropdown",
    label: "Surface",
    options: ["glass", "solid", "matte", "slime"],
  },
  tone: {
    type: "dropdown",
    label: "Tone",
    options: ["cold", "neutral", "warm"],
  },
  glow: {
    type: "dropdown",
    label: "Glow",
    options: ["off", "soft", "hard"],
  },
  radius: {
    type: "slider",
    label: "Radius",
    steps: ["r0", "r1", "r2", "r3", "r4"],
  },
  accent: {
    type: "color-picker",
    label: "Accent",
    options: ["teal", "purple", "neutral"],
  },
  padding: {
    type: "spacing",
    label: "Padding",
    options: ["s0", "s1", "s2", "s3", "s4", "s5", "s6", "s8"],
  },
} as const;
