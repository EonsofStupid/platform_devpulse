import { createAnatomy } from "../../schema/anatomy.schema.js";

export const meterAnatomy = createAnatomy("meter", ["root", "track", "fill", "label"] as const);
