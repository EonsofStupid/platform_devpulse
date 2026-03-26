import { createAnatomy } from "../../schema/anatomy.schema.js";

export const toolbarAnatomy = createAnatomy("toolbar", ["root", "item"] as const);
