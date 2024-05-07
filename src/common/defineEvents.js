import Props from "./Props.js";

export function defineEvent (Class, name, options = {}) {
	let onName = `on${name}`;

	if (!(onName in Class.prototype)) {
		Props.add(Class, onName, {
			type: Function,
			typeOptions: {
				arguments: ["event"],
			},
		});

		return function postConstruct () {
			this.addEventListener("propchange", event => {
				if (event.name === onName) {
					// Implement the oneventname attribute
					let change = event.detail;

					if (change.oldInternalValue) {
						this.removeEventListener(name, change.oldInternalValue);
					}

					if (change.parsedValue) {
						this.addEventListener(name, change.parsedValue);
					}
				}
			});

			if (options.init) {
				options.init.call(this);
			}
		}
	}

}

export default function defineEvents (Class, events = Class.events) {
	let ret = [];

	for (let name in events) {
		let postConstruct = defineEvent(Class, name, events[name]);
		if (postConstruct) {
			ret.push(postConstruct);
		}
	}

	if (Class.postConstruct) {
		Class.postConstruct.push(...ret);
	}

	return ret;
}