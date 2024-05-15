import "../channel-slider/channel-slider.js";
import "../color-swatch/color-swatch.js";
import NudeElement from "../../node_modules/nude-element/src/Element.js";
import * as dom from "../common/dom.js";
import Color from "../common/color.js";

const Self = class ColorPicker extends NudeElement {
	static tagName = "color-picker";

	constructor () {
		super();

		this.attachShadow({mode: "open"});
		let styleURL = new URL(`./${Self.tagName}.css`, import.meta.url);
		this.shadowRoot.innerHTML = `
			<style>@import url("${ styleURL }")</style>
			<div id=sliders></div>
			<slot name="swatch">
				<color-swatch size="large" id="swatch">
					<input value="oklch(70% 0.25 138)" id="color" />
				</color-swatch>
			</slot>
		`;

		this._el = dom.named(this);
	}

	connectedCallback() {
		super.connectedCallback?.();
		this._el.sliders.addEventListener("input", this);
		this._el.swatch.addEventListener("input", this);

		this.render();
	}

	disconnectedCallback() {
		this._el.sliders.removeEventListener("input", this);
		this._el.swatch.removeEventListener("input", this);
	}

	handleEvent(event) {
		this.render(event.target);

		this.dispatchEvent(new event.constructor(event.type, {...event}));
	}

	render (source) {
		if (!source || this._el.sliders.contains(source)) {
			// From sliders
			let coords = [...this._el.sliders.children].map(el => el.value);
			this.color = new Color(this.space, coords);
			this._el.swatch.value = this.color;
		}
		else if (!source || this._el.swatch.contains(source)) {
			// From swatch
			if (!this._el.swatch.color) {
				// Invalid color, or still typing
				return;
			}
			this.color = this._el.swatch.color;
		}

		for (let slider of this._el.sliders.children) {
			slider.defaultColor = this.color;
		}
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
					this._el.sliders.insertAdjacentHTML("beforeend", `<channel-slider space="${ this.space.id }" channel="${ channel }"></channel-slider>`);
				}
			}
		}

		if (name === "color") {
			for (let slider of this._el.sliders.children) {
				slider.color = this.color;
			}

			if (this.color && (!this._el.swatch.color || !this.color.equals(this._el.swatch.color))) {
				// Avoid typing e.g. "red" and having it replaced with "rgb(100% 0% 0%)" under your caret
				prop.applyChange(this._el.swatch, change);
			}
		}
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
			set (value) {
				this.defaultColor = new Color(value).to(this.space);
			},
		},
	}
}

customElements.define(Self.tagName, Self);

export default Self;