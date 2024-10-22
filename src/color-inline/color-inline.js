import ColorElement from "../common/color-element.js";

const Self = class ColorInline extends ColorElement {
	static tagName = "color-inline";
	static url = import.meta.url;

	constructor () {
		super();
		this.attachShadow({mode: "open"});
		let styleURL = new URL("./color-inline.css", import.meta.url);
		this.shadowRoot.innerHTML = `<style>@import url("${ styleURL }");</style>
		<div part="swatch-wrapper">
			<div id="swatch" part="swatch"></div>
			<slot></slot>
		</div>`;

		this._el = {};
		this._el.swatch = this.shadowRoot.querySelector("#swatch");
	}

	connectedCallback () {
		super.connectedCallback?.();
		Self.#mo.observe(this, {childList: true, subtree: true, characterData: true});
	}

	propChangedCallback ({name, prop, detail: change}) {
		if (name === "color") {
			let isValid = this.color !== null;
			this._el.swatch.classList.toggle("invalid", !isValid);

			let colorString = this.color?.display();
			this._el.swatch.style.setProperty("--color", colorString);
		}
	}

	static #mo = new MutationObserver(mutations => {
		for (let mutation of mutations) {
			let target = mutation.target;

			while (target && !(target instanceof ColorInline)) {
				target = target.parentNode;
			}

			if (target) {
				target.value = target.textContent.trim();
			}
		}
	});

	static props = {
		value: {
			type: String,
			default () {
				return this.textContent.trim();
			},
		},
		color: {
			get type () {
				return Self.Color;
			},
			defaultProp: "value",
			parse (value) {
				if (!value) {
					return null;
				}

				return Self.Color.get(value);
			},
			reflect: false,
		},
	};

	static events = {
		colorchange: {
			propchange: "color",
		},
		valuechange: {
			propchange: "value",
		},
	};
};


Self.define();

export default Self;
