import { SuplGetter } from "./supl_getter";
import { parseDatesPage, parseSuplovaniPage, SuplovaniPage } from "./supl_parser";
export class SuplUtil {
	suplGetter: SuplGetter;
	constructor(suplGetter: SuplGetter) {
		this.suplGetter = suplGetter;
	}
	getSuplovaniForAllDates(): Promise<SuplovaniPage[]> {
		return new Promise((resolve, reject) => {
			this.suplGetter.getDatesPage().then(datesPage => {
				const dates = parseDatesPage(datesPage);

				let promises = dates.map((date) => {
					return this.suplGetter.getSuplovaniPage(date);
				});

				let allPromises = Promise.all(promises);
				allPromises.then((res) => {
					let suplovaniPages = res.map((suplovaniPageString) => {
						return parseSuplovaniPage(suplovaniPageString);
					});
					resolve(suplovaniPages);
				});
			});
		});
	}
}