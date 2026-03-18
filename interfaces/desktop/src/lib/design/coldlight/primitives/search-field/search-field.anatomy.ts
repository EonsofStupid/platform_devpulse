import { createAnatomy } from "../../schema/anatomy.schema.js";

export const searchFieldAnatomy = createAnatomy("search-field", [
	"root",
	"input",
	"icon",
	"clear",
] as const);
