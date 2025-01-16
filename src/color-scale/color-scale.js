import ColorElement from "../common/color-element.js";
import "../color-swatch/color-swatch.js";

const Self = class ColorScale extends ColorElement {
	static tagName = "color-scale";
	static url = import.meta.url;
	static dependencies = new Set(["color-swatch"]);
	static shadowStyle = true;
	static shadowTemplate = `
		<div id=swatches></div>
		<slot></slot>`;

	constructor () {
		super();

		this._el = {
			slot: this.shadowRoot.querySelector("slot"),
			swatches: this.shadowRoot.getElementById("swatches"),
		};
	}

	connectedCallback () {
		super.connectedCallback?.();
		this._el.swatches.addEventListener("colorchange", this, {capture: true});
	}

	disconnectedCallback () {
		this.#swatches = [];
		this._el.swatches.removeEventListener("colorchange", this, {capture: true});
	}

	handleEvent (event) {
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
				swatch.setAttribute("exportparts", "swatch, info, gamut, label: swatch-label");
				newSwatches.push(swatch);
			}

			swatch.color = color;
			swatch.label = name;
			if (this.info) {
				swatch.info = this.info;
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

	static props = {
		colors: {
			type: {
				is: Object,
				// Support overriding the Color object
				get values () {
					return ColorScale.Color;
				},
				defaultKey: (v, i) => v,
			},
		},
		space: {
			default: "oklch",
			parse (value) {
				let ColorSpace = ColorScale.Color.Space;
				if (value instanceof ColorSpace || value === null || value === undefined) {
					return value;
				}

				value += "";

				return ColorSpace.get(value);
			},
			stringify (value) {
				return value?.id;
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
						let steps = ColorScale.Color.steps(start.color, end.color, { space: this.space, steps: this.steps + 2 });

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
			additionalDependencies: ["info"],
		},
		info: {},
	};

	static events = {
		colorschange: {
			propchange: "computedColors",
		},
	};
};

Self.define();

export default Self;
