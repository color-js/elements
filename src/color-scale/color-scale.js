import "../color-swatch/color-swatch.js";
import NudeElement from "../../node_modules/nude-element/src/Element.js";
import Color from "../common/color.js";

const Self = class ColorScale extends NudeElement {
	static tagName = "color-scale";
	static Color = Color;

	constructor () {
		super();

		this.attachShadow({mode: "open"});
		let styleURL = new URL(`./${Self.tagName}.css`, import.meta.url);
		this.shadowRoot.innerHTML = `
			<style>@import url("${ styleURL }")</style>
			<slot></slot>
		`;

		this._el = this.shadowRoot.querySelector("slot");
	}

	connectedCallback() {
		super.connectedCallback?.();
		this._el.addEventListener("colorchange", this, {capture: true});
	}

	disconnectedCallback() {
		this._el.removeEventListener("colorchange", this, {capture: true});
	}

	handleEvent(event) {
		this.dispatchEvent(new event.constructor(event.type, {...event}));
	}

	propChangedCallback ({name, prop, detail: change}) {
		if (name === "colors") {
			// Re-render swatches
			this.render();
		}
		else if (name === "steps") {
			// Re-render swatches
		}
	}

	#swatches = [];

	render () {
		let colors = this.colors;

		for (let i=0; i<this.children.length; i++) {
			this.#swatches[i] = this.children[i];

			if (colors.length > i) {
				this.#swatches[i].color = colors[i];
			}
			else {
				this.#swatches[i].remove();
			}
		}

		if (colors.length > this.#swatches.length) {
			let newSwatches = Array.from({length: colors.length - this.#swatches.length}, (_, i) => {
				let swatch = document.createElement("color-swatch");
				swatch.color = colors[i];
				swatch.setAttribute("size", "large");
				return swatch;
			});
			this.append(...newSwatches);
			this.#swatches.push(...newSwatches);
		}
	}

	disconnectedCallback () {
		this.#swatches = [];
	}

	static props = {
		space: {
			default: "oklch",
			parse (value) {
				if (value instanceof Color.Space || value === null || value === undefined) {
					return value;
				}

				value += "";

				return Color.Space.get(value);
			},
			stringify (value) {
				return value?.id;
			},
		},
		colors: {
			type: Array,
			typeOptions: {
				itemType: Color,
			},
			// get () {

			// },
			// set: true,
		},
		steps: {

		},
	};
}

customElements.define(Self.tagName, Self);