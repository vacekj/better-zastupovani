// tslint:disable no-console

import "./script/commonImports";

// Page-specific imports
import "./styles/tv.css";
import "./tv.html";

// NPM Modules
import { closestIndexTo, compareDesc, isBefore, isPast, isToday, isWeekend, setHours } from "date-fns";
import * as jq from "./lib/vendor/jquery.min.js";
const $: JQueryStatic = (jq as any);
import * as ms from "ms";
import * as Raven from "raven-js";

// LIB Modules
import { SuplGetterBrowser } from "./lib/getting/suplGetter";
import { ChybejiciRecord, ChybejiciTable } from "./lib/parsing/ChybejiciParser";
import { DateWithUrl, parseDatesPage } from "./lib/parsing/DatesParser";
import { DozorRecord, NahradniUcebnaRecord, parseSuplovaniPage, SuplovaniPage, SuplovaniRecord } from "./lib/parsing/suplParser";
import { ScheduleFilter } from "./lib/utils/ScheduleHandler";

//#region Failsafes
// Refresh data every REFRESH_PERIOD
const REFRESH_PERIOD = ms("5 seconds");
setInterval(() => {
	Utils.refreshData();
	console.log(`Data refreshed, next refresh in ${REFRESH_PERIOD / 1000} seconds`);
}, REFRESH_PERIOD);

// Reload page every RELOAD_PERIOD
const RELOAD_PERIOD = ms("1 hour");
setInterval(() => {
	window.location.reload();
	console.log(`Page reloaded, next reload in ${RELOAD_PERIOD / 1000} seconds`);
}, RELOAD_PERIOD);
//#endregion

const suplGetter = new SuplGetterBrowser();

// tslint:disable-next-line:prefer-const
let state: {
	sortedDates: DateWithUrl[] | null,
	currentDate: DateWithUrl
} = {
	sortedDates: null,
	currentDate: null
};

$(document).ready(bootstrap);

function bootstrap() {
	Raven.config("https://9d2a2a92d6d84dc08743bfb197a5cb65@sentry.io/296434").install();

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
	export function selectDate(date: DateWithUrl) {
		state.currentDate = date;
		console.log(`Selecting date ${date.dateString}`);
		suplGetter
			.getSuplovaniPage(date.url)
			.then(parseSuplovaniPage)
			.then(ScheduleFilter.filterSuplovaniPage)
			.then(RenderHandler.render)
			.catch((ex) => {
				Raven.captureException(ex);
				throw ex;
			});
	}
}

namespace RenderHandler {
	export function render(suplovaniPage: SuplovaniPage) {
		RenderHandler.renderSuplovani(suplovaniPage.suplovani, "#table_suplovani > tbody");
		RenderHandler.renderDozory(suplovaniPage.dozory, "#table_dozory > tbody");
		RenderHandler.renderNahradniUcebny(suplovaniPage.nahradniUcebny, "#table_nahradniUcebny > tbody");
		RenderHandler.renderOznameni(suplovaniPage.oznameni);
	}

	export function renderSuplovani(suplovaniRecords: SuplovaniRecord[], targetSelector: string) {
		const suplovaniTable = $(targetSelector);
		suplovaniTable.empty();

		const contentToAppend = suplovaniRecords.length
			? suplovaniRecords.map(RenderHandler.suplovaniRecordToTr).join("")
			: RenderHandler.rowHeader("Žádné nadcházející suplování", 8);

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
		const filteredDozory = ScheduleFilter.filterDozory(dozorRecords);
		const contentToAppend = filteredDozory.length
			? filteredDozory.map(RenderHandler.dozorRecordToTr).join("")
			: RenderHandler.rowHeader("Žádné nadcházející dozory", 6);

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
		const filteredNahradniUcebny = ScheduleFilter.filterNahradniUcebny(nahradniUcebnyRecords);
		const contentToAppend = filteredNahradniUcebny.length
			? filteredNahradniUcebny.map(RenderHandler.nahradniUcebnaRecordToTr).join("")
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
		const template = oznameni ? `<div class="col-md-12">
	<h5>Oznámení</h5>
	<div class="card">
		<div class="card-body">
			${oznameni}
		</div>
	</div>
	<hr>
</div>
` : "";
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

	export function refreshData() {
		DatesHandler.selectDate(state.currentDate);
	}
}
