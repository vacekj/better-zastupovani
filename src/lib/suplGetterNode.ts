import * as iconv from 'iconv-lite';
import * as request_ from 'request';
import { SuplGetter } from './suplGetter';
import { DateWithUrl } from './suplParser';

/**
 * A SuplGetter that works in Node environment
 *
 * Handles decoding of the responses
 * @class SuplGetterNode
 * @extends {SuplGetter}
 */
export class SuplGetterNode extends SuplGetter {
	public request(url, cb) {
		request_({
			url,
			encoding: null
		}, (err, res, body) => {
			const decodedBody = iconv.decode(body, 'win1250');
			cb(err, res, decodedBody);
		});
	}

	public async getClassesPage(): Promise<string> {
		return new Promise((resolve, reject) => {
			this.request(this.URL_ROZVRH, (err, res, body) => {
				if (err) {
					reject(err);
				}
				resolve(body);
			});
		});
	}

	public async getDatesPage(): Promise<string> {
		return new Promise((resolve, reject) => {
			this.request(this.URL_DATES, (err, res, body) => {
				if (err) {
					reject(err);
				}
				resolve(body);
			});
		});
	}

	public async getSuplovaniPage(date: DateWithUrl): Promise<string> {
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
