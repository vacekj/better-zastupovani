// tslint:disable no-console

// Page-specific imports
import "./img/favicon.png";

import "./styles/vendor/placeholder-loading.min.css";
import "./styles/vendor/bootstrap-md.min.css";
import "./styles/tv.css";
import "./index.html";
// NPM Modules
import * as $ from "./lib/vendor/jquery.min.js";
import * as Raven from "raven-js";

import {IAPIresponse, SOLAPI} from "./lib/getting/SOLAPI";

import * as a2d from "array2d";
import {ScheduleHandler} from "./lib/utils/ScheduleHandler";
import {addBusinessDays, format, isAfter, isWeekend, setHours, startOfWeek} from "date-fns";
import isLessonInPast = ScheduleHandler.isLessonInPast;

//#region Updates

// Reload page every RELOAD_PERIOD
const UPDATE_PERIOD = 30 * 1000;
setInterval(() => {
	loadData();
	console.log(`Page updated, next reload in ${UPDATE_PERIOD / 1000} seconds`);
}, UPDATE_PERIOD);
//#endregion

// @ts-ignore
$(document).ready(bootstrap);

function bootstrap() {
	Raven.config("https://9d2a2a92d6d84dc08743bfb197a5cb65@sentry.io/296434").install();

	/* First load */
	loadData().catch((e) => {
		throw e;
	});
}

async function loadData() {
	const API = new SOLAPI();
	const today = new Date();

	let dateToDisplay = today;
	const endOfSchoolDay = setHours(new Date(), 16);
	if (isWeekend(today)) {
		dateToDisplay = startOfWeek(addBusinessDays(today, 1), {
			weekStartsOn: 1
		});
	} else if (isAfter(new Date(), endOfSchoolDay)) {
		dateToDisplay = addBusinessDays(new Date(), 1);
	}
	const suplovaniForToday: IAPIresponse = await API.getSuplovani(dateToDisplay);

	suplovaniForToday.parsedSuplovani = a2d.transpose(suplovaniForToday.parsedSuplovani);
	// @ts-ignore
	if (suplovaniForToday.parsedSuplovani.length == 0) {
		$("#table_suplovani")[0].innerHTML = `<div style="text-align: center; padding: 20px">
Žádné zastupování
</div>`;

		$("#last_updated")[0].innerHTML = `Data aktualizována: ${suplovaniForToday.fetchDate}`;

		$("#date")[0].innerHTML = format(dateToDisplay, "d.M.y");
		return;
	}
	const header = suplovaniForToday.parsedSuplovani[0];
	const rows = suplovaniForToday.parsedSuplovani.slice(1);

	const sortedSupl = sortSupl(rows);

	$("#table_suplovani")[0].innerHTML = suplovaniToTable(header, sortedSupl);

	$("#last_updated")[0].innerHTML = `Data aktualizována: ${suplovaniForToday.fetchDate}`;

	$("#date")[0].innerHTML = format(dateToDisplay, "d.M.y");
}

function sortSupl(rows: string[][]) {
	return rows.sort((a, b) => {
		const hourA = a[1][0];
		const hourB = b[1][0];

		return parseInt(hourA, 10) - parseInt(hourB, 10);
	});
}

function filterSupl(suplovani: string[][]) {
	return suplovani.filter((row) => {
		let lessonNumber = row[1][0];
		const lessonLength = row[1].match(/\(([0-9])\)/) || 0;
		if (lessonLength) {
			lessonNumber += lessonLength ? parseInt(lessonLength[0], 10) - 1 : 0;
		}
		return !isLessonInPast(parseInt(lessonNumber, 10));
	});
}

function suplovaniToTable(head, body) {
	const thead =
		`<tr> ${
			head.map((col) => {
				return `<th>${col}</th>`;
			})
				.join("")
		} </tr>`;

	const tbody =
		body
			.map((row) => {
				return `<tr> ${
					row
						.map((col) => {
							return `<td>${col}</td>`;
						})
						.join("")
				} </tr>`;
			})
			.join("");

	return `<thead>
				${thead}
            </thead>
            <tbody>
            ${tbody}
            </tbody>`;
}
