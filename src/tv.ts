// tslint:disable no-console

import "./script/commonImports";
// Page-specific imports
import "./styles/tv.css";
import "./tv.html";
// NPM Modules
import * as $ from "./lib/vendor/jquery.min.js";

import * as Raven from "raven-js";

import {IAPIresponse, SOLAPI} from "./lib/getting/SOLAPI";

import * as a2d from "array2d";

//#region Updates

// Reload page every RELOAD_PERIOD
const RELOAD_PERIOD = 30 * 1000; // Every minute
setInterval(() => {
	window.location.reload();
	console.log(`Page reloaded, next reload in ${RELOAD_PERIOD / 1000} seconds`);
}, RELOAD_PERIOD);
//#endregion

$(document).ready(bootstrap);

function bootstrap() {
	Raven.config("https://9d2a2a92d6d84dc08743bfb197a5cb65@sentry.io/296434").install();

	/* First load */
	loadData();
}

async function loadData() {
	const API = new SOLAPI();
	const today = new Date();
	const suplovaniForToday: IAPIresponse = await API.getSuplovani(new Date(2019, 8, 4));
	$("#table_suplovani")[0].innerHTML = suplovaniToTable(suplovaniForToday.data.parsedSuplovani);
}

/* TODO: sort lesson by second column - hour */

/* TODO: hide lessons in the past*/

function suplovaniToTable(suplovani: string[][]) {
	const t: string[][] = a2d.transpose(suplovani);
	const thead = [t[0]];
	const trows = t.slice(1);
	const rows =
		trows
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
	const head =
		thead
			.map((row) => {
				return `<tr> ${
					row
						.map((col) => {
							return `<th>${col}</th>`;
						})
						.join("")
				} </tr>`;
			})
			.join("");

	return `<thead>
				${head}
            </thead>
            <tbody>
            ${rows}
            </tbody>`;
}
