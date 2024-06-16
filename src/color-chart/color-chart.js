import "../color-scale/color-scale.js";
import NudeElement from "../../node_modules/nude-element/src/Element.js";
import Color from "../common/color.js";

const Self = class ColorChart extends NudeElement {
	static tagName = "color-chart";
	static globalStyle = new URL("color-chart-global.css", import.meta.url);
	static Color = Color;

	constructor () {
		super();

		this.attachShadow({mode: "open"});
		let styleURL = new URL(`./${Self.tagName}.css`, import.meta.url);
		this.shadowRoot.innerHTML = `
			<style>@import url("${ styleURL }")</style>
			<div id="chart-container">
				<div id="chart">
					<slot></slot>
				</div>
			</div>
			<div class="axis" id="y_axis">
				<div class="label" part="y label"></div>
				<div class="ticks" part="y ticks"></div>
			</div>
			<div class="axis" id="x_axis">
				<div class="label" part="x label"></div>
				<div class="ticks" part="x ticks"></div>
			</div>
		`;

		this._el = {
			slot:   this.shadowRoot.querySelector("slot"),
			chart:  this.shadowRoot.getElementById("chart"),
			xTicks: this.shadowRoot.querySelector("#x_axis .ticks"),
			yTicks: this.shadowRoot.querySelector("#y_axis .ticks"),
			xLabel: this.shadowRoot.querySelector("#x_axis .label"),
			yLabel: this.shadowRoot.querySelector("#y_axis .label"),
		};
	}

	connectedCallback() {
		super.connectedCallback();
		customElements.whenDefined("color-scale").then(() => this.render());
	}

	handleEvent (evt) {
		if (evt.target.tagName === "COLOR-SCALE" && evt.name === "computedColors") {
			this.render(evt);
		}
	}

	series = new WeakMap();

	render (evt) {
		let colorScales = this.querySelectorAll("color-scale");

		if (colorScales.length === 0) {
			return;
		}

		let minX = Infinity, maxX = -Infinity;
		let minY = Infinity, maxY = -Infinity;

		for (let colorScale of colorScales) {
			let scale = this.series.get(colorScale);

			if (!scale || evt?.target === colorScale) {
				scale = this.renderScale(colorScale);
			}

			minX = Math.min(scale.minX, minX);
			maxX = Math.max(scale.maxX, maxX);
			minY = Math.min(scale.minY, minY);
			maxY = Math.max(scale.maxY, maxY);
		}

		let yAxis = getAxis(minY, maxY, 10);
		let xAxis = getAxis(minX, maxX, 10);

		this._el.chart.style.setProperty("--min-x", xAxis.min);
		this._el.chart.style.setProperty("--max-x", xAxis.max);
		this._el.chart.style.setProperty("--steps-x", xAxis.steps);

		this._el.chart.style.setProperty("--min-y", yAxis.min);
		this._el.chart.style.setProperty("--max-y", yAxis.max);
		this._el.chart.style.setProperty("--steps-y", yAxis.steps);

		this._el.xTicks.innerHTML = Array(xAxis.steps).fill().map((_, i) => "<div part='x tick'>" + +(xAxis.min + i * xAxis.step).toPrecision(15) + "</div>").join("\n");
		this._el.yTicks.innerHTML = Array(yAxis.steps).fill().map((_, i) => "<div part='y tick'>" + +(yAxis.min + i * yAxis.step).toPrecision(15) + "</div>").reverse().join("\n");

		this._el.yLabel.textContent = this.space.name + " " + this.yResolved.name;
	}

	renderScale (colorScale) {
		let minX = Infinity, maxX = -Infinity;
		let minY = Infinity, maxY = -Infinity;
		let prevColor;
		let i = 0;
		let colors = colorScale.computedColors.slice();
		// TODO sort by X

		if (!colors?.length) {
			colors = [];
		}

		colorScale.style.setProperty("--color-count", colors.length);

		for (let {name, color} of colors) {
			let swatch = colorScale._el.swatches.children[i];
			color = color.to(this.space);
			let y = color.get(this.y);
			let x = Number(name.match(/\d+$/)?.[0] ?? i);

			minX = Math.min(minX, x);
			maxX = Math.max(maxX, x);
			minY = Math.min(minY, y);
			maxY = Math.max(maxY, y);

			swatch.style.setProperty("--x", x);
			swatch.style.setProperty("--y", y);
			swatch.style.setProperty("--index", i++);

			if (prevColor !== undefined) {
				prevColor.style.setProperty("--next-color", swatch.style.getPropertyValue("--color"));
				prevColor.style.setProperty("--next-x", x);
				prevColor.style.setProperty("--next-y", y);
			}

			prevColor = swatch;
		}

		this.series.set(colorScale, {minX, maxX, minY, maxY});

		return {minX, maxX, minY, maxY};
	}

	propChangedCallback (evt) {
		let {name, prop, detail: change} = evt;

		if (name === "resolvedX" || name === "yResolved") {
			// Re-render swatches
			this.render(evt);
		}
	}

	static props = {
		y: {
			default: "oklch.l"
		},

		yResolved: {
			get () {
				return Color.Space.resolveCoord(this.y, "oklch")
			},
			// rawProp: "coord",
		},

		space: {
			default: "oklch",
			get () {
				return this.yResolved.space;
			},
		},
	};
}

customElements.define(Self.tagName, Self);

export default Self;

function getAxis (min, max, initialSteps) {
	let range = max - min;
	let step = range / initialSteps;
	let magnitude = Math.floor(Math.log10(step));
	let base = Math.pow(10, magnitude);
	let candidates = [base, base * 2, base * 5, base * 10];

	for (let i = 0; i < candidates.length; i++) {
		if (candidates[i] > step) {
			step = candidates[i];
			break;
		}
	}

	let start = Math.floor(min / step) * step;
	let end = Math.ceil(max / step) * step;
	let steps = Math.round((end - start) / step);

	let ret = {min: start, max: end, step, steps};
	for (let prop in ret) {
		ret[prop] = +ret[prop].toPrecision(15);
	}
	return ret;
}