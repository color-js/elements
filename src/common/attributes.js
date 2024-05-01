import { defineInstanceProperty } from "./util.js";

export default function (Class, attributes = Class.attributes) {
	defineInstanceProperty(Class, "_props", el => ({}));
	defineInstanceProperty(Class, "ignoredAttributes", el => new Set());

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

	Class.prototype.attributeChangedCallback ??= function (name, value, oldValue) {
		if (!this.isConnected || this.ignoredAttributes.has(name)) {
			return;
		}

		if (name) {
			if (name in attributes && (this.hasAttribute(name) || value !== undefined)) {
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
		if (spec instanceof Attribute) {
			return spec;
		}

		this.name = name;
		Object.assign(this, spec);

		this.reflect ??= true;
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
				return this.default.call(element, element);
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

		let attributeValue = change.attributeValue = element.getAttribute(name);

		let reflectToAttribute = this.reflect === true || this.reflect.toAttribute;
		let attributeName = this.reflect === true ? this.name : this.reflect.toAttribute;

		if (source === "property") { // property -> attribute
			if (reflectToAttribute) {
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
						element.ignoredAttributes.add(attributeName);

						if (attributeValue === null) {
							element.removeAttribute(attributeName);
						}
						else {
							element.setAttribute(attributeName, attributeValue);
						}

						element.ignoredAttributes.delete(attributeName);
					}

					Object.assign(change, {attributeValue, oldAttributeValue});
				}
			}
		}
		else if (source === "attribute") {
			let reflectFromAttribute = this.reflect === true || this.reflect.fromAttribute;
			let propertyName = this.reflect === true ? name : this.reflect.fromAttribute;

			if (reflectFromAttribute) {
				// Common DOM pattern where the attribute sets the default value
				// and the DOM property is used to store the current value
				element._props[propertyName] = this.parse(attributeValue);
			}
		}

		this.propagate(element, change);

		this.changed?.call(element, change);
		element.propChangedCallback?.(name, change);
	}

	propagate (element, change) {
		if (!this.propagateTo) {
			return;
		}

		let {source, value, oldValue} = change;
		let attributeName = this.reflect === true ? this.name : this.reflect.toAttribute;
		let elements = typeof this.propagateTo === "function" ? this.propagateTo.call(element, element) : this.propagateTo;
		elements = Array.isArray(elements) ? elements : [elements];

		for (let element of elements) {
			if (!element) {
				continue;
			}
			if (source === "property") {
				element[this.name] = value;
			}
			else {
				let attributeValue = change.attributeValue;
				if (attributeValue === null) {
					element.removeAttribute(attributeName);
				}
				else {
					element.setAttribute(attributeName, attributeValue);
				}
			}
		}
	}
}