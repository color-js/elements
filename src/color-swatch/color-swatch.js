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

		if (name === "label") {
			if (this.label.length && this.label !== this.swatchTextContent) {
				this._el.label.textContent = this.label;
				this._el.label.title = this.label;
			}
			else {
				this._el.label.textContent = "";
				this._el.label.title = "";
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

		if (name === "colorInfo" || name === "vsInfo") {
			if (!this.colorInfo) {
				return;
			}

			this._el.info ??= Object.assign(document.createElement("dl"), {part: "info"});
			if (!this._el.info.parentNode) {
				this._el.colorWrapper.after(this._el.info);
			}

			let html = [];
			for (let data of this.info) {
				let [label, key] = Object.entries(data)[0];

				let rawValue = this.colorInfo[key] ?? this.vsInfo?.[key];
				if (rawValue === undefined) {
					continue;
				}

				let value = typeof rawValue === "number" ? Number(rawValue.toPrecision(4)) : rawValue;
				let ret = `<div class="data"><dt>${ label }</dt><dd>${ value }</dd>`;

				if (this.colorDeltas?.[key] && this.infoCoordsResolved?.[key]) {
					let delta = this.colorDeltas[key];
					let classes = delta > 0 ? "positive" : "negative";

					if (this.infoCoordsResolved[key]?.type === "angle") {
						classes += " angle";
					}
					else {
						delta = delta / rawValue * 100;
					}

					delta = typeof delta === "number" ? Number(delta.toPrecision(4)) : delta;
					ret += `<dd class="delta ${classes}">${ delta }</dd>`;
				}

				ret += "</div>";

				html.push(ret);
			}

			this._el.info.innerHTML = html.join("\n");
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
				return value.trim();
			},
		},
		color: {
			get type () {
				return Self.Color;
			},
			get () {
				if (!this.value) {
					return null;
				}

				return Self.Color.get(this.value);
			},
			set (value) {
				this.value = Self.Color.get(value)?.display();
			},
			reflect: false,
		},
		info: {
			type: {
				is: Array,
				values: {
					is: Object,
					defaultKey: (value, i) => {
						if (value.startsWith("deltaE.") || value.startsWith("contrast.")) {
							let [method, algorithm] = value.split(".");
							let label = method === "deltaE" ? `ΔE ${algorithm}` : `${algorithm} Contrast`;
							return label;
						}
						else if (value.includes(".")) {
							return Self.Color.Space.resolveCoord(value)?.name;
						}
						else {
							return value;
						}
					},
				},
			},
			default: [],
			reflect: {
				from: true,
			},
		},
		/**
		 * Specified coords
		 * @example ["oklch.h", "oklch.c", "oklch.l"]
		 */
		infoCoords: {
			get () {
				if (!this.info.length) {
					return;
				}

				let ret = [];
				for (let data of this.info) {
					let [key, value] = Object.entries(data)[0];
					if (value.includes(".") && !value.startsWith("deltaE") && !value.startsWith("contrast")) {
						ret.push(value);
					}
				}

				return ret;
			},
		},
		// We need this to correctly work (calculate and show in the UI) with coords of type "angle"
		infoCoordsResolved: {
			get () {
				if (!this.infoCoords) {
					return;
				}

				let ret = {};
				for (let coord of this.infoCoords) {
					try {
						let { space, index } = Self.Color.Space.resolveCoord(coord);
						ret[coord] = Object.values(space.coords)[index];
					}
					catch (e) {
						console.error(e);
					}
				}

				return ret;
			},
		},
		/**
		 * Specified deltaE and contrast
		 * @example ["deltaE.2000", "contrast.WCAG21"]
		 */
		infoOther: {
			get () {
				if (!this.info.length) {
					return;
				}

				let ret = [];
				for (let data of this.info) {
					let [key, value] = Object.entries(data)[0];
					if (!this.infoCoords.includes(value)) {
						ret.push(value);
					}
				}

				return ret;
			},
		},
		/**
		 * Coords for `this.color`
		 * @example {"oklch.l": 0.7,"oklch.c": 0.25, "oklch.h": 138}
		 */
		colorInfo: {
			get () {
				if (!this.color || !this.infoCoords) {
					return;
				}

				let ret = {};
				for (let coord of this.infoCoords) {
					try {
						ret[coord] = this.color.get(coord);
					}
					catch (e) {
						console.error(e);
					}
				}

				return ret;
			},
		},
		/**
		 * Color deltas (between `this.color` and `this.vs`)
		 * @example {"oklch.l": -0.3,"oklch.c": 0.35, "oklch.h": 108}
		 */
		colorDeltas: {
			get () {
				if (!this.infoCoordsResolved || !this.vsInfo) {
					return;
				}

				// TODO: Use Color.js deltas() instead (when v0.6.0 is released)
				let ret = {};
				for (let coord of this.infoCoords) {
					let value = this.colorInfo[coord];
					let vsValue = this.vsInfo[coord];

					let isAngle = this.infoCoordsResolved[coord]?.type === "angle";
					if (isAngle) {
						// Constrain angles (shorter arc)
						[value, vsValue] = [value, vsValue].map(v => ((v % 360) + 360) % 360);
						let angleDiff = vsValue - value;
						if (angleDiff > 180) {
							value += 360;
						}
						else if (angleDiff < -180) {
							vsValue += 360;
						}
					}

					ret[coord] = value - vsValue;
				}

				return ret;
			},
		},
		/**
		 * Color to compare `this.color` with
		 */
		vs: {
			get type () {
				return Self.Color;
			},
		},
		/**
		 * Coords, deltaE, contrast for `this.vs`
		 * @example {"oklch.l": 1, "oklch.c": 0, "oklch.h": null, "deltaE.2000": 37.69, "contrast.WCAG21": 2.46}
		 */
		vsInfo: {
			get () {
				if (!this.color || !this.vs || !this.info.length) {
					return;
				}

				let ret = {};

				for (let coord of this.infoCoords) {
					try {
						ret[coord] = this.vs.get(coord);
					}
					catch (e) {
						console.error(e);
					}
				}

				for (let data of this.infoOther) {
					let [method, algorithm] = data.split(".");

					if (method && algorithm) {
						try {
							ret[data] = this.color[method](this.vs, algorithm);
						}
						catch (e) {
							console.error(e);
						}
					}
				}

				return ret;
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
	};
};

Self.define();

export default Self;
