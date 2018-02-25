import * as iconv from "iconv-lite";
import * as request_ from "request";

import { SuplGetter } from "./suplGetter";

/**
 * A SuplGetter that works in Node environment
 *
 * Handles decoding of the responses
 * @class SuplGetterNode
 * @extends {SuplGetter}
 */
export class SuplGetterNode extends SuplGetter {
	constructor() {
		super();
	}
	public request(url, cb) {
		request_({
			encoding: null,
			url
		}, (err, res, body) => {
			const decodedBody = iconv.decode(body, "win1250");
			cb(err, res, decodedBody);
		});
	}

	public async getClassesPage(): Promise<string> {
		return new Promise<string>((resolve, reject) => {
			this.request(this.URL_ROZVRH, (err, res, body) => {
				if (err) {
					reject(err);
				}
				resolve(body);
			});
		});
	}

	public async getDatesPage(): Promise<string> {
		return new Promise<string>((resolve, reject) => {
			this.request(this.URL_DATES, (err, res, body) => {
				if (err) {
					reject(err);
				}
				resolve(body);
			});
		});
	}

	public async getSuplovaniPage(dateUrl: string): Promise<string> {
		return new Promise<string>((resolve, reject) => {
			this.request(this.URL_SUPL + dateUrl, (err, res, body) => {
				if (err) {
					reject(err);
				}
				resolve(body);
			});
		});
	}

	public async getVyucujiciPage(): Promise<string> {
		return new Promise<string>((resolve, reject) => {
			this.request(this.URL_VYUCUJICI, (err, res, body) => {
				if (err) {
					reject(err);
				}
				resolve(body);
			});
		});
	}
}
