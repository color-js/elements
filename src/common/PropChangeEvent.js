import Props from "./Props.js";

export class PropChangeEvent extends CustomEvent {
	constructor (type, { name, prop, ...options } = {}) {
		super(type, options);

		this.name = name;
		this.prop = prop;
	}
}

export default function definePropChangeEvent (Class, name) {
	let eventName = `${name}change`;
	let onEventName = `on${eventName}`;

	let eventClassName = name[0].toUpperCase() + name.slice(1) + "ChangeEvent";

	Props.add(Class, onEventName, {
		type: Function,
		typeOptions: {
			arguments: ["event"],
		},
	});

	let CustomPropChangeEvent = class extends PropChangeEvent {
		constructor (type, options = {}) {
			super(type, options);

			this[name] = options[name];
		}
	};
	Object.defineProperty(CustomPropChangeEvent, "name", { value: eventClassName });

	return function postInit () {

		this.addEventListener("propchange", event => {
			if (event.name === onEventName) {
				// Implement the oneventname attribute
				let change = event.detail;

				if (change.oldInternalValue) {
					this.removeEventListener(eventName, change.oldInternalValue);
				}

				if (change.parsedValue) {
					this.addEventListener(eventName, change.parsedValue);
				}
			}

			if (event.name === name) {
				// Actually fire event
				let newEvent = new CustomPropChangeEvent(eventName, {
					[name]: this[name],
				});
				this.dispatchEvent(newEvent);
			}
		});
	}
}