// Bootstrap imports
import './bootstrap-md.min.css';

// Webpack imports
require('./index.html');
require('./style.css');
require('./style.js');
require('./favicon.png');

const $ = require('cash-dom');
const Cookies = require('js-cookie');

const dfnsFormat = require('date-fns/format');
const dfnsIsEqual = require('date-fns/is_equal');
const dfnsCompareAsc = require('date-fns/compare_asc');

const COOKIE_FILTER = 'trida';
const API_URL = 'https://zastupovani.herokuapp.com/api/data';

type Window = {
	state: State;
};

let window: Window;

type State = {
	suplovani?: any[];
	classes?: any[];
	currentDate?: String;
	currentFilter?: String;
};

// Create global state
window.state = {
	suplovani: [],
	classes: [],
	currentDate: dfnsFormat(new Date(), 'YYYY-MM-DD'),
	currentFilter: ''
};

// MAIN ENTRY POINT
$(() => {
	registerEventHandlers();

	// Remember filter
	const filterCookie = Cookies.get(COOKIE_FILTER);
	if (filterCookie !== undefined && filterCookie !== '') {
		setState({
			currentFilter: filterCookie
		});
	}

	// Update state from server
	showLoadingIndicator();
	setInputsDisabled(true);
	getStateFromServer().then((state) => {
		setState(state);
		setInputsDisabled(false);
	}).catch((err) => {
		console.log(err);
	});
});

function setState(newState: Partial<State>, overwrite = false): void {
	if (overwrite) {
		window.state = newState;
	} else {
		window.state = Object.assign(getState(), newState);
	}
	render();
}

function getState(): State {
	return window.state;
}

function getStateFromServer(): Promise<Partial<State>> {
	return new Promise((resolve, reject) => {
		fetch(API_URL).then((result) => {
			return result.json();
		}).then((res) => {
			resolve({
				suplovani: res.suplovani
			});
		}).catch(reject);
	});
}

function registerEventHandlers(): void {
	$('#selector_filter').on('keyup', function () {
		const newValue = this.value;
		setState({
			currentFilter: newValue
		});
		Cookies.set(COOKIE_FILTER, newValue);
	});
	const dateHandler = function () {
		const newValue = this.value;
		setState({
			currentDate: newValue
		});
	};
	$('#selector_date').on('change', dateHandler).on('input', dateHandler);
}

function render() {
	renderFilter();
	renderDates();
	renderSuplovani();
	renderMissings();
	renderNahradniUcebny();
}

function renderNahradniUcebny() {
	// clear the table
	$('#table_nahradniUcebny > tbody').empty();
	let contentToAppend = '';
	const noMissings = `<tr>
	<td colspan="9">Žádní náhradní učebny</td>
	</tr>
	`;
	const currentSupl = getSuplovaniForSelectedDate(getState().suplovani, getState().currentDate);

	const nahUcebny = currentSupl ? currentSupl.nahradniUcebny.map(nahradniUcebnaToRow) : [];

	contentToAppend = nahUcebny.length ? nahUcebny : noMissings;

	$('#table_nahradniUcebny > tbody').append(contentToAppend);
}

function renderMissings() {
	// clear the table
	$('#table_missings > tbody').empty();
	let contentToAppend = '';
	const noMissings = `<tr>
	<td colspan="9">Žádní chybějící</td>
	</tr>
	`;

	const missings = formatMissingsArray(getMissings().chybejici).map(missingToTimetableRow).reduce((acc, row) => {
		return acc + row;
	}, '');

	contentToAppend = missings.length ? missings : noMissings;

	$('#table_missings > tbody').append(contentToAppend);
}

function getMissings() {
	const suplovani = getState().suplovani;
	if (!suplovani) {
		return [];
	}
	const currentSuplovani = getSuplovaniForSelectedDate(getState().suplovani, getState().currentDate);
	if (!currentSuplovani) {
		return [];
	}

	return currentSuplovani;
}

function renderSuplovani() {
	// clear the table
	$('#table_suplovani > tbody').empty();

	let contentToAppend = '';
	const noSupl = `<tr>
	<td colspan="8">Žádné suplování</td>
	</tr>
	`;

	const selectedSuplovani = getSelectedSuplovani();
	contentToAppend = selectedSuplovani.length ? SuplovaniRowToTrs(selectedSuplovani) : noSupl;

	$('#table_suplovani > tbody').append(contentToAppend);
}

function getSelectedSuplovani() {
	const suplovani = getState().suplovani;

	if (!suplovani) {
		return [];
	}

	const currentSuplovani = getSuplovaniForSelectedDate(getState().suplovani, getState().currentDate);
	if (!currentSuplovani) {
		return [];
	}

	const filter = getState().currentFilter.trim();

	return currentSuplovani.suplovani.filter((elem) => {
		return suplovaniRowContainsString(elem, filter);
	});
}

function getSuplovaniForSelectedDate(suplovani = getState().suplovani, date = getState().currentDate) {
	return suplovani.find((supl) => {
		return dfnsIsEqual(dfnsFormat(supl.date, 'YYYY-MM-DD'), date);
	});
}

function suplovaniRowContainsString(suplovaniRow, filter) {
	return Object.keys(suplovaniRow).some((element, index, array) => {
		return suplovaniRow[element].toLowerCase().includes(filter.toLowerCase());
	});
}

function SuplovaniRowToTrs(suplovaniRow) {
	return suplovaniRow.map((element) => {
		return removeControlChars(`<tr>
			<td>${element.hodina}</td>
			<td>${element.trida}</td>
			<td>${element.predmet}</td>
			<td>${element.ucebna}</td>
			<td>${element.nahucebna}</td>
			<td>${element.vyuc}</td>
			<td>${element.zastup}</td>
			<td>${element.pozn}</td>
		</tr>
		`);
	});
}

function renderDates() {
	// Extract dates from context
	const dates = getState().suplovani.map((suplovani) => {
		return suplovani.date;
	});

	if (!dates.length) {
		return;
	}

	// Set current value
	$('#selector_date').val(getState().currentDate);

	// Sort dates ascending
	const sorted = dates.sort((a, b) => {
		return dfnsCompareAsc(a, b);
	});

	// Set Max and Min value
	const min = sorted[0];
	const max = sorted[sorted.length - 1];
	$('#selector_date').prop({
		max: dfnsFormat(max, 'YYYY-MM-DD'),
		min: dfnsFormat(min, 'YYYY-MM-DD')
	});
}

function renderFilter() {
	$('#selector_filter').val(getState().currentFilter);
}

// Loading indicator
function showLoadingIndicator() {
	const indicator = (colspan) => `
	<tr data-test="loadingIndicator">
		<td colspan="${colspan}">
			<svg class="spinner" width="65px" height="65px" viewBox="0 0 66 66" xmlns="http://www.w3.org/2000/svg">
				<circle class="path" fill="none" stroke-width="6" stroke-linecap="round" cx="33" cy="33" r="30"></circle></svg>
		</td>
	</tr>`;

	$('#table_suplovani > tbody').append(indicator(8));
	$('#table_missings > tbody').append(indicator(9));
	$('#table_nahradniUcebny > tbody').append(indicator(7));
}

/**
 * Dedupe and format missings array
 * TODO: move this to parser
 */
function formatMissingsArray(missingsArray) {
	const dedupedArray = [];
	if (!missingsArray || missingsArray.length === 0) {
		return [];
	}
	missingsArray.map((missing) => {
		const index = includesObjectWithProp(dedupedArray, 'kdo', missing.kdo);
		if (index !== -1) {
			const originalObject = dedupedArray[index];
			dedupedArray[index] = {
				...originalObject,
				schedule: { ...originalObject.schedule, ...rangeToSchedule(missing.range) }
			};

		} else {
			dedupedArray.push({
				kdo: missing.kdo,
				schedule: rangeToSchedule(missing.range)
			});
		}
	});

	return dedupedArray;
}

/**
 * Convert hour range to full schedule object
 * ["1", "3"] to {1: false, 2: false, 3: false, 4: true}
 */
function rangeToSchedule(range) {
	// no range -> full 8 hours
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

	// single hour
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
	} else { //first and last hour of absence
		const obj = {};
		// until first hour of absence
		for (let hour = 1; hour < range[0]; hour++) {
			obj[hour] = true;
		}

		// absence hours
		for (let hour = range[0]; hour <= range[1]; hour++) {
			obj[hour] = false;
		}

		// after absence
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
function includesObjectWithProp(arr, prop, value) {
	for (let i = 0; i < arr.length; i++) {
		if (arr[i][prop] === value) {
			return i;
		}
	}

	return -1;
}

/**
 *
 *
 */
function missingToTimetableRow(missing) {
	const cells = [];

	for (const hour in missing.schedule) {
		cells.push(`<td class="${missing.schedule[hour] ? 'present' : 'absent'}">${hour}</td>`);
	}

	const row = `
		<tr>
			<td>${missing.kdo}</td>
			${cells.join('')}
		</tr >
	`;

	return removeControlChars(row);
}

function nahradniUcebnaToRow(nah) {
	return removeControlChars(`<tr>
			<td>${nah.hodina}</td>
			<td>${nah.trida}</td>
			<td>${nah.predmet}</td>
			<td>${nah.chybucebna}</td>
			<td>${nah.nahucebna}</td>
			<td>${nah.vyuc}</td>
			<td>${nah.pozn}</td>
		</tr>
		`);
}

/**
 * Removes control characters from a string
 *
 */
function removeControlChars(s: string) {
	return s.replace(/[\n\r\t]/g, '');
}

/**
 * Disables user input
 * Used for blocking user input until data is loadedk
 *
 */
function setInputsDisabled(value) {
	const collection = $('#selector_filter').add('#selector_date');
	if (value) {
		collection.attr('disabled', true);
	} else {
		collection.removeAttr('disabled');
	}
}
