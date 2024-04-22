export default function (Class, attributes = Class.attributes) {
	Object.defineProperty(Class.prototype, "_props", {
		get () {
			let value = {};
			Object.defineProperty(this, "_props", {
				value,
				writable: true,
				configurable: true,
				enumerable: false,
			});
			return value;
		},
		writable: true,
		configurable: true,
	});

	// Define getters and setters for each attribute
	for (let name in attributes) {
		let spec = Class.attributes[name] ?? {};
		let {type, default: defaultValue} = spec;

		Object.defineProperty(Class.prototype, name, {
			get () {
				let value = this._props[name];

				if (value === undefined && defaultValue !== undefined) {
					return defaultValue;
				}

				return value;
			},
			set (value) {
				let oldValue = this._props[name];
				let oldAttributeValue = this.getAttribute(name);
				let originalValue = value;
				let originalClass = value.constructor;
				let originalType = typeof value;

				if (type && type !== String) {
					if (type === Number) {
						value = Number(value);
					}
					else if (type === Boolean) {
						value = value !== null;
					}
					else {
						// Assume it's a class
						value = new type(value);
					}
				}

				this._props[name] = value;

				if (value !== oldValue && oldAttributeValue !== originalValue) {
					if (type === Boolean) {
						this.toggleAttribute(name, value);
					}
					else {
						this.setAttribute(name, value);
					}
				}
			},
			enumerable: true,
		});
	}

	// Class.prototype._initializeProps = function () {};
}