export function isIOS(): boolean {
	return (
		/iPad|iPhone|iPod/.test(navigator.userAgent) ||
		(navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
	);
}

export function isWebKit(): boolean {
	return /AppleWebKit/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
}
