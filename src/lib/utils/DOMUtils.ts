export function load(html: string) {
	const domParser = new DOMParser();
	const document = domParser.parseFromString(html.trim(), "text/html");
	function querySelectorAll<E extends Element = Element>(selectors: string): NodeListOf<E> {
		return document.querySelectorAll.call(document, selectors);
	}

	return querySelectorAll;
}

export function $context(selector: string, context: Element) {
	return context.querySelectorAll(selector);
}

export function parseTable(context: Element, dupCols = true, dupRows = true, textMode = false): string[][] {
	const columns = [];
	let currX = 0;
	let currY = 0;

	[...$context("tr", context)].map((row, rowIDX) => {
		currY = 0;
		[...$context("td, th", row)].map((col, colIDX) => {
			const rowspan = col.getAttribute("rowspan") || 1;
			const colspan = col.getAttribute("colspan") || 1;
			const content = col.innerHTML || "";

			let x = 0;
			let y = 0;
			for (x = 0; x < rowspan; x++) {
				for (y = 0; y < colspan; y++) {
					if (columns[currY + y] === undefined) {
						columns[currY + y] = [];
					}

					while (columns[currY + y][currX + x] !== undefined) {
						currY += 1;
						if (columns[currY + y] === undefined) {
							columns[currY + y] = [];
						}
					}

					if ((x === 0 || dupRows) && (y === 0 || dupCols)) {
						columns[currY + y][currX + x] = content;
					} else {
						columns[currY + y][currX + x] = "";
					}
				}
			}
			currY += 1;
		});
		currX += 1;
	});

	return columns;
}
