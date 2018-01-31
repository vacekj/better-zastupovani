import { parse } from 'date-fns';
import { load } from './DOMUtils';
/**
 * Helper class for Dates and URLs pointing to suplovaniPages
 *
 */
export class DateWithUrl {
	public url: string;
	public date: Date;
	public dateString: string;
	constructor(url: string, dateString: string) {
		this.url = url;
		const extractedDate = url.slice(7, 17).replace('_', '-').replace('_', '-');
		this.date = parse(extractedDate);
		this.dateString = dateString;
	}
}

/**
 * Parses a dates page string into a SuplovaniPageDate array
 *
 */
export function parseDatesPage(datesPage: string): DateWithUrl[] {
	const $ = load(datesPage);
	const options = $('option');

	return [...options].map((option) => {
		return new DateWithUrl(option.getAttribute('value'), option.innerHTML);
	});
}