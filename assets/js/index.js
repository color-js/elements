import "https://colorjs.io/assets/js//prism.js";
import "https://colorjs.io/assets/js/colors.js";

import { styleCallouts } from "https://colorjs.io/assets/js/enhance.js";
styleCallouts();

let root = document.documentElement;
document.addEventListener("scroll", evt => {
	root.style.setProperty("--scrolltop", root.scrollTop);
}, {passive: true});

import HTMLDemoElement from "https://nudeui.com/html-demo/html-demo.js";

if (document.body.classList.contains("component-page")) {
	HTMLDemoElement.wrapAll();
}