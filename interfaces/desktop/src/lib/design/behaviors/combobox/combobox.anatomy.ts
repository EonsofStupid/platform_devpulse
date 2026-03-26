import { createAnatomy } from "../../schema/anatomy.schema.js";

export const comboboxAnatomy = createAnatomy("combobox", [
	"root",
	"input",
	"trigger",
	"listbox",
	"option",
	"label",
] as const);
