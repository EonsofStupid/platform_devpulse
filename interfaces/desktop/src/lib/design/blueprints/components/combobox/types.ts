import type { BlueprintLegend } from "../../types.js";

export const comboboxBlueprintIds = ["combobox.default"] as const;

export type ComboboxBlueprintId = (typeof comboboxBlueprintIds)[number];

export const comboboxBlueprints: BlueprintLegend = {
	kind: "combobox",
	defaultId: "combobox.default",
	ids: comboboxBlueprintIds,
};
