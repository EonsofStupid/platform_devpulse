/**
 * Body scroll lock with reference counting.
 *
 * Multiple overlays can request scroll lock simultaneously —
 * scroll is only restored when ALL locks are released.
 * iOS-aware: uses position:fixed workaround for iOS Safari.
 */

function isIOS(): boolean {
	return typeof navigator !== "undefined" && /iPad|iPhone|iPod/.test(navigator.userAgent);
}

class ScrollLocker {
	#refCount = 0;
	#scrollY = 0;
	#originalStyles = "";

	acquire(): void {
		this.#refCount++;
		if (this.#refCount !== 1) return;

		const body = document.body;
		this.#originalStyles = body.style.cssText;
		this.#scrollY = window.scrollY;

		if (isIOS()) {
			body.style.position = "fixed";
			body.style.top = `-${this.#scrollY}px`;
			body.style.left = "0";
			body.style.right = "0";
			body.style.overflow = "hidden";
		} else {
			body.style.overflow = "hidden";
			body.style.paddingRight = `${window.innerWidth - document.documentElement.clientWidth}px`;
		}
	}

	release(): void {
		if (this.#refCount <= 0) return;
		this.#refCount--;
		if (this.#refCount !== 0) return;

		const body = document.body;
		body.style.cssText = this.#originalStyles;

		if (isIOS()) {
			window.scrollTo(0, this.#scrollY);
		}

		this.#originalStyles = "";
		this.#scrollY = 0;
	}
}

const scrollLocker = new ScrollLocker();

export function useScrollLock(active: () => boolean): void {
	$effect(() => {
		if (active()) {
			scrollLocker.acquire();
			return () => scrollLocker.release();
		}
	});
}
