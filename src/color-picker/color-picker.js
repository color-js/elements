import ColorElement from "../common/color-element.js";
import "../channel-slider/channel-slider.js";
import "../color-swatch/color-swatch.js";
import * as dom from "../common/dom.js";

const Self = class ColorPicker extends ColorElement {
	static tagName = "color-picker";
	static url = import.meta.url;
	static dependencies = new Set(["channel-slider"]);
	static shadowStyle = true;
	static shadowTemplate = `
		<div id="sliders" part="sliders"></div>
		<slot name="swatch">
			<color-swatch size="large" id="swatch" part="swatch" exportparts="swatch: swatch-base, gamut, details, info, color-wrapper">
				<slot slot="swatch-content"></slot>
				<input value="oklch(70% 0.25 138)" id="color" />
			</color-swatch>
		</slot>`;

	constructor () {
		super();

		this._el = dom.named(this);
	}

	connectedCallback () {
		super.connectedCallback?.();
		this._el.sliders.addEventListener("input", this);
		this._el.swatch.addEventListener("input", this);
	}

	disconnectedCallback () {
		this._el.sliders.removeEventListener("input", this);
		this._el.swatch.removeEventListener("input", this);
	}

	handleEvent (event) {
		let source = event.target;

		if (this._el.sliders.contains(source)) {
			// From sliders
			let coords = [...this._el.sliders.children].map(el => el.value);
			this.color = new Self.Color(this.space, coords);
		}
		else if (this._el.swatch.contains(source)) {
			// From swatch
			if (!this._el.swatch.color) {
				// Invalid color, or still typing
				return;
			}
			this.color = this._el.swatch.color;
		}

		this.dispatchEvent(new event.constructor(event.type, {...event}));
	}

	propChangedCallback ({name, prop, detail: change}) {
		if (name === "space") {
			let i = 0;
			for (let channel in this.space.coords) {
				let slider = this._el.sliders.children[i++];

				if (slider) {
					slider.space = this.space;
					slider.channel = channel;
				}
				else {
					this._el.sliders.insertAdjacentHTML("beforeend", `<channel-slider space="${ this.space.id }" channel="${ channel }" part="channel-slider"></channel-slider>`);
				}
			}

			for (let slider of this._el.sliders.children) {
				slider.color = this.color;
			}
		}

		if (name === "color") {
			for (let slider of this._el.sliders.children) {
				slider.color = this.color;
			}

			if (!this._el.swatch.color || !this.color.equals(this._el.swatch.color)) {
				// Avoid typing e.g. "red" and having it replaced with "rgb(100% 0% 0%)" under your caret
				prop.applyChange(this._el.swatch, change);
			}
		}
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
			defaultProp: "defaultColor",
			reflect: false,
		},
	};

	static events = {
		change: {
			from () {
				return [this._el.sliders, this._el.swatch];
			},
		},
		input: {
			from () {
				return [this._el.sliders, this._el.swatch];
			},
		},
		colorchange: {
			propchange: "color",
		},
	};
};

Self.define();

export default Self;
