import { createAnatomy } from "../../schema/anatomy.schema.js";

export const tagGroupAnatomy = createAnatomy("tag-group", [
	"root",
	"tag",
	"label",
	"description",
	"remove",
] as const);
