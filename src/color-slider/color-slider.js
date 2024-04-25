/*
<label v-for="(meta, i) in coord_meta" class="color-slider-label">
	{{ meta.name }} ({{ meta.min }}-{{ meta.max }})
	<input class="color-slider" type="range" v-model.number="coords[i]" :style="`--stops: ${ slider_steps[i] }`" :min="meta.min" :max="meta.max" :step="meta.step" />
	<input type="number" v-model.number="coords[i]" class="autosize" :style="`--percentage: ${coords[i] / (meta.max - meta.min) }`" :min="meta.min" :max="meta.max" :step="meta.step" />
</label>

<label class="color-slider-label">Alpha (0-100)
	<input class="color-slider" type="range" v-model.number="alpha"
	:style="`--stops: ${ slider_steps[coord_meta.length] }`" />
	<input type="number" class="autosize" v-model.number="alpha" :style="`--percentage: ${alpha / 100}`" max="100" />
</label>*/
import defineAttributes from "../common/attributes.js";
import * as dom from "../common/dom.js";
import Color from "../common/color.js";

let styleURL = new URL("./color-slider.css", import.meta.url);

export default class ColorSlider extends HTMLElement {
	_slots = {};

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

		if (this.color) {
			this.initialColor = this.color;
		}

		this._el.slider.addEventListener("input", this);
	}

	disconnectedCallback() {
		this._el.slider.removeEventListener("input", this);
	}

	handleEvent(event) {
		this.color = this.colorAt(this._el.slider.value);
		this.dispatchEvent(new event.constructor(event.type, {...event}));
	}

	changed (name, change) {
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

	colorAt (p) {
		let bands = this.scales?.length;

		if (bands <= 0) {
			return null;
		}

		let band = 1 / bands;
		p = p / bands;
		let scaleIndex = Math.max(0, Math.min(Math.floor(p / band), bands - 1));
		let scale = this.scales[scaleIndex];
		let color = scale(p % band);
		// TODO handle values outside [0, 1]
		return color;
	}

	static attributes = {
		stops: {
			type: Array,
			itemType: Color,
			default: el => []
		},
		color: {
			type: Color,
			default () {
				return this.colorAt(0.5);
			}
		},
		space: {
			type: String,
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
		value: {
			retarget () {
				return this._el.slider;
			}
		}
	}
}

defineAttributes(ColorSlider);

customElements.define("color-slider", ColorSlider);