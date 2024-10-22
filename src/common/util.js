export async function wait (ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Compute the ideal step for a range, to be used as a default in spinners and sliders
 * @param {number} min
 * @param {number} max
 * @param {options} options
 */
export function getStep (min, max, {minSteps = 100, maxStep = 1} = {}) {
	let range = Math.abs(max - min);
	let step = range / minSteps;

	// Find nearest power of 10 that is < step
	step = 10 ** Math.floor(Math.log10(step));

	return step > maxStep ? maxStep : step;
}

export function sortObject (obj, fn) {
	if (!obj) {
		return obj;
	}

	return Object.fromEntries(Object.entries(obj).sort(fn));
}

export function mapObject (obj, fn) {
	if (!obj) {
		return obj;
	}

	return Object.fromEntries(Object.entries(obj).map(fn));
}

export function pick (obj, properties) {
	if (!properties || !obj) {
		return obj;
	}

	return Object.fromEntries(Object.entries(obj).filter(([key]) => properties.includes(key)));
}
