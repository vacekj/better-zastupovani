import { DateWithUrl } from "./suplParser";
export abstract class SuplGetter {
	public URL_SUPL = 'http://suplovani.gytool.cz/';
	public URL_ROZVRH = 'http://rozvrh.gytool.cz/index_Trida_Menu.html';
	public get URL_DATES(): string {
		return this.URL_SUPL + '!index_menu.html';
	}
	/**
	 * getClasses
	 */
	public abstract getClassesPage(): Promise<string>;

	/**
	 * getSuplovani
	 */
	public abstract getSuplovaniPage(date: DateWithUrl): Promise<string>;

	/**
	 * getDatesPage
	 */
	public abstract getDatesPage(): Promise<string>;
}

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