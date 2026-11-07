/**
 * @file constraints.ts
 * @package @devpulse/coldlight
 *
 * ColdLight Constraint System
 *
 * Cross-validation between recipes, surfaces, primitives, and actions.
 * This is what makes ColdLight MORE sophisticated than copy-paste systems:
 * - Runtime validation of recipe + surface combinations
 * - Constraint conflict detection
 * - Action dependency resolution
 * - Slot compatibility checking
 *
 * @author Jesse "Hades" Hall <jessay@angryvibers.com>
 * @license MIT
 * @since 1.0.0
 */

import { FEATURES } from "./coldlight.config";
import { SURFACES, SURFACE_ROLES, type Surface, type SurfaceRole } from "./coldlight.config";

// ============================================
// CONSTRAINT TYPES
// ============================================

/**
 * Result of a constraint validation.
 */
export interface ConstraintResult {
  /** Whether the constraint is satisfied */
  valid: boolean;
  /** Error messages if invalid */
  errors: string[];
  /** Warning messages (valid but suboptimal) */
  warnings: string[];
}

/**
 * Surface + Recipe constraint.
 */
export interface SurfaceRecipeConstraint {
  /** Surface type */
  surface: Surface;
  /** Allowed recipes for this surface */
  allowedRecipes: string[];
  /** Forbidden recipes for this surface */
  forbiddenRecipes: string[];
}

/**
 * Recipe + Action constraint.
 */
export interface RecipeActionConstraint {
  /** Recipe ID */
  recipe: string;
  /** Required actions */
  requiredActions: string[];
  /** Optional actions */
  optionalActions: string[];
  /** Forbidden actions */
  forbiddenActions: string[];
}

/**
 * Primitive + Surface constraint.
 */
export interface PrimitiveSurfaceConstraint {
  /** Primitive ID */
  primitive: string;
  /** Allowed surfaces */
  allowedSurfaces: Surface[];
  /** Default surface */
  defaultSurface: Surface;
}

// ============================================
// SURFACE-RECIPE CONSTRAINTS
// ============================================

/**
 * Defines which recipes work with which surfaces.
 * This prevents invalid combinations at design time.
 */
export const SURFACE_RECIPE_CONSTRAINTS: SurfaceRecipeConstraint[] = [
  {
    surface: "glass",
    allowedRecipes: [
      "panel.glass.default",
      "panel.glass.glow",
      "button.glass.default",
      "button.glass.glow",
      "input.glass.default",
      "card.glass.default",
      "card.glass.glow",
      "modal.glass.default",
      "popover.glass.default",
    ],
    forbiddenRecipes: [
      "panel.matte.*",
      "panel.solid.*",
      "button.solid.*",
    ],
  },
  {
    surface: "matte",
    allowedRecipes: [
      "panel.matte.default",
      "panel.matte.raised",
      "button.matte.default",
      "input.matte.default",
      "card.matte.default",
    ],
    forbiddenRecipes: [
      "*.glass.*",
      "*.glow",
    ],
  },
  {
    surface: "solid",
    allowedRecipes: [
      "button.solid.primary",
      "button.solid.secondary",
      "button.solid.accent",
      "panel.solid.default",
    ],
    forbiddenRecipes: [
      "*.glass.*",
      "*.blur",
    ],
  },
];

// ============================================
// RECIPE-ACTION CONSTRAINTS
// ============================================

/**
 * Defines which actions are required/forbidden for recipes.
 */
export const RECIPE_ACTION_CONSTRAINTS: RecipeActionConstraint[] = [
  {
    recipe: "panel.glass.glow",
    requiredActions: ["glowTrack"],
    optionalActions: ["tilt"],
    forbiddenActions: [],
  },
  {
    recipe: "button.glass.glow",
    requiredActions: ["glowTrack", "ripple"],
    optionalActions: ["pressFeedback"],
    forbiddenActions: [],
  },
  {
    recipe: "button.solid.primary",
    requiredActions: ["ripple"],
    optionalActions: ["pressFeedback"],
    forbiddenActions: ["glowTrack"],
  },
  {
    recipe: "card.glass.glow",
    requiredActions: ["glowTrack"],
    optionalActions: ["tilt", "hoverIntent"],
    forbiddenActions: [],
  },
];

// ============================================
// PRIMITIVE-SURFACE CONSTRAINTS
// ============================================

/**
 * Defines which surfaces work with which primitives.
 */
export const PRIMITIVE_SURFACE_CONSTRAINTS: PrimitiveSurfaceConstraint[] = [
  {
    primitive: "button",
    allowedSurfaces: ["glass", "matte", "solid"],
    defaultSurface: "glass",
  },
  {
    primitive: "dialog",
    allowedSurfaces: ["glass", "matte"],
    defaultSurface: "glass",
  },
  {
    primitive: "sheet",
    allowedSurfaces: ["glass", "matte"],
    defaultSurface: "glass",
  },
  {
    primitive: "popover",
    allowedSurfaces: ["glass", "matte"],
    defaultSurface: "glass",
  },
  {
    primitive: "tooltip",
    allowedSurfaces: ["glass", "matte", "solid"],
    defaultSurface: "glass",
  },
  {
    primitive: "select",
    allowedSurfaces: ["glass", "matte"],
    defaultSurface: "glass",
  },
  {
    primitive: "card",
    allowedSurfaces: ["glass", "matte", "solid"],
    defaultSurface: "glass",
  },
  {
    primitive: "alert",
    allowedSurfaces: ["glass", "matte", "solid"],
    defaultSurface: "matte",
  },
  {
    primitive: "badge",
    allowedSurfaces: ["glass", "matte", "solid"],
    defaultSurface: "solid",
  },
];

// ============================================
// ROLE CONSTRAINTS
// ============================================

/**
 * Defines which surface roles can use which features.
 */
export const ROLE_FEATURE_CONSTRAINTS: Record<SurfaceRole, {
  canGlow: boolean;
  canBlur: boolean;
  canAnimate: boolean;
  maxBlurLevel: number;
}> = {
  button: {
    canGlow: true,
    canBlur: true,
    canAnimate: true,
    maxBlurLevel: 2,
  },
  input: {
    canGlow: true,
    canBlur: true,
    canAnimate: false,
    maxBlurLevel: 1,
  },
  panel: {
    canGlow: true,
    canBlur: true,
    canAnimate: true,
    maxBlurLevel: 3,
  },
  scrim: {
    canGlow: false,
    canBlur: true,
    canAnimate: true,
    maxBlurLevel: 3,
  },
  card: {
    canGlow: true,
    canBlur: true,
    canAnimate: true,
    maxBlurLevel: 2,
  },
  menu: {
    canGlow: false,
    canBlur: true,
    canAnimate: true,
    maxBlurLevel: 2,
  },
};

// ============================================
// VALIDATION FUNCTIONS
// ============================================

/**
 * Validate a surface + recipe combination.
 */
export function validateSurfaceRecipe(surface: Surface, recipe: string): ConstraintResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const constraint = SURFACE_RECIPE_CONSTRAINTS.find((c) => c.surface === surface);

  if (!constraint) {
    // No constraint = allowed by default
    return { valid: true, errors: [], warnings: [] };
  }

  // Check if recipe is explicitly allowed
  const isAllowed = constraint.allowedRecipes.some((pattern) => {
    if (pattern.includes("*")) {
      const regex = new RegExp("^" + pattern.replace(/\*/g, ".*") + "$");
      return regex.test(recipe);
    }
    return pattern === recipe;
  });

  // Check if recipe is explicitly forbidden
  const isForbidden = constraint.forbiddenRecipes.some((pattern) => {
    if (pattern.includes("*")) {
      const regex = new RegExp("^" + pattern.replace(/\*/g, ".*") + "$");
      return regex.test(recipe);
    }
    return pattern === recipe;
  });

  if (isForbidden) {
    errors.push(`Recipe "${recipe}" is forbidden for surface "${surface}"`);
  } else if (!isAllowed && constraint.allowedRecipes.length > 0) {
    warnings.push(`Recipe "${recipe}" is not in the allowed list for surface "${surface}"`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate a recipe + action combination.
 */
export function validateRecipeActions(recipe: string, actions: string[]): ConstraintResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const constraint = RECIPE_ACTION_CONSTRAINTS.find((c) => c.recipe === recipe);

  if (!constraint) {
    // No constraint = allowed by default
    return { valid: true, errors: [], warnings: [] };
  }

  // Check required actions
  for (const required of constraint.requiredActions) {
    if (!actions.includes(required)) {
      errors.push(`Recipe "${recipe}" requires action "${required}"`);
    }
  }

  // Check forbidden actions
  for (const action of actions) {
    if (constraint.forbiddenActions.includes(action)) {
      errors.push(`Action "${action}" is forbidden for recipe "${recipe}"`);
    }
  }

  // Check for unused optional actions
  for (const optional of constraint.optionalActions) {
    if (!actions.includes(optional)) {
      warnings.push(`Optional action "${optional}" not used for recipe "${recipe}"`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate a primitive + surface combination.
 */
export function validatePrimitiveSurface(primitive: string, surface: Surface): ConstraintResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const constraint = PRIMITIVE_SURFACE_CONSTRAINTS.find((c) => c.primitive === primitive);

  if (!constraint) {
    // No constraint = all surfaces allowed
    return { valid: true, errors: [], warnings: [] };
  }

  if (!constraint.allowedSurfaces.includes(surface)) {
    errors.push(
      `Surface "${surface}" is not allowed for primitive "${primitive}". ` +
      `Allowed: ${constraint.allowedSurfaces.join(", ")}`
    );
  }

  if (surface !== constraint.defaultSurface) {
    warnings.push(
      `Using non-default surface "${surface}" for "${primitive}". ` +
      `Default is "${constraint.defaultSurface}"`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate a role's feature usage.
 */
export function validateRoleFeatures(
  role: SurfaceRole,
  features: { glow?: boolean; blur?: number; animate?: boolean }
): ConstraintResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const constraint = ROLE_FEATURE_CONSTRAINTS[role];

  if (!constraint) {
    return { valid: true, errors: [], warnings: [] };
  }

  if (features.glow && !constraint.canGlow) {
    errors.push(`Role "${role}" does not support glow effects`);
  }

  if (features.blur !== undefined) {
    if (!constraint.canBlur) {
      errors.push(`Role "${role}" does not support blur effects`);
    } else if (features.blur > constraint.maxBlurLevel) {
      warnings.push(
        `Blur level ${features.blur} exceeds recommended max (${constraint.maxBlurLevel}) for role "${role}"`
      );
    }
  }

  if (features.animate && !constraint.canAnimate) {
    errors.push(`Role "${role}" does not support animations`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Full validation of a component configuration.
 */
export function validateComponentConfig(config: {
  primitive: string;
  surface: Surface;
  recipe: string;
  role: SurfaceRole;
  actions?: string[];
  features?: { glow?: boolean; blur?: number; animate?: boolean };
}): ConstraintResult {
  const allErrors: string[] = [];
  const allWarnings: string[] = [];

  // Validate primitive + surface
  const primitiveSurface = validatePrimitiveSurface(config.primitive, config.surface);
  allErrors.push(...primitiveSurface.errors);
  allWarnings.push(...primitiveSurface.warnings);

  // Validate surface + recipe
  const surfaceRecipe = validateSurfaceRecipe(config.surface, config.recipe);
  allErrors.push(...surfaceRecipe.errors);
  allWarnings.push(...surfaceRecipe.warnings);

  // Validate recipe + actions (if actions provided)
  if (config.actions) {
    const recipeActions = validateRecipeActions(config.recipe, config.actions);
    allErrors.push(...recipeActions.errors);
    allWarnings.push(...recipeActions.warnings);
  }

  // Validate role features (if features provided)
  if (config.features) {
    const roleFeatures = validateRoleFeatures(config.role, config.features);
    allErrors.push(...roleFeatures.errors);
    allWarnings.push(...roleFeatures.warnings);
  }

  return {
    valid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings,
  };
}

// ============================================
// DEVELOPMENT HELPERS
// ============================================

/**
 * Assert constraint in development mode.
 * Throws in dev, warns in production.
 */
export function assertConstraint(result: ConstraintResult, context: string): void {
  if (!result.valid) {
    const message = `[ColdLight] Constraint violation in ${context}:\n${result.errors.join("\n")}`;

    if (FEATURES.devWarnings) {
      throw new Error(message);
    } else {
      console.error(message);
    }
  }

  if (result.warnings.length > 0 && FEATURES.devWarnings) {
    console.warn(
      `[ColdLight] Constraint warnings in ${context}:\n${result.warnings.join("\n")}`
    );
  }
}

/**
 * Get the default surface for a primitive.
 */
export function getDefaultSurface(primitive: string): Surface {
  const constraint = PRIMITIVE_SURFACE_CONSTRAINTS.find((c) => c.primitive === primitive);
  return constraint?.defaultSurface ?? "glass";
}

/**
 * Get allowed surfaces for a primitive.
 */
export function getAllowedSurfaces(primitive: string): Surface[] {
  const constraint = PRIMITIVE_SURFACE_CONSTRAINTS.find((c) => c.primitive === primitive);
  return constraint?.allowedSurfaces ?? [...SURFACES];
}

/**
 * Get required actions for a recipe.
 */
export function getRequiredActions(recipe: string): string[] {
  const constraint = RECIPE_ACTION_CONSTRAINTS.find((c) => c.recipe === recipe);
  return constraint?.requiredActions ?? [];
}

/**
 * Check if a recipe is compatible with a surface.
 */
export function isRecipeCompatible(recipe: string, surface: Surface): boolean {
  const result = validateSurfaceRecipe(surface, recipe);
  return result.valid;
}

/**
 * Get all compatible recipes for a surface.
 */
export function getCompatibleRecipes(surface: Surface): string[] {
  const constraint = SURFACE_RECIPE_CONSTRAINTS.find((c) => c.surface === surface);
  return constraint?.allowedRecipes ?? [];
}

// ============================================
// CONSTRAINT SUMMARY
// ============================================

/**
 * Generate a summary of all constraints.
 */
export function getConstraintSummary() {
  return {
    surfaceRecipeConstraints: SURFACE_RECIPE_CONSTRAINTS.length,
    recipeActionConstraints: RECIPE_ACTION_CONSTRAINTS.length,
    primitiveSurfaceConstraints: PRIMITIVE_SURFACE_CONSTRAINTS.length,
    roleFeatureConstraints: Object.keys(ROLE_FEATURE_CONSTRAINTS).length,
    surfaces: SURFACES,
    roles: SURFACE_ROLES,
  };
}

export default {
  validateSurfaceRecipe,
  validateRecipeActions,
  validatePrimitiveSurface,
  validateRoleFeatures,
  validateComponentConfig,
  assertConstraint,
  getDefaultSurface,
  getAllowedSurfaces,
  getRequiredActions,
  isRecipeCompatible,
  getCompatibleRecipes,
  getConstraintSummary,
};
