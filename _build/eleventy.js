import configOriginal from "./eleventy-original.js";
import * as filters from "./filters-extra.js";

let data = {
	"permalink": "{{ page.filePathStem | replace('README', '') | replace('index', '') }}/index.html",
	"body_classes": "cn-ignore"
};

export default config => {
	let ret = configOriginal(config);

	for (let prop in data) {
		config.addGlobalData(prop, data[prop]);
	}

	for (let f in filters) {
		config.addFilter(f, filters[f]);
	}

	return ret;
};
