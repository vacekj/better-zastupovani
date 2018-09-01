import { expect } from "chai";
import "mocha";

import { parseDatesPage } from "../parsing/DatesParser";
import { SuplGetterNode } from "./suplGetterNode";
const suplGetter = new SuplGetterNode();

import * as globalJsdom from "global-jsdom";
let jsdom;

describe("suplGetter", () => {
	before(() => {
		// tslint:disable-next-line:no-any
		jsdom = (globalJsdom as any)();
	});

	it("should get classes page", (done) => {
		suplGetter
			.getClassesPage()
			.then((classesPage) => {
				expect(classesPage).to.be.a("string");
				expect(classesPage).length.to.be.least(10);
				done();
			})
			.catch(done);
	});

	it("should get dates page", (done) => {
		suplGetter
			.getDatesPage()
			.then((datesPage) => {
				expect(datesPage).to.be.a("string");
				expect(datesPage).length.to.be.least(10);
				done();
			})
			.catch(done);
	});

	it("should get suplovani page", (done) => {
		suplGetter
			.getDatesPage()
			.then((datesPage) => {
				const dates = parseDatesPage(datesPage);
				const suplPages = dates.map((date) => {
					return suplGetter
						.getSuplovaniPage(date.url)
						.then((suplovaniPage) => {
							expect(suplovaniPage).to.be.a("string");
							expect(suplovaniPage).length.to.be.least(10);
						})
						.catch(done);
				});
				Promise.all(suplPages).then(() => done(), done);
			}, done);
	});

	after(() => {
		jsdom();
	});
});
