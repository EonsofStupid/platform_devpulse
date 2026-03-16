import { createAnatomy } from "../../schema/anatomy.schema.js";

export const switchAnatomy = createAnatomy("switch", ["root", "thumb", "label"] as const);
