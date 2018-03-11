import "./commonImports";

// Page-specific imports
import "./tv.css";
import "./tv.html";

// NPM Modules
import { closestIndexTo, compareDesc, isBefore, isPast, isToday, isWeekend, setHours } from "date-fns";
import * as $ from "jquery";
import ms from "ms";
import Raven from "raven-js";

// LIB Modules
import { SuplGetterBrowser } from "./lib/getting/suplGetter";
import { ChybejiciRecord, ChybejiciTable } from "./lib/parsing/ChybejiciParser";
import { DateWithUrl, parseDatesPage } from "./lib/parsing/DatesParser";
import { DozorRecord, NahradniUcebnaRecord, parseSuplovaniPage, SuplovaniPage, SuplovaniRecord } from "./lib/parsing/suplParser";
const suplGetter = new SuplGetterBrowser();

// tslint:disable-next-line:prefer-const
let state: {
	sortedDates: DateWithUrl[] | null,
	currentDates: [DateWithUrl, DateWithUrl]
} = {
		sortedDates: null,
		currentDates: [null, null]
	};

$(document).ready(bootstrap);

function bootstrap() {
	Raven.config("https://9d2a2a92d6d84dc08743bfb197a5cb65@sentry.io/296434").install();

	// Refresh data every REFRESH_PERIOD
	const REFRESH_PERIOD = ms("30 seconds");
	setInterval(() => {
		Utils.refresh();
	}, REFRESH_PERIOD);

	// Reload page every RELOAD_PERIOD
	const RELOAD_PERIOD = ms("1 hour");
	setInterval(() => {
		window.location.reload();
	}, RELOAD_PERIOD);

	suplGetter.getDatesPage()
		.then(parseDatesPage)
		.then((dates) => {
			// Sort dates by descending
			const sortedDates = dates.sort((a, b) => {
				return compareDesc(a.date, b.date);
			});

			// Update state with sorted dates (needed only once on bootstrap)
			state.sortedDates = sortedDates;

			// Get and select best day
			const closestDay: DateWithUrl = DatesHandler.getBestDay(sortedDates);
			const nextDay: DateWithUrl = sortedDates[sortedDates.indexOf(closestDay) - 1];
			// If there's a best day, select it
			if (closestDay) {
				DatesHandler.selectDate([closestDay, nextDay]);
			} else {
				// Fallback if no best day found, just select the first two in the list
				DatesHandler.selectDate([sortedDates[1], sortedDates[0]]);
			}
		}).catch((ex) => {
			Raven.captureException(ex);
			Utils.handleFetchError(ex);
			throw ex;
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

		// If it's a working day and it's before TRESHOLD_HOUR, try to display today's date;
		const THRESHOLD_HOUR = 15;
		if ((!isWeekend(new Date()) && isBefore(new Date(), setHours(new Date(), THRESHOLD_HOUR)))) {
			const workingClosestDay = state.sortedDates.find((date) => isToday(date.date));
			if (workingClosestDay) {
				closestDay = workingClosestDay;
			}
		}

		return closestDay;
	}
	export function selectDate(dates: [DateWithUrl, DateWithUrl]) {
		state.currentDates = dates;

		const promises = Promise.all(dates.map((date) => date.url).map(suplGetter.getSuplovaniPage, suplGetter));
		promises
			.then((pages) => pages.map(parseSuplovaniPage))
			.then(RenderHandler.render)
			.catch((ex) => {
				Raven.captureException(ex);
				Utils.handleFetchError(ex);
				throw ex;
			});
	}
}

namespace RenderHandler {
	export function render([suplovaniPage, secondSuplovaniPage]: [SuplovaniPage, SuplovaniPage]) {
		$("#datum1").text(suplovaniPage.date);
		$("#aktualizace1").text(suplovaniPage.lastUpdated);
		RenderHandler.renderSuplovani(suplovaniPage.suplovani, "#table_suplovani > tbody");
		RenderHandler.renderDozory(suplovaniPage.dozory, "#table_dozory > tbody");
		RenderHandler.renderNahradniUcebny(suplovaniPage.nahradniUcebny, "#table_nahradniUcebny > tbody");
		RenderHandler.renderChybejici(suplovaniPage.chybejici, "#table_chybejici > tbody");
		RenderHandler.renderOznameni(suplovaniPage.oznameni, "#oznameniContainer");

		$("#datum2").text(secondSuplovaniPage.date);
		$("#aktualizace2").text(secondSuplovaniPage.lastUpdated);
		RenderHandler.renderSuplovani(secondSuplovaniPage.suplovani, "#table_suplovani2 > tbody");
		RenderHandler.renderDozory(secondSuplovaniPage.dozory, "#table_dozory2 > tbody");
		RenderHandler.renderNahradniUcebny(secondSuplovaniPage.nahradniUcebny, "#table_nahradniUcebny2 > tbody");
		RenderHandler.renderChybejici(secondSuplovaniPage.chybejici, "#table_chybejici2 > tbody");
		RenderHandler.renderOznameni(secondSuplovaniPage.oznameni, "#oznameniContainer2");
	}

	export function renderSuplovani(suplovaniRecords: SuplovaniRecord[], targetSelector: string) {
		const suplovaniTable = $(targetSelector);
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

	export function renderDozory(dozorRecords: DozorRecord[], targetSelector: string) {
		const dozorTable = $(targetSelector);
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

	export function renderChybejici(chybejici: ChybejiciTable, targetSelector: string) {
		const chybejiciTable = $(targetSelector);
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

	export function renderNahradniUcebny(nahradniUcebnyRecords: NahradniUcebnaRecord[], targetSelector: string) {
		const nahradniUcebnyTable = $(targetSelector);
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

	export function renderOznameni(oznameni: string, targetSelector: string) {
		const template = oznameni ? `
		<div class="card">
			<div class="card-body">
				${oznameni}
			</div>
		</div>` : "";
		$(targetSelector).html(template);
	}

	export function rowHeader(text: string, colspan: number) {
		return `<tr><td colspan="${colspan}" class="noCellBg">${text}</td></tr>`;
	}
}

namespace Utils {

	export function removeControlChars(s: string) {
		return s.replace(/[\n\r\t]/g, "");
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

	export function refresh() {
		DatesHandler.selectDate(state.currentDates);
	}
}
