import { parse } from "date-fns";
import { load } from "../utils/DOMUtils";
// TODO: Test this using real, live data
/**
 * Date information corresponding to one suplovaniPage
 *
 */
export class DateWithUrl {
	public url: string;
	/**
	 * Used for sorting
	 *
	 * @type {Date}
	 * @memberof DateWithUrl
	 */
	public date: Date;
	/**
	 * Used as display value
	 *
	 * @type {string}
	 * @memberof DateWithUrl
	 */
	public dateString: string;
	constructor(url: string, dateString: string) {
		this.url = url;
		this.dateString = dateString;
		const extractedDate = url.match(/\d{4}_\d{2}_\d{2}/)[0].replace(new RegExp("_", "g"), "-");
		this.date = parse(extractedDate);
	}
}

/**
 * Parses a dates page string into a DateWithUrl array
 *
 */
export function parseDatesPage(datesPage: string): DateWithUrl[] {
	const $ = load(datesPage);
	const options = $("option");

	return Array.from(options).map((option: HTMLOptionElement) => {
		return new DateWithUrl(option.getAttribute("value").toString(), option.innerHTML);
	});
}
