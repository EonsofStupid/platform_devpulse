import { createAnatomy } from "../../schema/anatomy.schema.js";

export const textFieldAnatomy = createAnatomy("text-field", [
	"root",
	"input",
	"label",
	"description",
	"error",
] as const);
