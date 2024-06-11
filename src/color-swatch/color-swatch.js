import Color from "../common/color.js";
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
			<div id="wrapper">
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
					this._el.colorWrapper.insertAdjacentHTML("beforeend", `
						<gamut-badge id="gamut" part="gamut" exportparts="label: gamutlabel" gamuts="${ this.gamuts }" color="${ this.color }"></gamut-badge>
					`);

					this._el.gamutIndicator = this._el.colorWrapper.lastElementChild;

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

		if (name === "coords" || name === "vs") {
			if (this.coords.length) {
				this._el.coords ??= Object.assign(document.createElement("dl"), {part: "coords"});
				if (!this._el.coords.parentNode) {
					this._el.colorWrapper.after(this._el.coords);
				}

				let coords = [];
				for (let coord of this.coords) {
					let [label, channel] = Object.entries(coord)[0];
					let value = this.color.get(channel);

					let deltaString;
					if (typeof value === "number" && this.vs) {
						let {space, index} = Color.Space.resolveCoord(channel);
						let deltas = this.color.deltas(this.vs, {space}).coords;

						let delta = deltas[index];
						if (typeof delta === "number" && delta !== 0) {
							let spaceCoord = Object.values(space.coords)[index];
							let isAngle = spaceCoord.type === "angle";
							if (!isAngle) {
								delta = delta / value * 100;
							}
							delta = Number(delta.toPrecision(isAngle ? 4 : 1));

							let sign = delta > 0 ? "+" : "";
							let className = delta > 0 ? "positive" : "negative";
							deltaString = `<dd class="deltaE ${ className }">(${ sign }${ delta }${ !isAngle ? "%" : ""})</dd>`;
						}
					}

					value = typeof value === "number" ? Number(value.toPrecision(4)) : value;
					let html = `<dt>${ label }</dt><dd>${ value }</dd>`;
					if (deltaString) {
						html += deltaString;
					}

					coords.push(`<div class="coord">${ html }</div>`);
				}

				this._el.coords.innerHTML = coords.join("\n");
			}
		}

		if (name === "vs") {
			if (!this.vs) {
				this._el.deltaE?.remove();
				this._el.deltaE = null;
			}
			else {
				let value = this.color.deltaE(this.vs);
				value = typeof value === "number" ? Number(value.toPrecision(4)) : value;
				if (value !== 0) {
					this._el.deltaE ??= Object.assign(document.createElement("dl"), {part: "deltaE"});
					if (!this._el.deltaE.parentNode) {
						(this._el.coords ?? this._el.colorWrapper).after(this._el.deltaE);
					}

					this._el.deltaE.innerHTML = `<dt>ΔE</dt><dd>${ value }</dd>`;
				}
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
			}
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
		coords: {
			type: {
				is: Array,
				values: {
					is: Object,
					defaultKey: (coord, i) => Color.Space.resolveCoord(coord)?.name,
				},
			},
			default: [],
			reflect: {
				from: true,
			},
			dependencies: ["color"],
		},
		vs: {
			type: Color,
			dependencies: ["color"],
		},
	}

	static events = {
		colorchange: {
			propchange: "color",
		},
		valuechange: {
			propchange: "value",
		},
	};
}

customElements.define(Self.tagName, Self);

export default Self;