import Color from "../common/color.js";

const Self = class ColorInline extends HTMLElement {
	static Color = Color;
	static tagName = "color-inline";
	#swatch;

	constructor () {
		super();
		this.attachShadow({mode: "open"});
		let styleURL = new URL("./color-inline.css", import.meta.url);
		this.shadowRoot.innerHTML = `<style>@import url("${ styleURL }");</style>
		<div part="swatch-wrapper">
			<div id="swatch" part="swatch"></div>
			<slot></slot>
		</div>`;

		this.#swatch = this.shadowRoot.querySelector("#swatch");
		this.attributeChangedCallback();
	}

	connectedCallback () {
		this.#render();
		ColorInline.#mo.observe(this, {childList: true, subtree: true, characterData: true});
	}

	#value;
	get value () {
		return this.#value;
	}
	set value (value) {
		this.#value = value;
		this.#render();
	}

	#color;
	get color () {
		return this.#color;
	}

	#render () {
		let colorText = this.value || this.textContent;

		try {
			this.#color = new Color(colorText);
			this.#swatch.style.cssText = `--color: ${this.#color.display()}`;
			this.#swatch.classList.remove("invalid");
		}
		catch (e) {
			this.#color = null;
			this.#swatch.classList.add("invalid");
		}
	}

	static get observedAttributes () {
		return ["value"];
	}

	attributeChangedCallback (name, newValue) {
		if (!name && this.hasAttribute("value") || name === "value") {
			this.value = this.getAttribute("value");
		}
	}

	static #mo = new MutationObserver(mutations => {
		for (let mutation of mutations) {
			let target = mutation.target;

			while (target && !(target instanceof ColorInline)) {
				target = target.parentNode;
			}

			if (target) {
				target.#render();
			}
		}
	});
}


customElements.define(Self.tagName, Self);

export default Self;