import Color from "../common/color.js";
import defineEvents from "../../node_modules/nude-element/src/events/defineEvents.js";
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
		this._el.input = this.querySelector("input");
		this.static = !this._el.input;

		// This should eventually be a custom state
		this._el.wrapper.classList.toggle("static", this.static);

		if (this._el.input && this._el.input !== previousInput) {
			importIncrementable ??= import("https://incrementable.verou.me/incrementable.mjs").then(m => m.default);
			this._el.input.addEventListener("input", evt => {
				this.value = evt.target.value;
			});
		}
	}

	get gamut () {
		return this._el.gamutIndicator.gamut;
	}

	propChangedCallback ({name, prop, detail: change}) {
		if (name === "gamuts") {
			if (this.gamuts === "none") {
				this._el.gamutIndicator?.remove();
				this._el.gamutIndicator = null;
			}
			else if (this.gamuts) {
				if (!this._el.gamutIndicator) {
					this._el.colorWrapper.insertAdjacentHTML("beforeend", `
						<gamut-badge id="gamut" part="gamut" exportparts="label: gamutlabel" gamuts="${ this.gamuts }"></gamut-badge>
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

		if (name === "color") {
			let isValid = this.color !== null || !this.value;

			this._el.input?.setCustomValidity(isValid ? "" : "Invalid color");

			if (this._el.gamutIndicator) {
				this._el.gamutIndicator.color = this.color;
			}

			let colorString = this.color?.display();
			this.style.setProperty("--color", colorString);
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
			defaultProp: "value",
			parse (value) {
				if (!value) {
					return null;
				}

				return Color.get(value);
			},
			reflect: false,
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