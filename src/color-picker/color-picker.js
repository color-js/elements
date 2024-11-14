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
		<slot name="space-picker">
			<space-picker id="space_picker" part="space-picker" exportparts="picker: space-picker-base"></space-picker>
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
			space_picker: this.shadowRoot.querySelector("slot[name=space-picker]"),
		};
	}

	connectedCallback () {
		super.connectedCallback?.();
		this._el.sliders.addEventListener("input", this);
		this._el.swatch.addEventListener("input", this);
		this._slots.space_picker.addEventListener("input", this);
	}

	disconnectedCallback () {
		this._el.sliders.removeEventListener("input", this);
		this._el.swatch.removeEventListener("input", this);
		this._slots.space_picker.removeEventListener("input", this);
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
		else if (this._el.space_picker.contains(source)) {
			this.space = event.target.value;
			this.color = this.color.to(this.space);
		}

		this.dispatchEvent(new event.constructor(event.type, {...event}));
	}

	get spaceResolved () {
		return this._el.space_picker.selectedSpace;
	}

	propChangedCallback ({name, prop, detail: change}) {
		if (name === "space") {
			if (this._el.space_picker.value !== this.space) {
				this._el.space_picker.value = this.space;
			}

			if (this.color.space.id !== this.space) {
				this.color = this.color.to(this.space);
			}

			let space = this.spaceResolved;
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
		space: {
			default: "oklch",
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
				let space = this.spaceResolved;
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
