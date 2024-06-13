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
			<div id=swatches></div>
			<slot></slot>
		`;

		this._el = {
			slot: this.shadowRoot.querySelector("slot"),
			swatches: this.shadowRoot.getElementById("swatches"),
		};
	}

	connectedCallback() {
		super.connectedCallback?.();
		this._el.swatches.addEventListener("colorchange", this, {capture: true});
	}

	disconnectedCallback() {
		this._el.swatches.removeEventListener("colorchange", this, {capture: true});
	}

	handleEvent(event) {
		this.dispatchEvent(new event.constructor(event.type, {...event}));
	}

	propChangedCallback ({name, prop, detail: change}) {
		if (name === "computedColors") {
			// Re-render swatches
			this.render();
		}
	}

	#swatches = [];

	render () {
		let colors = this.computedColors;

		if (!colors) {
			return;
		}

		let colorCount = colors.length;

		let i = 0;
		let newSwatches = [];
		for (let {name, color} of colors) {
			let swatch = this.#swatches[i] = this._el.swatches.children[i];

			if (!swatch) {
				this.#swatches[i] = swatch = document.createElement("color-swatch");
				swatch.setAttribute("size", "large");
				swatch.setAttribute("part", "color-swatch");
				swatch.setAttribute("exportparts", "swatch, info");
				newSwatches.push(swatch);
			}

			swatch.color = color;
			swatch.textContent = name;
			if (this.coords) {
				swatch.coords = this.coords;
			}
			i++;
		}

		if (newSwatches.length > 0) {
			this._el.swatches.append(...newSwatches);
		}
		else if (colorCount < this._el.swatches.children.length) {
			// Remove but keep them around in this.#swatches
			[...this._el.swatches.children].slice(colorCount).forEach(child => child.remove());
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
			type: {
				is: Object,
				values: Color,
				defaultKey: (v, i) => v,
			},
		},
		steps: {
			type: Number,
			default: 0,
		},
		computedColors: {
			get () {
				if (!this.colors) {
					return null;
				}

				let colors = Object.entries(this.colors).map(([name, color]) => ({name, color}));

				if (this.steps > 0) {
					// Insert intermediate steps
					let tessellated = [];

					for (let i = 1; i < colors.length; i++) {
						let start = colors[i - 1];
						let end = colors[i];
						let steps = Color.steps(start.color, end.color, { space: this.space, steps: this.steps + 2 });

						steps.shift();
						steps.pop();
						steps = steps.map(color => ({name: color + "", color}));

						tessellated.push(start, ...steps);

						if (i === colors.length - 1) {
							// Only add the last color at the end
							// In all other iterations, it’s the same as the start of the next pair
							tessellated.push(end);
						}
					}

					colors = tessellated;
				}

				return colors;
			},
			additionalDependencies: ["coords"],
		},
		coords: {},
	};
}

customElements.define(Self.tagName, Self);

export default Self;