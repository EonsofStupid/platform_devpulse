import { createAnatomy } from "../../schema/anatomy.schema.js";

export const selectAnatomy = createAnatomy("select", [
	"root",
	"trigger",
	"value",
	"listbox",
	"option",
	"label",
] as const);
