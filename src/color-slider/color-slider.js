
import Color from "../common/color.js";
import NudeElement from "../common/Element.js";
import { getStep } from "../common/util.js";

const Self = class ColorSlider extends NudeElement {
	static postConstruct = [];
	static tagName = "color-slider";

	constructor () {
		super();
		this.attachShadow({mode: "open"});

		let styleURL = new URL(`./${this.constructor.tagName}.css`, import.meta.url);
		this.shadowRoot.innerHTML = `
			<style>@import url("${ styleURL }")</style>
			<input type="range" class="color-slider" part="slider" min="0" max="1" step="0.01" part="slider" />
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
		if (["min", "max", "step", "value", "defaultValue"].includes(name)) {
			prop.applyChange(this._el.slider, change);

			let spinnerValue = this.tooltip === "progress" ? +(this.progress * 100).toPrecision(4) : this.value;
			prop.applyChange(this._el.spinner, {...change, value: spinnerValue});
		}

		if (name === "stops" || name === "space") {
			let stops = this.stops;
			let supported = stops.every(color => !CSS.supports("color", color));
			// FIXME will fail if there are none values

			if (name === "stops") {
				if (!supported) {
					stops = this.tessellateStops({ steps: 3 });
				}

				stops = stops.map(color => color.display()).join(", ");

				this.style.setProperty("--slider-color-stops", stops);
			}
			else if (name === "space") {
				let space = this.space;
				let spaceId = space.id;

				if (!supported) {
					spaceId = this.space.isPolar ? "oklch" : "oklab";
				}

				this.style.setProperty("--color-space", spaceId);
			}
		}

		if (name === "color" || name === "defaultColor") {
			let color = this.color;

			if (color) {
				let displayedColor = color.display();
				this.style.setProperty("--color", displayedColor);
			}
		}

		if (name === "value") {
			this.style.setProperty("--progress", this.progress);

			if (!CSS.supports("field-sizing", "content")) {
				let valueStr = this.value + "";
				this._el.spinner.style.setProperty("--value-length", valueStr.length);
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
			type: Array,
			typeOptions: {
				itemType: Color,
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
		},
		scales: {
			get () {
				let stops = this.stops;
				let scales = [];

				for (let i=1; i<stops.length; i++) {
					let start = stops[i - 1];
					let end = stops[i];
					let range = start.range(end, { space: this.space, hue: "raw" });
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
		getSource: el => el._el.slider,
		role: "slider",
		valueProp: "value",
		changeEvent: "valuechange",
	};
}

customElements.define(Self.tagName, Self);

export default Self;