import ColorElement from "../common/color-element.js";
import "../color-swatch/color-swatch.js";

const Self = class ColorScale extends ColorElement {
	static tagName = "color-scale";
	static url = import.meta.url;
	static dependencies = new Set(["color-swatch"]);
	static shadowStyle = true;
	static shadowTemplate = `
		<div id=swatches></div>
		<slot name="add-button">
			<button id="add-button" part="add-button">Add color</button>
		</slot>
		<slot></slot>`;

	constructor () {
		super();

		this._el = {
			slot: this.shadowRoot.querySelector("slot"),
			swatches: this.shadowRoot.getElementById("swatches"),
			add_button: this.shadowRoot.getElementById("add-button"),
		};

		this._slots = {
			add_button: this.shadowRoot.querySelector("slot[name=add-button]"),
		};
	}

	connectedCallback () {
		super.connectedCallback?.();
		this._el.swatches.addEventListener("input", this, {capture: true});
		this._el.swatches.addEventListener("colorchange", this, {capture: true});
		this._el.swatches.addEventListener("click", this, {capture: true});
		this._slots.add_button.addEventListener("click", this);
	}

	disconnectedCallback () {
		this.#swatches = [];
		this._el.swatches.removeEventListener("input", this, {capture: true});
		this._el.swatches.removeEventListener("colorchange", this, {capture: true});
		this._el.swatches.removeEventListener("click", this, {capture: true});
		this._slots.add_button.removeEventListener("click", this);
	}

	handleEvent (event) {
		let source = event.target;

		if (event.type === "input" && (!this.editable?.name || !source.matches("input[slot=before]"))) {
			return;
		}

		if (source === this._el.add_button || this._slots.add_button.assignedElements().includes(source)) {
			this.addColor();
			return;
		}

		if (event.type === "colorchange") {
			// Update color
		}
		else if (event.type === "input") {
			// Update color name
		}
		else if (event.type === "click" && source.matches("[part=remove-button]")) {
			// Remove color
		}

		this.dispatchEvent(new event.constructor(event.type, {...event}));
	}

	propChangedCallback ({name, prop, detail: change}) {
		if (name === "computedColors" && !this.editable?.name && !this.editable?.color) {
			// Re-render swatches
			// Only if nothing is being edited, otherwise the input would be lost
			// or, e.g., "red" would be converted to "rgb(100%, 0%, 0%)" right after the typing is done
			this.render();
		}

		if (name === "editable") {
			if (this.editable?.color) {
				this._el.add_button.style.removeProperty("display");
			}
			else {
				this._el.add_button.style.setProperty("display", "none");
			}

			this.render();
		}
	}

	#swatches = [];

	addColor () {
		let {name, color} = this.defaultColor?.() ?? {};
		name ??= "New color";
		color ??= this.computedColors.at(-1)?.color ?? new Self.Color("#f06");

		if (this.colors[name]) {
			// Name already exists
			// Append a number to the name
			let i = 1;
			while (this.colors[`${ name } ${ i }`]) {
				i++;
			}
			name = `${ name } ${ i }`;
		}

		this.colors = {...this.colors, [name]: color.to(this.space)};
		this.render();

		if (this.editable?.color) {
			// Focus the new color input and select its content
			let swatch = this._el.swatches.lastElementChild;
			let input = swatch.querySelector("input:not([slot]");
			input.focus();
			input.select();
		}
	}

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
				swatch.setAttribute("exportparts", "swatch, info, gamut, remove-button");
				newSwatches.push(swatch);
			}

			swatch.color = color;
			if (this.editable?.name || this.editable?.color) {
				let html = "";

				if (this.editable.name) {
					html += `<input slot="before" value="${ name }" />`;
				}
				else {
					html += `<span slot="before">${ name }</span>`;
				}

				if (this.editable.color) {
					html += `<input value="${ color }" />`;
					html += `<button slot="swatch-content" part="remove-button" title="Remove color">❌</button>`;
				}

				swatch.innerHTML = html;
			}
			else {
				swatch.textContent = name;
			}

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
		editable: {
			parse (value) {
				if (value === undefined || value === null || value === false || value === "false") {
					return;
				}

				if (value === "" || value === "editable" || value === true || value === "true") {
					// Boolean attribute
					return {
						name: true,
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
			reflect: {
				from: true,
			},
		},
		defaultColor: {
			type: {
				is: Function,
			},
			reflect: false,
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
