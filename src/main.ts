// Polyfills
import "babel-polyfill";
import "whatwg-fetch";

// Bootstrap imports
import "./bootstrap-md.min.css";

// Webpack imports
import "./favicon.png";
import "./index.html";
import "./robots.txt";
import "./style.css";

// Images
import "./gh.png";
import "./pecet.jpg";
import "./svg/code.svg";
import "./svg/heart.svg";

// NPM Modules
import { addYears, closestIndexTo, compareDesc, isBefore, isPast, isToday, isTomorrow, isWeekend, setHours, startOfTomorrow } from "date-fns";
import * as Hammer from "hammerjs";
import * as $ from "jquery";
import * as Cookies from "js-cookie";
import Raven from "raven-js";

// LIB Modules
import { SuplGetterBrowser } from "./lib/getting/suplGetter";
import { ChybejiciRecord, ChybejiciTable } from "./lib/parsing/ChybejiciParser";
import { DateWithUrl, parseDatesPage } from "./lib/parsing/DatesParser";
import { DozorRecord, NahradniUcebnaRecord, parseClassesPage, parseSuplovaniPage, parseVyucujiciPage, Record, SuplovaniPage, SuplovaniRecord } from "./lib/parsing/suplParser";
import { addBackToTop } from "./lib/utils/backToTop";

const suplGetter = new SuplGetterBrowser();

// tslint:disable-next-line:prefer-const
let state: {
	currentSuplovaniPage: SuplovaniPage | null,
	sortedDates: DateWithUrl[] | null
} = {
		currentSuplovaniPage: null,
		sortedDates: null
	};

const Selectors = {
	DateSelector: $("#selector_date"),
	TodayButton: $("button#today"),
	TomorrowButton: $("button#tomorrow"),
	FilterSelector: $("#selector_filter")
};

const COOKIE_FILTER = "filter";

$(document).ready(bootstrap);

function bootstrap() {
	Raven.config("https://9d2a2a92d6d84dc08743bfb197a5cb65@sentry.io/296434").install();
	addBackToTop({
		backgroundColor: "#002c5f",
		diameter: 56,
		showWhenScrollTopIs: 200,
		textColor: "#fff"
	});
	Utils.showLoadingIndicators();
	registerEventHandlers();

	// Populate filter suggestions
	const suggestionPromises = Promise.all([suplGetter.getVyucujiciPage().then(parseVyucujiciPage), suplGetter.getClassesPage().then(parseClassesPage)])
		.catch((ex) => {
			Raven.captureException(ex);
			Utils.handleFetchError(ex);
			throw ex;
		});

	suggestionPromises.then((suggestions) => {
		const options = suggestions[0].concat(suggestions[1]).map((suggestion) => {
			return `<option value="${suggestion}">`;
		}).reduce((acc, el) => acc + el);

		$("datalist#filterSuggestions").append(options);
	}).catch((ex) => {
		Raven.captureException(ex);
		throw ex;
	});

	// Populate date selector
	suplGetter.getDatesPage()
		.then(parseDatesPage)
		.then((dates) => {
			// Sort dates by descending
			const sortedDates = dates.sort((a, b) => {
				return compareDesc(a.date, b.date);
			});

			// Update state with sorted dates (needed only once on bootstrap)
			state.sortedDates = sortedDates;

			Utils.enableDayButtons();

			// Transform dates to <option>'s
			const datesOptions = sortedDates.map(RenderHandler.dateWithUrlToOption).reduce((acc, curr) => {
				return acc + curr;
			});

			// Append options to date selector
			Selectors.DateSelector.append(datesOptions);

			// Get and select best day
			const closestDay: DateWithUrl = DatesHandler.getBestDay(sortedDates);

			// If there's a best day, select it
			if (closestDay) {
				DatesHandler.selectDate(closestDay);
			} else {
				// Fallback if no best day found, just select the first in the list
				DatesHandler.selectDate(sortedDates[0]);
			}
		}).catch((ex) => {
			Raven.captureException(ex);
			Utils.handleFetchError(ex);
			throw ex;
		});
}

function registerEventHandlers() {
	Selectors.TodayButton.on("click", DatesHandler.todayButtonHandler);
	Selectors.TomorrowButton.on("click", DatesHandler.tomorrowButtonHandler);
	Selectors.DateSelector.on("change", DatesHandler.onDateChange);
	Selectors.FilterSelector.on("keyup input", FilterHandler.onFilterChange);

	// Touch Gestures
	const hammertime = new Hammer(Selectors.DateSelector[0]);
	hammertime.on("swipe", (ev) => {
		if (ev.direction === 4 /* right */) {
			DatesHandler.nextDay();
		} else if (ev.direction === 2 /* left */) {
			DatesHandler.previousDay();
		}
	});
}

namespace DatesHandler {
	/**
	 * Selects best day to show at startup
	 *
	 * @param {DateWithUrl[]} sortedDates Dates sorted by date descending. Order must be preserved
	 * @returns
	 */
	export function getBestDay(sortedDates: DateWithUrl[]) {
		const closestIndex = closestIndexTo(new Date(), sortedDates.map((date) => date.date));
		let closestDay: DateWithUrl = state.sortedDates[closestIndex];
		// If date is in the past, select the next date
		if (isPast(closestDay.date)) {
			closestDay = state.sortedDates[closestIndex - 1];
		}

		// If it's a working day and it's before 14:00, try to display today's date;
		if ((!isWeekend(new Date()) && isBefore(new Date(), setHours(new Date(), 14)))) {
			const workingClosestDay = state.sortedDates.find((date) => isToday(date.date));
			if (workingClosestDay) {
				closestDay = workingClosestDay;
			}
		}

		return closestDay;
	}
	export function selectDate(date: DateWithUrl) {
		const dateSelector = Selectors.DateSelector[0];
		const index = state.sortedDates.indexOf(date);
		if (index) {
			(dateSelector as HTMLSelectElement).selectedIndex = index;
			DatesHandler.triggerDateChange();
		}
	}

	export function todayButtonHandler() {
		const today = state.sortedDates.find((dateWithUrl) => {
			return isToday(dateWithUrl.date);
		});

		if (today === undefined) {
			return;
		}

		DatesHandler.selectDate(today);
	}

	export function tomorrowButtonHandler() {
		const tomorrow = state.sortedDates.find((dateWithUrl) => {
			return isTomorrow(dateWithUrl.date);
		});

		// There's no tomorrow ;)
		if (tomorrow === undefined) {
			return;
		}

		DatesHandler.selectDate(tomorrow);
	}

	export function onDateChange(this: HTMLSelectElement) {
		Utils.showLoadingIndicators();
		const newDateUrl: string | null = this.options[this.selectedIndex].getAttribute("url");
		if (!newDateUrl) {
			return;
		}
		suplGetter.getSuplovaniPage(newDateUrl)
			.then(parseSuplovaniPage)
			.then((suplovaniPage) => {
				state.currentSuplovaniPage = suplovaniPage;
				return suplovaniPage;
			})
			.then((suplovaniPage) => {
				// Filter cookie
				if (Cookies.get(COOKIE_FILTER)) {
					$("#selector_filter").val(Cookies.get(COOKIE_FILTER) as string);
					RenderHandler.render(undefined, $(Selectors.FilterSelector).val() as string);
				} else {
					RenderHandler.render(suplovaniPage);
				}
			}).catch((ex) => {
				Raven.captureException(ex);
				Utils.handleFetchError(ex);
				throw ex;
			});
	}

	export function triggerDateChange() {
		Selectors.DateSelector[0].dispatchEvent(new Event("change"));
	}

	export function nextDay() {
		const select = (Selectors.DateSelector[0] as HTMLSelectElement);
		if (select.selectedIndex === 0) {
			return;
		} else {
			select.selectedIndex--;
		}
		DatesHandler.triggerDateChange();
	}
	export function previousDay() {
		const select = (Selectors.DateSelector[0] as HTMLSelectElement);
		if (select.selectedIndex === select.options.length - 1) {
			return;
		} else {
			select.selectedIndex++;
		}
		DatesHandler.triggerDateChange();
	}
}

namespace RenderHandler {
	export function render(suplovaniPage: SuplovaniPage | undefined, filter?: string) {
		// Filter only - load records from state
		if (filter) {
			// Function for filtering records by string
			const filterRecords = <T>(records: T[], filterString: string) => {
				return records.filter((record) => {
					return FilterHandler.objectContainsOneOf(record, filterString.split(" "));
				});
			};

			RenderHandler.renderSuplovani(filterRecords(state.currentSuplovaniPage.suplovani, filter));
			RenderHandler.renderDozory(filterRecords(state.currentSuplovaniPage.dozory, filter));
			RenderHandler.renderNahradniUcebny(filterRecords(state.currentSuplovaniPage.nahradniUcebny, filter));

			// Non-filtered records
			RenderHandler.renderChybejici(state.currentSuplovaniPage.chybejici);
			RenderHandler.renderOznameni(state.currentSuplovaniPage.oznameni);

			Utils.hideEmptyColumns();
		} else if (suplovaniPage) {
			// Update render - render from supplied parameter
			RenderHandler.renderSuplovani(suplovaniPage.suplovani);
			RenderHandler.renderDozory(suplovaniPage.dozory);
			RenderHandler.renderNahradniUcebny(suplovaniPage.nahradniUcebny);

			// Non-filtered records
			RenderHandler.renderChybejici(suplovaniPage.chybejici);
			RenderHandler.renderOznameni(suplovaniPage.oznameni);

			Utils.hideEmptyColumns();
		}
	}

	export function renderSuplovani(suplovaniRecords: SuplovaniRecord[]) {
		const suplovaniTable = $("#table_suplovani > tbody");
		suplovaniTable.empty();

		const contentToAppend = suplovaniRecords.length
			? suplovaniRecords.map(RenderHandler.suplovaniRecordToTr).join("")
			: RenderHandler.rowHeader("Žádné suplování", 8);

		suplovaniTable.append(contentToAppend);
	}

	export function suplovaniRecordToTr(suplovaniRecord: SuplovaniRecord): string {
		return Utils.removeControlChars(`<tr>
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

	export function renderDozory(dozorRecords: DozorRecord[]) {
		const dozorTable = $("#table_dozory > tbody");
		dozorTable.empty();

		const contentToAppend = dozorRecords.length
			? dozorRecords.map(RenderHandler.dozorRecordToTr).join("")
			: RenderHandler.rowHeader("Žádné dozory", 6);

		dozorTable.append(contentToAppend);
	}

	export function dozorRecordToTr(dozorRecord: DozorRecord): string {
		return Utils.removeControlChars(`<tr>
					<td>${dozorRecord.timeStart}</td>
					<td>${dozorRecord.timeEnd}</td>
					<td>${dozorRecord.misto}</td>
					<td>${dozorRecord.chybejici}</td>
					<td>${dozorRecord.dozorujici}</td>
					<td>${dozorRecord.poznamka}</td>
				</tr>`);
	}

	export function renderChybejici(chybejici: ChybejiciTable) {
		const chybejiciTable = $("#table_chybejici > tbody");
		chybejiciTable.empty();

		const noChybejici = RenderHandler.rowHeader("Žádní chybějící", 9);

		const ucitele = chybejici.ucitele.map(RenderHandler.chybejiciRecordToTr).join("");
		const tridy = chybejici.tridy.map(RenderHandler.chybejiciRecordToTr).join("");
		const ucebny = chybejici.ucebny.map(RenderHandler.chybejiciRecordToTr).join("");

		const contentToAppend = `
			${RenderHandler.rowHeader("Učitelé", 9)}
			${ucitele.length ? ucitele : noChybejici}
			${RenderHandler.rowHeader("Třídy", 9)}
			${tridy.length ? tridy : noChybejici}
			${RenderHandler.rowHeader("Učebny", 9)}
			${ucebny.length ? ucebny : noChybejici}
		`;

		chybejiciTable.append(contentToAppend);
	}

	export function chybejiciRecordToTr(chybejiciRecord: ChybejiciRecord) {
		// Missing graph
		const missingGraphCells = Object.keys(chybejiciRecord.schedule).map((hour) => {
			const className = chybejiciRecord.schedule[hour] ? "present" : "absent";
			return `<td class="${className}">${hour}</td>`;
		});

		const row = `
			<tr>
				<td>${chybejiciRecord.kdo}</td>
				${missingGraphCells.join("")}
			</tr >
		`;

		return Utils.removeControlChars(row);
	}

	export function renderNahradniUcebny(nahradniUcebnyRecords: NahradniUcebnaRecord[]) {
		const nahradniUcebnyTable = $("#table_nahradniUcebny > tbody");
		nahradniUcebnyTable.empty();

		const contentToAppend = nahradniUcebnyRecords.length
			? nahradniUcebnyRecords.map(RenderHandler.nahradniUcebnaRecordToTr).join("")
			: RenderHandler.rowHeader("Žádné náhradní učebny", 8);

		nahradniUcebnyTable.append(contentToAppend);
	}

	export function nahradniUcebnaRecordToTr(nahradniUcebna: NahradniUcebnaRecord) {
		return Utils.removeControlChars(`<tr>
				<td>${nahradniUcebna.hodina}</td>
				<td>${nahradniUcebna.trida}</td>
				<td>${nahradniUcebna.predmet}</td>
				<td>${nahradniUcebna.chybucebna}</td>
				<td>${nahradniUcebna.nahucebna}</td>
				<td>${nahradniUcebna.vyuc}</td>
				<td>${nahradniUcebna.pozn}</td>
			</tr>`);
	}

	export function renderOznameni(oznameni: string) {
		const template = oznameni ? `
		<div class="card">
			<div class="card-body">
				${oznameni}
			</div>
		</div>` : "";
		$("#oznameniContainer").html(template);
	}

	export function rowHeader(text: string, colspan: number) {
		return `<tr><td colspan="${colspan}" class="noCellBg">${text}</td></tr>`;
	}

	export function dateWithUrlToOption(dateWithUrl: DateWithUrl) {
		return `<option url="${dateWithUrl.url}">${dateWithUrl.dateString}</option>`;
	}
}

namespace FilterHandler {
	export function onFilterChange(this: HTMLInputElement) {
		const value = this.value.trim();
		if (value && value.length) {
			// Save filter to cookie
			Cookies.set(COOKIE_FILTER, value, { expires: addYears(new Date(), 1) });
			RenderHandler.render(undefined, value);
		} else {
			RenderHandler.render(state.currentSuplovaniPage);
		}
	}
	export function objectContainsOneOf<T>(object: T, filters: string[]) {
		return filters.some((filter) => {
			return objectContainsString(object, filter);
		});
	}

	function objectContainsString<T>(object: T, filter: string) {
		// If filter is a class, match only whole word to prevent II.A from matching II.A6
		const classRegex = new RegExp(".*\.[ABC]");
		const isClass = classRegex.test(filter) ? "\\b" : "";
		const regex = new RegExp("\\b" + Utils.escapeRegExp(filter) + isClass, "i");
		return Object.values(object).some((value: string) => {
			return regex.test(value);
		});
	}
}

namespace Utils {

	export function hideEmptyColumns() {
		// Clear hidden classes first
		$("th, td").removeClass("hidden");

		$("#table_suplovani th").each(function (i) {
			let remove = 0;

			const tds = $(this).parents("table").find("tr td:nth-child(" + (i + 1) + ")");
			tds.each(function (j) { if (this.innerHTML === "") { remove++; } });

			if (remove === ($("#table_suplovani tr").length - 1)) {
				$(this).addClass("hidden");
				tds.addClass("hidden");
			}
		});
	}
	export function enableDayButtons() {
		const today = state.sortedDates.find((dateWithUrl) => {
			return isToday(dateWithUrl.date);
		});

		if (today !== undefined) {
			Selectors.TodayButton.removeAttr("disabled");
		}

		const tomorrow = state.sortedDates.find((dateWithUrl) => {
			return isTomorrow(dateWithUrl.date);
		});

		// Disable tomorrow button if tomorrow is the weekend
		if (tomorrow !== undefined) {
			Selectors.TomorrowButton[0].removeAttribute("disabled");
		}
	}

	export function removeControlChars(s: string) {
		return s.replace(/[\n\r\t]/g, "");
	}

	export function showLoadingIndicators() {
		// Variable colspan for different-columned tables
		const indicator = (colspan) =>
			`<tr data-test="loadingIndicator">
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

	export function escapeRegExp(str: string) {
		return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
	}

	export function handleFetchError(ex: any) {
		const alertHtml = `
			<div class="col-md-12">
				<div class="alert alert-warning" role="alert">
					Vypadá to, že jste offline. Některé stránky se nemusí načítat.
				</div>
			</div>
			`;

		$("#alert-row").append(alertHtml);
	}
}
