import {
	defineLazyProperty,
} from "./util.js";
import Prop from "./Prop.js";

export default class Props extends Map {
	/**
	 * Dependency graph
	 * @type {Object.<string, Set<string>>}
	 * Key is the name of the prop, value is a set of prop names that depend on it
	 */
	dependents = {};

	#initialized = false;

	/**
	 *
	 * @param {HTMLElement} Class The class to define props for
	 * @param {Object} [props=Class.props] The props to define as an object with the prop name as the key and the prop spec as the value.
	 */
	constructor (Class, props = Class.props) {
		super(Object.entries(props));

		this.Class = Class;

		// Add prop specs on element class
		// TODO handle composition
		Class.props = this;

		// Internal prop values
		defineLazyProperty(Class.prototype, "props", el => ({}));

		// Ignore mutations on these attributes
		defineLazyProperty(Class.prototype, "ignoredAttributes", el => new Set());

		// Changes not already handled by the propChangedCallback
		defineLazyProperty(Class.prototype, "pendingChanges", el => ({}));
		defineLazyProperty(Class.prototype, "updatingProps", el => new Set());

		// Define the attributeChangedCallback iff not already defined
		// We assume that if it's defined, it's defined from this
		// This will fail if a class has a custom attributeChangedCallback
		Class.prototype.attributeChangedCallback ??= function (name, oldValue, value) {
			if (!this.isConnected || this.ignoredAttributes.has(name)) {
				// We process attributes all at once when the element is connected
				return;
			}

			if (name) {
				// Find relevant props
				// Update specific attribute
				let allProps = [...this.constructor.props.values()];
				let relevantProps = allProps.filter(spec => spec.fromAttribute === name);

				for (let spec of relevantProps) {
					spec.set(this, this.getAttribute(name), {source: "attribute", name, oldValue});
				}
			}
			else {
				// Update all reflected props from attributes at once
				for (let name of this.constructor.observedAttributes) {
					// Only process elements that have this attribute, or used to
					if (this.hasAttribute(name)) {
						this.attributeChangedCallback(name);
					}
				}
			}
		}

		if (!Object.hasOwn(Class, "observedAttributes")) {
			Object.defineProperty(Class, "observedAttributes", {
				get: () => this.observedAttributes,
				configurable: true,
			});
		}

		// Define getters and setters for each prop
		for (let name in props) {
			let prop = new Prop(name, props[name], this);
			this.set(name, prop);
			Object.defineProperty(Class.prototype, name, prop.getDescriptor());
		}

		this.#initialized = true;
		this.updateDependents();
	}

	get observedAttributes () {
		return [...this.values()].map(spec => spec.fromAttribute).filter(Boolean);
	}

	add (name, spec) {
		let prop = new Prop(name, spec, this);
		this.set(name, prop);
		Object.defineProperty(this.Class.prototype, name, prop.getDescriptor());
		this.updateDependents();
		return prop;
	}

	/**
	 * Add a prop regardless of whether props have been processed or not yet
	 * @param {Function} Class
	 * @param {string} name
	 * @param {object} spec
	 */
	static add (Class, name, spec) {
		if (Class.props instanceof this) {
			Class.props.add(name, spec);
		}
		else {
			Class.props[name] = spec;
		}
	}

	updateDependents () {
		if (!this.#initialized) {
			// We update all dependents at once after initialization
			return;
		}

		// Build or update dependency graph
		for (let prop of this.values()) {
			for (let name of prop.dependencies) {
				if (!this.dependents[name]) {
					this.dependents[name] = new Set();
				}

				this.dependents[name].add(prop);
			}
		}
	}

	static create (...args) {
		return new this(...args);
	}
}