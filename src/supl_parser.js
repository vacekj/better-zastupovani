const cheerio = require('cheerio');
const dfnsFormat = require('date-fns/format');
const array2d = require('array2d');

function parseClassesPage(classesPage) {
	const $ = cheerio.load(classesPage);
	let options = $('option');
	let values = options.map((i, option) => {
		return $(option).text();
	});
	let classes = values.toArray();
	return classes;
}

function parseDatesPage(datesPage) {
	const $ = cheerio.load(datesPage);
	let options = $('option');
	let data = options.map((i, option) => {
		return {
			url: $(option).attr('value'),
			date: dfnsFormat($(option).attr('value').slice(7, 17), 'YYYY-MM-DD'),
		};
	});
	return data.toArray();
}

function parseSuplovani(suplovaniPage) {
	const $ = cheerio.load(suplovaniPage);

	let result = {
		chybejici: [],
		suplovani: [],
		nahradniUcebny: []
	};

	let correctedChybejiciArray = parseTable($, $('div:contains("Chybějící")').next())[0].slice(1);
	correctedChybejiciArray.forEach((row) => {
		// Parse the string
		let parsedArray = row.split(', ');
		parsedArray.some((elem) => {
			let kdo = elem.split(' ')[0];
			// check if range is present
			if (!elem.includes(' ')) {
				result.chybejici.push(new ChybejiciRow(kdo, null));
				return true;
			}
			let rangePart = elem.split(' ')[1];
			let formatted = rangePart.replace('(', '').replace(')', '');
			let range = Array(2);
			// decide if range or only one hour: (1..2) or (2)
			if (formatted.length == 1) {
				// only one hour
				range = [formatted, formatted];
			} else {
				// range of hours
				let splitRange = formatted.split('..');
				range = [splitRange[0], splitRange[1]];
			}
			result.chybejici.push(new ChybejiciRow(kdo, range));
		});
	});

	let correctedSuplArray = array2d.transpose(parseTable($, $('div:contains("Suplování")').next())).slice(2);
	array2d.eachRow(correctedSuplArray, (row) => {
		result.suplovani.push(new SuplRow(row[0], row[1], row[2], row[3], row[4], row[5], row[6], row[7]));
	});

	let correctedNahradniUcebnyArray = array2d.transpose(parseTable($, $('div:contains("Náhradní")').next())).slice(2);
	array2d.eachRow(correctedNahradniUcebnyArray, (row) => {
		result.nahradniUcebny.push(new NahradniUcebnyRow(row[0], row[1], row[2], row[3], row[4], row[5], row[6]));
	});

	return result;
}

class ChybejiciRow {
	constructor(kdo, range) {
		this.kdo = kdo;
		this.range = range;
	}
}

class SuplRow {
	constructor(hodina, trida, predmet, ucebna, nahucebna, vyuc, zastup, pozn) {
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

class NahradniUcebnyRow {
	constructor(hodina, trida, predmet, chybucebna, nahucebna, vyuc, pozn) {
		this.hodina = hodina;
		this.trida = trida;
		this.predmet = predmet;
		this.chybucebna = chybucebna;
		this.nahucebna = nahucebna;
		this.vyuc = vyuc;
		this.pozn = pozn;
	}
}

function parseTable($, context, dupCols, dupRows, textMode) {
	if (dupCols === undefined) dupCols = false;
	if (dupRows === undefined) dupRows = false;
	if (textMode === undefined) textMode = false;

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

module.exports = { parseDatesPage, parseSuplovani, ChybejiciRow, SuplRow, NahradniUcebnyRow, parseClassesPage};