let supl = require('../src/supl');
let expect = require('chai').expect;

describe('Supl library', () => {
	it('Should get class list', (done) => {
		supl.getClasses()
			.then((classes) => {
				expect(classes).to.be.an.instanceof(Array);
				expect(classes[0]).to.equal('I.A8');
				done();
			}).catch((err) => {
				done(err);
			});
	});

	it('Should get current dates list', (done) => {
		supl.getDates()
			.then((dates) => {
				expect(dates).to.be.an.instanceof(Array);
				expect(typeof dates[0].url).to.equal('string');
				expect(dates[0].date).to.exist;
				done();
			}).catch((err) => {
				done(err);
			});
	});

	it('Should get data (chybejici, suplovani, nahradni ucebny) and parse it succesfully', (done) => {
		let date_url;
		supl
			.getDates().then((res) => {
				date_url = res[0].url;
				supl.getSuplovani(date_url).then((suplovani) => {
					let parsed = supl.parseSuplovani(suplovani);
					expect(parsed).to.have.keys(['chybejici', 'suplovani', 'nahradniUcebny']);
					expect(parsed.chybejici).to.be.an.instanceof(Array);
					expect(parsed.suplovani).to.be.an.instanceof(Array);
					expect(parsed.nahradniUcebny).to.be.an.instanceof(Array);
					expect(parsed.chybejici[0]).to.be.an.instanceof(supl.ChybejiciRow);
					expect(parsed.suplovani[0]).to.be.an.instanceof(supl.SuplRow);
					expect(parsed.nahradniUcebny[0]).to.be.an.instanceof(supl.NahradniUcebnyRow);
					done();
				}).catch((err) => {
					done(err);
				});
			}, done);

	});
});