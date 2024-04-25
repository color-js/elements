
import Color from "../common/color.js";
import * as dom from "../common/dom.js";
import defineAttributes from "../common/attributes.js";
import defineFormAssociated from "../common/form-associated.js";

let styleURL = new URL("./color-slider.css", import.meta.url);

export default class ColorSlider extends HTMLElement {
	#initialized = false;

	constructor () {
		super();
		this.attachShadow({mode: "open"});
		this.shadowRoot.innerHTML = `
			<style>@import url("${ styleURL }")</style>
			<input type="range" class="color-slider" part="slider" min="0" max="1" step="0.001" />
		`;

		this._el = dom.named(this);
	}

	connectedCallback() {
		this.attributeChangedCallback();

		this._el.slider.addEventListener("input", this);

		if (!this.#initialized) {
			this.#initialized = true;

			this._el.slider.dispatchEvent(new Event("input"));
		}
	}

	disconnectedCallback() {
		this._el.slider.removeEventListener("input", this);
	}

	handleEvent(event) {
		this.color = this.colorAt(this.value);
		this.dispatchEvent(new event.constructor(event.type, {...event}));
	}

	propChangedCallback (name, change) {
		if (name === "stops" || name === "space") {
			// FIXME will fail if there are none values
			if (name === "stops") {
				this._el.slider.style.setProperty("--stops", change.attributeValue ?? change.value);
			}
			else if (name === "space") {
				this._el.slider.style.setProperty("--color-space", change.attributeValue ?? change.value);
			}

			let stops = this.stops;
			this.scales = [];

			for (let i=1; i<stops.length; i++) {
				let start = stops[i - 1];
				let end = stops[i];
				let range = start.range(end, { space: this.space });
				this.scales.push(range);
			}
		}
	}

	get progress () {
		return this.progressAt(this.value);
	}

	progressAt (p) {
		return (p - this.min) / (this.max - this.min);
	}

	colorAt (p) {
		let bands = this.scales?.length;

		if (bands <= 0) {
			return null;
		}

		// Map to the 0-1 range
		p = this.progressAt(p);

		// FIXME the values outside of [0, 1] should be scaled
		if (p >= 1) {
			return this.scales.at(-1)(p);
		}
		else if (p <= 0) {
			return this.scales[0](p);
		}

		let band = 1 / bands;
		let scaleIndex = Math.max(0, Math.min(Math.floor(p / band), bands - 1));
		let scale = this.scales[scaleIndex];
		let color = scale((p % band) * bands);

		return color;
	}

	static attributes = {
		min: {
			type: Number,
			propagateTo: (element) => element._el.slider,
			default: 0,
		},
		max: {
			type: Number,
			propagateTo: (element) => element._el.slider,
			default: 1,
		},
		value: {
			type: Number,
			default: el => (el.min + el.max) / 2,
			propagateTo: (element) => element._el.slider,
			get: (element) => Number(element._el.slider.value),
		},
		step: {
			type: Number,
			propagateTo: (element) => element._el.slider,
			default: el => (el.max - el.min) / 1000,
		},
		stops: {
			type: Array,
			itemType: Color,
			default: el => []
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
			}
		},
	}
}

defineAttributes(ColorSlider);
defineFormAssociated(ColorSlider, {
	getSource: el => el._el.slider,
	role: "slider",
	valueProp: "value",
	changeEvent: "input",
});

customElements.define("color-slider", ColorSlider);