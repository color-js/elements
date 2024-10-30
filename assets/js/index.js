import "https://colorjs.io/assets/js//prism.js";
import "https://colorjs.io/assets/js/colors.js";

import { styleCallouts } from "https://colorjs.io/assets/js/enhance.js";
styleCallouts();

import HTMLDemoElement from "https://nudeui.com/elements/html-demo/html-demo.js";

if (document.body.classList.contains("component-page")) {
	HTMLDemoElement.wrapAll();
}
