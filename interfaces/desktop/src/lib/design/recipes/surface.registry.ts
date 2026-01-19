/**
 * @file src/lib/design/recipes/surface.registry.ts
 * @layer recipes
 * @description Surface registry - capabilities, controls, dependencies (SSOT)
 * @since 1.0.0
 */

import type { SurfaceToken, ToneToken, GlowToken, RadiusToken, BlurToken } from "../tokens/types";

// ===========================================
// REGISTRY TYPES
// ===========================================

export interface SurfaceCapabilities {
  supportsTone: boolean;
  supportsGlow: boolean;
  supportsBlur: boolean;
  supportsAccent: boolean;
}

export interface SurfaceAllowedControls {
  tone?: readonly ToneToken[];
  glow?: readonly GlowToken[];
  radius?: readonly RadiusToken[];
  blur?: readonly BlurToken[];
}

export interface SurfaceDependencies {
  tokens: readonly string[];
  motion: string | null;
  behaviors: string | null;
}

export interface SurfaceRegistryEntry {
  recipe: string | null;
  capabilities: SurfaceCapabilities;
  allowedComponents: readonly string[];
  allowedControls: SurfaceAllowedControls;
  dependencies: SurfaceDependencies;
}

// ===========================================
// SURFACE REGISTRY (SSOT)
// ===========================================

export const SurfaceRegistry = {
  glass: {
    recipe: "glass.surface.css",
    capabilities: {
      supportsTone: true,
      supportsGlow: true,
      supportsBlur: true,
      supportsAccent: true,
    },
    allowedComponents: ["Panel", "Card", "Modal", "Popover", "Drawer"],
    allowedControls: {
      tone: ["cold", "neutral", "warm"],
      glow: ["off", "soft", "hard"],
      radius: ["r1", "r2", "r3", "r4"],
      blur: ["b1", "b2", "b3"],
    },
    dependencies: {
      tokens: ["dp-glass-base", "dp-glass-tint-*", "dp-blur-*"],
      motion: null,
      behaviors: null,
    },
  },
  panels: {
    recipe: "panels.surface.css",
    capabilities: {
      supportsTone: true,
      supportsGlow: false,
      supportsBlur: false,
      supportsAccent: true,
    },
    allowedComponents: ["Panel", "Sidebar", "Drawer", "Frame"],
    allowedControls: {
      tone: ["cold", "neutral"],
      radius: ["r0", "r1", "r2"],
    },
    dependencies: {
      tokens: ["dp-matte-*", "dp-bevel-*", "dp-inset-*"],
      motion: null,
      behaviors: null,
    },
  },
  solid: {
    recipe: null,
    capabilities: {
      supportsTone: true,
      supportsGlow: false,
      supportsBlur: false,
      supportsAccent: true,
    },
    allowedComponents: ["*"],
    allowedControls: {
      tone: ["cold", "neutral", "warm"],
      radius: ["r0", "r1", "r2", "r3", "r4"],
    },
    dependencies: {
      tokens: ["dp-matte-*"],
      motion: null,
      behaviors: null,
    },
  },
  matte: {
    recipe: null,
    capabilities: {
      supportsTone: true,
      supportsGlow: false,
      supportsBlur: false,
      supportsAccent: false,
    },
    allowedComponents: ["*"],
    allowedControls: {
      tone: ["cold", "neutral"],
      radius: ["r0", "r1", "r2"],
    },
    dependencies: {
      tokens: ["dp-matte-*", "dp-inset-*"],
      motion: null,
      behaviors: null,
    },
  },
} as const satisfies Record<string, SurfaceRegistryEntry>;

export type SurfaceId = keyof typeof SurfaceRegistry;

// ===========================================
// REGISTRY ACCESS HELPERS
// ===========================================

export function isSurfaceAllowed(surface: SurfaceToken, componentName: string): boolean {
  const entry = SurfaceRegistry[surface as SurfaceId];
  if (!entry) return false;
  if (entry.allowedComponents.includes("*")) return true;
  return entry.allowedComponents.includes(componentName);
}

export function getAllowedControls(surface: SurfaceToken): SurfaceAllowedControls {
  const entry = SurfaceRegistry[surface as SurfaceId];
  return entry?.allowedControls ?? {};
}

export function hasCapability(
  surface: SurfaceToken,
  capability: keyof SurfaceCapabilities
): boolean {
  const entry = SurfaceRegistry[surface as SurfaceId];
  return entry?.capabilities[capability] ?? false;
}
