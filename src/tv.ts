// tslint:disable no-console

// Page-specific imports
import "./img/favicon.png";

import "./styles/vendor/placeholder-loading.min.css";
import "./styles/vendor/bootstrap-md.min.css";
import "./styles/tv.css";
import "./tv.html";
// NPM Modules
import * as $ from "./lib/vendor/jquery.min.js";
import * as Raven from "raven-js";

import {IAPIresponse, SOLAPI} from "./lib/getting/SOLAPI";

import * as a2d from "array2d";
import {ScheduleHandler} from "./lib/utils/ScheduleHandler";
import {addBusinessDays, isWeekend, startOfWeek} from "date-fns";
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
	if (isWeekend(today)) {
		dateToDisplay = startOfWeek(addBusinessDays(today, 1), {
			weekStartsOn: 1
		});
	}
	const suplovaniForToday: IAPIresponse = await API.getSuplovani(dateToDisplay);

	suplovaniForToday.data.parsedSuplovani = a2d.transpose(suplovaniForToday.data.parsedSuplovani);
	const header = suplovaniForToday.data.parsedSuplovani[0];
	const rows = suplovaniForToday.data.parsedSuplovani.slice(1);

	const sortedSupl = sortSupl(rows);
	const filteredSupl = filterSupl(sortedSupl);

	$("#table_suplovani")[0].innerHTML = suplovaniToTable(header, filteredSupl);

	$("#last_updated")[0].innerHTML = `Data aktualizována: ${suplovaniForToday.data.fetchDate}`;
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
