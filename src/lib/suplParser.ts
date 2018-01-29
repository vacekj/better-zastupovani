const cheerio = require('cheerio');
const dfnsFormatt = require('date-fns/format');
const array2d = require('array2d');

import { load } from "./parser";

/**
 * Parses a classes page into an array of class strings
 * 
 * @param {string} classesPage 
 * @returns {Array<string>} 
 */
export function parseClassesPage(classesPage: string): Array<string> {
	const $ = load(classesPage);
	let options = $('option');
	let values = [...options].map((option) => {
		return option.innerHTML;
	});
	return values;
}

export class DateWithUrl {
	url: string;
	date: string;
	constructor(url: string, date: string) {
		this.url = url;
		this.date = date;
	}
}

/**
 * Parses a dates page string into a SuplovaniPageDate array
 * 
 * @param {string} datesPage 
 * @returns {[DateWithUrl]} 
 */
export function parseDatesPage(datesPage: string): DateWithUrl[] {
	const $ = load(datesPage);
	let options = $('option');
	let data = [...options].map((option) => {
		return new DateWithUrl(option.getAttribute('value'), dfnsFormatt(option.getAttribute('value').slice(7, 17), 'YYYY-MM-DD'));
	});
	return data;
}

/**
 * Parses a suplovani page string into a SuplovaniPage object
 * 
 * @param {string} suplovaniPage 
 * @returns {SuplovaniPage} 
 */
export function parseSuplovaniPage(suplovaniPage: string): SuplovaniPage {
	const $ = load(suplovaniPage);

	// Date
	let date = $('.StyleZ3')[0].innerHTML;

	// Chybejici
	let table = $('table[width="683"]')[0];
	let chybejiciRows = parseTable(table)[0].slice(1);
	let chybejiciArray = chybejiciRows.map((row) => {
		// split the row into individual missing records
		let parsedRow = row.split(', ');
		return parsedRow.map((elem) => {
			let kdo = elem.split(' ')[0];
			// check if range is present
			if (!elem.includes(' ')) {
				return new ChybejiciRecord(kdo, null);
			}
			// extract range part from string
			let rangePart = elem.split(' ')[1].replace('(', '').replace(')', '');
			let range: [string, string] = ['', ''];
			// decide if range or only one hour: (1..2) or (2)
			if (rangePart.length == 1) {
				// only one hour
				range = [rangePart, rangePart];
			} else {
				// range of hours
				let splitRange = rangePart.split('..');
				range = [splitRange[0], splitRange[1]];
			}
			return new ChybejiciRecord(kdo, range);
		});
	});
	let chybejiciTable = new ChybejiciTable(chybejiciArray[0], chybejiciArray[1], chybejiciArray[2]);

	// Suplovani
	let suplovaniRecords: Array<SuplovaniRecord> = []; // TODO: finish converting this to native DOM apis
	let correctedSuplArray = array2d.transpose(parseTable($('div:contains("Suplování")')[0].nextElementSibling)).slice(2);
	array2d.eachRow(correctedSuplArray, (row) => {
		suplovaniRecords.push(new SuplovaniRecord(row[0], row[1], row[2], row[3], row[4], row[5], row[6], row[7]));
	});

	// Nahradni ucebny
	let nahradniUcebnaRecords: Array<NahradniUcebnaRecord> = [];
	let correctedNahradniUcebnyArray = array2d.transpose(parseTable($('div:contains("Náhradní")').next())).slice(2);
	array2d.eachRow(correctedNahradniUcebnyArray, (row) => {
		nahradniUcebnaRecords.push(new NahradniUcebnaRecord(row[0], row[1], row[2], row[3], row[4], row[5], row[6]));
	});

	return new SuplovaniPage(date, chybejiciTable, suplovaniRecords, nahradniUcebnaRecords);
}

export class SuplovaniPage {
	chybejici: ChybejiciTable;
	suplovani: Array<SuplovaniRecord>;
	nahradniUcebny: Array<NahradniUcebnaRecord>;
	date: string;
	constructor(date: string, chybejici: ChybejiciTable, suplovani: Array<SuplovaniRecord>, nahradniUcebny: Array<NahradniUcebnaRecord>) {
		this.chybejici = chybejici;
		this.suplovani = suplovani;
		this.nahradniUcebny = nahradniUcebny;
		this.date = date;
	}
}

export class ChybejiciTable {
	ucitele: Array<ChybejiciRecord>;
	tridy: Array<ChybejiciRecord>;
	ucebny: Array<ChybejiciRecord>;
	constructor(ucitele: Array<ChybejiciRecord>, tridy: Array<ChybejiciRecord>, ucebny: Array<ChybejiciRecord>) {
		this.ucitele = ucitele;
		this.tridy = tridy;
		this.ucebny = ucebny;
	}
}

export class ChybejiciRecord {
	kdo: string;
	range: [string, string];
	constructor(kdo: string, range: [string, string]) {
		this.kdo = kdo;
		this.range = range;
	}
}

export class SuplovaniRecord {
	hodina: string;
	trida: string;
	predmet: string;
	ucebna: string;
	nahucebna: string;
	vyuc: string;
	zastup: string;
	pozn: string;

	constructor(hodina: string, trida: string, predmet: string, ucebna: string, nahucebna: string, vyuc: string, zastup: string, pozn: string) {
		this.hodina = hodina;
		this.trida = trida;
		this.predmet = predmet;
		this.ucebna = ucebna;
		this.nahucebna = nahucebna;
		this.vyuc = vyuc;
		this.zastup = zastup;
		this.pozn = pozn;
	}
}

export class NahradniUcebnaRecord {
	hodina: string;
	trida: string;
	predmet: string;
	chybucebna: string;
	nahucebna: string;
	vyuc: string;
	pozn: string;
	constructor(hodina: string, trida: string, predmet: string, chybucebna: string, nahucebna: string, vyuc: string, pozn: string) {
		this.hodina = hodina;
		this.trida = trida;
		this.predmet = predmet;
		this.chybucebna = chybucebna;
		this.nahucebna = nahucebna;
		this.vyuc = vyuc;
		this.pozn = pozn;
	}
}

function parseTable(context: Element, dupCols = false, dupRows = false, textMode = false): Array<Array<string>> {
	var columns = [],
		curr_x = 0,
		curr_y = 0;

	[...$context('tr', context)].map(function (row, row_idx) {
		curr_y = 0;
		[...$context("td, th", row)].map(function (col, col_idx) {
			var rowspan = col.getAttribute('rowspan') || 1;
			var colspan = col.getAttribute('colspan') || 1;
			var content = col.innerHTML || "";

			var x = 0,
				y = 0;
			for (x = 0; x < rowspan; x++) {
				for (y = 0; y < colspan; y++) {
					if (columns[curr_y + y] === undefined) {
						columns[curr_y + y] = [];
					}

					while (columns[curr_y + y][curr_x + x] !== undefined) {
						curr_y += 1;
						if (columns[curr_y + y] === undefined) {
							columns[curr_y + y] = [];
						}
					}

					if ((x === 0 || dupRows) && (y === 0 || dupCols)) {
						columns[curr_y + y][curr_x + x] = content;
					} else {
						columns[curr_y + y][curr_x + x] = "";
					}
				}
			}
			curr_y += 1;
		});
		curr_x += 1;
	});

	return columns;
}

function $context(selector: string, context: Element) {
	return context.querySelectorAll(selector);
}