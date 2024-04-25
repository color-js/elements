import ChannelSlider from "../channel-slider/channel-slider.js";
import ColorSwatch from "../css-color/css-color.js";
import defineAttributes from "../common/attributes.js";
import * as dom from "../common/dom.js";
import Color from "../common/color.js";

export const tagName = "color-picker";

let styleURL = new URL(`./${tagName}.css`, import.meta.url);

const self = class ColorPicker extends HTMLElement {
	#initialized = false;

	constructor () {
		super();

		this.attachShadow({mode: "open"});
		this.shadowRoot.innerHTML = `
			<style>@import url("${ styleURL }")</style>
			<div id=sliders></div>
			<slot name="swatch">
				<css-color swatch="large" id="swatch">
					<input value="oklch(70% 0.25 138)" id="color" />
				</css-color>
			</slot>
		`;

		this._el = dom.named(this);
	}

	connectedCallback() {
		this.attributeChangedCallback();

		if (this.color) {
			this.initialColor = this.color;

		}

		this._el.sliders.addEventListener("input", this);

		if (!this.#initialized) {
			// Create sliders
			// this.propChangedCallback("space");

			this.#initialized = true;
		}
	}

	disconnectedCallback() {
		this._el.sliders.removeEventListener("input", this);
	}

	handleEvent(event) {
		this.render();

		this.dispatchEvent(new event.constructor(event.type, {...event}));
	}

	render () {
		this.color = self.computed.color.get.call(this);
		this._el.swatch.value = this.color;
	}

	propChangedCallback (name, change) {
		if (name === "color") {
			if (change.source === "attribute") {
				this.initialColor = this.color;
			}
		}
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
	}

	static computed = {
		color: {
			get () {
				let coords = [...this._el.sliders.children].map(el => el.value);
				this.color = new Color(this.space, coords);
			},
			dependencies: ["space"],
		}
	}

	static attributes = {
		space: {
			...ChannelSlider.attributes.space,
			default: "oklch",
			propagateTo: el => [...el._el.sliders.children],
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

defineAttributes(self);

customElements.define(tagName, self);

export default self;