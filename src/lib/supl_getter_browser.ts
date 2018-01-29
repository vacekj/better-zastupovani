import { SuplGetter } from "./supl_getter";
import { DateWithUrl } from "./supl_parser";
export class SuplGetterBrowser extends SuplGetter {
	request(url: string): Promise<string> {
		return new Promise((resolve, reject) => {
			fetch(url).then((res) => {
				if (!res.ok) {
					reject({ error: 'res not ok' });
				}
				return res.text();
			}).then((body) => {
				resolve(body);
			});
		});
	}

	getClassesPage(): Promise<string> {
		return this.request(this.URL_ROZVRH);
	}

	getDatesPage(): Promise<string> {
		return this.request(this.URL_DATES);
	}

	getSuplovaniPage(date: DateWithUrl): Promise<string> {
		return this.request(this.URL_SUPL + date.url);
	}
}