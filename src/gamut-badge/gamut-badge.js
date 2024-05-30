import Color from "../common/color.js";
import NudeElement from "../../node_modules/nude-element/src/Element.js";

const Self = class GamutBadge extends NudeElement {
	static tagName = "gamut-badge";
	static Color = Color;
	#label;

	constructor () {
		super();
		this.attachShadow({mode: "open"});
		let styleURL = new URL(`./${ Self.tagName }.css`, import.meta.url);
		this.shadowRoot.innerHTML = `
			<style>@import url("${ styleURL }")</style>
			<slot>
				<span id="label" part="label"></span>
			</slot>
		`;

		if (!this.#label) {
			this.#label = this.shadowRoot.querySelector("#label");
		}
	}

	get gamutLabel () {
		return this.gamutInfo?.label ?? "";
	}

	propChangedCallback ({name, prop, detail: change}) {
		if (name === "gamuts") {
			this.style.setProperty("--gamut-count", this.gamuts.length - 1);
		}

		if (name === "gamut") {
			if (this.gamutInfo) {
				this.style.setProperty("--gamut-level", this.gamutInfo.level);
				this.style.setProperty("--gamut-label", `"${ this.gamutInfo.label }"`);
				this.style.setProperty("--gamut-id", `"${ this.gamutInfo.id }"`);
			}
			else {
				this.style.removeProperty("--gamut-level");
				this.style.removeProperty("--gamut-label");
				this.style.removeProperty("--gamut-id");
			}
		}
	}

	static props = {
		gamuts: {
			type: Array,
			default: "srgb, p3, rec2020, prophoto",
			parse (gamuts) {
				if (!gamuts) {
					return [];
				}

				if (typeof gamuts === "string") {
					gamuts = gamuts.trim().split(/\s*,\s*/);
				}
				else if (!Array.isArray(gamuts) && typeof gamuts === "object") {
					// Object
					return Object.entries(gamuts).map(([id, label]) => ({id, label}));
				}

				let ret = gamuts.map((gamut, level) => {
					if (gamut?.id && "label" in gamut) {
						// Already in the correct format
						return gamut;
					}

					gamut = gamut.trim().split(/\s*:\s*/);
					let id = gamut[0];
					let label = gamut[1] ?? Color.spaces[id]?.name ?? id;
					return {id, label, level};
				});

				if (!ret.find(gamut => gamut.id === "none")) {
					ret.push({
						id: "none",
						get label () {
							return ret[this.level - 1].label + "+";
						},
						level: ret.length,
					});
				}

				return ret;
			},
			stringify (gamuts) {
				return gamuts.map(({id, label}) => `${ id }: ${ label }`).join(", ");
			},
		},
		gamutInfo: {
			get () {
				if (!this.color) {
					return null;
				}

				return this.gamuts?.find(gamut => gamut.id === "none" || this.color?.inGamut(gamut.id));
			},
		},
		gamut: {
			type: String,
			get () {
				return this.gamutInfo?.id;
			},
		},
		color: {
			type: Color,
		},
	};

	static events = {
		gamutchange: {
			propchange: "gamut",
		},
	};
};

customElements.define(Self.tagName, Self);

export default Self;
