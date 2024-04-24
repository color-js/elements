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
import Color from "../common/color.js";

export default class ColorSlider extends HTMLElement {
	_props = {};

	constructor () {
		super();
		this.attachShadow({mode: "open"});
		this.shadowRoot.innerHTML = `
			<style>@import url("${ styleURL }")</style>
			<label v-for="(meta, i) in coord_meta" class="color-slider-label">
				{{ meta.name }} ({{ meta.min }}-{{ meta.max }})
				<input class="color-slider" type="range" v-model.number="coords[i]" :style="`--stops: ${ slider_steps[i] }`" :min="meta.min" :max="meta.max" :step="meta.step" />
				<input type="number" :style="`--percentage: ${coords[i] / (meta.max - meta.min) }`" :min="meta.min" :max="meta.max" :step="meta.step" />
			</label>
		`;
	}



	attributeChangedCallback (name, value, oldValue) {
		if (name in this.constructor.attributes) {
			this[name] = value;
		}
	}

	static get observedAttributes() {
		return Object.keys(this.attributes);
	}

	static attributes = {
		space: {
			type: String,
			default: "oklch",
		},
		component: {
			type: String,
			default: "h",
		},
		value: {
			type: Number,
			default: "oklch(0.5 0 180)",
		},
		min: {
			type: Number,
		},
		max: {
			type: Number,
		},
		step: {
			type: Number,
		},
		colorvalue: {
			type: Color,
		},
		colormin: {
			type: Color,
		},
		colormax: {
			type: Color,
		},
	}
}

defineAttributes(ColorSlider);
customElements.define("color-slider", ColorSlider);