import { expect } from 'chai';
import 'mocha';

import { SuplGetterNode } from './suplGetterNode';

import { DateWithUrl, parseDatesPage } from './DatesParser';
import { NahradniUcebnaRecord, parseClassesPage, parseSuplovaniPage, SuplovaniPage, SuplovaniRecord } from './suplParser';

import * as JSDom from 'global-jsdom';
let jsdom;

const suplGetter = new SuplGetterNode();

describe('suplParser', () => {
	before(() => {
		jsdom = JSDom();
	});

	it('should parse classes page', (done) => {
		suplGetter.getClassesPage()
			.then((classesPage) => {
				const classes = parseClassesPage(classesPage);
				expect(classes).to.be.an.instanceof(Array);
				expect(classes[0]).to.equal('I.A8');
				expect(classes).to.include.members(['I.A6', 'I.A']);
				done();
			}).catch((err) => {
				done(err);
			});
	});

	it('should parse dates page', (done) => {
		suplGetter.getDatesPage()
			.then((datesPage) => {
				const dates = parseDatesPage(datesPage);
				expect(dates).to.be.an.instanceof(Array);
				expect(dates[0]).to.be.an.instanceof(DateWithUrl);
				expect(dates[0].date).to.be.an.instanceOf(Date);
				const containsDate = new RegExp('pondělí|úterý|středa|čtvrtek|pátek');
				expect(dates[0].dateString).to.match(containsDate);
				done();
			}).catch((err) => {
				done(err);
			});
	});

	it('should parse suplovani page', (done) => {
		suplGetter
			.getDatesPage().then((datesPage) => {
				const dates = parseDatesPage(datesPage);
				const date = dates[0];
				suplGetter.getSuplovaniPage(date).then((suplovaniPage) => {
					const parsedSuplovaniPage = parseSuplovaniPage(suplovaniPage);
					// Check for class etc. format using regex
					expect(parsedSuplovaniPage).to.be.an.instanceOf(SuplovaniPage);
					expect(parsedSuplovaniPage).to.not.satisfy(containsNullOrUndefined);
					done();
				}).catch((err) => {
					done(err);
				});
			}, done);
	});

	after(() => {
		jsdom();
	});
});

function arrayContainsNullOrUndefined(objects: Object[]): boolean {
	return objects.some(containsNullOrUndefined);
}

function containsNullOrUndefined(object: Object): boolean {
	Object.keys(object).map((key) => {
		if (object.hasOwnProperty(key)) {
			const element = object[key];
			if (typeof object[key] === 'object' && object[key] !== null) {
				containsNullOrUndefined(object[key]);
			} else if (Array.isArray(object[key]) && object[key].length) {
				arrayContainsNullOrUndefined(object[key]);
			} else if (!isReal(element)) {
				return true;
			}
		}
	});

	return false;
}

function isReal(value): boolean {
	return value && value !== 'undefined' && value !== 'null';
}
