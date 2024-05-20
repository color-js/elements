import "../color-slider/color-slider.js";
import * as dom from "../common/dom.js";
import Color from "../common/color.js";
import NudeElement from "../../node_modules/nude-element/src/Element.js";
import { getStep } from "../common/util.js";

export const tagName = "channel-slider";

export default class ChannelSlider extends NudeElement {
	constructor () {
		super();

		this.attachShadow({mode: "open"});
		let styleURL = new URL(`./${tagName}.css`, import.meta.url);
		this.shadowRoot.innerHTML = `
			<style>@import url("${ styleURL }")</style>
			<label class="color-slider-label" part="label">
				<slot></slot>
				<color-slider part="color_slider" exportparts="slider" id="slider" tooltip></color-slider>
			</label>
		`;

		this._el = dom.named(this);
		this._el.slot = this.shadowRoot.querySelector("slot");
	}

	connectedCallback() {
		super.connectedCallback?.();

		this._el.slider.addEventListener("input", this);
	}

	disconnectedCallback() {
		this._el.slider.removeEventListener("input", this);
	}

	handleEvent(event) {
		if (event.type === "input") {
			this.value = event.target.value;
		}
	}

	colorAt (value) {
		let color = this.defaultColor.clone();
		try {
			color.set(this.channel, value);
		}
		catch (e) {
			console.warn(e);
		}
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
		return this.channelSpec?.name ?? this.channel;
	}

	static props = {
		space: {
			default: "oklch",
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
		channel: {
			type: String,
			default () {
				return Object.keys(this.space.coords)[0];
			},
			// get () {
			// 	let value = this.props.channel;
			// 	let space = this.space;
			// 	console.log(this.props, value, space);

			// 	if (!space || space.coords[value]) {
			// 		return value;
			// 	}

			// 	return Object.keys(this.space.coords)[0];
			// },
			// set: true,
			// reflect: true,
		},
		channelSpec: {
			get () {
				let channelSpec = this.space?.coords[this.channel];

				if (!channelSpec && this.space) {
					channelSpec = Object.values(this.space.coords)[0];
					console.warn(`Unknown channel ${ this.channel } in space ${ this.space }. Using first channel (${ channelSpec.name }) instead.`);
				}

				return channelSpec;
			}
		},
		refRange: {
			get () {
				let channelSpec = this.channelSpec;
				return channelSpec?.refRange ?? channelSpec?.range ?? [0, 100];
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
				return getStep(this.max, this.min, { minSteps: 100 });
			},
		},

		defaultValue: {
			type: Number,
			default () {
				try {
					return this.defaultColor.get(this.channel);
				}
				catch {
					// When there is no channel in the defaultColor color space, don't throw,
					// but return the value of the first one. Eventually, everything will settle down,
					// and the default value will be correct.
					return this.defaultColor.coords[0];
				}
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
			convert (color) {
				return color.to(this.space);
			},
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
			dependencies: ["defaultColor", "space", "channel", "value"],
			set (value) {
				this.defaultColor = value;
				this.value = this.defaultValue;
			},
		},
	}

	static events = {
		change: {
			from () {
				return this._el.slider;
			}
		},
		input: {
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

customElements.define(tagName, ChannelSlider);