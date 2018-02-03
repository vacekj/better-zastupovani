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
import { parseSuplovaniPage, SuplovaniPage } from './lib/suplParser';
const suplGetter = new SuplGetterBrowser();

$(document).ready(bootstrap);

function bootstrap() {
	// populate date selector
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
			$(dateSelector).children(`[url="${today.url}"]`).attr('selected', 'true');
		}).catch();
}

function dateWithUrlToOption(dateWithUrl: DateWithUrl) {
	return `<option url="${dateWithUrl.url}">${dateWithUrl.dateString}</option>`;
}

function registerEventHandlers() {
	$('#selector_date').on('change', onFilterChange);
	$('#selector_filter').on('keyup', onDateChange);
}

function onFilterChange() {
	const value = this.value;
}

function onDateChange() {
	const newDateUrl: string = this.getAttribute('url');

	const suplovaniPage = suplGetter.getSuplovaniPage(newDateUrl)
		.then(parseSuplovaniPage)
		.then(render);
}

function render(suplovaniPage: SuplovaniPage, filter?: string) {

}
