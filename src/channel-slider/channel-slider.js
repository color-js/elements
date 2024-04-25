import ColorSlider from "../color-slider/color-slider.js";
import defineAttributes from "../common/attributes.js";
import * as dom from "../common/dom.js";
import Color from "../common/color.js";

export const tagName = "channel-slider";

let styleURL = new URL(`./${tagName}.css`, import.meta.url);

export default class ChannelSlider extends HTMLElement {
	#initialized = false;

	constructor () {
		super();

		this.attachShadow({mode: "open"});
		this.shadowRoot.innerHTML = `
			<style>@import url("${ styleURL }")</style>
			<label class="color-slider-label" part="label">
				<slot></slot>
				<color-slider part="color_slider" exportparts="slider" id="slider"></color-slider>
				<input type="number" part="spinner" />
			</label>
		`;

		this._el = dom.named(this);
		this._el.slot = this.shadowRoot.querySelector("slot");
	}

	connectedCallback() {
		this.attributeChangedCallback();

		if (this.color) {
			this.initialColor = this.color;
			this._el.slider.stops = [this.minColor, this.maxColor];
			console.log(this.minColor, this.maxColor , this.color + "")
		}

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
		if (event.target !== this._el.slider) {
			this._el.slider.value = event.target.value;
		}

		if (event.target !== this._el.spinner) {
			this._el.spinner.value = this.value;
		}

		this.color = this.colorAt(this.value);
		this.style.setProperty("--progress", this.progress);

		this.dispatchEvent(new event.constructor(event.type, {...event}));
	}

	colorAt (p) {
		return this._el.slider.colorAt(p);
	}

	get minColor () {
		let color = this.color.clone();
		color.set(this.channel, this.min);
		return color;
	}

	get maxColor () {
		let color = this.color.clone();
		color.set(this.channel, this.max);
		return color;
	}

	get progress () {
		return this._el.slider.progress;
	}

	progressAt (p) {
		return this._el.slider.progressAt(p);
	}

	propChangedCallback (name, change) {
		if (name === "space" || name === "channel" || name === "min" || name === "max") {
			this._el.slot.innerHTML = `${ this.channelName } <em>(${ this.min }&thinsp;&ndash;&thinsp;${ this.max })</em>`;
			this._el.slider.stops = [this.minColor, this.maxColor];
		}

		if (name === "min" || name === "max" || name === "step") {
			this._el.slider[name] = this[name];
			this._el.spinner[name] = this[name];
		}
	}

	get refRange () {
		let coordSpec = this.space.coords[this.channel];

		if (!coordSpec) {
			console.warn(`Unknown channel ${ this.channel } in space ${ this.space }`);
			return;
		}

		let range = coordSpec.refRange ?? coordSpec.range ?? [];
		return range;
	}

	get channelName () {
		return this.space.coords[this.channel].name ?? this.channel;
	}

	static computed = {

	}

	static attributes = {
		space: {
			...ColorSlider.attributes.space,
			default: "oklch",
			propagateTo: el => el._el.slider,
		},
		channel: {
			type: String,
			default: (el) => Object.keys(el.space.coords)[0],
		},
		min: {
			type: Number,
			default: el => {
				let min = el.refRange[0];
				el._el.slider.min = min;
				return min;
			},
			propagateTo: el => el._el.slider,
		},
		max: {
			type: Number,
			default: el => {
				let max = el.refRange[1];
				el._el.slider.max = max;
				return max;
			},
			propagateTo: el => el._el.slider,
		},
		value: {
			type: Number,
			default () {
				return (this.min + this.max) / 2;
			},
			propagateTo: el => el._el.slider,
			get: (element) => Number(element._el.slider.value),
		},
		step: {
			type: Number,
			default: el => (el.max - el.min) / 1000,
			propagateTo: el => el._el.slider,
		},
		color: {
			type: Color,
			default (el) {
				let coords = [];
				for (let channel in this.space.coords) {
					let spec = this.space.coords[channel];
					let range = spec.refRange ?? spec.range;
					coords.push((range[0] + range[1]) / 2);
				}

				return new Color(this.space, coords);
			}
		}
	}
}

defineAttributes(ChannelSlider);

customElements.define(tagName, ChannelSlider);