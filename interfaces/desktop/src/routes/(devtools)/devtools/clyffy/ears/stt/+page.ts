/** What this devtool's route folder says about itself (plan 0008). */

import { Ear } from "lucide-svelte";
import type { DevtoolNav } from "#lib/devtools/devtool-nav.js";
import type { RouteNav } from "#lib/sys/routing/index.js";

export const _nav: RouteNav = { icon: Ear, order: 10 };
export const _devtool: DevtoolNav = {
	accent: "blue",
	capability: "voice.stt",
	runtimeId: "whisper-onnx",
};
