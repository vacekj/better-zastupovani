export class Parser {
	document: Document;
	constructor(html: string) {
		let domParser = new DOMParser();
		this.document = domParser.parseFromString(html, 'text/html');
	}

	$(selector: string): NodeList {
		return this.document.querySelectorAll.bind(this.document);
	}
}

export function load(html: string) {
	let domParser = new DOMParser();
	let document = domParser.parseFromString(html.trim(), 'text/html');
	function querySelectorAll<E extends Element = Element>(selectors: string): NodeListOf<E> {
		return document.querySelectorAll.call(document, selectors);
	}
	return querySelectorAll;
}