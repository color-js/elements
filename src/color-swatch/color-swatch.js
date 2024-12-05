import ColorElement from "../common/color-element.js";
import "../gamut-badge/gamut-badge.js";

let importIncrementable;

const Self = class ColorSwatch extends ColorElement {
	static tagName = "color-swatch";
	static url = import.meta.url;
	static dependencies = new Set(["gamut-badge"]);
	static shadowStyle = true;
	static shadowTemplate = `
		<slot name="swatch">
			<div id="swatch" part="swatch">
				<slot name="swatch-content"></slot>
			</div>
		</slot>
		<div id="wrapper" part="details">
			<slot name="before"></slot>
			<div part="label"></div>
			<div part="color">
				<slot></slot>
			</div>
			<slot name="after"></slot>
		</div>`;

	#initiallyStatic;

	constructor () {
		super();

		this._el = {
			wrapper: this.shadowRoot.querySelector("#wrapper"),
			label: this.shadowRoot.querySelector("[part=label]"),
			colorWrapper: this.shadowRoot.querySelector("[part=color]"),
		};

		this._slots = {
			default: this.shadowRoot.querySelector("slot:not([name])"),
		};

		this.#updateStatic();
		this.#initiallyStatic = this.static;
		this._slots.default.addEventListener("slotchange", evt => this.#updateStatic());
	}

	#updateStatic () {
		let previousInput = this._el.input;
		let input = this._el.input = this.querySelector("input");

		this.static = !input;

		// This should eventually be a custom state
		this._el.wrapper.classList.toggle("static", this.static);

		if (input && input !== previousInput) {
			importIncrementable ??= import("https://incrementable.verou.me/incrementable.mjs").then(m => m.default);
			importIncrementable?.then(Incrementable => new Incrementable(input));

			input.addEventListener("input", evt => {
				this.value = evt.target.value;
			});
		}
	}

	get gamut () {
		return this._el.gamutIndicator.gamut;
	}

	get swatchTextContent () {
		// Children that are not assigned to another slot
		return [...this.childNodes].filter(n => !n.slot).map(n => n.textContent).join("").trim();
	}

	propChangedCallback ({name, prop, detail: change}) {
		let input = this._el.input;

		if (name === "gamuts") {
			if (this.gamuts === "none") {
				this._el.gamutIndicator?.remove();
				this._el.gamutIndicator = null;
			}
			else if (this.gamuts) {
				if (!this._el.gamutIndicator) {
					this._el.gamutIndicator = Object.assign(document.createElement("gamut-badge"), {
						id: "gamut",
						part: "gamut",
						exportparts: "label: gamutLabel",
						gamuts: this.gamuts,
						color: this.color,
					});

					this.shadowRoot.append(this._el.gamutIndicator);

					this._el.gamutIndicator.addEventListener("gamutchange", evt => {
						let gamut = this._el.gamutIndicator.gamut;
						this.setAttribute("gamut", gamut);
						this.dispatchEvent(new CustomEvent("gamutchange", {
							detail: gamut,
						}));
					});
				}
				else {
					this._el.gamutIndicator.gamuts = this.gamuts;
				}
			}
		}

		if (name === "value") {
			if (input && (!input.value || input.value !== this.value)) {
				input.value = this.value;
			}
		}

		if (name === "editable") {
			if (this.editable?.label) {
				let input = Object.assign(document.createElement("input"), {value: this.label});
				this._el.label.innerHTML = "";
				this._el.label.append(input);
				input.addEventListener("input", evt => {
					this.label = evt.target.value;
				});
			}

			if (this.editable?.color) {
				if (!input) {
					input = document.createElement("input");
					input.classList.add("color", "editable");
					input.value = this.value;

					// TODO: If the value comes from the swatch content, move it to <input>.
					// But how can it be restored afterward (when <input> is removed) without breaking (slotted) swatch content?
					// if (this.value === this.swatchTextContent) {
					// 	[...this.childNodes].filter(n => !n.slot).forEach(n => n.remove());
					// }

					this.append(input);
				}
			}
			else if (this.#initiallyStatic) {
				input?.remove();
			}
		}

		if ((name === "label" || name === "editable") && !this.editable?.label) {
			if (this.label.length && this.label !== this.swatchTextContent) {
				this._el.label.textContent = this.label;
			}
			else {
				this._el.label.textContent = "";
			}
		}

		if (name === "color") {
			let isValid = this.color !== null || !this.value;

			input?.setCustomValidity(isValid ? "" : "Invalid color");

			if (this._el.gamutIndicator) {
				this._el.gamutIndicator.color = this.color;
			}

			let colorString = this.color?.display();
			this.style.setProperty("--color", colorString);
		}

		if (name === "colorInfo") {
			if (!this.colorInfo) {
				return;
			}

			this._el.info ??= Object.assign(document.createElement("dl"), {part: "info"});
			if (!this._el.info.parentNode) {
				this._el.colorWrapper.after(this._el.info);
			}

			let info = [];
			for (let coord of this.info) {
				let [label, channel] = Object.entries(coord)[0];

				let value = this.colorInfo[channel];
				if (value === undefined) {
					continue;
				}

				value = typeof value === "number" ? Number(value.toPrecision(4)) : value;

				info.push(`<div class="coord"><dt>${ label }</dt><dd>${ value }</dd></div>`);
			}

			this._el.info.innerHTML = info.join("\n");
		}
	}

	static props = {
		size: {},
		open: {},
		gamuts: {
			default: "srgb, p3, rec2020: P3+, prophoto: PP",
		},
		value: {
			type: String,
			default () {
				if (this._el.input) {
					return this._el.input.value;
				}

				return this.swatchTextContent;
			},
			reflect: {
				from: true,
			},
		},
		label: {
			type: String,
			default () {
				return this.swatchTextContent;
			},
			convert (value) {
				return value?.trim();
			},
		},
		color: {
			get type () {
				return ColorSwatch.Color;
			},
			get () {
				if (!this.value) {
					return null;
				}

				return ColorSwatch.Color.get(this.value);
			},
			set (value) {
				this.value = ColorSwatch.Color.get(value)?.display();
			},
			reflect: false,
		},
		info: {
			type: {
				is: Array,
				values: {
					is: Object,
					defaultKey: (coord, i) => ColorSwatch.Color.Space.resolveCoord(coord)?.name,
				},
			},
			default: [],
			reflect: {
				from: true,
			},
		},
		colorInfo: {
			get () {
				if (!this.info.length || !this.color) {
					return;
				}

				let ret = {};
				for (let coord of this.info) {
					let [label, channel] = Object.entries(coord)[0];
					try {
						ret[channel] = this.color.get(channel);
					}
					catch (e) {
						console.error(e);
					}
				}

				return ret;
			},
		},
		editable: {
			parse (value) {
				if (value === undefined || value === null || value === false || value === "false") {
					return;
				}

				if (value === "" || value === "editable" || value === true || value === "true") {
					// Boolean attribute
					return {
						label: true,
						color: true,
					};
				}

				if (typeof value === "string") {
					// Convert to object
					let entries = value.split(/\s*[,\s]\s*/).map(key => [key.trim(), true]);
					return Object.fromEntries(entries);
				}

				if (typeof value === "object") {
					return value;
				}

				console.warn(`The specified value "${ value }" cannot be used as a value of the "editable" property.`);
				return;
			},
			dependencies: ["label", "color"],
			reflect: {
				from: true,
			},
		},
	};

	static events = {
		colorchange: {
			propchange: "color",
		},
		valuechange: {
			propchange: "value",
		},
		labelchange: {
			propchange: "label",
		},
	};
};

Self.define();

export default Self;
