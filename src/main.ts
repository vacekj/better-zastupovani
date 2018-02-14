// Polyfills
import "babel-polyfill";
import "whatwg-fetch";

// Bootstrap imports
import "./bootstrap-md.min.css";

// Webpack imports
import "./favicon.png";
import "./index.html";
import "./style.css";

// Images
import "./gh.png";
import "./pecet.jpg";
import "./svg/code.svg";
import "./svg/heart.svg";

import * as $ from "jquery";
import * as Cookies from "js-cookie";

import { addYears, closestIndexTo, closestTo, compareDesc, format, isEqual, isPast, isToday, isTomorrow, isWeekend, startOfTomorrow } from "date-fns";
import { SuplGetterBrowser } from "./lib/getting/suplGetter";
import { ChybejiciRecord, ChybejiciTable } from "./lib/parsing/ChybejiciParser";
import { DateWithUrl, parseDatesPage } from "./lib/parsing/DatesParser";
import { DozorRecord, NahradniUcebnaRecord, parseClassesPage, parseSuplovaniPage, parseVyucujiciPage, Record, SuplovaniPage, SuplovaniRecord } from "./lib/parsing/suplParser";
import { addBackToTop } from "./lib/utils/backToTop";
const suplGetter = new SuplGetterBrowser();

const state: {
	currentSuplovaniPage: SuplovaniPage,
	sortedDates: DateWithUrl[]
} = {
		currentSuplovaniPage: null,
		sortedDates: null
	};

const COOKIE_FILTER = "filter";

$(document).ready(bootstrap);

function bootstrap() {
	addBackToTop({
		backgroundColor: "#002c5f",
		diameter: 56,
		showWhenScrollTopIs: 200,
		textColor: "#fff"
	});
	showLoadingIndicator();
	disableInputs();
	registerEventHandlers();

	// Filter suggestions
	const suggestionPromises = Promise.all([suplGetter.getClassesPage().then(parseClassesPage), suplGetter.getVyucujiciPage().then(parseVyucujiciPage)]);
	suggestionPromises.then((suggestions) => {
		const options = suggestions[0].concat(suggestions[1]).map((suggestion) => {
			return `<option value="${suggestion}">`;
		}).reduce((acc, el) => acc + el);
		$("datalist#filterSuggestions").append(options);
	});

	// Populate date selector
	suplGetter.getDatesPage()
		.then(parseDatesPage)
		.then((dates) => {
			// Sort dates by descending
			const sortedDates = dates.sort((a, b) => {
				return compareDesc(a.date, b.date);
			});

			// Update states (needed only once)
			state.sortedDates = sortedDates;

			// Get options
			const datesOptions = sortedDates.map(dateWithUrlToOption).reduce((acc, curr) => {
				return acc + curr;
			});

			// Append options to date selector
			const dateSelector = $("#selector_date")[0];
			$(dateSelector).append(datesOptions);

			// Trigger first render
			dateSelector.dispatchEvent(new Event("change"));

			// Get and select closest (or next) working day
			const closestIndex = closestIndexTo(new Date(), sortedDates.map((date) => date.date));
			let closestDay = state.sortedDates[closestIndex];
			if (isPast(closestDay.date)) {
				closestDay = state.sortedDates[closestIndex - 1];
			}
			if (closestDay) {
				selectDate(closestDay);
			}
		}).catch(console.log);
}

function dateWithUrlToOption(dateWithUrl: DateWithUrl) {
	return `<option url="${dateWithUrl.url}">${dateWithUrl.dateString}</option>`;
}

function disableInputs() {
	// Disable today button during the weekend
	if (isWeekend(new Date())) {
		$("button#today").attr("disabled", "true");
	}

	// Disable tomorrow button if tomorrow is the weekend
	if (isWeekend(startOfTomorrow())) {
		$("button#tomorrow").attr("disabled", "true");
	}
}

function registerEventHandlers() {
	$("button#today").on("click", () => {
		const today = state.sortedDates.find((dateWithUrl) => {
			return isToday(dateWithUrl.date);
		});

		if (today === undefined) {
			return;
		}

		selectDate(today);
	});

	$("button#tomorrow").on("click", () => {
		const tomorrow = state.sortedDates.find((dateWithUrl) => {
			return isTomorrow(dateWithUrl.date);
		});

		// There's no tomorrow ;)
		if (tomorrow === undefined) {
			return;
		}

		selectDate(tomorrow);
	});
	$("#selector_date").on("change", onDateChange);
	$("#selector_filter").on("keyup input", onFilterChange);
}

function selectDate(date: DateWithUrl) {
	const dateSelector = $("#selector_date")[0];
	const index = state.sortedDates.indexOf(date);
	if (index) {
		(dateSelector as HTMLSelectElement).selectedIndex = index;
		// Need to manually trigger render
		dateSelector.dispatchEvent(new Event("change"));
	}
}

function onFilterChange() {
	const value = (this as HTMLInputElement).value.trim();
	if (value && value.length) {
		render(undefined, value);
	} else {
		render(state.currentSuplovaniPage);
	}

	// Save filter to cookiecookie
	Cookies.set(COOKIE_FILTER, value, { expires: addYears(new Date(), 1) });
}

function onDateChange() {
	showLoadingIndicator();
	const newDateUrl: string = (this as HTMLSelectElement).options[(this as HTMLSelectElement).selectedIndex].getAttribute("url");

	suplGetter.getSuplovaniPage(newDateUrl)
		.then(parseSuplovaniPage)
		.then((suplovaniPage) => {
			state.currentSuplovaniPage = suplovaniPage;
			return suplovaniPage;
		})
		.then((suplovaniPage) => {
			render(suplovaniPage);
			// Filter cookie
			if (Cookies.get(COOKIE_FILTER)) {
				$("#selector_filter").val(Cookies.get(COOKIE_FILTER));
				$("#selector_filter")[0].dispatchEvent(new Event("keyup"));
			}
		}).catch(console.log);
}

function render(suplovaniPage: SuplovaniPage, filter?: string) {
	if (filter) {
		const filterRecords = <T>(records: T[], filterString: string) => {
			return records.filter((record) => {
				return objectContainsString(record, filterString);
			});
		};

		renderSuplovani(filterRecords(state.currentSuplovaniPage.suplovani, filter));
		renderDozory(filterRecords(state.currentSuplovaniPage.dozory, filter));
		renderNahradniUcebny(filterRecords(state.currentSuplovaniPage.nahradniUcebny, filter));
	} else {
		renderSuplovani(suplovaniPage.suplovani);
		renderDozory(suplovaniPage.dozory);
		renderNahradniUcebny(suplovaniPage.nahradniUcebny);

		// Non-filtered
		renderChybejici(suplovaniPage.chybejici);
	}
}

function renderSuplovani(suplovaniRecords: SuplovaniRecord[]) {
	const suplovaniTable = $("#table_suplovani > tbody");
	suplovaniTable.empty();

	const contentToAppend = suplovaniRecords.length
		? suplovaniRecords.map(suplovaniRecordToTr).reduce((acc, tr) => acc + tr)
		: rowHeader("Žádné suplování", 8);

	suplovaniTable.append(contentToAppend);
}

function objectContainsString<T>(object: T, filter: string) {
	return Object.values(object).some((value: string) => {
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

function renderDozory(dozorRecords: DozorRecord[]) {
	const dozorTable = $("#table_dozory > tbody");
	dozorTable.empty();

	const contentToAppend = dozorRecords.length
		? dozorRecords.map(dozorRecordToTr).reduce((acc, tr) => acc + tr)
		: rowHeader("Žádné dozory", 6);

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
	const chybejiciTable = $("#table_chybejici > tbody");
	chybejiciTable.empty();

	const noChybejici = rowHeader("Žádní chybějící", 9);

	const ucitele = chybejici.ucitele.map(chybejiciRecordToTr).reduce((acc, el) => acc + el);
	const tridy = chybejici.tridy.map(chybejiciRecordToTr).reduce((acc, el) => acc + el);
	const ucebny = chybejici.ucebny.map(chybejiciRecordToTr).reduce((acc, el) => acc + el);

	const contentToAppend = `
	${rowHeader("Učitelé", 9)}
	${ucitele.length ? ucitele : noChybejici}
	${rowHeader("Třídy", 9)}
	${tridy.length ? tridy : noChybejici}
	${rowHeader("Učebny", 9)}
	${ucebny.length ? ucebny : noChybejici}
	`;

	chybejiciTable.append(contentToAppend);
}

function chybejiciRecordToTr(chybejiciRecord: ChybejiciRecord) {
	const cells = Object.keys(chybejiciRecord.schedule).map((hour) => {
		return `<td class="${chybejiciRecord.schedule[hour] ? "present" : "absent"}">${hour}</td>`;
	});

	const row = `
		<tr>
			<td>${chybejiciRecord.kdo}</td>
			${cells.join("")}
		</tr >
	`;

	return removeControlChars(row);
}

function renderNahradniUcebny(nahradniUcebnyRecords: NahradniUcebnaRecord[]) {
	const nahradniUcebnyTable = $("#table_nahradniUcebny > tbody");
	nahradniUcebnyTable.empty();

	const contentToAppend = nahradniUcebnyRecords.length
		? nahradniUcebnyRecords.map(nahradniUcebnaRecordToTr).reduce((acc, tr) => acc + tr)
		: rowHeader("Žádné náhradní učebny", 8);

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
	return `<tr><td colspan="${colspan}" class="noCellBg">${text}</td></tr>`;
}

/**
 * Removes control characters from a string
 *
 */
function removeControlChars(s: string) {
	return s.replace(/[\n\r\t]/g, "");
}

function showLoadingIndicator() {
	const indicator = (colspan) => `
	<tr data-test="loadingIndicator">
		<td colspan="${colspan}" class="noCellBg">
			<svg class="spinner" width="65px" height="65px" viewBox="0 0 66 66" xmlns="http://www.w3.org/2000/svg">
				<circle class="path" fill="none" stroke-width="6" stroke-linecap="round" cx="33" cy="33" r="30"></circle></svg>
		</td>
	</tr>`;

	$("#table_suplovani > tbody").html(indicator(8));
	$("#table_dozory > tbody").html(indicator(6));
	$("#table_chybejici > tbody").html(indicator(9));
	$("#table_nahradniUcebny > tbody").html(indicator(7));
}
