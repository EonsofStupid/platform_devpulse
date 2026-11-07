/**
 * @file src/lib/design/taxonomy/contracts.ts
 * @layer taxonomy
 *
 * @description
 * Prop contracts for block kinds.
 * Every kind's props MUST extend DsSurfaceProps.
 *
 * @since 1.0.0
 */

import { z } from "zod";
import {
  SurfaceSchema,
  GlassVariantSchema,
  GlowSchema,
  RadiusSchema,
  AccentSchema,
  BevelSchema,
  DepthSchema,
  ImprintSchema,
  ShellDepthSchema,
  SizeSchema,
  PaddingSchema,
} from "../tokens/schema";

// ===========================================
// BASE SURFACE CONTRACT
// ===========================================

/**
 * Color configuration for surfaces.
 */
export const DsColorConfigSchema = z.object({
  mode: z.enum(["mono", "duo"]).default("mono"),
  a: AccentSchema.default("teal"),
  b: AccentSchema.optional(),
  blend: z.object({
    type: z.enum(["none", "dissipate"]).default("none"),
    direction: z.enum(["top", "bottom", "left", "right", "radial"]).default("bottom"),
    softness: z.enum(["sharp", "soft", "diffuse"]).default("soft"),
    bias: z.enum(["start", "center", "end"]).default("center"),
    strength: z.enum(["subtle", "medium", "strong"]).default("medium"),
  }).optional(),
});

/**
 * Surface finish configuration.
 */
export const DsSurfaceConfigSchema = z.object({
  finish: SurfaceSchema.default("glass"),
  texture: z.enum(["none", "noise", "grain", "scan"]).default("none"),
  clarity: GlassVariantSchema.default("deep"),
});

/**
 * Frame/border configuration.
 */
export const DsFrameConfigSchema = z.object({
  mode: z.enum(["none", "solid", "glow", "gradient"]).default("none"),
  width: z.enum(["thin", "medium", "thick"]).default("thin"),
  treatment: z.enum(["flat", "beveled", "rounded"]).default("flat"),
  glow: GlowSchema.default("off"),
});

/**
 * Depth configuration (bevel + shadow).
 */
export const DsDepthConfigSchema = z.object({
  intent: z.enum(["flat", "raised", "sunken", "floating"]).default("flat"),
  bevel: z.object({
    level: BevelSchema.default("off"),
    style: z.enum(["outset", "inset", "imprint"]).default("outset"),
  }).default({}),
});

/**
 * Effects configuration.
 */
export const DsFxConfigSchema = z.object({
  rimLight: z.enum(["off", "subtle", "medium", "strong"]).default("off"),
  innerGlow: z.enum(["off", "subtle", "medium", "strong"]).default("off"),
  sparkle: z.enum(["off", "subtle", "medium"]).default("off"),
  noiseOverlay: z.enum(["off", "subtle", "medium"]).default("off"),
}).optional();

/**
 * Motion/animation configuration.
 */
export const DsMotionConfigSchema = z.object({
  idle: z.enum(["none", "breathe", "pulse", "scan"]).default("none"),
  hover: z.enum(["none", "glow", "lift", "highlight"]).default("none"),
  press: z.enum(["none", "sink", "flash"]).default("none"),
  focus: z.enum(["none", "ring", "glow"]).default("none"),
}).optional();

/**
 * Base surface props - every surface-based kind extends this.
 */
export const DsSurfacePropsSchema = z.object({
  color: DsColorConfigSchema.default({}),
  surface: DsSurfaceConfigSchema.default({}),
  frame: DsFrameConfigSchema.default({}),
  depth: DsDepthConfigSchema.default({}),
  fx: DsFxConfigSchema,
  motion: DsMotionConfigSchema,
});

export type DsSurfaceProps = z.infer<typeof DsSurfacePropsSchema>;

// ===========================================
// KIND-SPECIFIC CONTRACTS
// ===========================================

/**
 * Panel props.
 */
export const PanelPropsSchema = DsSurfacePropsSchema.extend({
  panel: z.object({
    padding: PaddingSchema.default("md"),
    scrollable: z.boolean().default(false),
  }).default({}),
});

export type PanelProps = z.infer<typeof PanelPropsSchema>;

/**
 * Shell props.
 */
export const ShellPropsSchema = DsSurfacePropsSchema.extend({
  chrome: z.object({
    level: z.enum(["appShell", "panel", "overlay"]).default("appShell"),
    insetGrid: z.boolean().default(true),
    safeArea: z.boolean().default(true),
  }).default({}),
});

export type ShellProps = z.infer<typeof ShellPropsSchema>;

/**
 * Chat dock props.
 */
export const ChatDockPropsSchema = DsSurfacePropsSchema.extend({
  dock: z.object({
    side: z.enum(["left", "right", "floating"]).default("right"),
    state: z.enum(["open", "minimized", "closed"]).default("open"),
  }).default({}),
  header: z.object({
    mode: z.enum(["compact", "full"]).default("compact"),
  }).default({}),
  presence: z.enum(["offline", "active", "busy"]).default("active"),
});

export type ChatDockProps = z.infer<typeof ChatDockPropsSchema>;

/**
 * Widget props.
 */
export const WidgetPropsSchema = DsSurfacePropsSchema.extend({
  widget: z.object({
    type: z.enum(["chart", "stat", "list", "meter"]).default("stat"),
    title: z.string().default("Widget"),
    intent: z.enum(["neutral", "info", "warn", "critical"]).default("neutral"),
  }).default({}),
});

export type WidgetProps = z.infer<typeof WidgetPropsSchema>;

// ===========================================
// CONTRACT REGISTRY
// ===========================================

/**
 * Maps block kinds to their prop schemas.
 */
export const kindContracts = {
  // Shell kinds
  appShell: ShellPropsSchema,
  topBar: ShellPropsSchema,
  sideNav: ShellPropsSchema,
  statusBar: ShellPropsSchema,
  dock: ShellPropsSchema,

  // Surface kinds
  panel: PanelPropsSchema,
  card: PanelPropsSchema,
  modal: PanelPropsSchema,
  glassFrame: DsSurfacePropsSchema,
  inputFrame: DsSurfacePropsSchema,

  // Widget kinds
  widget: WidgetPropsSchema,
  statMeter: WidgetPropsSchema,
  chart: WidgetPropsSchema,

  // Chat kinds
  chatDock: ChatDockPropsSchema,
  chatThread: DsSurfacePropsSchema,
  chatBubble: DsSurfacePropsSchema,
} as const;

export type KindContract = keyof typeof kindContracts;

/**
 * Get the prop schema for a block kind.
 */
export function getKindSchema(kind: KindContract) {
  return kindContracts[kind];
}

/**
 * Validate props for a block kind.
 */
export function validateKindProps(kind: KindContract, props: unknown) {
  const schema = kindContracts[kind];
  return schema.safeParse(props);
}

/**
 * Get default props for a block kind.
 */
export function getDefaultProps(kind: KindContract): unknown {
  const schema = kindContracts[kind];
  return schema.parse({});
}
