import { createAnatomy } from "../../schema/anatomy.schema.js";

export const radioGroupAnatomy = createAnatomy("radio-group", [
	"root",
	"radio",
	"label",
	"description",
] as const);
