/**
 * @file src/lib/design/recipes/actions/index.ts
 * @layer recipes
 * @description Action registry for recipe-required Svelte actions (SSOT)
 * @since 1.0.0
 */

// Re-export behavior types and configs
export * from "./types";

// ===========================================
// ACTION TYPES
// ===========================================

export type ActionCleanup = { destroy(): void; update?: (next: unknown) => void };

export type ActionFactory<P = unknown> = (node: HTMLElement, params?: P) => ActionCleanup;

// ===========================================
// ACTION IMPLEMENTATIONS
// ===========================================

const glowTrack: ActionFactory = (node) => {
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

const ripple: ActionFactory = (node) => {
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

const tilt: ActionFactory<{ maxAngle?: number; scale?: number }> = (node, params = {}) => {
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

const focusTrap: ActionFactory = (node) => {
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

const clickOutside: ActionFactory<{ onClickOutside: () => void }> = (node, params) => {
  const handleClick = (e: MouseEvent) => {
    if (!node.contains(e.target as Node)) {
      params?.onClickOutside?.();
    }
  };

  document.addEventListener("click", handleClick, true);

  return {
    destroy() {
      document.removeEventListener("click", handleClick, true);
    },
  };
};

const hoverIntent: ActionFactory<{ delay?: number; onIntent: () => void; onLeave?: () => void }> = (
  node,
  params = { onIntent: () => {} }
) => {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  const delay = params.delay ?? 100;

  const handleMouseEnter = () => {
    timeout = setTimeout(() => {
      params.onIntent();
    }, delay);
  };

  const handleMouseLeave = () => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
    params.onLeave?.();
  };

  node.addEventListener("mouseenter", handleMouseEnter);
  node.addEventListener("mouseleave", handleMouseLeave);

  return {
    destroy() {
      if (timeout) clearTimeout(timeout);
      node.removeEventListener("mouseenter", handleMouseEnter);
      node.removeEventListener("mouseleave", handleMouseLeave);
    },
  };
};

const pressFeedback: ActionFactory<{ scale?: number; duration?: number }> = (node, params = {}) => {
  const scale = params.scale ?? 0.97;
  const duration = params.duration ?? 100;

  const handleMouseDown = () => {
    node.style.transition = `transform ${duration}ms ease-out`;
    node.style.transform = `scale(${scale})`;
  };

  const handleMouseUp = () => {
    node.style.transform = "";
  };

  node.addEventListener("mousedown", handleMouseDown);
  node.addEventListener("mouseup", handleMouseUp);
  node.addEventListener("mouseleave", handleMouseUp);

  return {
    destroy() {
      node.removeEventListener("mousedown", handleMouseDown);
      node.removeEventListener("mouseup", handleMouseUp);
      node.removeEventListener("mouseleave", handleMouseUp);
    },
  };
};

// ===========================================
// ACTION REGISTRY (SSOT)
// ===========================================

/** SSOT: all actions live here */
export const actionRegistry = {
  glowTrack: { create: glowTrack },
  ripple: { create: ripple },
  tilt: { create: tilt },
  focusTrap: { create: focusTrap },
  clickOutside: { create: clickOutside },
  hoverIntent: { create: hoverIntent },
  pressFeedback: { create: pressFeedback },
} as const;

/** Derived union = no drift */
export type ActionId = keyof typeof actionRegistry;

// ===========================================
// RUNTIME HELPERS
// ===========================================

/** Get action by ID */
export function getAction(id: ActionId) {
  return actionRegistry[id];
}

/** Apply all actions required by a recipe */
export function applyRecipeActions(
  node: HTMLElement,
  requires: readonly ActionId[]
): ActionCleanup {
  const cleanups: (() => void)[] = [];

  for (const actionId of requires) {
    const action = actionRegistry[actionId];
    if (action) {
      const result = action.create(node);
      cleanups.push(result.destroy);
    }
  }

  return {
    destroy() {
      cleanups.forEach((fn) => fn());
    },
  };
}
