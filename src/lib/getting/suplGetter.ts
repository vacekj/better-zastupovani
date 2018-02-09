import { DateWithUrl } from "../parsing/DatesParser";
import { decode } from "../utils/decode";
/**
 * Base abstract class with common functionality and members for all SuplGetters
 *
 * @export
 * @abstract
 * @class SuplGetter
 */
export abstract class SuplGetter {
	public URL_SUPL = "https://suplovani.gytool.cz/";
	public URL_ROZVRH = "https://rozvrh.gytool.cz/index_Trida_Menu.html";
	public URL_VYUCUJICI = "https://rozvrh.gytool.cz/index_Vyucujici_Menu.html";
	public get URL_DATES(): string {
		return `${this.URL_SUPL}/!index_menu.html`;
	}
	/**
	 * getClasses
	 */
	public abstract getClassesPage(): Promise<string>;

	/**
	 * getSuplovani
	 */
	public abstract getSuplovaniPage(dateUrl: string): Promise<string>;

	/**
	 * getDatesPage
	 */
	public abstract getDatesPage(): Promise<string>;

	/**
	 * getVyucujiciPage
	 */
	public abstract getVyucujiciPage(): Promise<string>;
}

/**
 * A SuplGetter that works in browser environment
 *
 * Uses only native browser APIs
 * Handles decoding of the responses
 * @class SuplGetterNode
 * @extends {SuplGetter}
 */
export class SuplGetterBrowser extends SuplGetter {
	public async request(url: string): Promise<string> {
		return new Promise<string>((resolve, reject) => {
			const myInit: RequestInit = {
				method: "GET"
			};
			fetch(url, myInit)
				.then(async (res) => {
					if (!res.ok) {
						reject({ error: "res not ok" });
					}

					return res.arrayBuffer();
				})
				.then((arrayBuffer) => {
					return decode(arrayBuffer);
		})
				.then((body) => {
					resolve(body);
				})
				.catch(reject);
		});
	}

	public async getClassesPage(): Promise<string> {
		return this.request(this.URL_ROZVRH);
	}

	public async getDatesPage(): Promise<string> {
		return this.request(this.URL_DATES);
	}

	public async getSuplovaniPage(dateUrl: string): Promise<string> {
		return this.request(this.URL_SUPL + dateUrl);
	}

	public async getVyucujiciPage(): Promise<string> {
		return this.request(this.URL_VYUCUJICI);
	}
}
