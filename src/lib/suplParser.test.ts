import { expect } from 'chai';
import * as globalJSDOM from 'global-jsdom';
import 'mocha';
globalJSDOM();

import { SuplGetterNode } from './suplGetterNode';
import * as suplParser from './suplParser';

let suplGetter;

describe('suplParser - Integration Tests', () => {
	before(() => {
		suplGetter = new SuplGetterNode();
	});
	it('Should get class list', (done) => {
		suplGetter.getClassesPage()
			.then((classesPage) => {
				const classes = suplParser.parseClassesPage(classesPage);
				expect(classes).to.be.an.instanceof(Array);
				expect(classes[0]).to.equal('I.A8');
				done();
			}).catch((err) => {
				done(err);
			});
	});

	it('Should get current dates list', (done) => {
		suplGetter.getDatesPage()
			.then((datesPage) => {
				const dates = suplParser.parseDatesPage(datesPage);
				expect(dates).to.be.an.instanceof(Array);
				expect(typeof dates[0].url).to.equal('string');
				done();
			}).catch((err) => {
				done(err);
			});
	});
	// TODO: rewrite this for typescript, make more assertions, split into subtests
	it('Should get data (chybejici, suplovani, nahradni ucebny) and parse it succesfully', (done) => {
		suplGetter
			.getDatesPage().then((datesPage) => {
				const dates = suplParser.parseDatesPage(datesPage);
				const date = dates[0];
				suplGetter.getSuplovaniPage(date).then((suplovani) => {
					const parsed = suplParser.parseSuplovaniPage(suplovani);
					// Check for correct types using typeof & instanceof
					// Check for class etc. format using regex
					expect(parsed).to.have.keys(['chybejici', 'suplovani', 'nahradniUcebny']);
					expect(parsed.chybejici).to.be.an.instanceof(Array);
					expect(parsed.suplovani).to.be.an.instanceof(Array);
					expect(parsed.nahradniUcebny).to.be.an.instanceof(Array);
					done();
				}).catch((err) => {
					done(err);
				});
			}, done);
	});
});
