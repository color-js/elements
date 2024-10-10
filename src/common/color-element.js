import NudeElement from "../../node_modules/nude-element/src/Element.js";
// See https://bugs.webkit.org/show_bug.cgi?id=242740
import ColorJS from "./color.js";
const Color = await ColorJS;

export default class ColorElement extends NudeElement {
	// TODO make lazy
	static Color = Color;
}
