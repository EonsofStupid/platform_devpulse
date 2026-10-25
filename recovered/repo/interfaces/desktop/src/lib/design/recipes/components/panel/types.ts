import type { RecipeLegend } from "../../types.js";

export const panelRecipeIds = [
	"panel.glass.void",
	"panel.glass.tint",
	"panel.matte.flat",
	"panel.metal.chrome",
] as const;

export type PanelRecipeId = (typeof panelRecipeIds)[number];

export const panelRecipes: RecipeLegend = {
	kind: "panel",
	defaultId: "panel.glass.void",
	ids: panelRecipeIds,
};
