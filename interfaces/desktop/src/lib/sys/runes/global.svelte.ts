export type ChatMode = "developer" | "planning" | "image" | "general";

/**
 * The shell's own UI state. Which hub is showing is not here: the URL is the
 * state (SPRINT-01B lock 1), read with `hubHere()` from `#lib/sys/routing`.
 */
class GlobalState {
	sidebar_mode = $state<"collapsed" | "expanded">("collapsed");
	sidebar_submenu = $state<string | null>(null);
	context_mode = $state<"collapsed" | "expanded">("collapsed");
	overlay_active = $state<boolean>(false);

	// Chat mode. The chat window itself is a native OS window: open,
	// minimize and close are window operations, not UI state.
	chat_mode = $state<ChatMode>("general");
	/** The floating chat panel inside the main window (the owner's ChatOverlay). */
	chat_overlay_open = $state<boolean>(false);

	toggleSidebar(): void {
		this.sidebar_mode = this.sidebar_mode === "collapsed" ? "expanded" : "collapsed";
	}

	openSubmenu(hub: string): void {
		this.sidebar_submenu = this.sidebar_submenu === hub ? null : hub;
	}

	closeSubmenu(): void {
		this.sidebar_submenu = null;
	}

	toggleContext(): void {
		this.context_mode = this.context_mode === "collapsed" ? "expanded" : "collapsed";
	}

	showOverlay(): void {
		this.overlay_active = true;
	}

	hideOverlay(): void {
		this.overlay_active = false;
	}

	setMode(mode: ChatMode): void {
		this.chat_mode = mode;
	}

	toggleChatOverlay(): void {
		this.chat_overlay_open = !this.chat_overlay_open;
	}
}

export const globalState = new GlobalState();
