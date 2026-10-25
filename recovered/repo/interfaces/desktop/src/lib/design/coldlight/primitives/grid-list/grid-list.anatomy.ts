import { createAnatomy } from "../../schema/anatomy.schema.js";

export const gridListAnatomy = createAnatomy("grid-list", ["root", "item"] as const);
