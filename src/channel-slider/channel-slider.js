import ColorSlider from "../color-slider/color-slider.js";
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
			<label class="color-slider-label">
				<input class="color-slider" type="range" />
				<input type="number" />
			</label>
		`;

		dom.refs(this);
	}

	connectedCallback() {
		this.attributeChangedCallback();
	}

	get maxRange () {
		let coordSpec = this.space.coords[this.channel];

		if (!coordSpec) {
			console.warn(`Unknown channel ${ this.channel } in space ${ this.space }`);
			return;
		}
console.log(coordSpec);
		let range = coordSpec.refRange ?? this.space.range;
		return range;
	}

	static attributes = {
		space: {
			type: String,
			default: Color.spaces.oklch,
			parse (value) {
				if (value instanceof Color.Space) {
					return value;
				}

				value += "";

				return Color.Space.get(value);
			},
			stringify (value) {
				return value?.id;
			}
		},
		channel: {
			type: String,
			default: "h",
		},
		min: {
			type: Number,
			default () {
				return this.maxRange[0];
			}
		},
		max: {
			type: Number,
			default () {
				return this.maxRange[1];
			},
		},
		value: {
			type: Number,
			default () {
				return (this.min + this.max) / 2;
			},
		},
		step: {
			type: Number,
			default () {
				return Math.min(1, (this.max - this.min) / 100);
			}
		},
		color: {
			type: Color,
		},
		minColor: {
			type: Color,
		},
		maxColor: {
			type: Color,
		},
	}
}

defineAttributes(ColorSlider);

customElements.define("color-slider", ColorSlider);