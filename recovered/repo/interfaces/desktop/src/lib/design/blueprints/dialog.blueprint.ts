/**
 * @file Dialog Blueprint
 * @description Composition defaults for the Dialog component.
 */

import { registerBlueprint } from "./index.js";

registerBlueprint({
  id: "dialog.default",
  kind: "dialog",
  label: "Default Dialog",
  defaultRecipe: "dialog.glass.void",
  defaultProps: {
    accent: "teal",
    surface: "glass",
    variant: "void",
    radius: "lg",
    depth: 3,
    glow: "teal",
    bevel: "soft",
  },
  slots: {
    trigger: { required: false },
    portal: { required: true },
    overlay: { required: true },
    content: { required: true },
    title: { required: false },
    description: { required: false },
    close: { required: false },
    header: { required: false },
    footer: { required: false },
  },
});
