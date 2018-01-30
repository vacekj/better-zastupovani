export class Parser {
	public document: Document;
	constructor(html: string) {
		const domParser = new DOMParser();
		this.document = domParser.parseFromString(html, 'text/html');
	}

	public $(selector: string): NodeList {
		return this.document.querySelectorAll.bind(this.document);
	}
}

export function load(html: string) {
	const domParser = new DOMParser();
	const document = domParser.parseFromString(html.trim(), 'text/html');
	function querySelectorAll<E extends Element = Element>(selectors: string): NodeListOf<E> {
		return document.querySelectorAll.call(document, selectors);
	}

	return querySelectorAll;
}

export function $context(selector: string, context: Element) {
	return context.querySelectorAll(selector);
}
