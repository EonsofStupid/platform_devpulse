import { createAnatomy } from "../../schema/anatomy.schema.js";

export const numberFieldAnatomy = createAnatomy("number-field", [
	"root",
	"input",
	"increment",
	"decrement",
] as const);
