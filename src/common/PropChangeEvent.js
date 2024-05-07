import Props from "./Props.js";

export class PropChangeEvent extends CustomEvent {
	constructor (type, { name, prop, ...options } = {}) {
		super(type, options);

		this.name = name;
		this.prop = prop;
	}

	/**
	 * Get a subclass for a specific prop
	 * @param {*} name
	 */
	static for (name) {
		let eventClassName = name[0].toUpperCase() + name.slice(1) + "ChangeEvent";
		let CustomPropChangeEvent = class extends PropChangeEvent {
			constructor (type, options = {}) {
				super(type, options);

				this[name] = options[name];
			}

			static dispatchFrom (element) {
				let event = new this(name + "change", {
					[name]: element[name],
				});
				element.dispatchEvent(event);
			}
		};
		Object.defineProperty(CustomPropChangeEvent, "name", { value: eventClassName });
		return CustomPropChangeEvent;
	}
}

export default function definePropChangeEvent (Class, name) {
	let CustomPropChangeEvent = PropChangeEvent.for(name);

	return function postConstruct () {

		this.addEventListener("propchange", event => {
			if (event.name === name) {
				// Actually fire event
				CustomPropChangeEvent.dispatchFrom(this);
			}
		});
	}
}