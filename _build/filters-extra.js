export function tag_to_class (tag) {
	return tag?.replace(/(?:^|-)([a-z])/g, ($0, $1) => $1.toUpperCase());
}