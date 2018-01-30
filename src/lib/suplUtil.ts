import { SuplGetter } from './suplGetter';
import { parseDatesPage, parseSuplovaniPage, SuplovaniPage } from './suplParser';

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
		return new Promise((resolve, reject) => {
			this.suplGetter.getDatesPage()
				.then(datesPage => {
					const dates = parseDatesPage(datesPage);

					const promises = dates.map(async (date) => {
						return this.suplGetter.getSuplovaniPage(date);
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
