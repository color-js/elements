let specifier;

try {
	import.meta.resolve("colorjs.io");
	specifier = "colorjs.io";
}
catch (e) {
	// specifier = "../../node_modules/colorjs.io/dist/color.js";
	specifier = "https://colorjs.io/dist/color.js";
}

export default await import(specifier).then(module => module.default);