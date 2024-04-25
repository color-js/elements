import { defineInstanceProperty } from "./util.js";

export default function (Class, attributes = Class.attributes) {
	defineInstanceProperty(Class, "_props", el => ({}));
	defineInstanceProperty(Class, "ignoreAttributes", el => new Set());

	// Define getters and setters for each attribute
	for (let name in attributes) {
		let spec = attributes[name] = new Attribute(name, attributes[name]);

		Object.defineProperty(Class.prototype, name, {
			get () {
				return spec.get(this);
			},
			set (value) {
				spec.set(this, value);
			},
			enumerable: true,
		});
	}

	Class.prototype.attributeChangedCallback ??= function (name) {
		if (!this.isConnected || this.ignoreAttributes.has(name)) {
			return;
		}

		if (name) {
			if (name in attributes) {
				let spec = attributes[name];
				spec.set(this);
			}
		}
		else {
			// Update all reflected props from attributes
			for (let name in attributes) {
				if (this.hasAttribute(name)) {
					this.attributeChangedCallback(name);
				}
			}
		}
	}

	if (!Object.hasOwn(Class, "observedAttributes")) {
		Object.defineProperty(Class, "observedAttributes", {
			get () {
				return Object.keys(attributes);
			},
		});
	}
}

const callableBuiltins = new Set([String, Number, Boolean, Array, Object, Function, Symbol, BigInt]);
export class Attribute {
	constructor (name, spec) {
		this.name = name;
		Object.assign(this, spec);
	}

	// Cast value to the desired type
	parse (value) {
		if (value !== null && value !== undefined) {
			if (this.type === Array) {
				// Arrays involve two steps: parsing the value _into_ an array, then converting each individual value
				if (!Array.isArray(value)) {
					value = typeof value === "string" ? value.trim().split(/\s*,\s*/) : [value];
				}

				if (this.itemType) {
					return value.map(item => this.constructor.parseValue(this.itemType, item));
				}

				return value;
			}
		}

		return this.constructor.parseValue(this.type, value);
	}

	static parseValue (Type, value) {
		if (Type && value !== null && value !== undefined) {
			if (value instanceof Type) {
				return value;
			}

			return callableBuiltins.has(Type) ? Type(value) : new Type(value);
		}

		return value;
	}

	stringify (value) {
		if (Array.isArray(value)) {
			return value.map(item => this.stringify(item)).join(", ");
		}

		return value === null ? value : String(value);
	}

	roundtrip (value) {
		return this.stringify(this.parse(value));
	}

	// Compare two values for equality (after conversion to desired type)
	equals (a, b) {
		return a === b ?? a?.equals?.(b) ?? (Number.isNaN(a) && Number.isNaN(b));
	}

	// Read the value from the attribute
	fromAttribute (element) {
		if (this.type === Boolean) {
			return element.hasAttribute(this.name);
		}

		return element.getAttribute(this.name);
	}

	get (element) {
		let name = this.name;
		let value = element._props[name];

		if (value === undefined) {
			if (typeof this.default === "function") {
				return this.default.call(element);
			}

			return this.default;
		}

		return value;
	}

	set (element, value) {
		let source = "property";
		let name = this.name;

		if (value === undefined) {
			value = this.fromAttribute(element);
			source = "attribute";
		}

		let oldValue = element._props[name];
		let change = {source, value, oldValue};

		// Convert to desired type and store internally
		let originalValue = value;

		if (value !== null) {
			value = this.parse(value);
		}

		if (!this.equals(value, oldValue)) {
			element._props[name] = value;
		}

		change.attributeValue = element.getAttribute(name);

		if (source === "property") { // property -> attribute
			// Reflect to attribute
			let oldAttributeValue = change.attributeValue;
			let changed = false;

			if (!(typeof originalValue === "string" && originalValue === oldAttributeValue)) {
				let attributeValue;

				if (this.type === Boolean) {
					attributeValue = value ? "" : null;
					changed = (value !== null) !== (oldAttributeValue !== null);
				}
				else {
					if (oldAttributeValue === null) {
						changed = value !== null;
					}
					else {
						changed = this.roundtrip(attributeValue) !== this.roundtrip(value);
					}
				}

				if (changed) {
					attributeValue = this.stringify(value);
					element.ignoreAttributes.add(name);

					if (attributeValue === null) {
						element.removeAttribute(name);
					}
					else {
						element.setAttribute(name, attributeValue);
					}

					element.ignoreAttributes.delete(name);
				}

				Object.assign(change, {attributeValue, oldAttributeValue});
			}
		}

		if (this.propagateTo) {
			let elements = typeof this.propagateTo === "function" ? this.propagateTo.call(element, element) : this.propagateTo;
			elements = Array.isArray(elements) ? elements : [elements];

			for (let element of elements) {
				if (source === "property") {
					element[name] = value;
				}
				else {
					let attributeValue = change.attributeValue;
					if (attributeValue === null) {
						element.removeAttribute(name);
					}
					else {
						element.setAttribute(name, attributeValue);
					}
				}
			}
		}

		element.propChangedCallback?.(name, change);
	}
}