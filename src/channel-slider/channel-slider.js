import "../color-slider/color-slider.js";
import * as dom from "../common/dom.js";
import ColorElement from "../common/color-element.js";
import { getStep } from "../common/util.js";

const Self = class ChannelSlider extends ColorElement {
	static tagName = "channel-slider";
	static url = import.meta.url;
	static shadowStyle = true;
	static shadowTemplate = `
		<label class="color-slider-label" part="label">
			<slot>
				<span id="channel_info" part="channel-info"></span>
				<input type="number" part="spinner" min="0" max="1" step="0.01" id="spinner" />
			</slot>
			<color-slider part="color_slider" exportparts="slider" id="slider"></color-slider>
		</label>`;

	constructor () {
		super();

		this._el = dom.named(this);
		this._el.slot = this.shadowRoot.querySelector("slot");
	}

	connectedCallback () {
		super.connectedCallback?.();

		this._el.slider.addEventListener("input", this);
		this._el.slot.addEventListener("input", this);
	}

	disconnectedCallback () {
		this._el.slider.removeEventListener("input", this);
		this._el.slot.removeEventListener("input", this);
	}

	handleEvent (event) {
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

			if (["min", "max", "step", "value", "defaultValue"].includes(name)) {
				prop.applyChange(this._el.spinner, change);

				if (name === "value" && this.value !== undefined) {
					this._el.spinner.value = Number(this.value.toPrecision(4));

					if (!CSS.supports("field-sizing", "content")) {
						let valueStr = this._el.spinner.value;
						this._el.spinner.style.setProperty("--value-length", valueStr.length);
					}
				}
			}
		}

		if (name === "defaultColor" || name === "space" || name === "channel" || name === "min" || name === "max") {
			this._el.slider.stops = this.stops;

			if (name === "space" || name === "channel" || name === "min" || name === "max") {
				this._el.channel_info.innerHTML = `${ this.channelName } <em>(${ this.min }&thinsp;&ndash;&thinsp;${ this.max })</em>`;
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
				if (value instanceof Self.Color.Space || value === null || value === undefined) {
					return value;
				}

				value += "";

				return Self.Color.Space.get(value);
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
			},
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
			get type () {
				return Self.Color;
			},
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

				return new Self.Color(this.space, coords);
			},
			reflect: {
				from: "color",
			},
		},
		color: {
			get type () {
				return Self.Color;
			},
			get () {
				return this.colorAt(this.value);
			},
			dependencies: ["defaultColor", "space", "channel", "value"],
			set (value) {
				this.defaultColor = value;
				this.value = this.defaultValue;
			},
		},
	};

	static events = {
		change: {
			from () {
				return this._el.slider;
			},
		},
		input: {
			from () {
				return this._el.slider;
			},
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
};

Self.define();

export default Self;
