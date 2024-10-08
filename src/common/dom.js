export function named (host, attributes = ["id", "part"]) {
	let ret = {};
	let selector = attributes.map(attr => `[${ attr }]`).join(", ");

	for (let el of host.shadowRoot.querySelectorAll(selector)) {
		// Get the value of the first attribute in attributes that has a value
		let attribute = attributes.find(attr => el.hasAttribute(attr));
		ret[el[attribute]] = el;
	}

	return ret;
}

export function slots (host) {
	let ret = {};

	for (let slot of host.shadowRoot.querySelectorAll("slot")) {
		ret[slot.name] = slot;

		if (!slot.name || slot.dataset.default !== undefined) {
			ret.default = slot;
		}
	}

	return ret;
}

export function toSlots ({
	slots = this._slots,
	slotElements = slots ? Object.values(slots) : Array.from(this.shadowRoot.querySelectorAll("slot")),
}) {
	let children = this.childNodes;
	let assignments = new WeakMap();

	if (!slots && slotElements) {
		slots = Object.fromEntries(slotElements.map(slot => [slot.name, slot]));
	}

	// Assign to slots
	for (let child of children) {
		let assignedSlot;

		if (child.slot) {
			// Explicit slot
			assignedSlot = slots[child.slot];
		}
		else if (child.matches) {
			assignedSlot = slotElements.find(slot => child.matches(slot.dataset.assign));
		}

		assignedSlot ??= slots.default;
		let all = assignments.get(assignedSlot) ?? new Set();
		all.add(child);
		assignments.set(assignedSlot, all);
	}

	for (let slot of slotElements) {
		let all = assignments.get(slot) ?? new Set();
		slot.assign(...all);
	}
}
