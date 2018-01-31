import { expect } from 'chai';
import 'mocha';

import { parseDatesPage } from './DatesParser';
import { SuplGetterNode } from './suplGetterNode';
const suplGetter = new SuplGetterNode();

import * as JSDom from 'global-jsdom';
let jsdom;

describe('suplGetter', () => {
	before(() => {
		jsdom = JSDom();
	});

	it('should get classes page', (done) => {
		suplGetter.getClassesPage()
			.then((classesPage) => {
				expect(classesPage).to.be.a('string');
				done();
			}).catch((err) => {
				done(err);
			});
	});

	it('should get dates page', (done) => {
		suplGetter.getDatesPage()
			.then((datesPage) => {
				expect(datesPage).to.be.a('string');
				done();
			}).catch((err) => {
				done(err);
			});
	});

	it('should get suplovani page', (done) => {
		suplGetter
			.getDatesPage().then((datesPage) => {
				const dates = parseDatesPage(datesPage);
				const date = dates[0];
				suplGetter.getSuplovaniPage(date).then((suplovaniPage) => {
					expect(suplovaniPage).to.be.a('string');
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
