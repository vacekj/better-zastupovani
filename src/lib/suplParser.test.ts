import {  } from "./suplParser";
import { expect } from "chai";

describe('suplParser - Integration Tests', () => {
	it('Should get class list', (done) => {
		suplGetter.getClasses()
			.then((classesPage) => {
				let classes = suplParser.parseClassesPage(classesPage);
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

	it('Should get data (chybejici, suplovani, nahradni ucebny) and parse it succesfully', (done) => {
		suplGetter
			.getDatesPage().then((datesPage) => {
				const dates = suplParser.parseDatesPage(datesPage);
				let date = dates[0];
				suplGetter.getSuplovani(date).then((suplovani) => {
					let parsed = suplParser.parseSuplovani(suplovani);
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