import { SuplGetter } from "./suplGetter";
import * as request_ from "request";
import * as iconv from "iconv-lite";
import { DateWithUrl } from "./suplParser";
export class SuplGetterNode extends SuplGetter {
	request(url, cb) {
		request_({
			url,
			encoding: null
		}, (err, res, body) => {
			let decodedBody = iconv.decode(body, 'win1250');
			cb(err, res, decodedBody);
		});
	}

	getClassesPage(): Promise<string> {
		return new Promise((resolve, reject) => {
			this.request(this.URL_ROZVRH, (err, res, body) => {
				if (err) {
					reject(err);
				}
				resolve(body);
			});
		});
	}

	getDatesPage(): Promise<string> {
		return new Promise((resolve, reject) => {
			this.request(this.URL_DATES, (err, res, body) => {
				if (err) {
					reject(err);
				}
				resolve(body);
			});
		});
	}

	getSuplovaniPage(date: DateWithUrl): Promise<string> {
		return new Promise((resolve, reject) => {
			this.request(this.URL_SUPL + date.url, (err, res, body, $) => {
				if (err) {
					reject(err);
				}
				resolve(body);
			});
		});
	}
}