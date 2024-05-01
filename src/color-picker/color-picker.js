import ChannelSlider from "../channel-slider/channel-slider.js";
import "../css-color/css-color.js";
import Props from "../common/props.js";
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
		let coords = [...this._el.sliders.children].map(el => el.value);
		this.color = new Color(this.space, coords);

		this._el.swatch.value = this.color;

		for (let slider of this._el.sliders.children) {
			slider.defaultColor = this.color;
		}
	}

	propChangedCallback (prop, change) {
		let name = prop.name;
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
			prop.applyChange(this._el.swatch, change);
		}
	}

	static computed = {

	}

	static props = {
		space: {
			...ChannelSlider.props.get("space").spec,
		},
		defaultColor: {
			...ChannelSlider.props.get("defaultColor").spec
		},
		color: {
			...ChannelSlider.props.get("color").spec
		},
	}
}

Props.create(self);

customElements.define(tagName, self);

export default self;