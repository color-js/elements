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

		if (event.type === "input" && (!this.editable?.name || !source.matches(".color-name.editable"))) {
			// Ignore input events from the color input: the color changes are handled by the colorchange event
			return;
		}

		if (event.type === "click" && source === this._el.add_button || this._slots.add_button.assignedElements().includes(source)) {
			this.addColor();
			return;
		}

		if (event.type === "colorchange" && source.matches("color-swatch:not(.intermediate)")) {
			// Update color if it’s not an intermediate one
			this.updateColor(source);
		}
		else if (event.type === "input") {
			this.updateColorName(source.closest("color-swatch"), source.value);
		}
		else if (event.type === "click" && source.matches("button.delete-button")) {
			this.deleteColor(source.closest("color-swatch"));
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

	addColor (color, name) {
		let {name: defaultName, color: defaultColor} = this.defaultColor?.() ?? {};

		name ??= defaultName ?? "New color";
		color ??= defaultColor ?? this.computedColors.at(-1)?.color ?? new Self.Color("#f06");

		if (this.colors[name]) {
			// Name already exists
			// Append a number to the name
			let i = 1;
			while (this.colors[`${ name } ${ i }`]) {
				i++;
			}
			name = `${ name } ${ i }`;
		}

		this.colors = {...this.colors, [name]: color};
		this.render();

		if (this.editable?.color) {
			// Focus the new color input and select its content
			let swatch = this._el.swatches.lastElementChild;
			let input = swatch.querySelector("input.color.editable");
			input.focus();
			input.select();
		}
	}

	updateColor (swatch, color = swatch?.color) {
		if (!swatch) {
			return;
		}

		if (swatch.matches(".intermediate")) {
			console.warn("Cannot update intermediate colors. They are calculated automatically and will be overwritten when the color scale is re-rendered the next time.");
			return;
		}

		let colorNameElement = swatch.querySelector(".color-name");
		let colorName = colorNameElement?.value ?? colorNameElement?.textContent ?? swatch.textContent;

		this.colors = {...this.colors, [colorName]: color};

		if (this.steps) {
			// Update the UI to reflect the new intermediate colors
			// If there are no intermediate colors, the UI is already up-to-date
			this.render();

			// Preserve the cursor position — set it to the end of the input
			let input = swatch.querySelector("input.color.editable");
			let end = input.value.length;
			input.setSelectionRange(end, end);
			input.focus();
		}
	}

	updateColorName (swatch, newName) {
		if (!swatch || !newName) {
			return;
		}

		if (swatch.matches(".intermediate")) {
			console.warn("Cannot update names of intermediate colors. They are calculated automatically and will be overwritten when the color scale is re-rendered the next time.");
			return;
		}

		// Update the name of the existing color preserving the colors order
		let colors = Object.entries(this.colors);
		let index = colors.findIndex(([name, color]) => color.equals(swatch.color));
		colors.splice(index, 1, [newName, swatch.color]);

		this.colors = Object.fromEntries(colors);
	}

	deleteColor (swatch) {
		if (!swatch) {
			return;
		}

		if (swatch.matches(".intermediate")) {
			console.warn("Cannot delete intermediate colors. They are calculated automatically and will be re-added when the color scale is re-rendered the next time.");
			return;
		}

		let colorNameElement = swatch.querySelector(".color-name");
		let colorName = colorNameElement?.value ?? colorNameElement?.textContent ?? swatch.textContent;

		swatch.remove();

		let colors = {...this.colors};
		delete colors[colorName];
		this.colors = colors;

		if (this.editable) {
			// If we are in the edit mode, we need to force re-render the swatches
			this.render();
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
		for (let {name, color, intermediate} of colors) {
			let swatch = this.#swatches[i] = this._el.swatches.children[i];

			if (!swatch) {
				this.#swatches[i] = swatch = document.createElement("color-swatch");
				swatch.setAttribute("size", "large");
				swatch.setAttribute("part", "color-swatch");
				swatch.setAttribute("exportparts", "swatch, info, gamut");
				newSwatches.push(swatch);
			}

			swatch.classList[intermediate ? "add" : "remove"]("intermediate");

			if (!intermediate && (this.editable?.name || this.editable?.color)) {
				let html = "";

				if (this.editable.name) {
					// FIXME: What if there is content in the slot?
					html += `<input slot="before" class="color-name editable" value="${ name }" />`;
				}
				else {
					// FIXME: What if there is content in the slot?
					html += `<span slot="before" class="color-name">${ name }</span>`;
				}

				if (this.editable.color) {
					// FIXME: What if there is content in the slots?
					html += `<input class="color editable" value="${ color }" />`;
					html += `<button slot="swatch-content" class="delete-button" title="Delete color">❌</button>`;
				}

				swatch.innerHTML = html;
			}
			else {
				// FIXME: What if there is content in the slot?
				swatch.innerHTML = `<span slot="before" class="color-name">${ name }</span>`;
			}

			swatch.color = color;

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
						steps = steps.map(color => ({name: color + "", color, intermediate: true}));

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
