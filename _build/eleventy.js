import markdownIt from "markdown-it";
import markdownItAttrs from "markdown-it-attrs";
import markdownItAnchor from "markdown-it-anchor";
import configOriginal from "./eleventy-original.js";
import * as filters from "./filters-extra.js";

let data = {
	permalink: "{{ page.filePathStem | replace('README', '') | replace('index', '') }}/index.html",
	body_classes: "cn-ignore",
};

let md = markdownIt({
	html: true,
	linkify: true,
	typographer: true,
})
	.disable("code")
	.use(markdownItAttrs)
	.use(markdownItAnchor, {
		permalink: markdownItAnchor.permalink.headerLink(),
		level: 2,
	});

export default config => {
	let ret = configOriginal(config);

	for (let prop in data) {
		config.addGlobalData(prop, data[prop]);
	}

	for (let f in filters) {
		config.addFilter(f, filters[f]);
	}

	config.setLibrary("md", md);

	config.addPairedShortcode("md", children => {
		return md.render(children);
	});

	return ret;
};
