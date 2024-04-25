export function defineInstanceProperty (Class, name, getValue) {
	Object.defineProperty(Class.prototype, name, {
		get () {
			Object.defineProperty(this, name, {
				value: getValue(this),
				writable: true,
				configurable: true,
				enumerable: false,
			});

			return this[name];
		},
		configurable: true,
	});
}