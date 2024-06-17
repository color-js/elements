// See https://bugs.webkit.org/show_bug.cgi?id=242740
import ColorJS from "../common/color.js";
const Color = await ColorJS;

import NudeElement from "../../node_modules/nude-element/src/Element.js";
import "../gamut-badge/gamut-badge.js";

let importIncrementable;

const Self = class ColorSwatch extends NudeElement {
	static tagName = "color-swatch";
	static Color = Color;

	constructor () {
		super();
		this.attachShadow({mode: "open"});
		let styleURL = new URL("./color-swatch.css", import.meta.url);
		this.shadowRoot.innerHTML = `
			<style>@import url("${ styleURL }")</style>
			<slot name="swatch">
				<div id="swatch" part="swatch">
					<slot name="swatch-content"></slot>
				</div>
			</slot>
			<div id="wrapper" part="details">
				<slot name="before"></slot>
				<div part="color-wrapper">
					<slot></slot>
				</div>
				<slot name="after"></slot>
			</div>
		`;

		this._el = {};
		this._el.wrapper = this.shadowRoot.querySelector("#wrapper");
		this._el.colorWrapper = this.shadowRoot.querySelector("[part=color-wrapper]");
		this._el.slot = this.shadowRoot.querySelector("slot:not([name])");

		this.#updateStatic();
		this._el.slot.addEventListener("slotchange", evt => this.#updateStatic());
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

		if (name === "color") {
			let isValid = this.color !== null || !this.value;

			input?.setCustomValidity(isValid ? "" : "Invalid color");

			if (this._el.gamutIndicator) {
				this._el.gamutIndicator.color = this.color;
			}

			let colorString = this.color?.display();
			this.style.setProperty("--color", colorString);
		}

		if (name === "info" || name === "vs") {
			let infoHTML = [];
			let coords = [];
			let other = []; // DeltaE and contrast

			if (this.info.length || this.vs) {
				this._el.info ??= Object.assign(document.createElement("dl"), {part: "info"});
				if (!this._el.info.parentNode) {
					this._el.colorWrapper.after(this._el.info);
				}

				for (let item of this.info) {
					let [label, data] = Object.entries(item)[0];
					if (label === "deltaE" || label === "contrast") {
						let method = label;
						let algorithm = data.replace(/(^deltaE)|(\s+contrast$)/, "");
						label = algorithm;

						if (method === "deltaE") {
							label = "ΔE " + label;
						}

						other.push({method, label, algorithm});
					}
					else {
						// Color coord
						coords.push([label, data]);
					}
				}
			}

			if (coords.length) {
				for (let [label, channel] of coords) {
					let value = this.color.get(channel);

					let deltaString;
					if (this.vs) {
						let vsValue = this.vs.get(channel);

						let hasDelta = typeof value === "number" && !Number.isNaN(value) &&
						               typeof vsValue === "number" && !Number.isNaN(vsValue);
						if (hasDelta) {
							let delta;

							let {space, index} = Color.Space.resolveCoord(channel);
							let spaceCoord = Object.values(space.coords)[index];

							let isAngle = spaceCoord.type === "angle";
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

								delta = value - vsValue;
							}
							else {
								delta = (value - vsValue) / value * 100;
							}

							delta = Number(delta.toPrecision(isAngle ? 4 : 2));
							if (delta !== 0) {
								let sign = delta > 0 ? "+" : "";
								let className = delta > 0 ? "positive" : "negative";
								deltaString = `<dd class="deltaE ${ className }">(${ sign }${ delta }${ !isAngle ? "%" : ""})</dd>`;
							}
						}
					}

					value = typeof value === "number" ? Number(value.toPrecision(4)) : value;
					let html = `<dt>${ label }</dt><dd>${ value }</dd>`;
					if (deltaString) {
						html += deltaString;
					}

					infoHTML.push(`<div class="info">${ html }</div>`);
				}
			}

			if (this.vs) {
				for (let {label, algorithm, method} of other) {
					if (algorithm) {
						let value = this.color[method](this.vs, algorithm);
						value = typeof value === "number" ? Number(value.toPrecision(4)) : value;
						infoHTML.push(`<div class="info"><dt>${ label ?? algorithm }</dt><dd>${ value }</dd></div>`);
					}
				}
			}

			if (infoHTML.length) {
				this._el.info.innerHTML = infoHTML.join("\n");
			}
		}
	}

	static props = {
		gamuts: {
			default: "srgb, p3, rec2020: P3+, prophoto: PP",
		},
		value: {
			type: String,
			default () {
				if (this._el.input) {
					return this._el.input.value;
				}

				// Children that are not assigned to another slot
				return [...this.childNodes].filter(n => !n.slot).map(n => n.textContent).join("").trim();
			},
			reflect: {
				from: "color",
			},
		},
		color: {
			type: Color,
			get () {
				if (!this.value) {
					return null;
				}

				return Color.get(this.value);
			},
			set (value) {
				this.value = Color.get(value)?.display();
			},
			reflect: false,
		},
		info: {
			type: {
				is: Array,
				values: {
					is: Object,
					defaultKey: (coord, i) => {
						if (coord.includes(".")) {
							return Color.Space.resolveCoord(coord)?.name;
						}
						else if (coord.startsWith("deltaE")) {
							return "deltaE";
						}
						else if (coord.endsWith("contrast")) {
							return "contrast";
						}
					},
				},
			},
			default: [],
			reflect: {
				from: true,
			},
			dependencies: ["color"],
		},
		size: {},
		open: {},
		vs: {
			type: Color,
			dependencies: ["color"],
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

customElements.define(Self.tagName, Self);

export default Self;
