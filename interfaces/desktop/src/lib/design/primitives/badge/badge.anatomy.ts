import { createAnatomy } from "../../schema/anatomy.schema.js";

export const badgeAnatomy = createAnatomy("badge", ["root", "icon", "label"] as const);
