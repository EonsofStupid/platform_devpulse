import { createAnatomy } from "../../schema/anatomy.schema.js";

export const stackAnatomy = createAnatomy("stack", ["root"] as const);
