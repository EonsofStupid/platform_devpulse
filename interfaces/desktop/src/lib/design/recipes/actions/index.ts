/**
 * @fileoverview Recipe Actions Registry
 * @file src/lib/design/recipes/actions/index.ts
 * @module @devpulse/design/recipes/actions
 * @layer recipes
 *
 * @description
 * Svelte actions for recipe effects. Actions are declared in recipe.requires
 * and auto-attached by renderers.
 *
 * @since 1.0.0
 */

import type { Action } from "svelte/action";
import type { RecipeDefinition } from "../index";

// ===========================================
// ACTION TYPES
// ===========================================

export type ActionId = "glowTrack" | "ripple" | "tilt" | "focusTrap";

export interface ActionResult {
  destroy?: () => void;
  update?: (params: unknown) => void;
}

// ===========================================
// GLOW TRACK ACTION
// ===========================================

/**
 * Tracks mouse position and updates CSS custom properties for glow effects.
 */
export const glowTrack: Action<HTMLElement, void> = (node) => {
  const handleMouseMove = (e: MouseEvent) => {
    const rect = node.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    node.style.setProperty("--glow-x", `${x}%`);
    node.style.setProperty("--glow-y", `${y}%`);
  };

  const handleMouseLeave = () => {
    node.style.setProperty("--glow-x", "50%");
    node.style.setProperty("--glow-y", "50%");
  };

  node.addEventListener("mousemove", handleMouseMove);
  node.addEventListener("mouseleave", handleMouseLeave);

  return {
    destroy() {
      node.removeEventListener("mousemove", handleMouseMove);
      node.removeEventListener("mouseleave", handleMouseLeave);
    },
  };
};

// ===========================================
// RIPPLE ACTION
// ===========================================

/**
 * Creates ripple effect on click.
 */
export const ripple: Action<HTMLElement, void> = (node) => {
  const handleClick = (e: MouseEvent) => {
    const rect = node.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const rippleEl = document.createElement("span");
    rippleEl.className = "ripple-effect";
    rippleEl.style.cssText = `
      position: absolute;
      left: ${x}px;
      top: ${y}px;
      transform: translate(-50%, -50%) scale(0);
      width: 100px;
      height: 100px;
      border-radius: 50%;
      background: oklch(100% 0 0 / 0.2);
      pointer-events: none;
      animation: ripple-expand 0.6s ease-out forwards;
    `;

    node.style.position = "relative";
    node.style.overflow = "hidden";
    node.appendChild(rippleEl);

    setTimeout(() => rippleEl.remove(), 600);
  };

  node.addEventListener("click", handleClick);

  return {
    destroy() {
      node.removeEventListener("click", handleClick);
    },
  };
};

// ===========================================
// TILT ACTION
// ===========================================

/**
 * 3D tilt effect on hover.
 */
export const tilt: Action<HTMLElement, { maxAngle?: number; scale?: number }> = (
  node,
  params = {}
) => {
  const maxAngle = params.maxAngle ?? 5;
  const scale = params.scale ?? 1.02;

  const handleMouseMove = (e: MouseEvent) => {
    const rect = node.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;

    node.style.transform = `
      perspective(1000px)
      rotateY(${x * maxAngle}deg)
      rotateX(${-y * maxAngle}deg)
      scale(${scale})
    `;
  };

  const handleMouseLeave = () => {
    node.style.transform = "";
  };

  node.addEventListener("mousemove", handleMouseMove);
  node.addEventListener("mouseleave", handleMouseLeave);

  return {
    destroy() {
      node.removeEventListener("mousemove", handleMouseMove);
      node.removeEventListener("mouseleave", handleMouseLeave);
    },
  };
};

// ===========================================
// FOCUS TRAP ACTION
// ===========================================

/**
 * Traps keyboard focus within element.
 */
export const focusTrap: Action<HTMLElement, void> = (node) => {
  const focusableSelector =
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key !== "Tab") return;

    const focusables = node.querySelectorAll<HTMLElement>(focusableSelector);
    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last?.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first?.focus();
    }
  };

  node.addEventListener("keydown", handleKeyDown);

  return {
    destroy() {
      node.removeEventListener("keydown", handleKeyDown);
    },
  };
};

// ===========================================
// ACTION REGISTRY
// ===========================================

export const actionRegistry = {
  glowTrack,
  ripple,
  tilt,
  focusTrap,
} as const;

// ===========================================
// RECIPE ACTION COMPOSER
// ===========================================

/**
 * Svelte action that auto-attaches all actions declared in recipe.requires.
 * Use: <div use:applyRecipeActions={recipe}>
 */
export const applyRecipeActions: Action<HTMLElement, RecipeDefinition> = (
  node,
  recipe
) => {
  const cleanups: (() => void)[] = [];

  const attach = (r: RecipeDefinition) => {
    // Clean up previous
    cleanups.forEach((fn) => fn());
    cleanups.length = 0;

    // Attach new
    for (const actionId of r.requires ?? []) {
      const action = actionRegistry[actionId as keyof typeof actionRegistry];
      if (action) {
        const result = action(node);
        if (result?.destroy) {
          cleanups.push(result.destroy);
        }
      }
    }
  };

  attach(recipe);

  return {
    update(newRecipe: RecipeDefinition) {
      attach(newRecipe);
    },
    destroy() {
      cleanups.forEach((fn) => fn());
    },
  };
};
