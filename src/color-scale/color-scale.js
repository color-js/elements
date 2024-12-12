import ColorElement from "../common/color-element.js";
import "../color-swatch/color-swatch.js";

const Self = class ColorScale extends ColorElement {
	static tagName = "color-scale";
	static url = import.meta.url;
	static dependencies = new Set(["color-swatch"]);
	static shadowStyle = true;
	static shadowTemplate = `
		<div part="wrapper">
			<div id=swatches></div>
			<slot name="add-button"></slot>
		</div>
		<slot></slot>`;

	constructor () {
		super();

		this._el = {
			slot: this.shadowRoot.querySelector("slot"),
			swatches: this.shadowRoot.getElementById("swatches"),
		};

		this._slots = {
			add_button: this.shadowRoot.querySelector("slot[name=add-button]"),
		};
	}

	connectedCallback () {
		super.connectedCallback?.();
		this._el.swatches.addEventListener("labelchange", this, {capture: true});
		this._el.swatches.addEventListener("colorchange", this, {capture: true});
		this._el.swatches.addEventListener("click", this, {capture: true});
		this._slots.add_button.addEventListener("click", this);
	}

	disconnectedCallback () {
		this.#swatches = [];
		this._el.swatches.removeEventListener("labelchange", this, {capture: true});
		this._el.swatches.removeEventListener("colorchange", this, {capture: true});
		this._el.swatches.removeEventListener("click", this, {capture: true});
		this._slots.add_button.removeEventListener("click", this);
	}

	handleEvent (event) {
		let source = event.target;

		if (event.type === "click" && source === this._el.add_button || this._slots.add_button.assignedElements().includes(source)) {
			this.addColor();
			return;
		}

		if (event.type === "colorchange" && source.matches("color-swatch:not(.intermediate, .ignore-updates)")) {
			this.updateColor(source);
		}
		else if (event.type === "labelchange" && source.matches("color-swatch:not(.intermediate, .ignore-updates)")) {
			this.updateColorName(source);
		}
		else if (event.type === "click" && source.closest(`button[part="delete button"]`)) {
			this.deleteColor(source.closest("color-swatch"));
		}

		this.dispatchEvent(new event.constructor(event.type, {...event}));
	}

	propChangedCallback ({name, prop, detail: change}) {
		if (name === "computedColors" && this !== document.activeElement) {
			// Re-render swatches
			// Only if nothing is being edited, otherwise the input would be lost
			// or, e.g., "red" would be converted to "rgb(100%, 0%, 0%)" right after the typing is done
			this.render();
		}

		if (name === "editable") {
			if (this.editable?.add) {
				if (!this._el.add_button) {
					this._el.add_button = Object.assign(document.createElement("button"), {part: "add button", title: "Add color", textContent: "+"});
					this._slots.add_button.append(this._el.add_button);
				}
			}
			else {
				this._el.add_button?.remove();
				this._el.add_button = null;
			}

			this.render();
		}
	}

	#swatches = [];

	#validIndex (index) {
		if (!this._el.swatches.children.length) {
			console.warn("There are no colors to work with.");
			return false;
		}

		if (index < 0 || index >= this._el.swatches.children.length) {
			console.warn(`No color with index "${ index }". The index should be from 0 up to but not including ${ this._el.swatches.children.length }.`);
			return false;
		}

		return true;
	}

	addColor (color, name) {
		color ??= this.defaultColor;
		name ??= color?.name || "New color";

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
			input?.focus();
			input?.select();
		}
	}

	updateColor (swatch, color = swatch?.color) {
		if (swatch === undefined || swatch === null) {
			return;
		}

		if (typeof swatch === "number") {
			// The index of a swatch is passed
			if (!this.#validIndex(swatch)) {
				return;
			}

			swatch = this._el.swatches.children[swatch];

			if (!color) {
				console.warn("You should provide a new color for the color swatch.");
				return;
			}
			else if (swatch.color.equals(color)) {
				// Nothing to change
				return;
			}
		}

		if (swatch.matches(".intermediate")) {
			console.warn("Cannot update intermediate colors. They are calculated automatically and will be overwritten when the color scale is re-rendered the next time.");
			return;
		}

		if (this.colors[swatch.label].equals(color)) {
			// Nothing to update
			return;
		}

		this.colors = {...this.colors, [swatch.label]: color};

		if (this.steps) {
			// Update the UI to reflect the new intermediate colors
			// If there are no intermediate colors, the UI is already up-to-date
			this.render();

			// Preserve the cursor position — set it to the end of the input
			let input = swatch.querySelector("input.color.editable");
			let end = input?.value.length;
			input?.setSelectionRange(end, end);
			input?.focus();
		}
	}

	updateColorName (swatch, newName = swatch?.label) {
		if (swatch === undefined || swatch === null) {
			return;
		}

		if (typeof swatch === "number") {
			// The index of a swatch is passed
			if (!this.#validIndex(swatch)) {
				return;
			}

			swatch = this._el.swatches.children[swatch];

			if (newName === undefined) {
				console.warn("You should provide a new name for the color.");
				return;
			}
			else if (swatch.label === newName) {
				// Nothing to change
				return;
			}
		}

		if (swatch.matches(".intermediate")) {
			console.warn("Cannot update names of intermediate colors. They are calculated automatically and will be overwritten when the color scale is re-rendered the next time.");
			return;
		}

		// In color scales, colors must have names: either the provided one or the default.
		// If they are not supposed to be shown, they can be hidden with CSS.
		newName ||= swatch.color.toString();

		if (this.colors[newName]) {
			// Name already exists
			// Append a number to the name
			// Why? Objects cannot have duplicate keys
			let i = 1;
			while (this.colors[`${ newName } ${ i }`]) {
				i++;
			}
			newName = `${ newName } ${ i }`;
		}

		if (swatch.label !== newName) {
			// This will trigger the labelchange event again, and the colors will be updated on the next tick
			swatch.label = newName;
		}
		else {
			// Update the name of the existing color preserving the colors order
			this.colors = Object.fromEntries([...this._el.swatches.children].map(swatch => [swatch.label, swatch.color]));
		}
	}

	deleteColor (swatch) {
		if (swatch === undefined || swatch === null) {
			return;
		}

		if (typeof swatch === "number") {
			// The index of a swatch is passed
			if (!this.#validIndex(swatch)) {
				return;
			}

			swatch = this._el.swatches.children[swatch];
		}

		if (swatch.matches(".intermediate")) {
			console.warn("Cannot delete intermediate colors. They are calculated automatically and will be re-added when the color scale is re-rendered the next time.");
			return;
		}

		let colorName = swatch.label;

		if (!this.steps) {
			swatch.remove();
		}

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
				swatch.setAttribute("exportparts", "swatch, info, gamut, label");
				newSwatches.push(swatch);
			}

			// We should ignore all labelchange and colorchange events until the color scale is fully rendered
			swatch.classList.add("ignore-updates");

			swatch.classList[intermediate ? "add" : "remove"]("intermediate");

			if (!intermediate) {
				// Make the swatch editable, if needed
				let editable;
				if (this.editable?.name) {
					(editable ??= {}).label = true;
				}
				if (this.editable?.color) {
					(editable ??= {}).color = true;
				}

				if (editable) {
					swatch.editable = editable;
				}
				else {
					swatch.editable = false;
				}

				let deleteButton = swatch.querySelector(`[part="delete button"]`);
				if (this.editable?.delete) {
					if (!deleteButton) {
						// The icon is from https://iconify.design/
						swatch.insertAdjacentHTML("beforeend", `
							<button part="delete button" title="Delete color">
								<svg viewBox="0 0 24 24">
									<path fill="currentColor" fill-rule="evenodd" d="m18.412 6.5l-.801 13.617A2 2 0 0 1 15.614 22H8.386a2 2 0 0 1-1.997-1.883L5.59 6.5H3.5v-1A.5.5 0 0 1 4 5h16a.5.5 0 0 1 .5.5v1zM10 2.5h4a.5.5 0 0 1 .5.5v1h-5V3a.5.5 0 0 1 .5-.5M9 9l.5 9H11l-.4-9zm4.5 0l-.5 9h1.5l.5-9z" />
								</svg>
							</button>
						`);
					}
				}
				else {
					deleteButton?.remove();
				}
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

		// The scale is fully rendered, so we no longer need to ignore labelchange and colorchange events from the swatches
		[...this._el.swatches.children].forEach(swatch => swatch.classList.remove("ignore-updates"));
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
						list: true,
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
			convert (value) {
				if (value?.list) {
					// Enable the list operations: add, delete, reorder, etc.
					delete value.list;
					return {...value, add: true, delete: true, reorder: true};
				}

				return value;
			},
			reflect: {
				from: true,
			},
		},
		defaultColor: {
			get type () {
				return Self.Color;
			},
			default () {
				return this.computedColors.at(-1)?.color ?? new Self.Color("oklab", [0.5, 0, 0]);
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
