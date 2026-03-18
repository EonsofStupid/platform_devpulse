import { createAnatomy } from "../../schema/anatomy.schema.js";

export const listboxAnatomy = createAnatomy("listbox", [
	"root",
	"option",
	"group",
	"label",
] as const);
