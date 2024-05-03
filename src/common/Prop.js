import {
	equals,
	inferDependencies,
	nextTick,
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

	// Just calls equals() by default but can be overridden
	equals(a, b) {
		return equals(a, b);
	}

	// To attribute
	stringify (value) {
		if (Array.isArray(value)) {
			return value.map(item => this.stringify(item)).join(", ");
		}

		return value === null ? value : String(value);
	}

	// Parse value into the correct type
	// This could be coming from an attribute (string)
	// Or directly setting the property (which could be a variety of types)
	parse (value) {
		return Prop.parseAs(value, this.type, this.typeOptions);
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
		let change = {element, source, value, oldInternalValue, attributeName: name};
		let attributeName = name;
		let parsedValue = this.parse(value);

		if (this.equals(parsedValue, oldInternalValue)) {
			return;
		}

		element.props[this.name] = parsedValue;

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

	// Cast a value to the desired type
	static parseAs (value, type, typeOptions) {
		if (!type || value === undefined) {
			return value;
		}

		if (value !== null && value !== undefined) {
			if (type === Array) {
				// Arrays involve two steps: parsing the value _into_ an array,
				// then converting each individual value into the desired itemType
				if (!Array.isArray(value)) {
					value = typeof value === "string" ? value.trim().split(/\s*,\s*/) : [value];
				}

				if (typeOptions?.itemType) {
					return value.map(item => this.parseAs(item, typeOptions.itemType));
				}

				return value;
			}
		}

		if (type === Boolean) {
			return value !== null;
		}
		else if (type && value !== null) {
			if (value instanceof type) {
				return value;
			}

			return callableBuiltins.has(type) ? type(value) : new type(value);
		}

		return value;
	}
}export default Self;
