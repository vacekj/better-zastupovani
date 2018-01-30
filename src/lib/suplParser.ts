import * as array2d from 'array2d';
import { format } from 'date-fns';

import { $context, load } from './DOMUtils';

/**
 * Parses a classes page into an array of class strings
 *
 */
export function parseClassesPage(classesPage: string): string[] {
	const $ = load(classesPage);
	const options = $('option');

	return [...options].map((option) => {
		return option.innerHTML;
	});
}

/**
 * Helper class for Dates and URLs pointing to suplovaniPages
 *
 */
export class DateWithUrl {
	public url: string;
	public date: string;
	constructor(url: string, date: string) {
		this.url = url;
		this.date = date;
	}
}

/**
 * Parses a dates page string into a SuplovaniPageDate array
 *
 */
export function parseDatesPage(datesPage: string): DateWithUrl[] {
	const $ = load(datesPage);
	const options = $('option');

	return [...options].map((option) => {
		return new DateWithUrl(option.getAttribute('value'), format(option.getAttribute('value').slice(7, 17), 'YYYY-MM-DD'));
	});
}

/**
 * Parses a suplovani page string into a SuplovaniPage object
 */
export function parseSuplovaniPage(suplovaniPage: string): SuplovaniPage {
	const $ = load(suplovaniPage);

	// Date
	const date = $('.StyleZ3')[0].innerHTML;

	// Chybejici
	const table = $('table[width="683"]')[0];
	const chybejiciRows = parseTable(table)[0].slice(1);
	const chybejiciArray = chybejiciRows.map((row) => {
		// split the row into individual missing records
		const parsedRow = row.split(', ');

		return parsedRow.map((elem) => {
			const kdo = elem.split(' ')[0];
			// check if range is present
			if (!elem.includes(' ')) {
				return new ChybejiciRecord(kdo, null);
			}
			// extract range part from string
			const rangePart = elem.split(' ')[1].replace('(', '').replace(')', '');
			let range: [string, string] = ['', ''];
			// decide if range or only one hour: (1..2) or (2)
			if (rangePart.length === 1) {
				// only one hour
				range = [rangePart, rangePart];
			} else {
				// range of hours
				const splitRange = rangePart.split('..');
				range = [splitRange[0], splitRange[1]];
			}

			return new ChybejiciRecord(kdo, range);
		});
	});
	const chybejiciTable = new ChybejiciTable(chybejiciArray[0], chybejiciArray[1], chybejiciArray[2]);

	// Suplovani
	const suplovaniRecords: SuplovaniRecord[] = []; // TODO: finish converting this to native DOM apis
	const correctedSuplArray = array2d.transpose(parseTable($('div:contains("Suplování")')[0].nextElementSibling)).slice(2);
	array2d.eachRow(correctedSuplArray, (row) => {
		suplovaniRecords.push(new SuplovaniRecord(row[0], row[1], row[2], row[3], row[4], row[5], row[6], row[7]));
	});

	// Nahradni ucebny
	const nahradniUcebnaRecords: NahradniUcebnaRecord[] = [];
	const correctedNahradniUcebnyArray = array2d.transpose(parseTable($('div:contains("Náhradní")')[0].nextElementSibling)).slice(2);
	array2d.eachRow(correctedNahradniUcebnyArray, (row) => {
		nahradniUcebnaRecords.push(new NahradniUcebnaRecord(row[0], row[1], row[2], row[3], row[4], row[5], row[6]));
	});

	// Dozory
	const dozoryTable = $('table[width="605"]')[0];
	const dozorRows = parseTable(dozoryTable)[0].slice(1);
	const dozorRecords: DozorRecord[] = [];
	array2d.eachRow(dozorRows, (dozorRow) => {
		dozorRecords.push(new DozorRecord(dozorRow[0], dozorRow[1], dozorRow[2], dozorRow[3], dozorRow[4], dozorRow[5]));
	});

	// Last updated
	const lastUpdated = $('table[width=700] td.StyleZ5')[0].innerHTML;

	return new SuplovaniPage(date, chybejiciTable, suplovaniRecords, nahradniUcebnaRecords, dozorRecords, lastUpdated);
}

/**
 * Represents of a single suplovani page for a specified date
 */
export class SuplovaniPage {
	public chybejici: ChybejiciTable;
	public suplovani: SuplovaniRecord[];
	public nahradniUcebny: NahradniUcebnaRecord[];
	public dozory: DozorRecord[];
	public date: string;
	public lastUpdated: string;
	constructor(date: string, chybejici: ChybejiciTable, suplovani: SuplovaniRecord[], nahradniUcebny: NahradniUcebnaRecord[],
		dozory: DozorRecord[], lastUpdated: string) {

		this.chybejici = chybejici;
		this.suplovani = suplovani;
		this.nahradniUcebny = nahradniUcebny;
		this.dozory = dozory;
		this.date = date;
		this.lastUpdated = lastUpdated;
	}
}

/**
 * Represents a single Chybejici table, grouped by type
 */
export class ChybejiciTable {
	public ucitele: ChybejiciRecord[];
	public tridy: ChybejiciRecord[];
	public ucebny: ChybejiciRecord[];
	constructor(ucitele: ChybejiciRecord[], tridy: ChybejiciRecord[], ucebny: ChybejiciRecord[]) {
		this.ucitele = ucitele;
		this.tridy = tridy;
		this.ucebny = ucebny;
	}
}

/**
 * Represents a single Chybejici record
 *
 * E.g.: Petr (1..6)
 */
export class ChybejiciRecord {
	public kdo: string;
	public range: [string, string];
	constructor(kdo: string, range: [string, string]) {
		this.kdo = kdo;
		this.range = range;
	}
}

/**
 * Represents a single suplovani record
 *
 * @export
 * @class SuplovaniRecord
 */
export class SuplovaniRecord {
	public hodina: string;
	public trida: string;
	public predmet: string;
	public ucebna: string;
	public nahucebna: string;
	public vyuc: string;
	public zastup: string;
	public pozn: string;

	constructor(hodina: string, trida: string,
		predmet: string, ucebna: string, nahucebna: string, vyuc: string, zastup: string, pozn: string) {
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

/**
 * Represents a single NahradniUcebna record
 *
 * @export
 * @class NahradniUcebnaRecord
 */
export class NahradniUcebnaRecord {
	public hodina: string;
	public trida: string;
	public predmet: string;
	public chybucebna: string;
	public nahucebna: string;
	public vyuc: string;
	public pozn: string;
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

/**
 * Represents a single Dozor record
 */
class DozorRecord {
	public timeStart: string;
	public timeEnd: string;
	public misto: string;
	public chybejici: string;
	public dozorujici: string;
	public poznamka: string;
	constructor(timeStart: string, timeEnd: string, misto: string, chybejici: string, dozorujici: string, poznamka: string) {
		this.timeStart = timeStart;
		this.timeEnd = timeEnd;
		this.misto = misto;
		this.chybejici = chybejici;
		this.dozorujici = dozorujici;
		this.poznamka = poznamka;
	}
}

function parseTable(context: Element, dupCols = false, dupRows = false, textMode = false): string[][] {
	const columns = [];
	let currX = 0;
	let currY = 0;

	[...$context('tr', context)].map((row, rowIDX) => {
		currY = 0;
		[...$context('td, th', row)].map((col, colIDX) => {
			const rowspan = col.getAttribute('rowspan') || 1;
			const colspan = col.getAttribute('colspan') || 1;
			const content = col.innerHTML || '';

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
						columns[currY + y][currX + x] = '';
					}
				}
			}
			currY += 1;
		});
		currX += 1;
	});

	return columns;
}
