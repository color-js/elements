export function defineInstanceProperty (Class, name, getValue) {
	Object.defineProperty(Class.prototype, name, {
		get () {
			let value = getValue.call(this, this);

			Object.defineProperty(this, name, {
				value,
				writable: true,
				configurable: true,
				enumerable: false,
			});

			return value;
		},
		set (value) {
			Object.defineProperty(this, name, {
				value,
				writable: true,
				configurable: true,
				enumerable: false,
			});
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