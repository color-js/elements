
import Color from "../common/color.js";
import Props from "../common/props.js";
import defineFormAssociated from "../common/form-associated.js";

export const tagName = "color-slider";
let styleURL = new URL(`./${tagName}.css`, import.meta.url);

export default class ColorSlider extends HTMLElement {
	#initialized = false;

	constructor () {
		super();
		this.attachShadow({mode: "open"});
	}

	connectedCallback() {
		if (!this.#initialized) {
			this.attributeChangedCallback("max");
			this.attributeChangedCallback("min");
			this.attributeChangedCallback("value");

			this.shadowRoot.innerHTML = `
			<style>@import url("${ styleURL }")</style>
			<input type="range" class="color-slider" part="slider"
			       min="${ this.min }" max="${ this.max }" step="${ this.step }" value="${ this.defaultValue }" />`;

			this._el = {
				slider: this.shadowRoot.querySelector(".color-slider"),
			};

			this.attributeChangedCallback();

			this._el.slider.addEventListener("input", this);

			this.#initialized = true;

			this._el.slider.dispatchEvent(new Event("input"));
		}
	}

	disconnectedCallback() {
		this._el.slider.removeEventListener("input", this);
	}

	handleEvent(event) {
		this.value = this._el.slider.value;
		this.dispatchEvent(new event.constructor(event.type, {...event}));
	}

	propChangedCallback (prop, change) {
		let name = prop.name;
		let slider = this._el?.slider;

		if (["min", "max", "step", "value", "defaultValue"].includes(name)) {
			slider && prop.applyChange(slider, change);
		}

		if (!name || name === "stops" || name === "space") {
			let stops = this.stops;
			let supported = stops.every(color => !CSS.supports("color", color));
			// FIXME will fail if there are none values

			if (name === "stops") {
				if (!supported) {
					stops = this.tessellateStops({ steps: 3 });
				}

				stops = stops.map(color => color.display()).join(", ");

				this.style.setProperty("--stops", stops);
			}
			else if (name === "space") {
				let space = this.space;
				let spaceId = space.id;

				if (supported) {
					spaceId = this.space.isPolar ? "oklch" : "oklab";
				}

				this.style.setProperty("--color-space", spaceId);
			}
		}

		if (name === "color") {
			this.style.setProperty("--color", this.color?.display());
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

	progressAt (p) {
		return (p - this.min) / (this.max - this.min);
	}

	colorAt (p) {
		let progress = this.progressAt(p);
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
				return Math.abs(this.max - this.min) / 1000;
			},
		},
		stops: {
			type: Array,
			itemType: Color,
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
				return this.stops[0]?.space;
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
	}
}

Props.create(ColorSlider);
defineFormAssociated(ColorSlider, {
	getSource: el => el._el.slider,
	role: "slider",
	valueProp: "value",
	changeEvent: "input",
});

customElements.define(tagName, ColorSlider);