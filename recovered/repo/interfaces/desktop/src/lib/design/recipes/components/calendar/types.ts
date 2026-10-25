import type { RecipeLegend } from "../../types.js";

export const calendarRecipeIds = ["calendar.glass.void"] as const;
export type CalendarRecipeId = (typeof calendarRecipeIds)[number];
export const calendarRecipes: RecipeLegend = {
	kind: "calendar",
	defaultId: "calendar.glass.void",
	ids: calendarRecipeIds,
};
