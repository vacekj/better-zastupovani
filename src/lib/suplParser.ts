import * as array2d from 'array2d';
import { format, parse } from 'date-fns';

import { $context, load, parseTable } from './DOMUtils';

import { ChybejiciTable, parseChybejiciTable } from './ChybejiciParser';

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
 * Parses a suplovani page string into a SuplovaniPage object
 */
export function parseSuplovaniPage(suplovaniPage: string): SuplovaniPage {
	const $ = load(suplovaniPage);

	// Date
	const date = $('.StyleZ3')[0].innerHTML;

	// Chybejici
	const chybejiciTableElement = $('table')[0];
	const chybejiciTable = parseChybejiciTable(chybejiciTableElement);

	// Suplovani
	const suplovaniRecords: SuplovaniRecord[] = [];
	const suplovaniTable = $('td.StyleC3')[0].parentElement.parentElement.parentElement;
	const correctedSuplArray = array2d.transpose(parseTable(suplovaniTable)).slice(2);
	array2d.eachRow(correctedSuplArray, (row) => {
		suplovaniRecords.push(new SuplovaniRecord(row[0], row[1], row[2], row[3], row[4], row[5], row[6], row[7]));
	});

	// Nahradni ucebny
	const nahradniUcebnaRecords: NahradniUcebnaRecord[] = [];
	const nahradniUCebnaTable = $('td.StyleD3')[0].parentElement.parentElement.parentElement;
	const correctedNahradniUcebnyArray = array2d.transpose(parseTable(nahradniUCebnaTable)).slice(2);
	array2d.eachRow(correctedNahradniUcebnyArray, (row) => {
		nahradniUcebnaRecords.push(new NahradniUcebnaRecord({
			hodina: row[0],
			trida: row[1],
			predmet: row[2],
			chybucebna: row[3],
			nahucebna: row[4],
			vyuc: row[5],
			pozn: row[6]
		}));
	});

	// Dozory
	const dozoryTable = $('table[width="605"]')[0];
	const dozorRows = array2d.transpose(parseTable(dozoryTable)).slice(2);
	const dozorRecords: DozorRecord[] = [];
	array2d.eachRow(dozorRows, (dozorRow) => {
		dozorRecords.push(new DozorRecord({
			timeStart: dozorRow[0],
			timeEnd: dozorRow[1],
			misto: dozorRow[2],
			chybejici: dozorRow[3],
			dozorujici: dozorRow[4],
			poznamka: dozorRow[5]
		}));
	});

	// Last updated
	const lastUpdated = $('table[width="700"] td.StyleZ5')[0].innerHTML;

	return new SuplovaniPage(date, chybejiciTable, suplovaniRecords, nahradniUcebnaRecords, dozorRecords, lastUpdated);
}

/**
 * Helper class for removing nbsp
 *
 * @class Record
 */
export class Record {
	public removeNbsp() {
		Object.keys(this).map((key) => {
			if (typeof this[key] === 'string') {
				this[key] = this[key].replace('&nbsp;', '');
			}
		});
	}
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
 * Represents a single suplovani record
 *
 * @export
 * @class SuplovaniRecord
 */
export class SuplovaniRecord extends Record {
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
		super();
		this.hodina = hodina;
		this.trida = trida;
		this.predmet = predmet;
		this.ucebna = ucebna;
		this.nahucebna = nahucebna;
		this.vyuc = vyuc;
		this.zastup = zastup;
		this.pozn = pozn;
		this.removeNbsp();
	}
}

/**
 * Represents a single NahradniUcebna record
 *
 * @export
 * @class NahradniUcebnaRecord
 */
export class NahradniUcebnaRecord extends Record {
	public hodina: string;
	public trida: string;
	public predmet: string;
	public chybucebna: string;
	public nahucebna: string;
	public vyuc: string;
	public pozn: string;
	constructor(options: Partial<NahradniUcebnaRecord>) {
		super();
		Object.assign(this, options);
		this.removeNbsp();
	}
}

/**
 * Represents a single Dozor record
 */
export class DozorRecord extends Record {
	public timeStart: string;
	public timeEnd: string;
	public misto: string;
	public chybejici: string;
	public dozorujici: string;
	public poznamka: string;
	constructor(options: Partial<DozorRecord>) {
		super();
		Object.assign(this, options);
		this.removeNbsp();
	}
}
