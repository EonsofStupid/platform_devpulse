/**
 * @file Recipe Utilities
 * @description Shared helpers for recipe class computation.
 */

import type { RadiusToken, DepthToken, SizeToken } from "$lib/design/tokens/types.js";

const RADIUS_MAP: Record<RadiusToken, string> = {
  none: "rounded-none",
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  xl: "rounded-xl",
  full: "rounded-full",
};

const DEPTH_MAP: Record<DepthToken, string> = {
  0: "",
  1: "shadow-sm",
  2: "shadow-md",
  3: "shadow-lg",
  4: "shadow-xl",
};

const SIZE_MAP: Record<SizeToken, string> = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg",
};

export function radiusClass(radius: RadiusToken): string {
  return RADIUS_MAP[radius];
}

export function depthClass(depth: DepthToken): string {
  return DEPTH_MAP[depth];
}

export function sizeClass(size: SizeToken): string {
  return SIZE_MAP[size];
}
