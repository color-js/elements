import "https://colorjs.io/assets/js/index.js";

import "https://colorjs.io/assets/js//prism.js";
// import "https://blissfuljs.com/bliss.shy.js";
// import "https://live.prismjs.com/src/prism-live.mjs?load=javascript";
// import "https://colorjs.io/notebook/color-notebook.js";
import "https://colorjs.io/assets/js/colors.js";
import { styleCallouts } from "https://colorjs.io/assets/js/enhance.js";

styleCallouts();

let root = document.documentElement;
document.addEventListener("scroll", evt => {
	root.style.setProperty("--scrolltop", root.scrollTop);
}, {passive: true});