/** What this devtool's route folder says about itself (plan 0008). */

import { Eye } from "lucide-svelte";
import type { DevtoolNav } from "#lib/devtools/devtool-nav.js";
import type { RouteNav } from "#lib/sys/routing/index.js";

export const _nav: RouteNav = { icon: Eye, order: 10 };
export const _devtool: DevtoolNav = {
	accent: "salmon",
	capability: "vision.embedder",
	runtimeId: "siglip2-onnx",
	backdrop: { variation: "neural-pulse", intensity: "strong", speed: "normal" },
};
