import ColorElement from "../common/color-element.js";
import "../channel-slider/channel-slider.js";
import "../color-swatch/color-swatch.js";
import "../space-picker/space-picker.js";
import * as dom from "../common/dom.js";

const Self = class ColorPicker extends ColorElement {
	static tagName = "color-picker";
	static url = import.meta.url;
	static dependencies = new Set(["channel-slider"]);
	static styles = import("./color-picker.css", { with: { type: "css" } }).catch(
		() => new URL("./color-picker.css", import.meta.url),
	);
	static shadowTemplate = `
		<slot name="color-space">
			<space-picker id="space_picker" part="color-space" exportparts="base: color-space-base"></space-picker>
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
			let alpha = this.color.alpha;
			if (coords.length > 3) {
				alpha = coords.pop() / 100;
			}
			this.color = new Self.Color(this.space, coords, alpha);
		}
		else if (this._el.swatch.contains(source)) {
			// From swatch
			if (!this._el.swatch.color) {
				// Invalid color, or still typing
				return;
			}
			this.color = this._el.swatch.color;
		}
		else if (
			this._el.space_picker.contains(source) ||
			this._slots.color_space.assignedElements().includes(source)
		) {
			this.spaceId = event.target.value;
		}

		this.dispatchEvent(new event.constructor(event.type, { ...event }));
	}

	updated ({ changed }) {
		if (changed.has("space") || changed.has("alpha")) {
			let space = this.space;

			if (this.color.space !== space) {
				this.color = this.color.to(space);
			}

			let i = 0;
			let channels = [...Object.keys(this.space.coords)];
			if (this.alpha) {
				channels.push("alpha");
			}
			for (let channel of channels) {
				let slider = this._el.sliders.children[i++];

				if (slider) {
					slider.space = space;
					slider.channel = channel;
				}
				else {
					this._el.sliders.insertAdjacentHTML(
						"beforeend",
						`<channel-slider space="${space.id}" channel="${channel}" part="channel-slider" exportparts="color-slider, slider"></channel-slider>`,
					);
				}
			}

			if (this._el.sliders.children.length > channels.length) {
				// Remove the slider for alpha
				this._el.sliders.children[channels.length].remove();
			}

			for (let slider of this._el.sliders.children) {
				slider.color = this.color;
				slider.gamut = this.gamut;
			}
		}

		if (changed.has("color")) {
			for (let slider of this._el.sliders.children) {
				slider.color = this.color;
			}

			if (!this._el.swatch.color || !this.color.equals(this._el.swatch.color)) {
				this._el.swatch.color = this.color;
			}
		}
	}

	static props = {
		spaceId: {
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
			changed ({ value, source }) {
				if (!value && source) {
					// A user write (source === property/attribute) cleared the value. We should always
					// have one, so fall back to the current space.
					this.spaceId = this.space.id;
					return;
				}

				if (this._el.space_picker.value !== value) {
					this._el.space_picker.value = value;
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
			changed ({ value }) {
				if (value === undefined) {
					// this.spaceId changed
					if (this._el.space_picker.value !== this.spaceId) {
						this._el.space_picker.value = this.spaceId;
					}

					return;
				}
				else if (!value) {
					// Something went wrong. We should always have a value. Falling back to the current space
					this.space = this._el.space_picker.selectedSpace;
					return;
				}

				value = value instanceof Self.Color.Space ? value.id : value;
				if (this.spaceId !== value) {
					this._el.space_picker.value = value;
					this.spaceId = value;
				}
			},
			dependencies: ["spaceId"],
			defaultProp: "spaceId",
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
			defaultProp: "defaultColor",
			reflect: false,
		},

		alpha: {
			parse (value) {
				if (value === undefined || value === null) {
					return;
				}

				if (value === false || value === "false") {
					return false;
				}

				if (value === "" || value === "alpha" || value === true || value === "true") {
					// Boolean attribute
					return true;
				}
			},
			reflect: {
				from: true,
			},
		},

		gamut: {
			type: String,
			default: "",
			convert (value) {
				if (
					value &&
					value !== "auto" &&
					value !== "none" &&
					!(value in Self.Color.spaces)
				) {
					return this.gamut;
				}
				return value;
			},
			changed () {
				for (let slider of this._el.sliders.children) {
					slider.gamut = this.gamut;
				}
			},
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
