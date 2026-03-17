import { createAnatomy } from "../../schema/anatomy.schema.js";

export const accordionAnatomy = createAnatomy("accordion", ["root", "item", "trigger", "content"] as const);
