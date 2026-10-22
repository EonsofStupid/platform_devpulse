/**
 * @file VPB Connection State — Dev Server Awareness
 * @layer vpb
 * @package @devpulse/sys
 *
 * Tracks Vite dev server connection via HMR API.
 * Detects disconnects/reconnects and preserves VPB state.
 */

class VpbConnectionState {
	connected = $state<boolean>(true);
	lastDisconnect = $state<number | null>(null);
	reconnectCount = $state<number>(0);

	init(): void {
		if (typeof import.meta.hot !== "undefined" && import.meta.hot) {
			import.meta.hot.on("vite:ws-disconnect", () => {
				this.connected = false;
				this.lastDisconnect = Date.now();
			});
			import.meta.hot.on("vite:ws-connect", () => {
				this.connected = true;
				this.reconnectCount++;
			});
		}
	}
}

export const vpbConnection = new VpbConnectionState();
