import { createAnatomy } from "../../schema/anatomy.schema.js";

export const sliderAnatomy = createAnatomy("slider", ["root", "track", "thumb", "label", "output"] as const);
