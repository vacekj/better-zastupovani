const cheerio = require('cheerio');
const dfnsFormatt = require('date-fns/format');
const array2d = require('array2d');

function parseClassesPage(classesPage: string): Array<string> {
	const $ = cheerio.load(classesPage);
	let options = $('option');
	let values = options.map((i, option) => {
		return $(option).text();
	});
	let classes = values.toArray();
	return classes;
}

type SuplovaniPageDate = {
	url: string;
	date: string;
};

function parseDatesPage(datesPage: string): [SuplovaniPageDate] {
	const $ = cheerio.load(datesPage);
	let options = $('option');
	let data = options.map((i, option) => {
		return {
			url: $(option).attr('value'),
			date: dfnsFormatt($(option).attr('value').slice(7, 17), 'YYYY-MM-DD'),
		};
	});
	return data.toArray();
}

/**
 * Parses a suplovani page string into a SuplovaniPage object
 * 
 * @param {string} suplovaniPage 
 * @returns {SuplovaniPage} 
 */
function parseSuplovani(suplovaniPage: string): SuplovaniPage {
	const $ = cheerio.load(suplovaniPage);

	// Chybejici
	let chybejiciRows = parseTable($, $('div:contains("Chybějící")').next())[0].slice(1);
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
	let suplovaniRecords: Array<SuplovaniRecord> = [];
	let correctedSuplArray = array2d.transpose(parseTable($, $('div:contains("Suplování")').next())).slice(2);
	array2d.eachRow(correctedSuplArray, (row) => {
		suplovaniRecords.push(new SuplovaniRecord(row[0], row[1], row[2], row[3], row[4], row[5], row[6], row[7]));
	});

	// Nahradni ucebny
	let nahradniUcebnaRecords: Array<NahradniUcebnaRecord> = [];
	let correctedNahradniUcebnyArray = array2d.transpose(parseTable($, $('div:contains("Náhradní")').next())).slice(2);
	array2d.eachRow(correctedNahradniUcebnyArray, (row) => {
		nahradniUcebnaRecords.push(new NahradniUcebnaRecord(row[0], row[1], row[2], row[3], row[4], row[5], row[6]));
	});

	return new SuplovaniPage(chybejiciTable, suplovaniRecords, nahradniUcebnaRecords);
}

class SuplovaniPage {
	chybejici: ChybejiciTable;
	suplovani: Array<SuplovaniRecord>;
	nahradniUcebny: Array<NahradniUcebnaRecord>;
	constructor(chybejici: ChybejiciTable, suplovani: Array<SuplovaniRecord>, nahradniUcebny: Array<NahradniUcebnaRecord>) {
		this.chybejici = chybejici;
		this.suplovani = suplovani;
		this.nahradniUcebny = nahradniUcebny;
	}
}

class ChybejiciTable {
	ucitele: Array<ChybejiciRecord>;
	tridy: Array<ChybejiciRecord>;
	ucebny: Array<ChybejiciRecord>;
	constructor(ucitele: Array<ChybejiciRecord>, tridy: Array<ChybejiciRecord>, ucebny: Array<ChybejiciRecord>) {
		this.ucitele = ucitele;
		this.tridy = tridy;
		this.ucebny = ucebny;
	}
}

class ChybejiciRecord {
	kdo: string;
	range: [string, string];
	constructor(kdo: string, range: [string, string]) {
		this.kdo = kdo;
		this.range = range;
	}
}

class SuplovaniRecord {
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

class NahradniUcebnaRecord {
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

function parseTable($, context, dupCols = false, dupRows = false, textMode = false): Array<Array<string>> {
	var columns = [],
		curr_x = 0,
		curr_y = 0;

	$("tr", context).each(function (row_idx, row) {
		curr_y = 0;
		$("td, th", row).each(function (col_idx, col) {
			var rowspan = $(col).attr('rowspan') || 1;
			var colspan = $(col).attr('colspan') || 1;
			var content;
			if (textMode === true) {
				content = $(col).text().trim() || "";
			} else {
				content = $(col).html() || "";
			}

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

module.exports = { parseDatesPage, parseSuplovani, ChybejiciRecord, SuplovaniRecord, NahradniUcebnaRecord, parseClassesPage };