import "../color-scale/color-scale.js";
import NudeElement from "../../node_modules/nude-element/src/Element.js";
// See https://bugs.webkit.org/show_bug.cgi?id=242740
import ColorJS from "../common/color.js";
const Color = await ColorJS;

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

	connectedCallback () {
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

			if (!scale || !evt || evt.target === colorScale || evt.target.nodeName !== "COLOR-SCALE") {
				scale = this.renderScale(colorScale);
			}

			if (!scale) {
				continue;
			}

			minX = Math.min(scale.x.min, minX);
			maxX = Math.max(scale.x.max, maxX);
			minY = Math.min(scale.y.min, minY);
			maxY = Math.max(scale.y.max, maxY);
		}

		if (isFinite(minX) && isFinite(maxX)) {
			let xAxis = getAxis(minX, maxX, 10);
			this._el.chart.style.setProperty("--min-x", xAxis.min);
			this._el.chart.style.setProperty("--max-x", xAxis.max);
			this._el.chart.style.setProperty("--steps-x", xAxis.steps);
			this._el.xTicks.innerHTML = Array(xAxis.steps).fill().map((_, i) => "<div part='x tick'>" + +(xAxis.min + i * xAxis.step).toPrecision(15) + "</div>").join("\n");
		}

		if (isFinite(minY) && isFinite(maxY)) {
			let yAxis = getAxis(minY, maxY, 10);

			this._el.chart.style.setProperty("--min-y", yAxis.min);
			this._el.chart.style.setProperty("--max-y", yAxis.max);
			this._el.chart.style.setProperty("--steps-y", yAxis.steps);
			this._el.yTicks.innerHTML = Array(yAxis.steps).fill().map((_, i) => "<div part='y tick'>" + +(yAxis.min + i * yAxis.step).toPrecision(15) + "</div>").reverse().join("\n");
			this._el.yLabel.textContent = this.space.name + " " + this.yResolved.name;
		}
	}

	renderScale (colorScale) {
		if (!colorScale.computedColors) {
			// Not yet initialized
			return;
		}

		let ret = {
			element: colorScale,
			swatches: new WeakMap(),
			x: {min: Infinity, max: -Infinity, values: new WeakMap() },
			y: {min: Infinity, max: -Infinity, values: new WeakMap()},
			colors: colorScale.computedColors?.slice() ?? [],
		};

		colorScale.style.setProperty("--color-count", ret.colors.length);

		let index = 0;
		for (let {name, color} of ret.colors) {
			let swatch = colorScale._el.swatches.children[index];
			ret.colors[index] = color = color.to(this.space);
			ret.swatches.set(color, swatch);

			let x = Number(name.match(/-?\d*\.?\d+$/)?.[0] ?? index);
			let y = color.get(this.y);

			ret.x.values.set(color, x);
			ret.y.values.set(color, y);

			ret.x.min = Math.min(ret.x.min, x);
			ret.x.max = Math.max(ret.x.max, x);
			ret.y.min = Math.min(ret.y.min, y);
			ret.y.max = Math.max(ret.y.max, y);

			swatch.style.setProperty("--x", x);
			swatch.style.setProperty("--y", y);
			swatch.style.setProperty("--index", index);

			index++;
		}

		// Sort colors by X (ascending)
		ret.colors.sort((a, b) => ret.x.values.get(a) - ret.x.values.get(b));

		let prevColor;
		for (let color of ret.colors) {
			let swatch = ret.swatches.get(color);

			if (prevColor !== undefined) {
				prevColor.style.setProperty("--next-color", swatch.style.getPropertyValue("--color"));
				prevColor.style.setProperty("--next-x", ret.x.values.get(color));
				prevColor.style.setProperty("--next-y", ret.y.values.get(color));
			}

			prevColor = swatch;
		}

		this.series.set(colorScale, ret);

		return ret;
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
			default: "oklch.l",
		},

		yResolved: {
			get () {
				return Color.Space.resolveCoord(this.y, "oklch");
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
};

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
