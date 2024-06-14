import "../color-scale/color-scale.js";
import NudeElement from "../../node_modules/nude-element/src/Element.js";
import Color from "../common/color.js";

const Self = class ColorChart extends NudeElement {
	static tagName = "color-chart";
	static globalStyle = new URL("./color-chart-global.css", import.meta.url);
	static Color = Color;

	constructor () {
		super();

		this.attachShadow({mode: "open"});
		let styleURL = new URL(`./${Self.tagName}.css`, import.meta.url);
		this.shadowRoot.innerHTML = `
			<style>@import url("${ styleURL }")</style>
			<div id="chart">
				<slot></slot>
			</div>
		`;

		this._el = {
			slot: this.shadowRoot.querySelector("slot"),
			chart: this.shadowRoot.getElementById("chart"),
		};
	}

	connectedCallback() {
		super.connectedCallback();
		customElements.whenDefined("color-scale").then(() => this.render());
	}

	handleEvent (evt) {
		if (evt.target.tagName === "COLOR-SCALE" && evt.name === "computedColors") {
			//
		}
	}

	render () {
		let minX = Infinity, maxX = -Infinity;
		let minY = Infinity, maxY = -Infinity;

		for (let colorScale of this.querySelectorAll("color-scale")) {
			let prevY;
			let i = 0;

			for (let {name, color} of colorScale.computedColors) {
				let swatch = colorScale._el.swatches.children[i];
				color = color.to(this.space);
				let parts = name.match(/^((?<label>.+)\s*\/)?\s*(?<x>\d+)$/)?.groups;

				let y = color.get(this.y);
				let x = Number(parts?.x ?? i);
				let label = (parts?.label ?? name).trim();

				minX = Math.min(minX, x);
				maxX = Math.max(maxX, x);
				minY = Math.min(minY, y);
				maxY = Math.max(maxY, y);

				swatch.style.setProperty("--y", y);
				swatch.style.setProperty("--x", x);
				swatch.style.setProperty("--index", i++);
				swatch.style.setProperty("--label", `"${label}"`);

				let {space, index} = Color.Space.resolveCoord(this.y, {space: this.space});
				let spaceCoord = Object.values(space.coords)[index];
				let isAngle = spaceCoord?.type === "angle";
				let info = isAngle ? y.toPrecision(4) : (y * 100).toPrecision(2) + "%";
				swatch.title = `${ label }: ${ info }`;

				if (prevY !== undefined) {
					swatch.style.setProperty("--prev-y", prevY);
				}
				prevY = y;
			}
		}

		this._el.chart.style.setProperty("--min-x", minX);
		this._el.chart.style.setProperty("--max-x", maxX);
		this._el.chart.style.setProperty("--min-y", minY);
		this._el.chart.style.setProperty("--max-y", maxY);
	}

	propChangedCallback ({name, prop, detail: change}) {
		if (name === "computedColors") {
			// Re-render swatches

		}
	}

	static props = {
		y: {
			default: "oklch.l"
		},

		resolvedY: {
			get () {
				return Color.Space.resolveCoord(this.y, "oklch")
			},
			// rawProp: "coord",
		},

		space: {
			default: "oklch",
			get () {
				return this.resolvedY.space;
			},
		},
	};
}

customElements.define(Self.tagName, Self);

export default Self;