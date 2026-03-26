import { createAnatomy } from "../../schema/anatomy.schema.js";

export const checkboxAnatomy = createAnatomy("checkbox", ["root", "indicator", "label"] as const);
