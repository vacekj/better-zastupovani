import {format} from "date-fns";

export class SOLAPI {

	private static formatDate(date: Date) {
		return format(date, "d.M.y");
	}

	private API_HOST = "http://localhost:3000";
	private API_URL = this.API_HOST + "/api/suplovani"; /*TODO: změnit tohle na production server*/

	public async getSuplovani(date: Date): Promise<IAPIresponse> {

		return new Promise<IAPIresponse>((resolve, reject) => {
			this.fetch_retry(this.API_URL + `?date=${SOLAPI.formatDate(date)}`,
				{
					cache: "no-store",
				}, 5)
				.then((res: Response) => {
					// Fetch doesn't reject the promise on codes like 404
					if (!res.ok && res.status !== 404) {
						reject({error: "res not ok"});
					}
					return res.json();
				})
				.then(resolve)
				.catch(reject);
		});
	}

	private async fetch_retry(url, options: RequestInit, n) {
		try {
			return await fetch(url, options);
		} catch (err) {
			if (n === 1) {
				throw err;
			}
			return await this.fetch_retry(url, options, n - 1);
		}
	}
}

export interface IAPIresponse {
	data: {
		parsedSuplovani: [[string]],
		fetchDate: string
	};
}
