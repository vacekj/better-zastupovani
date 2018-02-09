import { SuplGetter } from "../getting/suplGetter";
import { parseDatesPage } from "../parsing/DatesParser";
import { parseSuplovaniPage, SuplovaniPage } from "../parsing/suplParser";

/**
 * A utility class containing methods that do not fit anywhere else
 *
 * @export
 * @class SuplUtil
 */
export class SuplUtil {
	public suplGetter: SuplGetter;
	constructor(suplGetter: SuplGetter) {
		this.suplGetter = suplGetter;
	}
	public async getSuplovaniForAllDates(): Promise<SuplovaniPage[]> {
		return new Promise<SuplovaniPage[]>((resolve, reject) => {
			this.suplGetter.getDatesPage()
				.then((datesPage) => {
					const dates = parseDatesPage(datesPage);

					const promises = dates.map(async (date) => {
						return this.suplGetter.getSuplovaniPage(date.url);
					});

					const allPromises = Promise.all(promises);
					allPromises.then((res) => {
						const suplovaniPages = res.map((suplovaniPageString) => {
							return parseSuplovaniPage(suplovaniPageString);
						});
						resolve(suplovaniPages);
					}).catch();
				})
				.catch();
		});
	}
}
