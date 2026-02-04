// Side-effect imports: register recipes + blueprints
import "$lib/design/recipes/dialog.recipe.js";
import "$lib/design/blueprints/dialog.blueprint.js";

// Component exports
export * as Dialog from "./dialog/index.js";
export type { ComponentSurfaceProps } from "./types.js";
