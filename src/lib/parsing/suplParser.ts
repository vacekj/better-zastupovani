import * as array2d from "array2d";

import { load, parseTable } from "../utils/DOMUtils";

import { ChybejiciTable, parseChybejiciTable } from "./ChybejiciParser";

/**
 * Parses a classes page into an array of class strings
 *
 */
export function parseClassesPage(classesPage: string): string[] {
	const $ = load(classesPage);
	const options = $("option");

	return Array.from(options).map((option) => {
		return option.innerHTML;
	});
}

export function parseVyucujiciPage(vyucujiciPage: string): string[] {
	const $ = load(vyucujiciPage);
	const options = $("option");

	return Array.from(options).map((option) => {
		return option.innerHTML.split(" &nbsp;&nbsp;")[0];
	});
}

/**
 * Parses a suplovani page string into a SuplovaniPage object
 */
export function parseSuplovaniPage(suplovaniPage: string): SuplovaniPage {
	const $ = load(suplovaniPage);

	/* Page is empty / 404 */
	if ($(".StyleZ3")[0] === undefined) {
		return new SuplovaniPage({
			date: "",
			lastUpdated: "",
			chybejici: new ChybejiciTable([], [], []),
			suplovani: [],
			nahradniUcebny: [],
			dozory: [],
			oznameni: ""
		});
	}

	// Date
	const date = $(".StyleZ3")[0].innerHTML;

	// Chybejici
	const chybejiciTableElement = $("table")[0];
	let chybejiciTable: ChybejiciTable;
	if (chybejiciTableElement) {
		chybejiciTable = parseChybejiciTable(chybejiciTableElement);
	} else {
		chybejiciTable = new ChybejiciTable([], [], []);
	}

	// Suplovani
	const suplovaniRecords: SuplovaniRecord[] = [];
	const suplovaniAnchor = Array.from($("div.StyleZ4")).find((div) => div.innerHTML === "Suplování");
	if (suplovaniAnchor) {
		const suplovaniTable = suplovaniAnchor.nextElementSibling;
		const correctedSuplArray = array2d.transpose(parseTable(suplovaniTable)).slice(1);
		array2d.eachRow(correctedSuplArray, (row) => {
			suplovaniRecords.push(new SuplovaniRecord({
				hodina: row[0],
				trida: row[1],
				predmet: row[2],
				ucebna: row[3],
				nahucebna: row[4],
				vyuc: row[5],
				zastup: row[6],
				pozn: row[7]
			}));
		});
	}

	// Nahradni ucebny
	const nahradniUcebnaRecords: NahradniUcebnaRecord[] = [];
	const nahradniUcebnaAnchor = Array.from($("div.StyleZ4")).find((div) => div.innerHTML === "Náhradní učebny");
	if (nahradniUcebnaAnchor) {
		const nahradniUCebnaTable = nahradniUcebnaAnchor.nextElementSibling;
		const correctedNahradniUcebnyArray = array2d.transpose(parseTable(nahradniUCebnaTable)).slice(1);
		array2d.eachRow(correctedNahradniUcebnyArray, (row) => {
			nahradniUcebnaRecords.push(new NahradniUcebnaRecord({
				hodina: row[0],
				trida: row[1],
				vyuc: row[2],
				predmet: row[3],
				chybucebna: row[4],
				nahucebna: row[5],
				pozn: row[6]
			}));
		});
	}

	// Dozory
	const dozorRecords: DozorRecord[] = [];
	const dozoryAnchor = Array.from($("div.StyleZ4")).find((div) => div.innerHTML === "Dozor");
	if (dozoryAnchor) {
		const dozorRows = array2d.transpose(parseTable(dozoryAnchor.nextElementSibling)).slice(1);
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
	}

	// Last updated
	const lastUpdated = $('table[width="700"] td.StyleZ5')[0].innerHTML;

	// Oznámení
	const oznameni = $(".CellStyle_G0 > div.cell")[0];
	const oznameniText = oznameni ? oznameni.innerHTML.replace(new RegExp("<br><br>", "g"), "<br>") : "";

	return new SuplovaniPage({
		date,
		lastUpdated,
		chybejici: chybejiciTable,
		suplovani: suplovaniRecords,
		nahradniUcebny: nahradniUcebnaRecords,
		dozory: dozorRecords,
		oznameni: oznameniText
	});
}

/**
 * Helper class for removing nbsp
 *
 * @class Record
 */
export class Record {
	public removeNbsp() {
		Object.keys(this).map((key) => {
			if (typeof this[key] === "string") {
				this[key] = this[key].replace("&nbsp;", "");
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
	public oznameni: string;
	constructor(options: Partial<SuplovaniPage>) {
		Object.assign(this, options);
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

	constructor(options: Partial<SuplovaniRecord>) {
		super();
		Object.assign(this, options);
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
