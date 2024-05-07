

export default class PropChangeEvent extends CustomEvent {
	constructor (type, { name, prop, ...options } = {}) {
		super(type, options);

		this.name = name;
		this.prop = prop;
	}

	static subtypes = {};

	/**
	 * Get a subclass for a specific prop
	 * @param {*} name
	 */
	static for (name) {
		if (!this.subtypes[name]) {
			let CustomPropChangeEvent = class extends PropChangeEvent {
				constructor (type, options = {}) {
					super(type, options);

					this[name] = options[name];
				}
			};

			// In the future we may want to allow subtypes for more than one props,
			// in which case we’d want to make the class name customizable
			let eventClassName = name[0].toUpperCase() + name.slice(1) + "ChangeEvent";
			Object.defineProperty(CustomPropChangeEvent, "name", { value: eventClassName });

			this.subtypes[name] = CustomPropChangeEvent;
		}

		return this.subtypes[name];
	}
}