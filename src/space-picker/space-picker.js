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
		if (event.type === "change" && event.target === this._el.picker && event.target.value !== this.value) {
			this.value = event.target.value;
		}
	}

	propChangedCallback ({name, prop, detail: change}) {
		if (name === "spaces") {
			if (!this.groups) {
				this._el.picker.innerHTML = Object.entries(this.spaces)
					.map(([id, space]) => `<option value="${id}">${space.name}</option>`)
					.join("\n");
			}
			else {
				let groups = this.groups;

				// Remove empty groups
				groups = Object.entries(groups).filter(([type, spaces]) => {
					if (Object.keys(spaces).length === 0) {
						console.warn(`Removed empty group of color spaces with the label "${type}."`);
						return false;
					}

					return true;
				});

				if (!groups.length) {
					console.warn("All provided groups of color spaces are empty. Falling back to default grouping.");
					groups = [["All spaces", this.spaces]];
				}

				this._el.picker.innerHTML = groups.map(([type, spaces]) => `
					<optgroup label="${type}">
						${Object.entries(spaces)
							.map(([id, space]) => `<option value="${id}">${space.name}</option>`)
							.join("\n")}
					</optgroup>
				`).join("\n");
			}

			this._el.picker.value = this.value;
		}

		if (name === "value") {
			let value = this.value;

			if (value) {
				if (!(value in this.spaces)) {
					let spaces = Object.keys(this.spaces);
					let firstSpace = spaces[0];
					let currentSpace = this._el.picker.value;
					let fallback = spaces.includes(currentSpace) ? currentSpace : firstSpace;

					console.warn(`No color space found with id = "${ value }". Choose one of the following: ${ spaces.join(", ") }. Falling back to "${ fallback }".`);
					this.value = value = fallback;
				}

				if (this._el.picker.value !== value) {
					this._el.picker.value = value;
				}
			}
		}
	}

	static props = {
		value: {
			default () {
				if (this.groups) {
					let groups = this.groups;
					let firstGroup = Object.values(groups)[0];

					return firstGroup && Object.keys(firstGroup)[0];
				}
				else {
					return Object.keys(this.spaces)[0];
				}
			},
		},

		selectedSpace: {
			get () {
				let value = this.value;
				if (value === undefined || value === null) {
					return;
				}

				return this.spaces[value];
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
				// Replace non-existing spaces with { id, name: id }
				for (let id in value) {
					if (!value[id]) {
						value[id] = { id, name: id };
					}
				}

				return value;
			},
			stringify (value) {
				return Object.entries(value).map(([id, space]) => id).join(", ");
			},
		},

		groupBy: {
			type: {
				is: Function,
				arguments: ["space"],
			},
			reflect: false,
		},

		groups: {
			get () {
				if (!this.groupBy) {
					return;
				}

				let ret = {};
				for (let [id, space] of Object.entries(this.spaces)) {
					let group = this.groupBy(space);
					if (group) {
						(ret[group] ??= {})[id] = space;
					}
				}

				return ret;
			},
		},
	};

	static events = {
		change: {
			from () {
				return this._el.picker;
			},
		},
		input: {
			from () {
				return this._el.picker;
			},
		},
		valuechange: {
			propchange: "value",
		},
		spacechange: {
			propchange: "selectedSpace",
		},
	};

	static formAssociated = {
		like: el => el._el.picker,
		role: "combobox",
		changeEvent: "change",
	};
};

Self.define();

export default Self;
