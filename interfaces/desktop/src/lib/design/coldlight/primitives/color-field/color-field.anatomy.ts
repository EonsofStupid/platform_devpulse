import { createAnatomy } from "../../schema/anatomy.schema.js";

export const colorFieldAnatomy = createAnatomy("color-field", ["root", "input", "label", "swatch"] as const);
