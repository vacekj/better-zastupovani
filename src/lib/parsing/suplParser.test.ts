import { expect } from "chai";
import "mocha";

import { SuplGetterNode } from "src/lib/getting/suplGetterNode";
import { regexes } from "test/shared";
import { DateWithUrl, parseDatesPage } from "./DatesParser";
import { parseClassesPage, parseSuplovaniPage, SuplovaniPage } from "./suplParser";

import * as globalJsdom from "global-jsdom";
let jsdom;

const suplGetter = new SuplGetterNode();

describe("suplParser", () => {
	before(() => {
		// tslint:disable-next-line:no-any
		jsdom = (globalJsdom as any)();
	});

	it("should parse classes page", (done) => {
		suplGetter
			.getClassesPage()
			.then(parseClassesPage)
			.then((classes) => {
				expect(classes).to.be.an.instanceof(Array);
				expect(classes[0]).to.equal("I.A8");
				expect(classes).to.include.members(["I.A6", "I.A"]);
				expect(classes.every((trida) => regexes.trida.test(trida))).to.be.true;
				done();
			})
			.catch(done);
	});

	it("should parse dates page", (done) => {
		suplGetter
			.getDatesPage()
			.then(parseDatesPage)
			.then((dates) => {
				expect(dates).to.be.an.instanceof(Array);
				expect(dates.every((date) => date instanceof DateWithUrl)).to.be.true;
				expect(dates.every((date) => date.date instanceof Date)).to.be.true;
				expect(dates.every((date) => regexes.date.test(date.dateString))).to.be.true;
				done();
			})
			.catch(done);
	});

	it("should parse suplovani page", (done) => {
		suplGetter
			.getDatesPage()
			.then(parseDatesPage)
			.then((dates) => {
				const promises = dates.map((date) => {
					return suplGetter.getSuplovaniPage(date.url)
						.then(parseSuplovaniPage)
						.then((parsedSuplovaniPage) => {
							expect(parsedSuplovaniPage).to.be.an.instanceOf(SuplovaniPage);
							expect(parsedSuplovaniPage).to.not.satisfy(containsNullOrUndefined);
							expect(parsedSuplovaniPage.chybejici.tridy.map((record) => record.kdo)).to.satisfy((array) => arrayMatchesRegex(array, regexes.trida));
							expect(parsedSuplovaniPage.chybejici.ucebny.map((record) => record.kdo)).to.satisfy((array) => arrayMatchesRegex(array, regexes.ucebna));
						})
						.then(() => true)
						.catch(() => false);
				});
				Promise
					.all(promises)
					.then((results) => {
						expect(results.every((result) => result === true)).to.be.true;
						done();
					})
					.catch(done);
			})
			.catch(done);
	});

	after(() => {
		/* Cleanup jsdom */
		jsdom();
	});
});

function arrayMatchesRegex(array: string[], regex: RegExp): boolean {
	return array.every((elem) => {
		return regex.test(elem);
	});
}

function arrayContainsNullOrUndefined(objects: object[]): boolean {
	return objects.some(containsNullOrUndefined);
}

function containsNullOrUndefined(obj: object): boolean {
	return Object.values(obj).reduce((acc, value) => {
		if (value === undefined || value == null) {
			return true;
		} else if (typeof value === "object") {
			containsNullOrUndefined(value);
		} else if (Array.isArray(value) && value.length) {
			arrayContainsNullOrUndefined(value);
		}
	}, false);
}
