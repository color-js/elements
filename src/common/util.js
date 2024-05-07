/**
 * Defines instance properties by defining an accessor that automatically replaces itself with a writable property when accessed.
 * @param {Function} Class
 * @param {string} name
 * @param {function} getValue
 */
export function defineInstanceProperty (
	Class, name, getValue,
	{writable = true, configurable = true, enumerable = false} = {}) {
	let setter = function (value) {
		Object.defineProperty(this, name, { value, writable, configurable, enumerable });
	}
	Object.defineProperty(Class.prototype, name, {
		get () {
			let value = getValue.call(this, this);
			setter.call(this, value);
			return value;
		},
		set (value) { // Blind set
			setter.call(this, value);
		},
		configurable: true,
	});
}

export function defineLazyProperty (object, name, options) {
	if (typeof options === "function") {
		options = { get: options };
	}

	let {get, writable = true, configurable = true, enumerable = false} = options;

	let setter = function (value) {
		Object.defineProperty(this, name, { value, writable, configurable, enumerable });
	}
	Object.defineProperty(object, name, {
		get () {
			let value = get.call(this);
			setter.call(this, value);
			return value;
		},
		set (value) { // Blind set
			setter.call(this, value);
		},
		configurable: true,
	});
}

export function defineComputed (Class, computed = Class.computed) {
	let dependencies = new Map();

	for (let name in computed) {
		let spec = computed[name];
		defineInstanceProperty(Class, name, spec.get);

		if (spec.dependencies) {
			for (let prop of spec.dependencies) {
				let deps = dependencies.get(prop) ?? [];
				deps.push(name);
				dependencies.set(prop, deps);
			}
		}
	}

	if (dependencies.size > 0) {
		let _propChangedCallback = Class.prototype.propChangedCallback;

		Class.prototype.propChangedCallback = function(name, change) {
			if (dependencies.has(name)) {
				for (let prop of dependencies.get(name)) {
					this[prop] = computed[prop].get.call(this, this);
				}
			}

			_propChangedCallback?.call(this, name, change);
		}
	}
}

export function inferDependencies (fn) {
	if (!fn || typeof fn !== "function") {
		return [];
	}

	let code = fn.toString();

	return [...code.matchAll(/\bthis\.([$\w]+)\b/g)].map(match => match[1]);
}

export async function wait (ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

export async function nextTick (refreshRate = 20) {
	let now = performance.now();
	let remainder = now % refreshRate;
	let delay = refreshRate - remainder;
	let nextAt = now + delay;
	nextTick.start ??= now - remainder;

	return new Promise(resolve => setTimeout(() => resolve(nextAt - nextTick.start), delay));
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
	return Object.fromEntries(Object.entries(obj).sort(fn));
}
