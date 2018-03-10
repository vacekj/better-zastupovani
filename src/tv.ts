// Polyfills
import "babel-polyfill";
import "whatwg-fetch";

// Bootstrap imports
import "./bootstrap-md.min.css";

// Webpack imports
import "./favicon.png";
import "./robots.txt";
import "./style.css";
import "./tv.html";

// Images
import "./gh.png";
import "./pecet.jpg";
import "./svg/code.svg";
import "./svg/heart.svg";

// NPM Modules
import { addYears, closestIndexTo, compareDesc, isBefore, isPast, isToday, isTomorrow, isWeekend, setHours, startOfTomorrow } from "date-fns";
import * as $ from "jquery";
import Raven from "raven-js";

// LIB Modules
import { SuplGetterBrowser } from "./lib/getting/suplGetter";
import { ChybejiciRecord, ChybejiciTable } from "./lib/parsing/ChybejiciParser";
import { DateWithUrl, parseDatesPage } from "./lib/parsing/DatesParser";
import { DozorRecord, NahradniUcebnaRecord, parseClassesPage, parseSuplovaniPage, parseVyucujiciPage, Record, SuplovaniPage, SuplovaniRecord } from "./lib/parsing/suplParser";

const suplGetter = new SuplGetterBrowser();

// tslint:disable-next-line:prefer-const
let state: {
	sortedDates: DateWithUrl[] | null,
	currentDate: [DateWithUrl, DateWithUrl]
} = {
		sortedDates: null,
		currentDate: [null, null]
	};

$(document).ready(bootstrap);

function bootstrap() {
	Raven.config("https://9d2a2a92d6d84dc08743bfb197a5cb65@sentry.io/296434").install();
	Utils.showLoadingIndicators();

	// Select todays
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
		state.currentDate[0] = date;
		Utils.showLoadingIndicators();

		suplGetter.getSuplovaniPage(date.url)
			.then(parseSuplovaniPage)
			.then(RenderHandler.render)
			.catch((ex) => {
				Raven.captureException(ex);
				Utils.handleFetchError(ex);
				throw ex;
			});
	}
}

namespace RenderHandler {
	export function render(suplovaniPage: SuplovaniPage | undefined) {
		RenderHandler.renderSuplovani(suplovaniPage.suplovani);
		RenderHandler.renderDozory(suplovaniPage.dozory);
		RenderHandler.renderNahradniUcebny(suplovaniPage.nahradniUcebny);
		RenderHandler.renderChybejici(suplovaniPage.chybejici);
		RenderHandler.renderOznameni(suplovaniPage.oznameni);
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
}

namespace Utils {

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
