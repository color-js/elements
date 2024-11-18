import ColorElement from "../common/color-element.js";
import "../channel-slider/channel-slider.js";
import "../color-swatch/color-swatch.js";
import "../space-picker/space-picker.js";
import * as dom from "../common/dom.js";

const Self = class ColorPicker extends ColorElement {
	static tagName = "color-picker";
	static url = import.meta.url;
	static dependencies = new Set(["channel-slider"]);
	static shadowStyle = true;
	static shadowTemplate = `
		<slot name="color-space">
			<space-picker id="space_picker" part="color-space" exportparts="picker: color-space-base"></space-picker>
		</slot>
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
		this._slots = {
			color_space: this.shadowRoot.querySelector("slot[name=color-space]"),
		};
	}

	connectedCallback () {
		super.connectedCallback?.();
		this._el.sliders.addEventListener("input", this);
		this._el.swatch.addEventListener("input", this);
		this._slots.color_space.addEventListener("input", this);
	}

	disconnectedCallback () {
		this._el.sliders.removeEventListener("input", this);
		this._el.swatch.removeEventListener("input", this);
		this._slots.color_space.removeEventListener("input", this);
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
		else if (this._el.space_picker.contains(source) || this._slots.color_space.assignedElements().includes(source)) {
			this.spaceRaw = event.target.value;
		}

		this.dispatchEvent(new event.constructor(event.type, {...event}));
	}

	propChangedCallback ({name, prop, detail: change}) {
		if (name === "space") {
			let space = this.space;

			if (this.color.space !== space) {
				this.color = this.color.to(space);
			}

			let i = 0;
			for (let channel in space.coords) {
				let slider = this._el.sliders.children[i++];

				if (slider) {
					slider.space = space;
					slider.channel = channel;
				}
				else {
					this._el.sliders.insertAdjacentHTML("beforeend", `<channel-slider space="${ space.id }" channel="${ channel }" part="channel-slider"></channel-slider>`);
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
		spaceRaw: {
			default: "oklch",
			convert (value) {
				if (value === null || value === undefined) {
					return value;
				}
				else if (value instanceof Self.Color.Space) {
					return value.id;
				}

				return value + "";
			},
			changed ({parsedValue, ...change}) {
				if (!parsedValue) {
					// Something went wrong. We should always have a value. Falling back to the current space
					this.spaceRaw = this.space.id;
					return;
				}

				if (this.props.space && this.props.space.id !== parsedValue) {
					// The space object we have in the cache is outdated. We need to delete it so that the space getter returns the updated one
					delete this.props.space;
				}
			},
			reflect: {
				from: "space",
			},
		},

		space: {
			get () {
				return this._el.space_picker.selectedSpace;
			},
			set: true,
			changed ({parsedValue, ...change}) {
				if (!parsedValue) {
					// this.spaceRaw changed
					if (this._el.space_picker.value !== this.spaceRaw) {
						this._el.space_picker.value = this.spaceRaw;
					}

					return;
				}

				parsedValue = parsedValue instanceof Self.Color.Space ? parsedValue.id : parsedValue;
				if (this.spaceRaw !== parsedValue) {
					this._el.space_picker.value = parsedValue;
					this.spaceRaw = parsedValue;
				}
			},
			dependencies: ["spaceRaw"],
			defaultProp: "spaceRaw",
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
				let space = this.space;
				for (let channel in space.coords) {
					let spec = space.coords[channel];
					let range = spec.refRange ?? spec.range;
					coords.push((range[0] + range[1]) / 2);
				}

				return new Self.Color(space, coords);
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
				return [this._el.space_picker, this._el.sliders, this._el.swatch];
			},
		},
		input: {
			from () {
				return [this._el.space_picker, this._el.sliders, this._el.swatch];
			},
		},
		colorchange: {
			propchange: "color",
		},
	};
};

Self.define();

export default Self;
