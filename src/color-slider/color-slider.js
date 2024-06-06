
import Color from "../common/color.js";
import NudeElement from "../../node_modules/nude-element/src/Element.js";
import { getStep } from "../common/util.js";

let supports = {
	inSpace: CSS?.supports("background", "linear-gradient(in oklab, red, tan)"),
	fieldSizing: CSS?.supports("field-sizing", "content"),
};

const Self = class ColorSlider extends NudeElement {
	static tagName = "color-slider";
	static Color = Color;

	constructor () {
		super();
		this.attachShadow({mode: "open"});

		let styleURL = new URL(`./${this.constructor.tagName}.css`, import.meta.url);
		this.shadowRoot.innerHTML = `
			<style>@import url("${ styleURL }")</style>
			<input type="range" class="color-slider" part="slider" min="0" max="1" step="0.01" />
			<slot name="tooltip" class="slider-tooltip">
				<input type="number" part="spinner" min="0" max="1" step="0.01" />
			</slot>
			<slot></slot>
			`;

		this._el = {
			slider: this.shadowRoot.querySelector(".color-slider"),
			spinner: this.shadowRoot.querySelector("input[type=number]"),
		};
	}

	connectedCallback() {
		super.connectedCallback?.();

		this._el.slider.addEventListener("input", this);
		this._el.spinner.addEventListener("input", this);
	}

	disconnectedCallback() {
		this._el.slider.removeEventListener("input", this);
		this._el.spinner.removeEventListener("input", this);
	}

	handleEvent (event) {
		if (event.type === "input") {
			if (this.tooltip === "progress" && event.target === this._el.spinner) {
				// Convert to value
				let value = this._el.spinner.value;
				this.value = this.valueAt(value / 100);
			}
			else {
				this.value = event.target.value;
			}

			this.dispatchEvent(new event.constructor(event.type, {...event}));
		}
	}

	propChangedCallback ({name, prop, detail: change}) {
		// Spinner values when tooltip is "progress"
		let values = { min: 1, max: 100, step: 1, value: +(this.progress * 100).toPrecision(4) };
		values["defaultValue"] = values.value;

		if (["min", "max", "step", "value", "defaultValue"].includes(name)) {
			prop.applyChange(this._el.slider, change);

			let value = this.tooltip === "progress" ? values[name] : change.value;
			prop.applyChange(this._el.spinner, {...change, value});
		}

		if (name === "stops") {
			// FIXME will fail if there are none values
			let stops = this.stops;
			let supported = stops.every(color => CSS.supports("color", color));

			// CSS does not support (yet?) a raw hue interpolation,
			// so we need to fake it with tessellateStops() in cases of polar space and far-apart stops.
			let farApart = false;
			let space = this.space;
			if (space.isPolar) {
				for (let i = 1; i < stops.length; i++) {
					// Even though space is polar, color stops might be in non-polar spaces
					let first = stops[i - 1].to(space);
					let second = stops[i].to(space);

					let firstHue = first.get("h");
					let secondHue = second.get("h");

					if (Math.abs(firstHue - secondHue) >= 180) {
						farApart = true;
						break;
					}
				}
			}

			if (!supported || farApart) {
				stops = this.tessellateStops({ steps: 3 });
			}

			stops = stops.map(color => color.display()).join(", ");

			this.style.setProperty("--slider-color-stops", stops);
		}
		else if (name === "space" && supports.inSpace) {
			let space = this.space;
			let spaceId = space.id;
			let supported = CSS.supports("background", `linear-gradient(in ${ spaceId }, red, tan)`);

			if (!supported) {
				spaceId = this.space.isPolar ? "oklch" : "oklab";
			}

			this.style.setProperty("--color-space", spaceId);
		}
		else if (name === "color" || name === "defaultColor") {
			let color = this.color;

			if (color) {
				let displayedColor = color.display();
				this.style.setProperty("--color", displayedColor);
			}
		}
		else if (name === "value" || name === "min" || name === "max") {
			this.style.setProperty("--progress", this.progress);

			if (name === "value" && !supports.fieldSizing) {
				let valueStr = this.value + "";
				this._el.spinner.style.setProperty("--value-length", valueStr.length);
			}
		}
		else if (name === "tooltip") {
			if (change.value !== undefined) {
				["min", "max", "step", "value"].forEach(name => {
					this._el.spinner[name] = change.value === "progress" ? values[name] : this[name];
				});
			}
		}
	}

	tessellateStops (options = {}) {
		let stops = this.stops;
		let tessellated = [];

		for (let i=1; i<stops.length; i++) {
			let start = stops[i - 1];
			let end = stops[i];
			let steps = start.steps(end, { space: this.space, ...options });
			tessellated.push(...steps);

			if (i < stops.length - 1) {
				tessellated.pop();
			}
		}

		return tessellated;
	}

	get progress () {
		return this.progressAt(this.value);
	}

	progressAt (value) {
		return (value - this.min) / (this.max - this.min);
	}

	valueAt (progress) {
		return this.min + progress * (this.max - this.min);
	}

	colorAt (value) {
		let progress = this.progressAt(value);
		return this.colorAtProgress(progress);
	}

	colorAtProgress (progress) {
		let bands = this.scales?.length;

		if (bands <= 0) {
			return null;
		}

		// FIXME the values outside of [0, 1] should be scaled
		if (progress >= 1) {
			return this.scales.at(-1)(progress);
		}
		else if (progress <= 0) {
			return this.scales[0](progress);
		}

		let band = 1 / bands;
		let scaleIndex = Math.max(0, Math.min(Math.floor(progress / band), bands - 1));
		let scale = this.scales[scaleIndex];
		let color = scale((progress % band) * bands);

		return color;
	}

	static props = {
		min: {
			type: Number,
			default: 0,
		},
		max: {
			type: Number,
			default: 1,
		},
		step: {
			type: Number,
			default () {
				return getStep(this.max, this.min, { minSteps: 100 });
			},
		},
		stops: {
			type: {
				is: Array,
				values: Color,
			},
			default: el => []
		},
		defaultValue: {
			type: Number,
			default () {
				return (this.min + this.max) / 2;
			},
			reflect: {
				from: "value",
			},
		},
		value: {
			type: Number,
			defaultProp: "defaultValue",
			reflect: false,
		},

		space: {
			default () {
				return this.stops[0]?.space ?? "oklab";
			},
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

		color: {
			type: Color,
			get () {
				return this.colorAt(this.value);
			},
			dependencies: ["scales", "value"],
		},
		scales: {
			get () {
				let stops = this.stops;
				let scales = [];

				for (let i=1; i<stops.length; i++) {
					let start = stops[i - 1];
					let end = stops[i];
					let range = start.range(end, { space: this.space });
					scales.push(range);
				}

				return scales;
			},
			dependencies: ["stops", "space"],
		},

		tooltip: {
			type: String,
		},
	};

	static events = {
		change: {
			from () {
				return this._el.slider;
			}
		},
		valuechange: {
			propchange: "value",
		},
		colorchange: {
			propchange: "color",
		},
	};

	static formAssociated = {
		like: el => el._el.slider,
		role: "slider",
		valueProp: "value",
		changeEvent: "valuechange",
	};
}

customElements.define(Self.tagName, Self);

export default Self;