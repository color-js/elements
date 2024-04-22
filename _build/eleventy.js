import configOriginal from "./eleventy-original.js";

let data = {
	"permalink": "{{ page.filePathStem | replace('README', '') | replace('index', '') }}/index.html",
	"body_classes": "cn-ignore"
};

export default config => {
	let ret = configOriginal(config);

	for (let prop in data) {
		config.addGlobalData(prop, data[prop]);
	}

	return ret;
};
