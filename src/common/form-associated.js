import { defineInstanceProperty } from "./util.js";

export default function (Class, {
	getSource,
	role,
	valueProp = "value",
	changeEvent = "input",
} = {}) {
	defineInstanceProperty(Class, "_internals", el => {
		let source = getSource(el);
		let internals = el.attachInternals?.();

		if (internals) {
			internals.ariaRole = role ?? source?.computedRole ?? "textbox";
			internals.setFormValue(el[valueProp]);
			el.addEventListener(changeEvent, () => internals.setFormValue(el[valueProp]));
		}

		return internals;
	});

	for (let prop of ["labels", "form", "type", "name", "validity", "validationMessage", "willValidate"]) {
		Object.defineProperty(Class.prototype, prop, {
			get () {
				return this._internals[prop];
			},
			enumerable: true,
		});
	}

	Class.formAssociated = true;
}