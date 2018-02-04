// Bootstrap imports
import './bootstrap-md.min.css';

// Webpack imports
import './favicon.png';
import './index.html';
import './style.css';

import * as $ from 'jquery';
import * as Cookies from 'js-cookie';

import { compareAsc, format, isEqual, isToday } from 'date-fns';
import { DateWithUrl, parseDatesPage } from './lib/DatesParser';
import { SuplGetterBrowser } from './lib/suplGetter';
import { parseSuplovaniPage, SuplovaniPage, SuplovaniRecord } from './lib/suplParser';
const suplGetter = new SuplGetterBrowser();

$(document).ready(bootstrap);

var state: {
	currentSuplovaniPage: SuplovaniPage
} = {
		currentSuplovaniPage: null
	};

function bootstrap() {
	// populate date selector
	registerEventHandlers();
	suplGetter.getDatesPage()
		.then(parseDatesPage)
		.then((dates) => {
			// sort dates by descending
			const sortedDates = dates.sort((a, b) => {
				return compareAsc(a.date, b.date);
			});

			// get options
			const datesOptions = sortedDates.map(dateWithUrlToOption).reduce((acc, curr) => {
				return acc + curr;
			});

			// append options to date selector
			const dateSelector = $('#selector_date')[0];
			$(dateSelector).append(datesOptions);

			// get and select today's date
			const today = sortedDates.find((dateWithUrl) => {
				return isToday(dateWithUrl.date);
			});
			if (today) {
				$(dateSelector).children(`[url="${today.url}"]`).attr('selected', 'true');
			}

			// trigger first render
			dateSelector.dispatchEvent(new Event('change'));
		}).catch();
}

function dateWithUrlToOption(dateWithUrl: DateWithUrl) {
	return `<option url="${dateWithUrl.url}">${dateWithUrl.dateString}</option>`;
}

function registerEventHandlers() {
	$('#selector_date').on('change', onDateChange);
	$('#selector_filter').on('keyup', onFilterChange);
}

function onFilterChange() {
	const value = (<HTMLInputElement>this).value.trim();
	if (value && value.length) {
		render(undefined, value);
	} else {
		render(state.currentSuplovaniPage);
	}
}

function onDateChange() {
	const newDateUrl: string = (<HTMLSelectElement>this).selectedOptions[0].getAttribute('url');

	const suplovaniPage = suplGetter.getSuplovaniPage(newDateUrl)
		.then(parseSuplovaniPage)
		.then((suplovaniPage) => {
			state.currentSuplovaniPage = suplovaniPage;
			return suplovaniPage;
		})
		.then(render);
}

function render(suplovaniPage: SuplovaniPage, filter?: string) {
	if (filter) {
		const filteredSuplovaniRecords = state.currentSuplovaniPage.suplovani.filter((suplovaniRecord) => {
			return suplovaniRecordContainsString(suplovaniRecord, filter);
		});

		renderSuplovani(filteredSuplovaniRecords);
	} else {
		renderSuplovani(suplovaniPage.suplovani);
	}
}

function renderSuplovani(suplovaniRecords: SuplovaniRecord[]) {
	const suplovaniTable = $('#table_suplovani > tbody');
	suplovaniTable.empty();

	let contentToAppend = suplovaniRecords.length
		? suplovaniRecords.map(suplovaniRecordToTr).reduce((acc, tr) => acc + tr)
		: `<tr><td colspan="8">Žádné suplování</td></tr>`;

	suplovaniTable.append(contentToAppend);
}

function suplovaniRecordContainsString(suplovaniRecord: SuplovaniRecord, filter: string) {
	return Object.values(suplovaniRecord).some((value) => {
		return value.toLowerCase().includes(filter.toLowerCase());
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

/**
 * Removes control characters from a string
 *
 */
function removeControlChars(s: string) {
	return s.replace(/[\n\r\t]/g, '');
}