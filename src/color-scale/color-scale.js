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
		let colors = this.colors, colorCount = Object.values(colors).length;

		let i = 0;
		let newSwatches = [];
		for (let colorName in colors) {
			let color = colors[colorName];
			let swatch = this.#swatches[i] = this.children[i];

			if (!swatch) {
				this.#swatches[i] = swatch = document.createElement("color-swatch");
				swatch.setAttribute("size", "large");
				newSwatches.push(swatch);
			}

			swatch.color = color;
			swatch.textContent = colorName;
		}

		if (newSwatches.length > 0) {
			this.append(...newSwatches);
		}
		else if (colorCount < this.children.length) {
			// Remove but keep them around in this.#swatches
			[...this.children].slice(colorCount).forEach(child => child.remove());
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
			type: Object,
			typeOptions: {
				valueType: Color,
				defaultKey: (v, i) => v,
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