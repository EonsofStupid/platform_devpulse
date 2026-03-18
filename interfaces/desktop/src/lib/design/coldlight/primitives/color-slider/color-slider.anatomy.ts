import { createAnatomy } from "../../schema/anatomy.schema.js";

export const colorSliderAnatomy = createAnatomy("color-slider", [
	"root",
	"track",
	"thumb",
	"label",
] as const);
