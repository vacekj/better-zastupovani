import { expect } from "chai";
import "mocha";

import { SuplGetterNode } from "../getting/suplGetterNode";

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
		suplGetter.getClassesPage()
			.then((classesPage) => {
				const classes = parseClassesPage(classesPage);
				expect(classes).to.be.an.instanceof(Array);
				expect(classes[0]).to.equal("I.A8");
				expect(classes).to.include.members(["I.A6", "I.A"]);
				done();
			}).catch(done);
	});

	it("should parse dates page", (done) => {
		suplGetter.getDatesPage()
			.then((datesPage) => {
				const dates = parseDatesPage(datesPage);
				expect(dates).to.be.an.instanceof(Array);
				expect(dates[0]).to.be.an.instanceof(DateWithUrl);
				expect(dates[0].date).to.be.an.instanceOf(Date);
				const containsDate = new RegExp("pondělí|úterý|středa|čtvrtek|pátek");
				expect(dates[0].dateString).to.match(containsDate);
				done();
			}).catch(done);
	});

	it("should parse suplovani page", (done) => {
		suplGetter.getDatesPage()
			.then((datesPage) => {
				const dates = parseDatesPage(datesPage);
				const date = dates[0];
				suplGetter.getSuplovaniPage(date.url).then((suplovaniPage) => {
					const parsedSuplovaniPage = parseSuplovaniPage(suplovaniPage);
					expect(parsedSuplovaniPage).to.be.an.instanceOf(SuplovaniPage);
					expect(parsedSuplovaniPage).to.not.satisfy(containsNullOrUndefined);
					expect(parsedSuplovaniPage.chybejici.tridy.map((record) => record.kdo)).to.satisfy((array) => arrayMatchesRegex(array, regexes.trida));
					expect(parsedSuplovaniPage.chybejici.ucebny.map((record) => record.kdo)).to.satisfy((array) => arrayMatchesRegex(array, regexes.ucebna));
					done();
				}).catch(done);
			}).catch(done);
	});

	after(() => {
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
		} else if (typeof value === "object" && value !== null) {
			containsNullOrUndefined(value);
		} else if (Array.isArray(value) && value.length) {
			arrayContainsNullOrUndefined(value);
		}
	}, false);
}

const regexes = {
	trida: new RegExp("[IX|IV|V?I{0,3}]\.[A-C][1-8]?"),
	ucebna: new RegExp("[1-8]\.[A-C][1-8]?d?|[ABC].{3}d?"),
};
