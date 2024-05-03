import {
	inferDependencies,
} from "./util.js";
const callableBuiltins = new Set([String, Number, Boolean, Array, Object, Function, Symbol, BigInt]);

let Self = class Prop {
	constructor (name, spec, props) {
		if (spec instanceof Prop && name === spec.name) {
			return spec;
		}

		this.name = name;
		this.spec = spec;
		this.props = props;

		this.type = spec.type;
		this.typeOptions = spec.typeOptions;

		this.default = spec.default;

		if (typeof spec.default === "function") {
			let defaultDependencies = spec.defaultDependencies ?? inferDependencies(spec.default);
			if (defaultDependencies.length > 0) {
				let defaultProp = "default" + name.replace(/^\w/, c => c.toUpperCase());
				this.default = this.props.add(defaultProp, {
					get: spec.default,
					dependencies: defaultDependencies,
				});
			}
		}

		if (spec.defaultProp) {
			Object.defineProperty(this, "default", {
				get: () => this.props.get(spec.defaultProp),
				configurable: true,
				enumerable: true,
			});
		}

		this.dependencies = spec.dependencies ?? inferDependencies(spec.get);

		for (let fn of ["equals", "parse", "stringify"]) {
			if (spec[fn]) {
				this[fn] = spec[fn];
			}
		}

		// Computed properties are not reflected by default
		this.reflect = spec.reflect ?? !this.spec.get;
	}

	get fromAttribute () {
		let reflectFrom = typeof this.reflect === "object" ? this.reflect.from : this.reflect;
		return reflectFrom === true ? this.name : typeof reflectFrom === "string" ? reflectFrom : null;
	}

	get toAttribute () {
		let reflectTo = typeof this.reflect === "object" ? this.reflect.to : this.reflect;
		return reflectTo === true ? this.name : typeof reflectTo === "string" ? reflectTo : null;
	}

	// Just calls Self.equals() by default but can be overridden
	equals(a, b) {
		return Self.equals(a, b, this.type, this.typeOptions);
	}

	// To attribute
	stringify (value) {
		return Self.stringify(value, this.type, this.typeOptions);
	}

	// Parse value into the correct type
	// This could be coming from an attribute (string)
	// Or directly setting the property (which could be a variety of types)
	parse (value) {
		return Self.parse(value, this.type, this.typeOptions);
	}

	// Define the necessary getters and setters
	getDescriptor ({enumerable = true} = this.spec) {
		let me = this;
		let descriptor = {
			get () {
				return me.get(this);
			},
			enumerable,
		};

		if (!this.spec.get) {
			descriptor.set = function (value) {
				me.set(this, value, {source: "property"});
			};
		}
		else if (this.spec.set) {
			descriptor.set = function (value) {
				me.spec.set.call(this, value);
			};
		}

		return descriptor;
	}

	get (element) {
		let value = element.props[this.name];

		if (value === undefined) {
			this.update(element);
			value = element.props[this.name];
		}

		if (value === undefined || value === null) {
			if (this.default !== undefined) {
				if (this.default instanceof Prop) {
					return this.default.get(element);
				}
				else if (typeof this.default === "function") {
					return this.default(element);
				}
				else {
					return this.default;
				}
			}
		}

		return value;
	}

	set (element, value, {source = "property", name, oldValue} = {}) {
		let oldInternalValue = element.props[this.name];

		let attributeName = name;
		let parsedValue = this.parse(value);

		if (this.equals(parsedValue, oldInternalValue)) {
			return;
		}

		element.props[this.name] = parsedValue;

		let change = {
			element, source,
			value, parsedValue, oldInternalValue,
			attributeName: name,
		};

		if (source === "property") {
			// Reflect to attribute?
			if (this.toAttribute) {
				let attributeName = this.toAttribute;
				let attributeValue = this.stringify(parsedValue);
				let oldAttributeValue = element.getAttribute(attributeName);

				if (oldAttributeValue !== attributeValue) {
					// TODO what if another prop is reflected *from* this attribute?
					element.ignoredAttributes.add(this.toAttribute);

					Object.assign(change, { attributeName, attributeValue, oldAttributeValue });
					this.applyChange(element, {...change, source: "attribute"});

					element.ignoredAttributes.delete(attributeName);
				}
			}
		}
		else if (source === "attribute") {
			Object.assign(change, {
				attributeName,
				attributeValue: value,
				oldAttributeValue: oldValue,
			});
		}


		this.changed(element, change);
	}

	applyChange (element, change) {
		if (change.source === "attribute") {
			let attributeName = change.attributeName ?? this.toAttribute;
			let attributeValue = change.attributeValue ?? change.element.getAttribute(attributeName);

			if (attributeValue === null) {
				element.removeAttribute(attributeName);
			}
			else {
				element.setAttribute(attributeName, attributeValue);
			}
		}
		else if (change.source === "property") {
			element[this.name] = change.value;
		}
		else if (change.source === "default") {
			// Value will be undefined here
			if (change.element !== element) {
				element[this.name] = change.element[this.name];
			}
		}
		else {
			// Mixed
			this.applyChange(element, {...change, source: "attribute"});
			this.applyChange(element, {...change, source: "property"});
		}
	}

	async changed (element, change) {
		this.updateDependents(element);

		element.propChangedCallback?.(this, change);
	}

	/**
	 * Recalculate computed properties and cache the value
	 * @param {*} element
	 */
	update (element) {
		if (this.spec.get) {
			let value = this.spec.get.call(element);
			this.set(element, value, {source: "property"});
		}
	}

	/**
	 * Update all props that have this prop as a dependency
	 * @param {*} element
	 */
	updateDependents (element) {
		let dependents = this.props.dependents[this.name] ?? [];

		for (let prop of dependents) {
			prop.update(element);
		}

		// Is this a default for any empty properties?
		for (let prop of this.props.values()) {
			if (prop.default === this && element.props[prop.name] === undefined) {
				prop.changed(element, {source: "default", element});
			}
		}
	}

	static equals (a, b, type, typeOptions) {
		if (a === null || b === null || a === undefined || b === undefined) {
			return a === b;
		}

		let equals = this.types.get(type)?.equals;
		return equals ? equals(a, b, typeOptions) : this.defaultType.equals(a, b, type, typeOptions);
	}

	// Cast a value to the desired type
	static parse (value, type, typeOptions) {
		if (!type || value === undefined || value === null) {
			return value;
		}

		let parse = this.types.get(type)?.parse;
		return parse ? parse(value, typeOptions) : this.defaultType.parse(value, type, typeOptions);
	}

	static stringify (value, type, typeOptions) {
		if (value === undefined || value === null) {
			return null;
		}

		if (!type) {
			return String(value);
		}

		let stringify = this.types.get(type)?.stringify;

		if (stringify === false) {
			throw new TypeError(`Cannot stringify ${type}`);
		}

		return stringify ? stringify(value, typeOptions) : this.defaultType.stringify(value, type, typeOptions);
	}

	static defaultType = {
		equals (a, b, type) {
			let simpleEquals = a === b;
			if (simpleEquals || a === null || a === undefined || b === null || b === undefined) {
				return simpleEquals;
			}

			if (typeof a.equals === "function") {
				return a.equals(b);
			}

			// Roundtrip
			return simpleEquals;
		},
		parse (value, type, typeOptions) {
			if (value instanceof type) {
				return value;
			}

			return callableBuiltins.has(type) ? type(value) : new type(value);
		},

		stringify (value, type, typeOptions) {
			return String(value);
		},
	}

	static types = new Map([
		[Boolean, {
			parse: value => value !== null,
			stringify: value => value ? "" : null,
		}],
		[Number, {
			equals: (a, b) => a === b || Number.isNaN(a) && Number.isNaN(b),
		}],
		[Function, {
			equals: (a, b) => a === b || a.toString() === b.toString(),
			parse (value, options = {}) {
				if (typeof value === "function") {
					return value;
				}

				value = String(value);

				return Function(...(options.arguments ?? []), value);
			},
			// Just don’t do that
			stringify: false,
		}],
		[Array, {
			equals (a, b, { itemType } = {}) {
				if (a.length !== b.length) {
					return false;
				}

				if (itemType) {
					return a.every((item, i) => Self.equals(item, b[i], itemType));
				}
				else {
					return a.every((item, i) => item === b[i]);
				}
			},
			parse (value, { itemType, separator = ",", splitter } = {}) {
				if (!Array.isArray(value)) {
					if (!splitter) {
						// Make whitespace optional and flexible, unless the separator consists entirely of whitespace
						let isSeparatorWhitespace = !separator.trim();
						splitter = isSeparatorWhitespace ? /\s+/ : new RegExp(separator.replace(/\s+/g, "\\s*"));
					}


					value = typeof value === "string" ? value.trim().split(splitter) : [value];
				}

				if (itemType) {
					return value.map(item => Self.parse(item, itemType));
				}
			},
			stringify: (value, { itemType, separator = ",", joiner } = {}) => {
				if (itemType) {
					value = value.map(item => Self.stringify(item, itemType));
				}

				if (!joiner) {
					let trimmedSeparator = separator.trim();
					joiner = (!trimmedSeparator || trimmedSeparator === "," ? "" : " ") + separator + " ";
				}

				return value.join(joiner);
			},
		}],
	])
}

export default Self;
