import { parseTable } from "../utils/DOMUtils";
// TODO: Test this
export function parseChybejiciTable(chybejiciTable: Element): ChybejiciTable {
	const chybejiciRows = parseTable(chybejiciTable)[0].slice(1);
	const chybejiciArray = chybejiciRows.map((row) => {
		if (!row || row === "&nbsp;") {
			return [];
		}

		// Split the row into individual missing records
		const parsedRow = row.split(", ");

		return parsedRow.map((elem) => {
			const kdo = elem.split("(")[0];
			const range = extractRange(elem);

			return new ChybejiciRecord(kdo, rangeToSchedule(range));
		});
	});

	return new ChybejiciTable(chybejiciArray[0] || [], chybejiciArray[1] || [], chybejiciArray[2] || []);
}

function extractRange(elem: string): [string, string] | null {
	// No range
	if (!elem.includes(" ")) {
		return null;
	}

	// Extract range part from string
	const rangePart = elem.split(" ")[1].replace("(", "").replace(")", "");
	let range: [string, string] = ["", ""];
	// Decide if range or only one hour: (1..2) or (2)
	if (rangePart.length === 1) {
		// Only one hour
		range = [rangePart, rangePart];
	} else {
		// Range of hours
		const splitRange = rangePart.split("..");
		range = [splitRange[0], splitRange[1]];
	}

	return range;
}

/**
 * Dedupe and format missings array
 */
function formatMissingsArray(chybejiciArray: ChybejiciRecord[]) {
	const dedupedArray: ChybejiciRecord[] = [];
	if (!chybejiciArray || chybejiciArray.length === 0) {
		return [];
	}

	chybejiciArray.map((missing) => {
		const index = includesObjectWithProp(dedupedArray, "kdo", missing.kdo);
		if (index !== -1) {
			const originalObject = dedupedArray[index];
			dedupedArray[index] = Object.assign(originalObject, { schedule: missing.schedule });
		} else {
			dedupedArray.push(missing);
		}
	});

	return dedupedArray;
}

/**
 * Convert hour range to full schedule object
 * ["1", "3"] to {1: false, 2: false, 3: false, 4: true, ...}
 */
function rangeToSchedule(range: [string, string] | [string]): ISchedule {
	// No range -> full 8 hours
	if (range === null) {
		return {
			1: false,
			2: false,
			3: false,
			4: false,
			5: false,
			6: false,
			7: false,
			8: false
		};
	}

	// Single hour
	if ((range.length === 1) || (range[0] === range[1])) {
		const defaultObject = {
			1: true,
			2: true,
			3: true,
			4: true,
			5: true,
			6: true,
			7: true,
			8: true
		};
		defaultObject[range[0]] = false;

		return defaultObject;
	} else {
		// First and last hour of absence
		const obj: ISchedule = {
			1: undefined,
			2: undefined,
			3: undefined,
			4: undefined,
			5: undefined,
			6: undefined,
			7: undefined,
			8: undefined
		};
		// Until first hour of absence
		for (let hour = 1; hour < parseInt(range[0], 10); hour++) {
			obj[hour] = true;
		}

		// Absence hours
		for (let hour = parseInt(range[0], 10); hour <= parseInt(range[1], 10); hour++) {
			obj[hour] = false;
		}

		// After absence
		for (let hour = parseInt(range[1], 10) + 1; hour <= 8; hour++) {
			obj[hour] = true;
		}

		return obj;
	}
}

/**
 * Searches an array of objects for an object with a specified prop
 * Returns index if found
 */
function includesObjectWithProp(arr: ChybejiciRecord[], prop: string, value) {
	for (let i = 0; i < arr.length; i++) {
		if (arr[i][prop] === value) {
			return i;
		}
	}

	return -1;
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
	public schedule: ISchedule;
	constructor(kdo: string, schedule: ISchedule) {
		this.kdo = kdo;
		this.schedule = schedule;
	}
}

interface ISchedule {
	1: boolean;
	2: boolean;
	3: boolean;
	4: boolean;
	5: boolean;
	6: boolean;
	7: boolean;
	8: boolean;
}
