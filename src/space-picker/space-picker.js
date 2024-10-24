import ColorElement from "../common/color-element.js";

const Self = class SpacePicker extends ColorElement {
	static tagName = "space-picker";
	static url = import.meta.url;
	static shadowStyle = true;
	static shadowTemplate = `<select id="picker" part="picker"></select>`;

	constructor () {
		super();

		this._el = {};
		this._el.picker = this.shadowRoot.querySelector("#picker");
	}

	connectedCallback () {
		super.connectedCallback?.();
		this._el.picker.addEventListener("change", this);
	}

	disconnectedCallback () {
		super.disconnectedCallback?.();
		this._el.picker.removeEventListener("change", this);
	}

	handleEvent (event) {
		if (event.type === "change" && event.target === this._el.picker) {
			this.value = this._el.picker.value;
		}

		this.dispatchEvent(new event.constructor(event.type, {...event}));
	}

	propChangedCallback ({name, prop, detail: change}) {
		if (name === "spaces") {
			this._el.picker.innerHTML = Object.entries(this.spaces)
				.map(([id, space]) => `<option value="${id}">${space.name}</option>`)
				.join("\n");
		}

		if (name === "value" || name === "spaces") {
			if (this.value?.id !== this._el.picker.value) {
				if (this.value.id in this.spaces) {
					this._el.picker.value = this.value.id;
				}
				else {
					let currentValue = this.spaces[this._el.picker.value];
					console.warn(`No color space with id = “${ this.value.id }” was found among the specified ones. Using the current one (${ currentValue.id }) instead.`);
					this.value = currentValue;
				}
			}
		}
	}

	static props = {
		value: {
			default () {
				return Self.Color.Space.get(this._el.picker.value);
			},
			parse (value) {
				if (value instanceof Self.Color.Space || value === null || value === undefined) {
					return value;
				}

				value += "";

				return Self.Color.Space.get(value);
			},
			stringify (value) {
				return value?.id;
			},
		},

		spaces: {
			type: {
				is: Object,
				get values () {
					return Self.Color.Space;
				},
				defaultValue: (id, index) => {
					try {
						return Self.Color.Space.get(id);
					}
					catch (e) {
						console.error(e);
					}
				},
			},
			default: () => Self.Color.spaces,
			convert (value) {
				// Drop non-existing spaces
				return Object.fromEntries(Object.entries(value).filter(([id, space]) => space));
			},
			stringify (value) {
				return Object.entries(value).map(([id, space]) => id).join(", ");
			},
		},
	};

	static events = {
		change: {
			from () {
				return this._el.picker;
			},
		},
		spacechange: {
			propchange: "value",
		},
	};

	static formAssociated = {
		like: el => el._el.picker,
		role: "combobox",
		valueProp: "value",
		changeEvent: "spacechange",
	};
};

Self.define();

export default Self;
