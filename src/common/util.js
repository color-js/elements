export async function wait (ms) {
	if (ms === undefined) {
		return new Promise(resolve => requestAnimationFrame(resolve));
	}

	return new Promise(resolve => setTimeout(resolve, ms));
}

export function defer (executor) {
	let res, rej;

	let promise = new Promise((resolve, reject) => {
		res = resolve;
		rej = reject;

		executor?.(res, rej);
	});

	promise.resolve = res;
	promise.reject = rej;

	return promise;
}

/**
 * Wait for all promises to resolve. Supports dynamically adding promises to the list after the initial call.
 * @param {Promise[] | Set<Promise>} promises
 * @returns {Promise}
 */
export async function dynamicAll (promises) {
	let all = new Set([...promises]);
	let unresolved = new Set();

	for (let promise of promises) {
		if (promise?.then) {
			unresolved.add(promise);
			promise.then(() => {
				// Remove the promise from the list
				unresolved.delete(promise);
			});
		}
	}

	return Promise.all(unresolved).then(resolved => {
		// Check if the array has new items
		for (let promise of promises) {
			if (!all.has(promise)) {
				all.add(promise);

				if (promise?.then) {
					unresolved.add(promise);
				}
			}
		}

		if (unresolved.size > 0) {
			return dynamicAll(unresolved).then(r => [...resolved, ...r]);
		}

		return resolved;
	});
}

/**
 * Compute the ideal step for a range, to be used as a default in spinners and sliders
 * @param {number} min
 * @param {number} max
 * @param {options} options
 */
export function getStep (min, max, { minSteps = 100, maxStep = 1 } = {}) {
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

export function getType (value) {
	if (value === null || value === undefined) {
		return value + "";
	}

	return Object.prototype.toString.call(value).slice(8, -1);
}

/**
 * Template tag that does nothing. Useful for importing under different names (e.g. `css`) for syntax highlighting.
 * @param {string[]} strings
 * @param {...any} values
 * @returns {string}
 */
export function noOpTemplateTag (strings, ...values) {
	return strings.reduce((acc, string, i) => acc + string + (values[i] ?? ""), "");
}
