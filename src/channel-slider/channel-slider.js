import ColorSlider from "../color-slider/color-slider.js";
import Props from "../common/Props.js";
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
				<color-slider part="color_slider" exportparts="slider" id="slider" tooltip></color-slider>
			</label>
		`;

		this._el = dom.named(this);
		this._el.slot = this.shadowRoot.querySelector("slot");
		this.addEventListener("propchange", this.propChangedCallback);
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
		if (event.type === "input") {
			this.value = event.target.value;
		}

		this.dispatchEvent(new event.constructor(event.type, {...event}));
	}

	colorAt (value) {
		let color = this.defaultColor.clone();
		color.set(this.channel, value);
		return color;
	}

	colorAtProgress (progress) {
		// Map progress to min - max range
		let value = this.min + progress * (this.max - this.min);
		return this.colorAt(value);
	}

	get minColor () {
		return this.colorAt(this.min);
	}

	get maxColor () {
		return this.colorAt(this.max);
	}

	get stops () {
		return [
			this.minColor,
			this.colorAtProgress(0.25),
			this.colorAtProgress(0.5),
			this.colorAtProgress(0.75),
			this.maxColor,
		];
	}

	get progress () {
		return this._el.slider.progress;
	}

	progressAt (p) {
		return this._el.slider.progressAt(p);
	}

	propChangedCallback ({name, prop, detail: change}) {
		if (["space", "min", "max", "step", "value", "defaultValue"].includes(name)) {
			prop.applyChange(this._el.slider, change);
		};

		if (name === "defaultColor" || name === "space" || name === "channel" || name === "min" || name === "max") {
			this._el.slider.stops = this.stops;

			if (name === "space" || name === "channel" || name === "min" || name === "max") {
				this._el.slot.innerHTML = `${ this.channelName } <em>(${ this.min }&thinsp;&ndash;&thinsp;${ this.max })</em>`;
			}
		}
	}

	get channelName () {
		return this.space.coords[this.channel].name ?? this.channel;
	}

	static props = {
		space: {
			...ColorSlider.props.get("space").spec,
			default: "oklch",
		},
		channel: {
			type: String,
			default () {
				return Object.keys(this.space.coords)[0]
			},
		},
		refRange: {
			get () {
				let coordSpec = this.space.coords[this.channel];

				if (!coordSpec) {
					console.warn(`Unknown channel ${ this.channel } in space ${ this.space }`);
					return;
				}

				return coordSpec.refRange ?? coordSpec.range ?? [];
			},
		},
		min: {
			type: Number,
			default () {
				return this.refRange[0];
			},
		},
		max: {
			type: Number,
			default () {
				return this.refRange[1];
			},
		},
		step: {
			type: Number,
			default () {
				let step = (this.max - this.min) / 1000;
				// Clamp to closest power of ten
				if (step >= 1) {
					return 1;
				}

				return step;
			},
		},

		defaultValue: {
			type: Number,
			default () {
				return this.defaultColor.get(this.channel);
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

		defaultColor: {
			type: Color,
			default () {
				let coords = [];
				for (let channel in this.space.coords) {
					let spec = this.space.coords[channel];
					let range = spec.refRange ?? spec.range;
					coords.push((range[0] + range[1]) / 2);
				}

				return new Color(this.space, coords);
			},
			reflect: {
				from: "color",
			},
		},
		color: {
			type: Color,
			get () {
				return this.colorAt(this.value);
			},
			set (value) {
				let color = new Color(value).to(this.space);
				this.defaultColor = color;
				this.value = color.get(this.channel);
			},
			setDependencies: ["channel", "space"],
		},
	}
}

Props.create(ChannelSlider);

customElements.define(tagName, ChannelSlider);