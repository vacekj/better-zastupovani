// NPM Modules
import { addYears, closestIndexTo, compareDesc, isBefore, isPast, isToday, isTomorrow, isWeekend, setHours } from "date-fns";
import * as Driver from "driver.js";
import "../styles/vendor/driver.min.css";
import * as Hammer from "hammerjs";
import * as isMobile from "is-mobile";
import * as Cookies from "js-cookie";
import * as Raven from "raven-js";

// LIB Modules
import { SuplGetterBrowser } from "../lib/getting/suplGetter";
import { ChybejiciRecord, ChybejiciTable } from "../lib/parsing/ChybejiciParser";
import { DateWithUrl, parseDatesPage } from "../lib/parsing/DatesParser";
import { DozorRecord, NahradniUcebnaRecord, parseClassesPage, parseSuplovaniPage, parseVyucujiciPage, SuplovaniPage, SuplovaniRecord } from "../lib/parsing/suplParser";
import { addBackToTop } from "../lib/utils/backToTop";

import { objectContainsOneOf } from "./matchingLogic";

const suplGetter = new SuplGetterBrowser();

const state: {
	currentSuplovaniPage: SuplovaniPage | null,
	sortedDates: DateWithUrl[] | null
} = {
		currentSuplovaniPage: null,
		sortedDates: null
	};

const Selectors = {
	get DateSelector() { return document.querySelector("#selector_date"); },
	get TodayButton() { return document.querySelector("button#today"); },
	get TomorrowButton() { return document.querySelector("button#tomorrow"); },
	get FilterSelector(): HTMLInputElement { return document.querySelector("#selector_filter"); },
	get NahradniUcebnyTable() { return document.querySelector("#table_nahradniUcebny"); },
	get FilterSuggestionsDatalist(): HTMLDataListElement { return document.querySelector("datalist#filterSuggestions"); },
	get Pruvodce() { return document.querySelector("#pruvodce"); },
	get SelectorFieldDate(): HTMLElement { return document.querySelector("#selectorField_date"); },
	get SuplovaniTable() { return document.querySelector("#table_suplovani"); },
	get DozoryTable() { return document.querySelector("#table_dozory"); },
	get ChybejiciTable() { return document.querySelector("#table_chybejici"); },
	get AlertRow() { return document.querySelector("#alert-row"); },
	get LastUpdated(): HTMLDivElement { return document.querySelector("#lastUpdated"); }
};
const COOKIE_FILTER = "filter";
const COOKIE_TUTCOMPLETE = "tutcomplete";

export default function bootstrap() {
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
	Promise.all([suplGetter.getVyucujiciPage().then(parseVyucujiciPage), suplGetter.getClassesPage().then(parseClassesPage)])
		.then((suggestions) => {
			return suggestions[0]
				.concat(suggestions[1])
				.map((suggestion) => {
					return `<option value="${suggestion}">`;
				}).join("");
		})
		.then((options) => {
			Selectors.FilterSuggestionsDatalist.innerHTML = options;
		})
		.catch((Utils.catchHandler));

	// Populate date selector
	suplGetter
		.getDatesPage()
		.then(parseDatesPage)
		.then((dates) => {
			// Sort dates by descending
			const sortedDates = dates.sort((a, b) => {
				return compareDesc(a.date, b.date);
			});

			// Update state with sorted dates (needed only once on bootstrap)
			state.sortedDates = sortedDates;

			Utils.enableDateControls();
			Utils.enableFilterControls();

			// Transform dates to <option>'s
			const datesOptions = sortedDates.map(RenderHandler.dateWithUrlToOption).join("");

			// Append options to date selector
			Selectors.DateSelector.innerHTML = datesOptions;

			// Get and select best day
			const closestDay: DateWithUrl = DatesHandler.getBestDay(sortedDates);

			// If there's a best day, select it
			if (closestDay) {
				DatesHandler.selectDate(closestDay);
			} else {
				// Fallback if no best day found, just select the first in the list
				DatesHandler.selectDate(sortedDates[0]);
			}

			// TODO: Read and apply settings here
			// Settings: Nahr. ucebny pred dozory: // TODO: need to add these to HTML and to Selectors $("#nahucRow").insertAfter($("#suplovaniRow"));
			// TODO: Extract all selectors to Selectors object
			if (!Cookies.get(COOKIE_TUTCOMPLETE)) {
				Tutorial.start();
			}
		})
		.catch(Utils.catchHandler);
}

function registerEventHandlers() {
	Selectors.TodayButton.addEventListener("click", DatesHandler.todayButtonHandler);
	Selectors.TomorrowButton.addEventListener("click", DatesHandler.tomorrowButtonHandler);
	Selectors.DateSelector.addEventListener("change", DatesHandler.onDateChange);
	Selectors.FilterSelector.addEventListener("keyup", FilterHandler.onFilterChange);
	Selectors.FilterSelector.addEventListener("input", FilterHandler.onFilterChange);

	Selectors.Pruvodce.addEventListener("click", (e) => {
		e.stopImmediatePropagation();
		e.stopPropagation();
		// Skip the first step
		Tutorial.start(1);
	});

	// Touch Gestures
	const hammertime = new Hammer(Selectors.SelectorFieldDate);
	hammertime.on("swipe", (ev) => {
		if (ev.direction === 4 /* swipe right */) {
			DatesHandler.previousDay();
		} else if (ev.direction === 2 /* swipe left */) {
			DatesHandler.nextDay();
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
		const dateSelector = Selectors.DateSelector;
		const index = state.sortedDates.indexOf(date);
		if (index !== undefined) {
			(dateSelector as HTMLSelectElement).selectedIndex = index;
			DatesHandler.onDateChange();
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

	export function onDateChange() {
		const self = Selectors.DateSelector as HTMLSelectElement;
		Utils.showLoadingIndicators();
		const newDateUrl: string | null = self.options[self.selectedIndex].getAttribute("url");
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
					Selectors.FilterSelector.value = Cookies.get(COOKIE_FILTER);
					RenderHandler.render(undefined, Selectors.FilterSelector.value);
				} else {
					RenderHandler.render(suplovaniPage);
				}
			})
			.catch(Utils.catchHandler);
	}

	export function nextDay() {
		const select = (Selectors.DateSelector as HTMLSelectElement);
		if (select.selectedIndex === 0) {
			return;
		} else {
			select.selectedIndex--;
		}
		DatesHandler.onDateChange();
	}
	export function previousDay() {
		const select = (Selectors.DateSelector as HTMLSelectElement);
		if (select.selectedIndex === select.options.length - 1) {
			return;
		} else {
			select.selectedIndex++;
		}
		DatesHandler.onDateChange();
	}
}

namespace RenderHandler {
	export function render(suplovaniPage: SuplovaniPage | undefined, filter?: string) {
		// Filter only - load records from state
		if (filter) {
			// Function for filtering records by string
			const filterRecords = <T>(records: T[], filterString: string) => {
				return records.filter((record) => {
					return objectContainsOneOf(record, filterString.split(" "));
				});
			};

			RenderHandler.renderSuplovani(filterRecords(state.currentSuplovaniPage.suplovani, filter));
			Selectors.LastUpdated.innerText = state.currentSuplovaniPage.lastUpdated;
			RenderHandler.renderDozory(filterRecords(state.currentSuplovaniPage.dozory, filter));
			RenderHandler.renderNahradniUcebny(filterRecords(state.currentSuplovaniPage.nahradniUcebny, filter));

			// Non-filtered records
			RenderHandler.renderChybejici(state.currentSuplovaniPage.chybejici);
			RenderHandler.renderOznameni(state.currentSuplovaniPage.oznameni);

			Utils.hideEmptyColumns();
		} else if (suplovaniPage) {
			// Update render - render from supplied parameter
			RenderHandler.renderSuplovani(suplovaniPage.suplovani);
			Selectors.LastUpdated.innerText = suplovaniPage.lastUpdated;
			RenderHandler.renderDozory(suplovaniPage.dozory);
			RenderHandler.renderNahradniUcebny(suplovaniPage.nahradniUcebny);

			// Non-filtered records
			RenderHandler.renderChybejici(suplovaniPage.chybejici);
			RenderHandler.renderOznameni(suplovaniPage.oznameni);

			Utils.hideEmptyColumns();
		}
	}

	export function renderSuplovani(suplovaniRecords: SuplovaniRecord[]) {
		const suplovaniTable = Selectors.SuplovaniTable.querySelector("tbody");

		const content = suplovaniRecords.length
			? suplovaniRecords.map(RenderHandler.suplovaniRecordToTr).join("")
			: RenderHandler.rowHeader("Žádné suplování", 8);

		suplovaniTable.innerHTML = content;
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
		const dozorTable = Selectors.DozoryTable.querySelector("tbody");

		const content = dozorRecords.length
			? dozorRecords.map(RenderHandler.dozorRecordToTr).join("")
			: RenderHandler.rowHeader("Žádné dozory", 6);

		dozorTable.innerHTML = content;
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
		const chybejiciTable = Selectors.ChybejiciTable.querySelector("tbody");

		const noChybejici = RenderHandler.rowHeader("Žádní chybějící", 9);

		const ucitele = chybejici.ucitele.map(RenderHandler.chybejiciRecordToTr).join("");
		const tridy = chybejici.tridy.map(RenderHandler.chybejiciRecordToTr).join("");
		const ucebny = chybejici.ucebny.map(RenderHandler.chybejiciRecordToTr).join("");

		const content = `
			${RenderHandler.rowHeader("Učitelé", 9)}
			${ucitele.length ? ucitele : noChybejici}
			${RenderHandler.rowHeader("Třídy", 9)}
			${tridy.length ? tridy : noChybejici}
			${RenderHandler.rowHeader("Učebny", 9)}
			${ucebny.length ? ucebny : noChybejici}
		`;

		chybejiciTable.innerHTML = content;
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
		const nahradniUcebnyTable = Selectors.NahradniUcebnyTable.querySelector("tbody");

		const content = nahradniUcebnyRecords.length
			? nahradniUcebnyRecords.map(RenderHandler.nahradniUcebnaRecordToTr).join("")
			: RenderHandler.rowHeader("Žádné náhradní učebny", 8);

		nahradniUcebnyTable.innerHTML = content;
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
		document.querySelector("#oznameniContainer").innerHTML = template;
	}

	export function rowHeader(text: string, colspan: number) {
		return `<tr><td colspan="${colspan}" class="noCellBg">${text}</td></tr>`;
	}

	export function dateWithUrlToOption(dateWithUrl: DateWithUrl) {
		return `<option url="${dateWithUrl.url}">${dateWithUrl.dateString}</option>`;
	}
}

export namespace FilterHandler {
	export function onFilterChange(this: HTMLInputElement) {
		const value = this.value.trim();
		if (value && value.length) {
			RenderHandler.render(undefined, value);
		} else {
			RenderHandler.render(state.currentSuplovaniPage);
		}
		Cookies.set(COOKIE_FILTER, value, { expires: addYears(new Date(), 1) });
	}
}

namespace Utils {

	export function catchHandler(ex) {
		Raven.captureException(ex);
		if (ex instanceof TypeError) {
			Utils.showLoadingIndicators("");
			Selectors.AlertRow.innerHTML = `<div class="col-md-12">
			<div class="alert alert-warning" role="alert">
				Offline mód: některá data se nemusí načítat. <button type="button" class="btn btn-outline-warning refresh" >Obnovit</button>
			</div>
		</div>`;
			document.querySelector(".refresh").addEventListener("click", DatesHandler.onDateChange);
			Selectors.AlertRow.innerHTML = "";
			return;
		}
		throw ex;
	}

	export function hideEmptyColumns() {
		// Clear hidden classes first
		document.querySelector("th, td").classList.remove("hidden");

		Array.from(document.querySelectorAll("#table_suplovani th")).map((th, i) => {
			let remove = 0;

			const tds = Array.from(th.parentNode.parentNode.parentElement.querySelectorAll("tr td:nth-child(" + (i + 1) + ")"));
			tds.map((td) => {
				if (td.textContent === "") {
					remove++;
				}
			});

			if (remove === (document.querySelectorAll("#table_suplovani tr").length - 1)) {
				th.classList.add("hidden");
				tds.map((td) => td.classList.add("hidden"));
			}
		});
	}
	export function enableDateControls() {
		const today = state.sortedDates.find((dateWithUrl) => {
			return isToday(dateWithUrl.date);
		});

		if (today !== undefined) {
			Selectors.TodayButton.removeAttribute("disabled");
		}

		const tomorrow = state.sortedDates.find((dateWithUrl) => {
			return isTomorrow(dateWithUrl.date);
		});

		if (tomorrow !== undefined) {
			Selectors.TomorrowButton[0].removeAttribute("disabled");
		}

		Selectors.DateSelector.removeAttribute("disabled");
	}

	export function enableFilterControls() {
		Selectors.FilterSelector.removeAttribute("readonly");
	}

	export function removeControlChars(s: string) {
		return s.replace(/[\n\r\t]/g, "");
	}

	export function showLoadingIndicators(html?) {
		// Variable colspan for different-columned tables
		const indicator = (colspan) => html ||
			`<tr data-test="loadingIndicator">
		<td colspan="${colspan}" class="noCellBg">
			<svg class="spinner" width="65px" height="65px" viewBox="0 0 66 66" xmlns="http://www.w3.org/2000/svg">
				<circle class="path" fill="none" stroke-width="6" stroke-linecap="round" cx="33" cy="33" r="30"></circle></svg>
		</td>
		</tr>`;

		// TODO: convert this to Selectors
		document.querySelector("#table_suplovani > tbody").innerHTML = indicator(8);
		document.querySelector("#table_dozory > tbody").innerHTML = indicator(6);
		document.querySelector("#table_chybejici > tbody").innerHTML = indicator(9);
		document.querySelector("#table_nahradniUcebny > tbody").innerHTML = indicator(7);
	}
}

namespace Tutorial {
	let driver: Driver;
	function initialize() {
		driver = new Driver({
			animate: true,
			opacity: 0.6,
			stageBackground: "white",
			padding: 10,
			allowClose: true,
			scrollIntoViewOptions: { block: "end" },
			doneBtnText: "Dokončit",
			closeBtnText: "Zavřít",
			nextBtnText: "Další >",
			prevBtnText: "<",
			onHighlighted: () => {
				if (!driver.hasNextStep()) {
					Cookies.set(COOKIE_TUTCOMPLETE, "true", { expires: addYears(new Date(), 1) });
				}
			},
			onDeselected: () => {
				if (!driver.isActivated) {
					Cookies.set(COOKIE_TUTCOMPLETE, "true", { expires: addYears(new Date(), 1) });
				}
			}
		});

		const steps = {
			start: {
				element: "#logo_text > h2",
				popover: {
					title: "Vítejte v aplikaci Zastupování",
					description: "Pojďme se podívat, jak aplikace funguje"
				}
			},
			datum: {
				element: "#driver_date",
				popover: {
					title: "Zde si vyberete datum",
					description:
						`Při načtení stránky je automaticky vybráno dnešní datum,
					zítřejší pokud už je po výuce nebo nejbližší školní den
					pokud jsou např. prázdniny nebo víkend.`
				}
			},
			mobilSwipe: {
				element: "#selector_date",
				popover: {
					title: "Gesta na mobilních zařízeních",
					description:
						`Na mobilních zařízeních lze datum měnit také přejetím doleva/doprava přes pole dat.`
				}
			},
			tlacitka: {
				element: ".btn-group",
				popover: {
					title: "Tlačítka Dnes a Zítra",
					description:
						`Datum taky můžete rychle vybrat
						kliknutím na "Dnes" nebo "Zítra".
						<br>Pokud na dnešek nebo zítřek není žádné suplování,
						tlačítka zhasnou.
						`
				}
			},
			filtr: {
				element: "#selectorField_filter",
				popover: {
					title: "Filtrování",
					description:
						`Nejpodstatnější novou funkcí je rozhodně filtrování.
						<ul>
						<li>Do tohoto pole můžete napsat svoji zkratku (např. Chrj),
						a zobrazí se vám pouze změny, které se vás týkají.
						<b>Filtr funguje na zkratky učitelů, názvy tříd, názvy učeben</b>, časy rozvrhů a další.
						<li><b>Filtr se automaticky ukládá</b>, takže ho nemusíte při každé návštěvě vypisovat znova.
						<li><b>Můžete filtrovat i více termínů zároveň</b>, termíny oddělujte čárkou.
						např. "<i>VII.B8 SF11 SI21 SM31</i>" pro zobrazení změn pro třídu VII.B8
						a semináře se zkratkami SF11, SI21 a SM31.
						</ul>
						`
				}
			},
			chybejici: {
				element: "#chybejiciCol",
				popover: {
					title: "Tabulka chybějících",
					description:
						`Chybějící jsou zobrazeni v přehledné tabulce. Každá buňka reprezentuje jednu hodinu.
						Šedá výplň znamená, že subjekt v danou hodinu chybí, modrá případ opačný.
						`,
					position: "top"
				}
			},
			dotazy: {
				element: "#pruvodce",
				popover: {
					title: "Závěrem..",
					description:
						`Průvodce můžete kdykoliv znovu spustit kliknutím na tlačítko Průvodce v patičce.
						<br>V případě dotazů nebo konstruktivní kritiky <a href="mailto:vacekj@outlook.com">mailujte</a>
						`
				}
			}
		};

		// tslint:disable-next-line:prefer-const
		let orderedSteps = [
			steps.start,
			steps.datum,
			steps.tlacitka,
			steps.filtr,
			steps.chybejici,
			steps.dotazy
		];

		// Dynamic steps
		if (isMobile()) {
			orderedSteps.splice(2, 0, steps.mobilSwipe);
		}

		driver.defineSteps(orderedSteps);
	}

	export function start(step = 0) {
		initialize();
		driver.start(step);
	}
}
