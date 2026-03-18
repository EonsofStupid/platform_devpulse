import { createAnatomy } from "../../schema/anatomy.schema.js";

export const menuAnatomy = createAnatomy("menu", [
	"root",
	"trigger",
	"content",
	"item",
	"separator",
	"group",
	"label",
] as const);
