import { DateWithUrl } from "./supl_parser";
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