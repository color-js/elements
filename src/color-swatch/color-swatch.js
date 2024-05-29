import Color from "../common/color.js";
import defineEvents from "../../node_modules/nude-element/src/events/defineEvents.js";
import NudeElement from "../../node_modules/nude-element/src/Element.js";
import "../gamut-badge/gamut-badge.js";

let importIncrementable;

const Self = class ColorSwatch extends NudeElement {
	static tagName = "color-swatch";
	static Color = Color;

	_el = {};

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
	}

	#initialized;

	connectedCallback () {
		super.connectedCallback();

		if (!this.#initialized) {
			this.#initialize();
		}
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

	// Gets called when the element is connected for the first time
	#initialize ({force} = {}) {
		if (!force && this.#initialized) {
			return;
		}

		this.#initialized = true;

		this._el.wrapper = this.shadowRoot.querySelector("#wrapper");
		this._el.colorWrapper = this.shadowRoot.querySelector("[part=color-wrapper]");
		this._el.slot = this.shadowRoot.querySelector("slot:not([name])");

		this.#updateStatic();
		this._el.slot.addEventListener("slotchange", evt => this.#updateStatic());

		this.gamuts = null;
		if (!this.matches('[gamuts="none"]')) {
			this.gamuts = this.getAttribute("gamuts") ?? "srgb, p3, rec2020: P3+, prophoto: PP";
			this._el.gamutIndicator = document.createElement("gamut-badge");

			Object.assign(this._el.gamutIndicator, {
				gamuts: this.gamuts,
				id: "gamut",
				part: "gamut",
				exportparts: "label: gamutlabel",
			});

			this._el.colorWrapper.appendChild(this._el.gamutIndicator);

			this._el.gamutIndicator.addEventListener("gamutchange", evt => {
				let gamut = this._el.gamutIndicator.gamut;
				this.setAttribute("gamut", gamut);
				this.dispatchEvent(new CustomEvent("gamutchange", {
					detail: gamut,
				}));
			});
		}

		if (this.hasAttribute("property")) {
			this.property = this.getAttribute("property");
			this.scope = this.getAttribute("scope") ?? ":root";
			this._el.style = document.createElement("style");
			document.head.appendChild(this._el.style);

			let varRef = `var(${this.property})`;
			if (this.verbatim) {
				this.style.setProperty("--color", varRef);
				this.value ||= varRef;
			}
			else {
				let scopeRoot = this.closest(this.scope);

				// Is contained within scope root
				if (scopeRoot) {
					this.style.setProperty("--color", varRef);
				}

				scopeRoot ??= document.querySelector(this.scope);

				if (scopeRoot) {
					let cs = getComputedStyle(scopeRoot);
					this.value = cs.getPropertyValue(this.property);
				}
			}
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
				return [...this.childNodes].filter(n => !n.slot).map(n => n.textContent).join("");
			},
			reflect: {
				from: "color",
			}
		},
		color: {
			type: Color,
			parse (value) {
				clearTimeout(this._errorTimeout);

				let ret = null;
				try {
					ret = new Color(value);
				}
				catch (e) {
					// Why a timeout? We don't want to produce errors for intermediate states while typing,
					// but if this is a genuine error, we do want to communicate it.
					this._errorTimeout = setTimeout(_ => this._el.input?.setCustomValidity(e.message), 500);
				}

				if (ret) {
					this._el.input?.setCustomValidity("");
				}

				return ret;
			},
			defaultProp: "value",
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