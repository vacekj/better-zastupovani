// Bootstrap imports
import './bootstrap-md.min.css';

// Webpack imports
import './favicon.png';
import './index.html';
import './style.css';

// images
import './svg/code.svg';
import './svg/heart.svg';
import './gh.png';
import './pecet.jpg';

import * as $ from 'jquery';
import * as Cookies from 'js-cookie';

import { format, isEqual, compareDesc, closestIndexTo, closestTo } from 'date-fns';
import { DateWithUrl, parseDatesPage } from './lib/DatesParser';
import { SuplGetterBrowser } from './lib/suplGetter';
import { parseSuplovaniPage, SuplovaniPage, SuplovaniRecord, DozorRecord, Record, NahradniUcebnaRecord, parseClassesPage, parseVyucujiciPage } from './lib/suplParser';
import { ChybejiciTable, ChybejiciRecord } from 'src/lib/ChybejiciParser';
const suplGetter = new SuplGetterBrowser();

var state: {
	currentSuplovaniPage: SuplovaniPage
} = {
		currentSuplovaniPage: null
	};

const COOKIE_FILTER = 'filter';

$(document).ready(bootstrap);

function bootstrap() {
	// populate date selector
	registerEventHandlers();
	showLoadingIndicator();

	// Filter suggestions
	const suggestionPromises = Promise.all([suplGetter.getClassesPage().then(parseClassesPage), suplGetter.getVyucujiciPage().then(parseVyucujiciPage)]);
	suggestionPromises.then((suggestions) => {
		const options = suggestions[0].concat(suggestions[1]).map((suggestion) => {
			return `<option value="${suggestion}">`;
		}).reduce((acc, el) => acc + el);
		$('datalist#filterSuggestions').append(options);
	});

	// Main load
	suplGetter.getDatesPage()
		.then(parseDatesPage)
		.then((dates) => {
			// sort dates by descending
			const sortedDates = dates.sort((a, b) => {
				return compareDesc(a.date, b.date);
			});

			// get options
			const datesOptions = sortedDates.map(dateWithUrlToOption).reduce((acc, curr) => {
				return acc + curr;
			});

			// append options to date selector
			const dateSelector = $('#selector_date')[0];
			$(dateSelector).append(datesOptions);

			// trigger first render
			dateSelector.dispatchEvent(new Event('change'));

			// get and select closest day to today
			const closestDay = closestTo(new Date(), sortedDates.map((date) => date.date));
			const today = sortedDates.find((date) => isEqual(date.date, closestDay));
			if (today) {
				(<HTMLSelectElement>dateSelector).selectedIndex = sortedDates.indexOf(today);
				dateSelector.dispatchEvent(new Event('change'));
			}
		}).catch(console.log);
}

function dateWithUrlToOption(dateWithUrl: DateWithUrl) {
	return `<option url="${dateWithUrl.url}">${dateWithUrl.dateString}</option>`;
}

function registerEventHandlers() {
	$('#selector_date').on('change', onDateChange);
	$('#selector_filter').on('keyup input', onFilterChange);
}

function onFilterChange() {
	const value = (<HTMLInputElement>this).value.trim();
	if (value && value.length) {
		render(undefined, value);
	} else {
		render(state.currentSuplovaniPage);
	}

	// save filter to cookie
	Cookies.set(COOKIE_FILTER, value);
}

function onDateChange() {
	const newDateUrl: string = (<HTMLSelectElement>this).selectedOptions[0].getAttribute('url');

	const suplovaniPage = suplGetter.getSuplovaniPage(newDateUrl)
		.then(parseSuplovaniPage)
		.then((suplovaniPage) => {
			state.currentSuplovaniPage = suplovaniPage;
			return suplovaniPage;
		})
		.then()
		.then((suplovaniPage) => {
			render(suplovaniPage);
			// filter cookie
			if (Cookies.get(COOKIE_FILTER)) {
				$('#selector_filter').val(Cookies.get(COOKIE_FILTER));
				$('#selector_filter')[0].dispatchEvent(new Event('keyup'));
			}
		}).catch(console.log);
}

function render(suplovaniPage: SuplovaniPage, filter?: string) {
	if (filter) {
		const filterRecords = <T>(records: T[], filter: string) => {
			return records.filter((record) => {
				return objectContainsString(record, filter);
			});
		};

		renderSuplovani(filterRecords(state.currentSuplovaniPage.suplovani, filter));
		renderDozory(filterRecords(state.currentSuplovaniPage.dozory, filter));
	} else {
		renderSuplovani(suplovaniPage.suplovani);
		renderDozory(suplovaniPage.dozory);

		// non-filtered
		renderChybejici(suplovaniPage.chybejici);
		renderNahradniUcebny(suplovaniPage.nahradniUcebny);
	}
}

function renderSuplovani(suplovaniRecords: SuplovaniRecord[]) {
	const suplovaniTable = $('#table_suplovani > tbody');
	suplovaniTable.empty();

	let contentToAppend = suplovaniRecords.length
		? suplovaniRecords.map(suplovaniRecordToTr).reduce((acc, tr) => acc + tr)
		: rowHeader('Žádné suplování', 8);

	suplovaniTable.append(contentToAppend);
}

function objectContainsString<T>(object: T, filter: string) {
	return Object.values(object).some((value) => {
		return value.includes(filter);
	});
}

function suplovaniRecordToTr(suplovaniRecord: SuplovaniRecord): string {
	return removeControlChars(`<tr>
				<td>${suplovaniRecord.hodina}</td>
				<td>${suplovaniRecord.trida}</td>
				<td>${suplovaniRecord.predmet}</td>
				<td>${suplovaniRecord.ucebna}</td>
				<td>${suplovaniRecord.nahucebna}</td>
				<td>${suplovaniRecord.vyuc}</td>
				<td>${suplovaniRecord.zastup}</td>
				<td>${suplovaniRecord.pozn}</td>
			</tr>
			`);
}

function renderDozory(dozorRecords: DozorRecord[]) {
	const dozorTable = $('#table_dozory > tbody');
	dozorTable.empty();

	let contentToAppend = dozorRecords.length
		? dozorRecords.map(dozorRecordToTr).reduce((acc, tr) => acc + tr)
		: rowHeader('Žádné dozory', 6);

	dozorTable.append(contentToAppend);
}

function dozorRecordToTr(dozorRecord: DozorRecord): string {
	return removeControlChars(`<tr>
				<td>${dozorRecord.timeStart}</td>
				<td>${dozorRecord.timeEnd}</td>
				<td>${dozorRecord.misto}</td>
				<td>${dozorRecord.chybejici}</td>
				<td>${dozorRecord.dozorujici}</td>
				<td>${dozorRecord.poznamka}</td>
			</tr>`);
}

function renderChybejici(chybejici: ChybejiciTable) {
	const chybejiciTable = $('#table_chybejici > tbody');
	chybejiciTable.empty();

	const noChybejici = rowHeader('Žádní chybějící', 9);

	const ucitele = chybejici.ucitele.map(chybejiciRecordToTr).reduce((acc, el) => acc + el);
	const tridy = chybejici.tridy.map(chybejiciRecordToTr).reduce((acc, el) => acc + el);
	const ucebny = chybejici.ucebny.map(chybejiciRecordToTr).reduce((acc, el) => acc + el);

	const contentToAppend = `
	${rowHeader('Učitelé', 9)}
	${ucitele.length ? ucitele : noChybejici}
	${rowHeader('Třídy', 9)}
	${tridy.length ? tridy : noChybejici}
	${rowHeader('Učebny', 9)}
	${ucebny.length ? ucebny : noChybejici}
	`;

	chybejiciTable.append(contentToAppend);
}

function chybejiciRecordToTr(chybejiciRecord: ChybejiciRecord) {
	const cells = Object.keys(chybejiciRecord.schedule).map((hour) => {
		return `<td class="${chybejiciRecord.schedule[hour] ? 'present' : 'absent'}">${hour}</td>`;
	});

	const row = `
		<tr>
			<td>${chybejiciRecord.kdo}</td>
			${cells.join('')}
		</tr >
	`;

	return removeControlChars(row);
}

function renderNahradniUcebny(nahradniUcebnyRecords: NahradniUcebnaRecord[]) {
	const nahradniUcebnyTable = $('#table_nahradniUcebny > tbody');
	nahradniUcebnyTable.empty();

	let contentToAppend = nahradniUcebnyRecords.length
		? nahradniUcebnyRecords.map(nahradniUcebnaRecordToTr).reduce((acc, tr) => acc + tr)
		: rowHeader('Žádné náhradní učebny', 8);

	nahradniUcebnyTable.append(contentToAppend);
}

function nahradniUcebnaRecordToTr(nahradniUcebna: NahradniUcebnaRecord) {
	return removeControlChars(`<tr>
			<td>${nahradniUcebna.hodina}</td>
			<td>${nahradniUcebna.trida}</td>
			<td>${nahradniUcebna.predmet}</td>
			<td>${nahradniUcebna.chybucebna}</td>
			<td>${nahradniUcebna.nahucebna}</td>
			<td>${nahradniUcebna.vyuc}</td>
			<td>${nahradniUcebna.pozn}</td>
		</tr>`);
}

function rowHeader(text: string, colspan: number) {
	return `<tr><td colspan="${colspan}">${text}</td></tr>`;
}

/**
 * Removes control characters from a string
 *
 */
function removeControlChars(s: string) {
	return s.replace(/[\n\r\t]/g, '');
}

function showLoadingIndicator() {
	const indicator = (colspan) => `
	<tr data-test="loadingIndicator">
		<td colspan="${colspan}">
			<svg class="spinner" width="65px" height="65px" viewBox="0 0 66 66" xmlns="http://www.w3.org/2000/svg">
				<circle class="path" fill="none" stroke-width="6" stroke-linecap="round" cx="33" cy="33" r="30"></circle></svg>
		</td>
	</tr>`;

	$('#table_suplovani > tbody').append(indicator(8));
	$('#table_dozory > tbody').append(indicator(6));
	$('#table_chybejici > tbody').append(indicator(9));
	$('#table_nahradniUcebny > tbody').append(indicator(7));
}